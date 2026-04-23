"""
Specialist Model Manager
========================
Trains one Random Forest classifier per market regime on a user-chosen stock.
Regime labels come from the NIFTY HMM inside RegimeAgent -- never re-trained here.

FIXES APPLIED:
  P1 - Regime Collapse: STOCK_DATA_PERIOD="10y" + scaler-aware NIFTY labeling
       + bootstrap oversampling for minority regimes
  P4 - Temporal alignment: dropped rows are logged explicitly
  P5 - Feature scaling: sklearn Pipeline(StandardScaler + RF) saved as one object
  P6 - Stale models: JSON metadata per model + needs_retrain() + auto-trigger
"""

import io
import os
import sys
import json
import time
import warnings
import numpy as np
import pandas as pd
import yfinance as yf
import joblib
import pandas_ta as ta
from datetime import date, datetime
from datetime import date, datetime
from sklearn.metrics import classification_report
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.utils import resample
from xgboost import XGBClassifier

# Force UTF-8 stdout on Windows
if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

# regime_agent must be importable from the same models/ directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from regime_agent.regime_agent import RegimeAgent, VIX_TICKER

warnings.filterwarnings("ignore", category=RuntimeWarning)

# ==============================================================================
# CONSTANTS
# ==============================================================================
STOCK_DATA_PERIOD        = "10y"   # P1 FIX: 10y gives regime diversity matching HMM
CONVICTION_THRESHOLD     = 0.53    # Tightened to allow more BUY signals
WEAK_CONVICTION_THRESHOLD = 0.47   # Tightened to allow more SELL signals
MODEL_RETRAIN_DAYS       = 30      # P6: retrain if model is older than this
OVERSAMPLE_TARGET        = 150     # P1: oversample minority regimes to at least this
MODEL_DIR                = "models/"
ALL_REGIMES              = ["Bull", "Bear", "Sideways", "HighVolatility"]
FEATURE_COLS             = [
    "rsi_14", "macd_line", "macd_hist", "bb_width",
    "return_5d", "return_10d", "return_20d", "volume_ratio",
    "ema_20_50_cross", "adx_14", "atr_14_norm", "stoch_k",
    "dist_sma_50", "dist_sma_200"
]
XGB_PARAMS = {
    "n_estimators":    150,
    "max_depth":       4,          # XGB trees are stronger, keep depth shallow to prevent overfitting
    "learning_rate":   0.05,
    "subsample":       0.8,
    "colsample_bytree":0.8,
    "random_state":    42,
    "eval_metric":     "logloss",
}


# ==============================================================================
# CLASS
# ==============================================================================
class SpecialistModelManager:
    """
    Manages per-regime Random Forest + StandardScaler pipelines for one stock.
    Regime labels are always sourced from the injected RegimeAgent instance.
    """

    def __init__(self, ticker, regime_agent):
        """Store ticker and regime_agent; initialise model and accuracy dicts."""
        self.ticker       = ticker.strip().upper()
        self.regime_agent = regime_agent
        self.models       = {}     # regime -> sklearn Pipeline(scaler + RF)
        self.accuracies   = {}     # regime -> float accuracy
        self.df_stock     = None
        os.makedirs(MODEL_DIR, exist_ok=True)

    # --------------------------------------------------------------------------
    # PATH HELPERS
    # --------------------------------------------------------------------------
    def _get_model_path(self, regime):
        """Return path for a regime-specific pipeline .pkl file."""
        return os.path.join(MODEL_DIR, "%s_%s_pipeline.pkl" % (self.ticker, regime))

    def _get_meta_path(self, regime):
        """Return path for a regime-specific JSON metadata file."""
        return os.path.join(MODEL_DIR, "%s_%s_meta.json" % (self.ticker, regime))

    # --------------------------------------------------------------------------
    # P6: METADATA HELPERS
    # --------------------------------------------------------------------------
    def _save_metadata(self, regime, n_train, accuracy):
        """Save training metadata to JSON for staleness checks."""
        meta = {
            "ticker":     self.ticker,
            "regime":     regime,
            "trained_on": str(date.today()),
            "n_train":    n_train,
            "accuracy":   accuracy,
            "period":     STOCK_DATA_PERIOD,
        }
        try:
            with open(self._get_meta_path(regime), "w") as f:
                json.dump(meta, f, indent=2)
        except Exception as exc:
            print("  [WARN] Could not save metadata for %s: %s" % (regime, exc))

    def needs_retrain(self, regime, max_age_days=MODEL_RETRAIN_DAYS):
        """Return True if the saved model is missing or older than max_age_days."""
        meta_path = self._get_meta_path(regime)
        if not os.path.exists(meta_path):
            return True
        try:
            meta = json.load(open(meta_path))
            trained_on = datetime.strptime(meta["trained_on"], "%Y-%m-%d")
            age_days   = (datetime.today() - trained_on).days
            return age_days >= max_age_days
        except Exception:
            return True

    # --------------------------------------------------------------------------
    # SAFE DOWNLOAD
    # --------------------------------------------------------------------------
    def _safe_download(self, ticker, period=None, start=None, end=None):
        """Download yfinance data with one retry; always returns clean DataFrame."""
        def _attempt():
            if start is not None and end is not None:
                s = str(start)[:10]
                e = str(end)[:10]
                return yf.download(ticker, start=s, end=e,
                                   auto_adjust=True, progress=False)
            return yf.download(ticker, period=period, auto_adjust=True, progress=False)

        try:
            df = _attempt()
            if df is None or df.empty:
                print("  [WARN] Empty result for %s, retrying in 5s..." % ticker)
                time.sleep(5)
                df = _attempt()
            if df is None or df.empty:
                raise ValueError(
                    "yfinance returned no data for '%s'." % ticker
                )
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            return df
        except Exception as exc:
            raise ValueError("Download failed for '%s': %s" % (ticker, exc)) from exc

    # --------------------------------------------------------------------------
    # FEATURE ENGINEERING  (P5 note: Pipeline handles scaling; raw features here)
    # --------------------------------------------------------------------------
    def _engineer_stock_features(self, df):
        """Compute 8 technical features and binary next_day_up target."""
        df    = df.copy()
        close = df["Close"]
        vol   = df["Volume"]

        df["rsi_14"] = ta.rsi(close, length=14)

        macd_df = ta.macd(close, fast=12, slow=26, signal=9)
        if macd_df is not None and not macd_df.empty:
            df["macd_line"] = macd_df.iloc[:, 0]
            df["macd_hist"] = macd_df.iloc[:, 2]
        else:
            df["macd_line"] = np.nan
            df["macd_hist"] = np.nan

        bb_df = ta.bbands(close, length=20, std=2)
        if bb_df is not None and not bb_df.empty:
            bbl = bb_df.iloc[:, 0]; bbm = bb_df.iloc[:, 1]; bbu = bb_df.iloc[:, 2]
            df["bb_width"] = (bbu - bbl) / bbm.replace(0, np.nan)
        else:
            df["bb_width"] = np.nan

        # Trend & Momentum
        ema20 = ta.ema(close, length=20)
        ema50 = ta.ema(close, length=50)
        df["ema_20_50_cross"] = (ema20 - ema50) / ema50.replace(0, np.nan)
        
        adx_df = ta.adx(df["High"], df["Low"], close, length=14)
        if adx_df is not None and not adx_df.empty:
            df["adx_14"] = adx_df.iloc[:, 0]  # ADX line
        else:
            df["adx_14"] = np.nan
            
        # Volatility
        df["atr_14_norm"] = ta.atr(df["High"], df["Low"], close, length=14) / close
        
        # Oscillators
        stoch_df = ta.stoch(df["High"], df["Low"], close, k=14, d=3, smooth_k=3)
        if stoch_df is not None and not stoch_df.empty:
            df["stoch_k"] = stoch_df.iloc[:, 0]
        else:
            df["stoch_k"] = np.nan
            
        # Price Action
        sma50 = ta.sma(close, length=50)
        sma200 = ta.sma(close, length=200)
        df["dist_sma_50"] = (close - sma50) / sma50.replace(0, np.nan)
        df["dist_sma_200"] = (close - sma200) / sma200.replace(0, np.nan)

        # Returns & Volume
        df["return_5d"]    = close.pct_change(5)
        df["return_10d"]   = close.pct_change(10)
        df["return_20d"]   = close.pct_change(20)
        df["volume_ratio"] = vol / vol.rolling(20).mean().replace(0, np.nan)
        
        # New robust target: Will the price be strictly higher 3 days from now?
        df["target_3d_up"] = (close.shift(-3) > close).astype(int)

        df.dropna(inplace=True)
        return df

    # --------------------------------------------------------------------------
    # P1 FIX: NIFTY REGIME LABELING -- uses regime_agent's own scaler
    # --------------------------------------------------------------------------
    def _build_nifty_regime_series(self, start_date, end_date):
        """Label each date with a NIFTY regime using the pre-trained HMM + scaler."""
        print("  [SpecialistMgr] Downloading NIFTY data for regime labeling...")
        nifty_raw = self._safe_download("^NSEI", start=start_date, end=end_date)
        nifty_raw.index = pd.to_datetime(nifty_raw.index).tz_localize(None)

        print("  [SpecialistMgr] Downloading India VIX data...")
        vix_raw = self._safe_download(VIX_TICKER, start=start_date, end=end_date)
        vix_raw.index = pd.to_datetime(vix_raw.index).tz_localize(None)

        nifty_df = nifty_raw[["Close"]].copy()
        nifty_df["daily_return"]   = nifty_df["Close"].pct_change()
        nifty_df["volatility_20d"] = nifty_df["daily_return"].rolling(20).std() * np.sqrt(252)

        vix_df = vix_raw[["Close"]].copy()
        vix_df.columns = ["vix_close"]
        vix_df["vix_change"] = vix_df["vix_close"].pct_change()
        nifty_df = nifty_df.join(vix_df["vix_change"], how="left")
        nifty_df.dropna(inplace=True)

        raw_feat = nifty_df[["daily_return", "volatility_20d", "vix_change"]].values

        # P1 FIX: scale with regime_agent's fitted scaler before predicting
        scaled_feat = self.regime_agent.scaler.transform(raw_feat)
        raw_states  = self.regime_agent.hmm.predict(scaled_feat)

        regime_series = pd.Series(
            [self.regime_agent.state_map.get(s, "Sideways") for s in raw_states],
            index=nifty_df.index,
            name="regime",
        )
        return regime_series

    # --------------------------------------------------------------------------
    # P1 FIX: BOOTSTRAP OVERSAMPLE minority regime training set
    # --------------------------------------------------------------------------
    def _oversample_train(self, X_train, y_train, target=OVERSAMPLE_TARGET):
        """Bootstrap-resample the training set up to `target` rows if too small."""
        n = len(X_train)
        if n >= target:
            return X_train, y_train

        n_needed = target - n
        X_extra, y_extra = resample(
            X_train, y_train,
            n_samples=n_needed,
            replace=True,
            random_state=42
        )
        X_out = np.vstack([X_train, X_extra])
        y_out = np.concatenate([y_train, y_extra])
        print("  [INFO] Oversampled training set: %d -> %d rows" % (n, len(y_out)))
        return X_out, y_out

    # --------------------------------------------------------------------------
    # STEP 1 - FETCH AND LABEL
    # --------------------------------------------------------------------------
    def fetch_and_label(self):
        """Download 10y stock data, engineer features, and attach NIFTY regime labels."""
        print("\n[SpecialistMgr] Fetching %s of data for %s..." % (
            STOCK_DATA_PERIOD, self.ticker
        ))
        raw = self._safe_download(self.ticker, period=STOCK_DATA_PERIOD)
        raw.index = pd.to_datetime(raw.index).tz_localize(None)

        if "Close" not in raw.columns:
            raise ValueError(
                "Downloaded data for '%s' has no 'Close' column." % self.ticker
            )

        print("[SpecialistMgr] Engineering features...")
        stock_df = self._engineer_stock_features(raw)

        if len(stock_df) < 252:
            raise ValueError(
                "Insufficient data for '%s'. Got %d rows -- need at least 252." % (
                    self.ticker, len(stock_df)
                )
            )

        start_date = str(stock_df.index[0].date())
        end_date   = str((stock_df.index[-1] + pd.Timedelta(days=1)).date())
        regime_series = self._build_nifty_regime_series(start_date, end_date)

        # P4 FIX: log alignment drops explicitly
        n_before = len(stock_df)
        stock_df = stock_df.join(regime_series, how="left")
        stock_df.dropna(subset=["regime"], inplace=True)
        n_dropped = n_before - len(stock_df)
        if n_dropped > 0:
            print("  [P4] Dropped %d rows due to NIFTY/Stock date misalignment "
                  "(market holiday mismatch)." % n_dropped)

        self.df_stock = stock_df

        dist = stock_df["regime"].value_counts()
        print("\n[SpecialistMgr] Regime distribution for %s (%s of data):" % (
            self.ticker, STOCK_DATA_PERIOD
        ))
        for regime in ALL_REGIMES:
            count = dist.get(regime, 0)
            flag  = " <- LOW (will oversample)" if 0 < count < OVERSAMPLE_TARGET else (
                    " <- ZERO (no model)" if count == 0 else "")
            print("  %-16s: %5d rows%s" % (regime, count, flag))

    # --------------------------------------------------------------------------
    # STEP 2 - TRAIN ALL  (P5: Pipeline, P1: oversample, P6: metadata)
    # --------------------------------------------------------------------------
    def train_all(self):
        """Train one scaler+RF Pipeline per regime, with oversampling + metadata."""
        assert self.df_stock is not None, "Call fetch_and_label() first."

        print("\n[SpecialistMgr] Training specialist pipelines for %s..." % self.ticker)
        summary_rows = []

        for regime in ALL_REGIMES:
            subset  = self.df_stock[self.df_stock["regime"] == regime].copy()
            n_total = len(subset)

            if n_total < 20:
                print("  Skipping %s -- insufficient data (%d rows)" % (regime, n_total))
                summary_rows.append((regime, n_total, 0, "--"))
                continue

            X = subset[FEATURE_COLS].values
            y = subset["target_3d_up"].values

            split = int(n_total * 0.8)
            X_train, X_test = X[:split], X[split:]
            y_train, y_test = y[:split], y[split:]

            # P1 FIX: oversample minority regime training sets
            if len(X_train) < OVERSAMPLE_TARGET:
                X_train, y_train = self._oversample_train(X_train, y_train)

            # Build XGBoost model (handles class imbalance via scale_pos_weight if needed,
            # but oversampling largely fixes it. We'll add scale_pos_weight just in case)
            neg_cases = np.sum(y_train == 0)
            pos_cases = np.sum(y_train == 1)
            scale_pos_weight = neg_cases / pos_cases if pos_cases > 0 else 1.0
            
            xgb = XGBClassifier(**XGB_PARAMS, scale_pos_weight=scale_pos_weight)

            # P5 FIX: Pipeline(StandardScaler -> XGBoost)
            pipeline = Pipeline([
                ("scaler", StandardScaler()),
                ("xgb",    xgb),
            ])
            pipeline.fit(X_train, y_train)

            accuracy = round(pipeline.score(X_test, y_test) * 100, 1)
            self.accuracies[regime] = accuracy
            self.models[regime]     = pipeline

            y_pred = pipeline.predict(X_test)
            report = classification_report(
                y_test, y_pred,
                target_names=["Down", "Up"], zero_division=0
            )
            print("\n  [%s] Classification Report (test set):\n%s" % (regime, report))
            print("  [%s] Pipeline trained on %d rows | Test accuracy: %.1f%%" % (
                regime, len(X_train), accuracy
            ))

            try:
                joblib.dump(pipeline, self._get_model_path(regime))
                self._save_metadata(regime, len(X_train), accuracy)  # P6
            except Exception as exc:
                print("  [WARN] Could not save %s pipeline: %s" % (regime, exc))

            summary_rows.append((regime, len(X_train), len(X_test), "%.1f%%" % accuracy))

        print("\n%-16s %11s %10s %14s" % (
            "Regime", "Train Rows", "Test Rows", "Test Accuracy"
        ))
        print("-" * 56)
        for regime, n_train, n_test, acc in summary_rows:
            print("%-16s %11s %10s %14s" % (regime, n_train, n_test, acc))

    # --------------------------------------------------------------------------
    # STEP 3 - LOAD ALL  (P6: staleness check)
    # --------------------------------------------------------------------------
    def load_all(self, max_age_days=MODEL_RETRAIN_DAYS):
        """Load saved pipelines; warn if any model is stale (older than max_age_days)."""
        print("\n[SpecialistMgr] Loading saved models for %s..." % self.ticker)
        loaded = []
        for regime in ALL_REGIMES:
            path = self._get_model_path(regime)
            if os.path.exists(path):
                try:
                    self.models[regime] = joblib.load(path)
                    loaded.append(regime)
                    # P6 FIX: staleness check
                    if self.needs_retrain(regime, max_age_days):
                        print("  [P6] WARNING: '%s' model is >= %d days old. "
                              "Consider retraining." % (regime, max_age_days))
                    else:
                        meta = json.load(open(self._get_meta_path(regime)))
                        self.accuracies[regime] = meta.get("accuracy", "?")
                except Exception as exc:
                    print("  [WARN] Failed to load %s: %s" % (regime, exc))
            else:
                print("  No saved model for '%s' -- run train_all() first" % regime)

        if loaded:
            print("  Loaded: %s" % loaded)
        else:
            print("  No models loaded.")

    # --------------------------------------------------------------------------
    # LIVE FEATURES
    # --------------------------------------------------------------------------
    def _get_live_features(self):
        """Download last 1 year for the stock and return the latest clean feature row."""
        raw = self._safe_download(self.ticker, period="1y")
        raw.index = pd.to_datetime(raw.index).tz_localize(None)
        engineered = self._engineer_stock_features(raw)

        if engineered.empty:
            raise ValueError(
                "Could not compute live features for '%s'." % self.ticker
            )
        return engineered[FEATURE_COLS].values[-1].reshape(1, -1)

    # --------------------------------------------------------------------------
    # STEP 4 - PREDICT  (P6: auto-retrain if stale)
    # --------------------------------------------------------------------------
    def predict(self, regime_output):
        """Select regime-specific pipeline, auto-retrain if stale, return signal."""
        current_regime    = regime_output.get("regime", "")
        regime_confidence = regime_output.get("confidence", 0.0)

        # P6 FIX: auto-trigger retrain if model is stale
        if current_regime in self.models and self.needs_retrain(current_regime):
            print("  [P6] Model for '%s' is stale. Triggering retrain..." % current_regime)
            self.fetch_and_label()
            self.train_all()

        if current_regime not in self.models:
            return {
                "ticker":             self.ticker,
                "signal":             "HOLD",
                "reason":             "No specialist model for regime '%s'" % current_regime,
                "probability":        0.5,
                "conviction":         "NONE",
                "regime_used":        current_regime,
                "regime_confidence":  regime_confidence,
                "model_accuracy":     "not evaluated",
                "as_of_date":         regime_output.get("as_of_date", ""),
            }

        pipeline = self.models[current_regime]
        print("\n[SpecialistMgr] Fetching live features for %s..." % self.ticker)
        X_live = self._get_live_features()

        # P5: Pipeline handles scaling internally before predict_proba
        prob_arr = pipeline.predict_proba(X_live)[0]
        prob_up  = float(prob_arr[1]) if len(prob_arr) > 1 else 0.5

        if prob_up >= CONVICTION_THRESHOLD:
            signal     = "BUY"
            conviction = "HIGH"
        elif prob_up <= WEAK_CONVICTION_THRESHOLD:
            signal     = "SELL"
            conviction = "HIGH"
        else:
            signal     = "HOLD"
            conviction = "LOW"

        return {
            "ticker":             self.ticker,
            "signal":             signal,
            "probability":        round(prob_up, 4),
            "conviction":         conviction,
            "regime_used":        current_regime,
            "regime_confidence":  regime_confidence,
            "model_accuracy":     self.accuracies.get(current_regime, "not evaluated"),
            "as_of_date":         regime_output.get("as_of_date", ""),
        }


# ==============================================================================
# MAIN BLOCK
# ==============================================================================
if __name__ == "__main__":
    ra = RegimeAgent()
    ra.fetch_data()
    ra.load()

    regime_result = ra.get_current_regime()
    print("\nCurrent Regime: %s (%.1f%%)" % (
        regime_result["regime"], regime_result["confidence"]
    ))

    ticker = input("\nEnter stock ticker (e.g. RELIANCE.NS): ").strip()
    sm = SpecialistModelManager(ticker=ticker, regime_agent=ra)

    sm.load_all()
    if not sm.models:
        print("No saved models found. Training now...")
        sm.fetch_and_label()
        sm.train_all()

    prediction = sm.predict(regime_result)
    print("\n=== SPECIALIST MODEL PREDICTION ===")
    print("Stock:            %s" % prediction["ticker"])
    print("Signal:           %s" % prediction["signal"])
    print("Probability Up:   %s" % prediction["probability"])
    print("Conviction:       %s" % prediction["conviction"])
    print("Regime Used:      %s" % prediction["regime_used"])
    print("Model Accuracy:   %s" % prediction["model_accuracy"])
    print("As of:            %s" % prediction["as_of_date"])
