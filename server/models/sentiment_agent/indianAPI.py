import requests
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

def fetch_indianapi_live_news(stock_name, api_key):
    print(f"--- Fetching IndianAPI.in Data for: {stock_name} ---")
    
    # Using the primary /stock endpoint as per official documentation
    url = f"https://stock.indianapi.in/stock?name={stock_name}"
    
    headers = {
        'x-api-key': api_key
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        
        # Extract the 'recentNews' array exactly as defined in the docs
        news_items = data.get('recentNews', [])
        
        if not news_items:
            print(f"\nConnection successful, but the 'recentNews' array was empty.")
            return pd.DataFrame()

        scraped_data = []
        
        for item in news_items:
            scraped_data.append({
                "Stock": data.get('companyName', stock_name), # Grabs official company name too
                "Headline": item.get('headline', item.get('title', 'No Title')),
                "URL": item.get('url', item.get('link', '')),
                "Source": item.get('source', item.get('publisher', 'IndianAPI'))
            })
            
        df = pd.DataFrame(scraped_data)
        return df
        
    else:
        print(f"Error {response.status_code}: {response.text}")
        return pd.DataFrame()

# --- EXECUTION ---
STOCK = "Reliance"
MY_API_KEY = os.getenv("INDIAN_API_KEY") 

df_api_news = fetch_indianapi_live_news(STOCK, MY_API_KEY)

if not df_api_news.empty:
    df_api_news.to_csv("RELIANCE_IndianAPI_News.csv", index=False)
    print(f"\nSuccess! Gathered {len(df_api_news)} flawlessly targeted Indian headlines.")
    print(df_api_news.head())
else:
    print("No data fetched. Double-check your API key tier limits.")