import pandas as pd

EXCHANGE_SUFFIX_MAP = {
    "NSE": ".NS",
    "BSE": ".BO",
    "NYSE": "",
    "NASDAQ": "",
    "LSE": ".L",
    "TSX": ".TO",
}

def normalize_ticker(ticker: str, exchange: str = "NSE") -> str:
    """
    Auto-append yfinance exchange suffix if not already present.
    Handles special characters in Indian tickers like M&M, L&T.
    """
    ticker = ticker.strip().upper()
    suffix = EXCHANGE_SUFFIX_MAP.get(exchange.upper(), ".NS")
    # Already has a suffix (contains a dot after the first char)
    if "." in ticker[1:]:
        return ticker
    # Exception: index tickers starting with ^ need no suffix
    if ticker.startswith("^"):
        return ticker
    return ticker + suffix
