"""
Market Regime Detection Agent
=============================
Detects the current market regime from historical stock data using a
Gaussian Hidden Markov Model (HMM).

Output regimes: Bull | Bear | Sideways | HighVolatility
"""

import sys
import io
import warnings
import numpy as np
import pandas as pd
import yfinance as yf
import pandas_ta as ta
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from hmmlearn.hmm import GaussianHMM
from sklearn.preprocessing import StandardScaler

# Force stdout to UTF-8 to avoid cp1252 encoding errors on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# Suppress HMM convergence warnings in production
warnings.filterwarnings("ignore", category=RuntimeWarning)
warnings.filterwarnings("ignore", message=".*did not converge.*")


class MarketRegimeAgent:
    """
    A regime-aware market detection agent built on a Gaussian HMM.

    Usage:
        agent = MarketRegimeAgent(ticker="^NSEI")
        agent.fetch_data()
        agent.compute_features()
        agent.train_hmm()
        agent.label_regimes()
        regime = agent.get_current_regime()
        agent.plot_regimes()
    """

    # Colours used for plotting each regime
    REGIME_COLOURS = {
        "Bull": "#00C853",           # Green
        "Bear": "#D50000",           # Red
        "Sideways": "#FFD600",       # Yellow
        "HighVolatility": "#FF6D00", # Orange
    }

    def __init__(self, ticker: str = "^NSEI", period: str = "3y"):
        """
        Parameters
        ----------
        ticker : str
            Yahoo Finance ticker symbol. Default is ^NSEI (NIFTY 50).
        period : str
            Historical data period for yfinance. Default "3y".
        """
        self.ticker = ticker
        self.period = period

        self.df: pd.DataFrame = pd.DataFrame()
        self.features: np.ndarray = np.array([])       # raw features
        self.scaled_features: np.ndarray = np.array([]) # normalized features
        self.scaler: StandardScaler = StandardScaler()
        self.hmm: GaussianHMM | None = None
        self.states: np.ndarray = np.array([])
        self.regime_map: dict[int, str] = {}

    # ------------------------------------------------------------------
    # STEP 1 - DATA FETCHING
    # ------------------------------------------------------------------
    def fetch_data(self) -> None:
        """Download historical OHLC data from Yahoo Finance."""
        print(f"[RegimeAgent] Downloading {self.period} of data for {self.ticker}...")
        raw = yf.download(self.ticker, period=self.period, auto_adjust=True, progress=False)

        if raw.empty:
            raise ValueError(f"No data returned for ticker '{self.ticker}'. Check the symbol.")

        # Flatten potential MultiIndex columns produced by yfinance >= 0.2
        if isinstance(raw.columns, pd.MultiIndex):
            raw.columns = raw.columns.get_level_values(0)

        self.df = raw[["Open", "High", "Low", "Close", "Volume"]].copy()
        print(f"[RegimeAgent] Fetched {len(self.df)} rows "
              f"({self.df.index[0].date()} to {self.df.index[-1].date()})")

    # ------------------------------------------------------------------
    # STEP 2 - FEATURE ENGINEERING
    # ------------------------------------------------------------------
    def compute_features(self) -> None:
        """Compute daily_return, volatility, RSI, and MACD feature columns."""
        if self.df.empty:
            raise RuntimeError("Call fetch_data() first.")

        df = self.df.copy()

        # Daily percentage return
        df["daily_return"] = df["Close"].pct_change()

        # 20-day rolling standard deviation of returns (annualised proxy for vol)
        df["volatility"] = df["daily_return"].rolling(window=20).std()

        # 14-day RSI
        rsi_series = ta.rsi(df["Close"], length=14)
        df["rsi"] = rsi_series

        # MACD line (12/26/9 defaults)
        macd_df = ta.macd(df["Close"])
        if macd_df is not None and not macd_df.empty:
            df["macd"] = macd_df.iloc[:, 0]  # MACD line column
        else:
            df["macd"] = np.nan

        # Drop warmup NaNs
        df.dropna(inplace=True)

        if len(df) < 60:
            raise ValueError("Insufficient data after feature engineering. Use a longer period.")

        self.df = df
        self.features = df[["daily_return", "volatility", "rsi", "macd"]].values

        # Standardize so all features have mean=0 and std=1.
        # This is critical for HMM covariance stability across tickers.
        self.scaled_features = self.scaler.fit_transform(self.features)
        print(f"[RegimeAgent] Features computed and scaled. Shape: {self.features.shape}")

    # ------------------------------------------------------------------
    # STEP 3 - HMM TRAINING
    # ------------------------------------------------------------------
    def train_hmm(self, n_components: int = 4, n_iter: int = 1000) -> None:
        """
        Fit a Gaussian HMM on the feature matrix.

        Parameters
        ----------
        n_components : int
            Number of hidden states (regimes). Default 4.
        n_iter : int
            Maximum EM iterations. Default 1000.
        """
        if self.scaled_features.size == 0:
            raise RuntimeError("Call compute_features() first.")

        print(f"[RegimeAgent] Training HMM (states={n_components}, iter={n_iter})...")
        self.hmm = GaussianHMM(
            n_components=n_components,
            covariance_type="full",
            n_iter=n_iter,
            random_state=42,
        )
        # Always fit on SCALED features to ensure positive-definite covariance
        self.hmm.fit(self.scaled_features)
        self.states = self.hmm.predict(self.scaled_features)
        print(f"[RegimeAgent] HMM trained. Unique states found: {np.unique(self.states).tolist()}")

    # ------------------------------------------------------------------
    # STEP 4 - REGIME LABELING
    # ------------------------------------------------------------------
    def label_regimes(self) -> None:
        """
        Map HMM integer states to human-readable regime labels.

        Label logic:
          - Bull           : state with highest mean daily return
          - Bear           : state with lowest (most negative) mean daily return
          - HighVolatility : state with highest mean volatility
          - Sideways       : the remaining state
        """
        if self.hmm is None or self.states.size == 0:
            raise RuntimeError("Call train_hmm() first.")

        df = self.df.copy()
        df["state"] = self.states

        stats = (
            df.groupby("state")[["daily_return", "volatility"]]
            .mean()
            .rename(columns={"daily_return": "mean_return", "volatility": "mean_vol"})
        )
        print("\n[RegimeAgent] Per-state statistics:")
        print(stats.to_string())

        mapping: dict[int, str] = {}
        remaining = set(stats.index.tolist())

        # Bull - highest mean return
        bull_state = int(stats["mean_return"].idxmax())
        mapping[bull_state] = "Bull"
        remaining.discard(bull_state)

        # Bear - lowest mean return
        bear_state = int(stats["mean_return"].idxmin())
        mapping[bear_state] = "Bear"
        remaining.discard(bear_state)

        # HighVol → highest mean volatility (from remaining)
        remaining_stats = stats.loc[list(remaining)]
        highvol_state = int(remaining_stats["mean_vol"].idxmax())
        mapping[highvol_state] = "HighVolatility"
        remaining.discard(highvol_state)

        # Sideways → the last state
        sideways_state = list(remaining)[0]
        mapping[sideways_state] = "Sideways"

        self.regime_map = mapping
        print(f"\n[RegimeAgent] Regime mapping: {mapping}")

        # Write the state and regime columns back to the main DataFrame
        self.df["state"] = self.states
        self.df["regime"] = self.df["state"].map(mapping)

    # ------------------------------------------------------------------
    # STEP 5 - CURRENT REGIME OUTPUT
    # ------------------------------------------------------------------
    def get_current_regime(self, window: int = 60) -> str:
        """
        Infer the current regime from the last `window` data rows.

        Uses majority-vote over HMM predictions in the recent window
        to smooth out short-term noise.

        Parameters
        ----------
        window : int
            Number of recent rows to look at. Default 60 (~3 months).

        Returns
        -------
        str
            One of "Bull", "Bear", "Sideways", "HighVolatility".
        """
        if self.hmm is None or not self.regime_map:
            raise RuntimeError("Call train_hmm() and label_regimes() first.")

        recent_scaled = self.scaled_features[-window:]
        recent_states = self.hmm.predict(recent_scaled)

        # Majority vote
        dominant_state = int(np.bincount(recent_states).argmax())
        regime = self.regime_map[dominant_state]

        print(f"\n[RegimeAgent] Current Regime: {regime.upper()}")
        return regime

    # ------------------------------------------------------------------
    # STEP 6 - VISUALIZATION
    # ------------------------------------------------------------------
    def plot_regimes(self, save_path: str | None = None) -> None:
        """
        Plot the Close price coloured by detected regime bands.

        Parameters
        ----------
        save_path : str | None
            If provided, saves the figure to this path instead of showing it.
        """
        if "regime" not in self.df.columns:
            raise RuntimeError("Call label_regimes() first.")

        fig, ax = plt.subplots(figsize=(16, 6))
        ax.plot(self.df.index, self.df["Close"], color="white", linewidth=1.2, zorder=3)

        # Shade background by regime
        prev_date = self.df.index[0]
        prev_regime = self.df["regime"].iloc[0]

        for i in range(1, len(self.df)):
            current_regime = self.df["regime"].iloc[i]
            if current_regime != prev_regime or i == len(self.df) - 1:
                ax.axvspan(
                    prev_date,
                    self.df.index[i],
                    facecolor=self.REGIME_COLOURS.get(prev_regime, "#888888"),
                    alpha=0.25,
                    zorder=1,
                )
                prev_date = self.df.index[i]
                prev_regime = current_regime

        # Legend
        legend_patches = [
            mpatches.Patch(color=c, alpha=0.6, label=label)
            for label, c in self.REGIME_COLOURS.items()
        ]
        ax.legend(handles=legend_patches, loc="upper left", fontsize=10)

        # Styling
        fig.patch.set_facecolor("#0A1128")
        ax.set_facecolor("#0A1128")
        ax.spines["bottom"].set_color("#334155")
        ax.spines["left"].set_color("#334155")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.tick_params(colors="#9CA3AF")
        ax.yaxis.label.set_color("#9CA3AF")
        ax.xaxis.label.set_color("#9CA3AF")
        ax.set_title(
            f"Market Regime Detection - {self.ticker}",
            color="white",
            fontsize=14,
            pad=12,
        )
        ax.set_xlabel("Date", color="#9CA3AF")
        ax.set_ylabel("Price", color="#9CA3AF")

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches="tight")
            print(f"[RegimeAgent] Chart saved to: {save_path}")
        else:
            plt.show()


# ==============================================================================
# MAIN BLOCK - Called from CLI or Node.js backend
# ==============================================================================
if __name__ == "__main__":
    import sys as _sys
    import json as _json

    # Accept ticker from command line: python regime_agent.py RELIANCE.NS
    _ticker = _sys.argv[1] if len(_sys.argv) > 1 else "^NSEI"
    _period = _sys.argv[2] if len(_sys.argv) > 2 else "3y"

    # Try the ticker as-is, then with .NS suffix (NSE India fallback)
    _tickers_to_try = [_ticker]
    if not _ticker.endswith(".NS") and not _ticker.startswith("^"):
        _tickers_to_try.append(_ticker + ".NS")

    _result = None
    for _t in _tickers_to_try:
        try:
            agent = MarketRegimeAgent(ticker=_t, period=_period)
            agent.fetch_data()
            agent.compute_features()
            agent.train_hmm()
            agent.label_regimes()
            _result = {
                "regime": agent.get_current_regime(),
                "ticker": _t,
            }
            break  # success — stop trying
        except Exception as _e:
            print(f"[RegimeAgent] Ticker '{_t}' failed: {_e}", file=_sys.stderr)
            continue

    if _result:
        print(f"\n---JSON_OUTPUT---{_json.dumps(_result)}---JSON_OUTPUT---")
    else:
        print(f"\n---JSON_OUTPUT---{_json.dumps({'error': 'Could not fetch data for ticker'})}---JSON_OUTPUT---")
