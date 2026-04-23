import yfinance as yf
import pandas as pd
import pandas_ta as ta
import numpy as np
import matplotlib.pyplot as plt
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils import normalize_ticker

class TechnicalAnalysisAgent:
    def __init__(self, ticker="^NSEI", exchange="NSE", period="1y"):
        self.raw_ticker = ticker
        self.exchange = exchange
        self.ticker = normalize_ticker(ticker, exchange)
        self.period = period
        self.data = pd.DataFrame()
        self.results = {}

    def fetch_data(self):
        """Fetch OHLC data with fallback retry on empty result."""
        import yfinance as yf

        def _try_fetch(t):
            data = yf.download(t, period=self.period,
                               auto_adjust=True, progress=False)
            return data

        self.data = _try_fetch(self.ticker)

        # Retry with .NS if first attempt fails and no suffix was given
        if (self.data is None or self.data.empty) and "." not in self.ticker:
            fallbacks = [self.ticker + ".NS", self.ticker + ".BO"]
            for fb in fallbacks:
                self.data = _try_fetch(fb)
                if self.data is not None and not self.data.empty:
                    self.ticker = fb
                    print(f"[INFO] Resolved ticker to: {self.ticker}")
                    break

        if self.data is None or self.data.empty:
            print(f"[ERROR] No data for {self.ticker}. "
                  f"Check ticker symbol and exchange.")
            return False

        # Flatten MultiIndex columns if present (yfinance v0.2+)
        if isinstance(self.data.columns, pd.MultiIndex):
            self.data.columns = self.data.columns.get_level_values(0)

        self.data = self.data[["Open", "High", "Low", "Close", "Volume"]].copy()
        self.data.dropna(inplace=True)
        print(f"[OK] Fetched {len(self.data)} rows for {self.ticker}")
        return True

    def compute_indicators(self):
        """
        Compute RSI, MACD, and Moving Averages.
        Handles missing data by dropping NaNs appropriately.
        """
        if self.data is None or self.data.empty:
            print("[SKIP] No data — cannot compute indicators.")
            return False

        # a) RSI (14-day)
        self.data["RSI_14"] = self.data.ta.rsi(length=14)

        # b) MACD
        macd_df = self.data.ta.macd(fast=12, slow=26, signal=9)
        if macd_df is not None and not macd_df.empty:
            self.data = pd.concat([self.data, macd_df], axis=1)
        else:
            self.data["MACD_12_26_9"] = np.nan
            self.data["MACDh_12_26_9"] = np.nan
            self.data["MACDs_12_26_9"] = np.nan

        # c) Moving Averages
        self.data["MA50"] = self.data["Close"].rolling(50).mean()
        self.data["MA200"] = self.data["Close"].rolling(200).mean()

        # d) ADX (Trend Strength)
        adx_df = self.data.ta.adx(length=14)
        if adx_df is not None and not adx_df.empty:
            self.data = pd.concat([self.data, adx_df], axis=1)
        else:
            self.data["ADX_14"] = np.nan
            self.data["DMP_14"] = np.nan
            self.data["DMN_14"] = np.nan

        # e) OBV (Volume Confirmation)
        obv = self.data.ta.obv()
        if obv is not None and not obv.empty:
            self.data["OBV"] = obv
            self.data["OBV_MA"] = self.data["OBV"].rolling(20).mean()
        else:
            self.data["OBV"] = np.nan
            self.data["OBV_MA"] = np.nan

        # Drop NaN rows after computing all indicators
        # Handle edge cases like insufficient data for 200-day MA
        data_clean = self.data.dropna()
        if not data_clean.empty:
            self.data = data_clean
        else:
            # Fallback if insufficient data for MA200
            subset = ["RSI_14", "MACD_12_26_9", "MACDh_12_26_9", "MACDs_12_26_9", "MA50", "ADX_14"]
            subset = [col for col in subset if col in self.data.columns]
            self.data.dropna(subset=subset, inplace=True)

    def compute_score(self):
        """
        Compute scores based on RSI, MACD, and MA conditions.
        Returns a dictionary with the results.
        """
        if self.data.empty:
            return {
                "rsi_value": 0.0,
                "rsi_score": 0,
                "macd_score": 0,
                "ma_score": 0,
                "final_score": 0.0,
                "trend_signal": "Neutral (No Data)",
                "confidence": 0.0
            }

        latest = self.data.iloc[-1]

        # a) Extract Latest Values
        adx = float(latest.get("ADX_14", 20)) if not pd.isna(latest.get("ADX_14", float("nan"))) else 20.0
        rsi = float(latest.get("RSI_14", 50)) if not pd.isna(latest.get("RSI_14", float("nan"))) else 50.0
        
        macd_line = float(latest.get("MACD_12_26_9", 0)) if not pd.isna(latest.get("MACD_12_26_9", float("nan"))) else 0.0
        signal_line = float(latest.get("MACDs_12_26_9", 0)) if not pd.isna(latest.get("MACDs_12_26_9", float("nan"))) else 0.0
        histogram = float(latest.get("MACDh_12_26_9", 0)) if not pd.isna(latest.get("MACDh_12_26_9", float("nan"))) else 0.0

        ma50 = latest.get("MA50", 0)
        ma200 = latest.get("MA200", 0)
        close = latest.get("Close", 0)

        obv = latest.get("OBV", 0)
        obv_ma = latest.get("OBV_MA", 0)

        # Determine Market Context
        is_trending = adx >= 25
        is_sideways = adx < 20

        # b) RSI Score (Context-Aware)
        # In sideways markets, RSI acts as a mean-reversion oscillator.
        # In trending markets, RSI stays overbought/oversold longer (strength).
        rsi_score = 0
        if is_sideways:
            if rsi > 70: rsi_score = -1.0   # Overbought -> Expect Drop
            elif rsi < 30: rsi_score = 1.0  # Oversold -> Expect Bounce
            else: rsi_score = 0.0
        else:
            if rsi > 70: rsi_score = 0.5    # Strong Upward Trend
            elif rsi < 30: rsi_score = -1.0 # Strong Downward Trend
            elif rsi > 50: rsi_score = 0.5
            else: rsi_score = -0.5

        # c) MACD Score (Trend-following)
        # MACD whipsaws in sideways markets, so we reduce its signal strength.
        macd_score = 0
        if macd_line > signal_line and histogram > 0:
            macd_score = 1.0 if is_trending else 0.5
        elif macd_line < signal_line and histogram < 0:
            macd_score = -1.0 if is_trending else -0.5

        # d) Moving Average Score
        ma_score = 0
        if not (pd.isna(ma50) or pd.isna(ma200) or pd.isna(close)):
            if ma50 > ma200 and close > ma50:
                ma_score = 1.0
            elif ma50 < ma200 and close < ma50:
                ma_score = -1.0
            elif close > ma50:
                ma_score = 0.5
            elif close < ma50:
                ma_score = -0.5

        # e) Volume Confirmation (OBV)
        # If OBV is above its 20-day moving average, volume supports upward movement.
        vol_score = 0
        if not (pd.isna(obv) or pd.isna(obv_ma)):
            if obv > obv_ma:
                vol_score = 1.0
            else:
                vol_score = -1.0

        # f) Final Score Calculation (Weighted based on context)
        if is_trending:
            # Trend indicators (MACD, MA) matter most
            final_score = (rsi_score * 0.15) + (macd_score * 0.35) + (ma_score * 0.35) + (vol_score * 0.15)
        elif is_sideways:
            # Oscillators (RSI) matter most
            final_score = (rsi_score * 0.40) + (macd_score * 0.10) + (ma_score * 0.30) + (vol_score * 0.20)
        else:
            # Transitional market (20 <= ADX < 25)
            final_score = (rsi_score * 0.25) + (macd_score * 0.25) + (ma_score * 0.30) + (vol_score * 0.20)

        final_score = max(-1.0, min(1.0, final_score))

        # g) Trend Signal Mapping
        if final_score >= 0.5:
            trend_signal = "Strong Bullish"
        elif 0.1 <= final_score < 0.5:
            trend_signal = "Mild Bullish"
        elif -0.1 < final_score < 0.1:
            trend_signal = "Neutral / Choppy"
        elif -0.5 < final_score <= -0.1:
            trend_signal = "Mild Bearish"
        else:
            trend_signal = "Strong Bearish"

        # h) Confidence
        confidence = round(abs(final_score) * 100, 2)

        self.results = {
            "rsi_value": float(rsi),
            "rsi_score": int(np.sign(rsi_score)),
            "macd_score": int(np.sign(macd_score)),
            "ma_score": int(np.sign(ma_score)),
            "final_score": float(final_score),
            "trend_signal": trend_signal,
            "confidence": float(confidence),
            "adx_value": float(adx),
            "is_trending": bool(is_trending)
        }

        
        return self.results

    def get_signal(self):
        """
        Prints formatted output summary and returns the score dict.
        """
        res = self.compute_score()
        
        def map_score(score):
            if score > 0: return "Bullish"
            elif score < 0: return "Bearish"
            else: return "Neutral"

        rsi_text = map_score(res["rsi_score"])
        macd_text = map_score(res["macd_score"])
        ma_text = map_score(res["ma_score"])
        
        if res["macd_score"] == 1:
            macd_cond = "MACD > Signal & Hist > 0"
        elif res["macd_score"] == -1:
            macd_cond = "MACD < Signal & Hist < 0"
        else:
            macd_cond = "Mixed / Other"

        if res["ma_score"] == 1:
            ma_cond = "MA50 > MA200 & Close > MA50"
        elif res["ma_score"] == -1:
            ma_cond = "MA50 < MA200 & Close < MA50"
        else:
            ma_cond = "Mixed / No MA200"
            
        print("=== Technical Analysis Agent Output ===")
        print(f"Ticker: {self.ticker}")
        print(f"RSI (14):     {res['rsi_value']:.2f}".ljust(30) + f"-> {rsi_text}")
        print(f"MACD Signal:  {macd_cond}".ljust(30) + f"-> {macd_text}")
        print(f"MA Crossover: {ma_cond}".ljust(30) + f"-> {ma_text}")
        print(f"Final Score:  {res['final_score']:.4f}")
        print(f"Trend Signal: {res['trend_signal']}")
        print(f"Confidence:   {res['confidence']}%")
        
        return res

    def plot_indicators(self):
        """
        Creates a 3-panel chart.
        Panel 1: Close Price with MA50 and MA200 lines
        Panel 2: MACD line and Signal line with histogram bars
        Panel 3: RSI line with horizontal lines at 30 and 70
        """
        if self.data.empty:
            print("No data to plot.")
            return

        fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(10, 12), sharex=True)
        
        # Panel 1: Close Price with MA50 and MA200 lines
        ax1.plot(self.data.index, self.data["Close"], label="Close Price", color="black", alpha=0.6)
        if "MA50" in self.data.columns and not self.data["MA50"].isna().all():
            ax1.plot(self.data.index, self.data["MA50"], label="MA50", color="blue")
        if "MA200" in self.data.columns and not self.data["MA200"].isna().all():
            ax1.plot(self.data.index, self.data["MA200"], label="MA200", color="red")
        ax1.set_title(f"{self.ticker} Price & Moving Averages")
        ax1.set_ylabel("Price")
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Panel 2: MACD line and Signal line with histogram bars
        if "MACD_12_26_9" in self.data.columns:
            ax2.plot(self.data.index, self.data["MACD_12_26_9"], label="MACD", color="blue")
            ax2.plot(self.data.index, self.data["MACDs_12_26_9"], label="Signal", color="orange")
            colors = ['green' if val >= 0 else 'red' for val in self.data["MACDh_12_26_9"]]
            # To plot histogram bars appropriately based on dates
            width = (self.data.index[1] - self.data.index[0]) * 0.8 if len(self.data.index) > 1 else 1
            ax2.bar(self.data.index, self.data["MACDh_12_26_9"], label="Histogram", color=colors, alpha=0.5, width=width)
        ax2.set_title("MACD")
        ax2.set_ylabel("MACD Value")
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        # Panel 3: RSI line with horizontal lines at 30 and 70
        if "RSI_14" in self.data.columns:
            ax2.plot() # Reset property
            ax3.plot(self.data.index, self.data["RSI_14"], label="RSI", color="purple")
            ax3.axhline(70, color="red", linestyle="--", alpha=0.5)
            ax3.axhline(30, color="green", linestyle="--", alpha=0.5)
        ax3.set_title("RSI (14)")
        ax3.set_ylabel("RSI Value")
        ax3.set_xlabel("Date")
        ax3.legend()
        ax3.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.show()

if __name__ == "__main__":
    import sys
    import json
    import matplotlib.pyplot as plt
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from utils import normalize_ticker
    
    ticker = sys.argv[1] if len(sys.argv) > 1 else "^NSEI"
    exchange = sys.argv[2] if len(sys.argv) > 2 else "NSE"
    
    agent = TechnicalAnalysisAgent(ticker=ticker, exchange=exchange)
    
    data_fetched = agent.fetch_data()
    if data_fetched:
        agent.compute_indicators()
    res = agent.get_signal()
    
    print("---JSON_OUTPUT---")
    print(json.dumps(res))
    print("---JSON_OUTPUT---")
