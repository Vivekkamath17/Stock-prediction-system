import os
from supabase import create_client
from dotenv import load_dotenv
import yfinance as yf
import pandas as pd
import time

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

supabase = create_client(url, key)

def check_tickers():
    print("Fetching stocks from Supabase...")
    response = supabase.table("Stocks").select("*").execute()
    stocks = response.data
    
    print(f"Found {len(stocks)} stocks. Validating yfinance tickers...")
    
    working = []
    failed = []
    
    for idx, stock in enumerate(stocks):
        ticker = stock.get("yfinance_ticker")
        if not ticker:
            ticker = stock.get("Ticker") + ".NS"
            
        print(f"[{idx+1}/{len(stocks)}] Testing {ticker} (for {stock['Stock']})... ", end="", flush=True)
        try:
            # Simple quick check
            df = yf.download(ticker, period="5d", progress=False)
            if df is not None and not df.empty:
                print("OK")
                working.append((stock['id'], ticker))
            else:
                print("FAILED (Empty)")
                failed.append((stock['id'], stock['Ticker'], stock['Stock']))
        except Exception as e:
            print(f"FAILED ({e})")
            failed.append((stock['id'], stock['Ticker'], stock['Stock']))
            
        time.sleep(0.5) # Rate limit protection

    print("\n=== SUMMARY ===")
    print(f"Working: {len(working)}")
    print(f"Failed: {len(failed)}")
    
    if failed:
        print("\nFailed Tickers:")
        for fid, fticker, fname in failed:
            print(f"- {fname} (Base Ticker: {fticker})")
            
if __name__ == "__main__":
    check_tickers()
