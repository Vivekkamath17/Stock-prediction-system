import sys
import os
import json
import yfinance as yf
import pandas as pd

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from utils import normalize_ticker

if __name__ == "__main__":
    ticker = sys.argv[1] if len(sys.argv) > 1 else "^NSEI"
    exchange = sys.argv[2] if len(sys.argv) > 2 else "NSE"
    period = sys.argv[3] if len(sys.argv) > 3 else "1mo"

    normalized = normalize_ticker(ticker, exchange)
    
    try:
        df = yf.download(normalized, period=period, auto_adjust=True, progress=False)

        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        if df.empty:
            result = {"dates": [], "prices": [], "error": "No data"}
        else:
            df = df[["Close"]].dropna().reset_index()
            # yfinance returns 'Date' or 'Datetime' depending on interval
            date_col = "Date" if "Date" in df.columns else "Datetime" if "Datetime" in df.columns else df.columns[0]
            df["Date"] = pd.to_datetime(df[date_col]).dt.strftime("%Y-%m-%d")

            result = {
                "ticker": normalized,
                "period": period,
                "dates": df["Date"].tolist(),
                "prices": df["Close"].round(2).tolist()
            }
    except Exception as e:
        result = {"dates": [], "prices": [], "error": str(e)}

    # Same output formatting convention so the Express backend can parse the JSON
    print(f"---JSON_OUTPUT---{json.dumps(result)}---JSON_OUTPUT---")
