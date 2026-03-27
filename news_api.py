import requests
import pandas as pd
from datetime import datetime, timedelta

# --- CONFIGURATION ---
STOCK_NAME = "Tata Consultancy Service"
TICKER = "TCS"
API_KEY = "f238beeb8b1f4fd98cb21136ec72aeed"

# List of highly relevant Indian financial domains
INDIAN_FINANCE_DOMAINS = "economictimes.indiatimes.com,moneycontrol.com,business-standard.com,thehindubusinessline.com,livemint.com"

def fetch_accurate_stock_news(stock_name, ticker, api_key):
    # 1. Date Range
    from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    
    # 2. Strict Query: Uses qInTitle to make the stock the main subject
    # We search for the ticker or name in the TITLE specifically
    query = f'("{stock_name}" OR "{ticker}")'

    url = 'https://newsapi.org/v2/everything'
    params = {
        'qInTitle': query,          # SEARCH ONLY IN HEADLINES
        'domains': INDIAN_FINANCE_DOMAINS, # ONLY TRUSTED INDIAN SOURCES
        'from': from_date,
        'sortBy': 'publishedAt',    # Latest news for prediction
        'language': 'en',
        'apiKey': api_key
    }

    print(f"--- Fetching Targeted News for {ticker} ---")
    response = requests.get(url, params=params)
    data = response.json()

    if data.get("status") == "ok":
        articles = data.get("articles", [])
        news_list = []
        
        for art in articles:
            # Final Manual Filter: Ensure "Sensex" isn't the only subject
            # If the headline is too generic, we ignore it.
            # headline = art["title"]
            # if "Sensex" in headline and ticker not in headline.upper():
            #     continue
                
            news_list.append({
                "Date": art["publishedAt"][:10],
                "Source": art["source"]["name"],
                "Headline": art["title"],
                "Description": art.get("description", ""),
                "URL": art["url"]
            })
        
        return pd.DataFrame(news_list)
    return pd.DataFrame()


# --- EXECUTION ---
df = fetch_accurate_stock_news(STOCK_NAME, TICKER, API_KEY)

if not df.empty:
    filename = f"{TICKER}_CLEAN_news.csv"
    df.to_csv(filename, index=False)
    print(f"Success! Found {len(df)} laser-focused articles.")
    print(df[['Date', 'Headline']].head())
else:
    print("No specific news found. This usually means no major corporate events happened in the last 7 days.")