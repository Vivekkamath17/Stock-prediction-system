"""
Market Regime Detection Agent
==============================
Detects the current NIFTY market regime using a Gaussian Hidden Markov Model (HMM).
The HMM is ALWAYS trained on NIFTY index data only -- never on individual stocks.

Output regimes: Bull | Bear | Sideways | HighVolatility

FIXES APPLIED:
  P2 - Confidence: averaged predict_proba over last 10 observations (not just 1)
  P3 - Walk-forward labeling: deterministic rank-based state assignment
"""

import io
import os
import sys
import time
import warnings
import numpy as np
import pandas as pd
import yfinance as yf
import joblib
from datetime import date
from hmmlearn.hmm import GaussianHMM
from sklearn.preprocessing import StandardScaler

# Force UTF-8 stdout so Windows cp1252 never causes UnicodeEncodeError
if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

# Suppress noisy convergence warnings
warnings.filterwarnings("ignore", category=RuntimeWarning)
warnings.filterwarnings("ignore", message=".*did not converge.*")
warnings.filterwarnings("ignore", message=".*ConvergenceWarning.*")

# ==============================================================================
# CONSTANTS
# ==============================================================================
NIFTY_TICKER   = "^NSEI"
VIX_TICKER     = "^INDIAVIX"
DEFAULT_PERIOD = "10y"
N_HMM_STATES  = 4
HMM_ITERATIONS = 2000
PERSISTENCE_DAYS = 3
CONFIDENCE_WINDOW = 30          # Increased to 30 days for macro trend stability
MODEL_DIR      = "models/"
HMM_MODEL_PATH = "models/nifty_hmm.pkl"
RANDOM_STATE   = 42

ALL_REGIME_LABELS = ["Bull", "Bear", "Sideways", "HighVolatility"]


# ==============================================================================
# CLASS
# ==============================================================================
class RegimeAgent:
    """
    Regime-aware market detection agent built on a Gaussian HMM trained
    exclusively on NIFTY index data. Exposes a clean dictionary interface
    for downstream agents.
    """

    def __init__(self, ticker=NIFTY_TICKER, period=DEFAULT_PERIOD):
        """Initialise the agent with ticker, period, and create model directory."""
        self.ticker = ticker
        self.period = period
        self.hmm = None
        self.state_map = None        # dict: {int_state -> regime_string}
        self.scaler = StandardScaler()
        self.df = None
        self.feature_matrix = None   # raw features (unscaled)
        self.scaled_features = None  # StandardScaler output

        os.makedirs(MODEL_DIR, exist_ok=True)

    # --------------------------------------------------------------------------
    # HELPER: safe yfinance download with one retry
    # --------------------------------------------------------------------------
    def _safe_download(self, ticker, period=None):
        """Download yfinance history (period-based) with a single retry."""
        try:
            df = yf.download(ticker, period=period, auto_adjust=True, progress=False)
            if df is None or df.empty:
                print("  [WARN] Empty result for %s, retrying in 5s..." % ticker)
                time.sleep(5)
                df = yf.download(ticker, period=period, auto_adjust=True, progress=False)
            if df is None or df.empty:
                raise ValueError(
                    "yfinance returned no data for '%s'. "
                    "Check ticker symbol and internet connection." % ticker
                )
            # Flatten MultiIndex columns (yfinance >= 0.2)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            return df
        except Exception as exc:
            raise ValueError("Failed to download data for '%s': %s" % (ticker, exc)) from exc

    # --------------------------------------------------------------------------
    # STEP 1 - DATA FETCHING
    # --------------------------------------------------------------------------
    def fetch_data(self):
        """Download NIFTY + India VIX data and compute the 3 HMM features."""
        print("[RegimeAgent] Downloading %s of NIFTY data (%s)..." % (self.period, self.ticker))
        nifty_raw = self._safe_download(self.ticker, period=self.period)

        print("[RegimeAgent] Downloading India VIX data (%s)..." % VIX_TICKER)
        vix_raw = self._safe_download(VIX_TICKER, period=self.period)

        df = nifty_raw[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.index = pd.to_datetime(df.index).tz_localize(None)

        df["daily_return"]   = df["Close"].pct_change()
        df["volatility_20d"] = df["daily_return"].rolling(20).std() * np.sqrt(252)

        vix_df = vix_raw[["Close"]].copy()
        vix_df.index = pd.to_datetime(vix_df.index).tz_localize(None)
        vix_df.columns = ["vix_close"]
        vix_df["vix_change"] = vix_df["vix_close"].pct_change()

        df = df.join(vix_df["vix_change"], how="left")
        df.dropna(inplace=True)

        if len(df) < 252:
            raise ValueError(
                "Insufficient data for '%s'. Got %d rows -- need at least 252." % (
                    self.ticker, len(df)
                )
            )

        self.df = df
        self.feature_matrix  = df[["daily_return", "volatility_20d", "vix_change"]].values
        self.scaled_features = self.scaler.fit_transform(self.feature_matrix)

        print("[RegimeAgent] Loaded %d rows | %s to %s" % (
            len(df), df.index[0].date(), df.index[-1].date()
        ))

    # --------------------------------------------------------------------------
    # STEP 2 - STATE -> REGIME MAPPING  (P3 FIX: deterministic rank-based)
    # --------------------------------------------------------------------------
    def _map_states_to_regimes(self):
        """
        Map HMM integer states to Bull/Bear/Sideways/HighVolatility using
        deterministic rank ordering -- stable across different fold orderings.

        Assignment order (all from scaled feature means):
          Bull         = state with HIGHEST mean_return (must be positive)
          Bear         = state with LOWEST  mean_return (must be negative)
          HighVol      = among remaining, state with HIGHEST mean_volatility
          Sideways     = remaining state(s)
        """
        means      = self.hmm.means_       # shape: (n_states, 3)
        n_states   = means.shape[0]
        mean_ret   = means[:, 0]           # daily_return column (scaled)
        mean_vol   = means[:, 1]           # volatility_20d column (scaled)

        mapping   = {}
        remaining = set(range(n_states))

        # Bull: highest mean_return
        bull_state = int(np.argmax(mean_ret))
        mapping[bull_state] = "Bull"
        remaining.discard(bull_state)

        # Bear: lowest mean_return (from remaining)
        bear_state = min(remaining, key=lambda s: mean_ret[s])
        mapping[bear_state] = "Bear"
        remaining.discard(bear_state)

        # HighVolatility: highest mean_vol from remaining
        highvol_state = max(remaining, key=lambda s: mean_vol[s])
        mapping[highvol_state] = "HighVolatility"
        remaining.discard(highvol_state)

        # Sideways: everything else
        for s in remaining:
            mapping[s] = "Sideways"

        print("[RegimeAgent] State -> regime mapping (rank-based, stable):")
        for st in range(n_states):
            print("  State %d: %-16s (mean_ret=%+.4f, mean_vol=%+.4f)" % (
                st, mapping[st], float(mean_ret[st]), float(mean_vol[st])
            ))
        return mapping

    # --------------------------------------------------------------------------
    # STEP 3 - TRAIN
    # --------------------------------------------------------------------------
    def train(self):
        """Fit GaussianHMM on scaled NIFTY feature matrix and persist to disk."""
        assert self.feature_matrix is not None, "Call fetch_data() before train()."

        print("[RegimeAgent] Training HMM (states=%d, iter=%d)..." % (
            N_HMM_STATES, HMM_ITERATIONS
        ))

        self.hmm = GaussianHMM(
            n_components=N_HMM_STATES,
            covariance_type="full",
            n_iter=HMM_ITERATIONS,
            random_state=RANDOM_STATE,
        )
        self.hmm.fit(self.scaled_features)

        converged = getattr(self.hmm.monitor_, "converged", False)
        if not converged:
            print("  [WARN] HMM did not fully converge. "
                  "Model is still usable but may be suboptimal.")

        self.state_map = self._map_states_to_regimes()

        try:
            joblib.dump((self.hmm, self.state_map, self.scaler), HMM_MODEL_PATH)
            print("[RegimeAgent] Model saved -> %s" % HMM_MODEL_PATH)
        except Exception as exc:
            print("  [WARN] Could not save model: %s" % exc)

        start = self.df.index[0].date()
        end   = self.df.index[-1].date()
        print("[RegimeAgent] Trained on %d rows from %s to %s" % (
            len(self.feature_matrix), start, end
        ))
        print("[RegimeAgent] State mapping: %s" % self.state_map)

    # --------------------------------------------------------------------------
    # STEP 4 - LOAD
    # --------------------------------------------------------------------------
    def load(self):
        """Load a previously saved HMM + scaler from disk."""
        if not os.path.exists(HMM_MODEL_PATH):
            raise FileNotFoundError(
                "No trained model found at '%s'. Run train() first." % HMM_MODEL_PATH
            )
        try:
            saved = joblib.load(HMM_MODEL_PATH)
            if len(saved) == 3:
                self.hmm, self.state_map, self.scaler = saved
            else:
                self.hmm, self.state_map = saved   # backward compat
            print("[RegimeAgent] Model loaded. State mapping: %s" % self.state_map)
        except Exception as exc:
            raise RuntimeError(
                "Failed to load model from '%s': %s" % (HMM_MODEL_PATH, exc)
            ) from exc

    # --------------------------------------------------------------------------
    # STEP 5 - GET CURRENT REGIME  (P2 FIX: averaged confidence)
    # --------------------------------------------------------------------------
    def get_current_regime(self):
        """Predict current regime with persistence filter and averaged confidence."""
        assert self.hmm is not None and self.state_map is not None, \
            "Model not ready. Call train() or load() first, then fetch_data()."
        assert self.feature_matrix is not None, \
            "Feature matrix is missing. Call fetch_data() first."

        recent_scaled = self.scaled_features[-60:]
        all_preds     = self.hmm.predict(recent_scaled)

        # ---- Probability Moving Average Filter ----
        # Instead of Viterbi sequence mode, we take the average marginal probability 
        # over the last CONFIDENCE_WINDOW days. This naturally smooths flickering 
        # and guarantees the winning state mathematically matches the highest confidence.
        window_obs  = recent_scaled[-CONFIDENCE_WINDOW:]           # shape: (3, 3)
        all_probs   = self.hmm.predict_proba(window_obs)           # shape: (3, n_states)
        avg_probs   = all_probs.mean(axis=0)                       # shape: (n_states,)
        
        winning_state = int(avg_probs.argmax())
        confidence    = round(float(avg_probs[winning_state]) * 100, 1)
        persistent    = bool(confidence >= 40.0) # Arbitrary threshold for UI

        regime_string = self.state_map.get(winning_state, "Sideways")

        state_probs = {
            self.state_map.get(i, "State%d" % i): round(float(p), 4)
            for i, p in enumerate(avg_probs)
        }

        converged = getattr(self.hmm.monitor_, "converged", True)

        return {
            "regime":             regime_string,
            "confidence":         confidence,
            "raw_state":          winning_state,
            "state_probabilities": state_probs,
            "persistent":         persistent,
            "converged":          converged,
            "as_of_date":         str(date.today()),
        }

    # --------------------------------------------------------------------------
    # STEP 6 - WALK-FORWARD VALIDATION  (P3 FIX: each fold uses rank-based labels)
    # --------------------------------------------------------------------------
    def walk_forward_validate(self):
        """Run walk-forward validation with per-fold scaling and rank-based labeling."""
        assert self.feature_matrix is not None and self.df is not None, \
            "Call fetch_data() first."

        TRAIN_WINDOW = 1000
        STEP         = 63
        n            = len(self.feature_matrix)

        if n < TRAIN_WINDOW + STEP:
            print("[RegimeAgent] Not enough data for walk-forward. "
                  "Need >%d rows, have %d." % (TRAIN_WINDOW + STEP, n))
            return

        print("\n[RegimeAgent] Running walk-forward validation...")
        results     = []
        fold_errors = 0

        for start in range(0, n - TRAIN_WINDOW - STEP, STEP):
            train_end = start + TRAIN_WINDOW
            test_end  = min(train_end + STEP, n)

            # Scale each fold independently -- prevents degenerate covariance
            fold_scaler = StandardScaler()
            train_X = fold_scaler.fit_transform(self.feature_matrix[start:train_end])
            test_X  = fold_scaler.transform(self.feature_matrix[train_end:test_end])

            try:
                tmp_hmm = GaussianHMM(
                    n_components=N_HMM_STATES,
                    covariance_type="full",
                    n_iter=HMM_ITERATIONS,
                    random_state=RANDOM_STATE,
                )
                tmp_hmm.fit(train_X)

                # Temporarily swap so _map_states_to_regimes uses tmp_hmm
                saved_hmm = self.hmm
                self.hmm  = tmp_hmm
                tmp_map   = self._map_states_to_regimes()   # P3: rank-based, stable
                self.hmm  = saved_hmm

                raw_preds  = tmp_hmm.predict(test_X)
                labels     = [tmp_map.get(s, "Sideways") for s in raw_preds]

                period_str = "%s to %s" % (
                    self.df.index[train_end].date(),
                    self.df.index[test_end - 1].date()
                )
                dist = {r: labels.count(r) / len(labels) * 100 for r in ALL_REGIME_LABELS}
                dist["period"] = period_str
                results.append(dist)

            except Exception as fold_exc:
                fold_errors += 1
                if fold_errors <= 3:
                    print("  [WARN] Fold %d skipped: %s" % (start, fold_exc))
                continue

        if fold_errors:
            print("  [INFO] %d fold(s) skipped." % fold_errors)

        # Print summary table
        print("\n%-30s %7s %7s %11s %9s" % (
            "Period", "Bull%", "Bear%", "Sideways%", "HighVol%"
        ))
        print("-" * 68)
        regime_ever_seen = {r: False for r in ALL_REGIME_LABELS}
        for row in results:
            for r in ALL_REGIME_LABELS:
                if row[r] > 0:
                    regime_ever_seen[r] = True
            print("%-30s %6.1f%% %6.1f%% %10.1f%% %8.1f%%" % (
                row["period"],
                row["Bull"], row["Bear"],
                row["Sideways"], row["HighVolatility"]
            ))

        for regime, seen in regime_ever_seen.items():
            if not seen:
                print(
                    "\nWARNING: '%s' never detected in walk-forward. "
                    "Consider extending the training period." % regime
                )

        print("[RegimeAgent] Walk-forward validation complete.\n")


# ==============================================================================
# MAIN BLOCK
# ==============================================================================
if __name__ == "__main__":
    agent = RegimeAgent()
    agent.fetch_data()
    agent.train()
    result = agent.get_current_regime()

    print("\n=== CURRENT MARKET REGIME ===")
    print("Regime:     %s" % result["regime"])
    print("Confidence: %.1f%%" % result["confidence"])
    print("Persistent: %s" % result["persistent"])
    print("As of:      %s" % result["as_of_date"])

    agent.walk_forward_validate()
