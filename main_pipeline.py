import os
import requests
import pandas as pd
from datetime import datetime, timedelta
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import Tool
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

print("--- Master Prediction Pipeline Initialized ---")

# ==========================================
# MODULE 1: DATA GATHERING SCRAPERS
# ==========================================

def fetch_indianapi_live_news(stock_name, ticker, api_key):
    print(f"[Scraper] Fetching Live IndianAPI Data for: {stock_name}...")
    url = f"https://stock.indianapi.in/stock?name={stock_name}"
    headers = {'x-api-key': api_key}
    
    response = requests.get(url, headers=headers)
    scraped_data = []
    
    if response.status_code == 200:
        data = response.json()
        news_items = data.get('recentNews', [])
        
        for item in news_items:
            scraped_data.append({
                "Stock": stock_name,
                "Headline": item.get('headline', item.get('title', 'No Title')),
                "URL": item.get('url', item.get('link', '')),
                "Source": item.get('source', 'IndianAPI')
            })
            
    df = pd.DataFrame(scraped_data)
    if not df.empty:
        df.to_csv(f"{ticker}_IndianAPI_Live.csv", index=False)
        print(f" -> Saved {len(df)} live headlines.")
    return df

def fetch_newsapi_7day_news(stock_name, ticker, api_key):
    print(f"[Scraper] Fetching 7-Day NewsAPI Data for: {stock_name}...")
    from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    query = f'("{stock_name}" OR "{ticker}")'
    indian_finance_domains = "economictimes.indiatimes.com,moneycontrol.com,business-standard.com,thehindubusinessline.com,livemint.com"

    url = 'https://newsapi.org/v2/everything'
    params = {
        'qInTitle': query,
        'domains': indian_finance_domains,
        'from': from_date,
        'sortBy': 'publishedAt',
        'language': 'en',
        'apiKey': api_key
    }

    response = requests.get(url, params=params)
    data = response.json()
    news_list = []

    if data.get("status") == "ok":
        articles = data.get("articles", [])
        for art in articles:
            news_list.append({
                "Stock": stock_name,
                "Headline": art["title"],
                "URL": art["url"],
                "Source": art["source"]["name"]
            })
            
    df = pd.DataFrame(news_list)
    if not df.empty:
        df.to_csv(f"{ticker}_NewsAPI_7Day.csv", index=False)
        print(f" -> Saved {len(df)} historical headlines.")
    return df

# ==========================================
# MODULE 2: AI SENTIMENT SERVER CONNECTION
# ==========================================

def get_sentiment_from_server(headline: str) -> str:
    """
    Sends the headline to your local FastAPI FinBERT server.
    """
    try:
        response = requests.post(
            "http://127.0.0.1:8000/analyze", 
            json={"headline": headline},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return f"Sentiment: {data['sentiment']} (Confidence: {data['confidence']})"
        else:
            return f"Error from FinBERT Server: {response.text}"
    except Exception as e:
        return f"Failed to connect to FastAPI server. Is it running? Error: {str(e)}"

# ==========================================
# MODULE 3: LANGGRAPH AGENT SETUP
# ==========================================

# NOTE: Paste your Gemini API key here
os.environ["GOOGLE_API_KEY"] = "AIzaSyBHuQDN5OTrcAiW9KlAotpxhprpCGXMMv4" 
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

fastapi_tool = Tool(
    name="FinBERT_Sentiment_Analyzer",
    func=get_sentiment_from_server,
    description="Calculate the financial sentiment of a stock market headline by querying the local FinBERT server. Pass the exact headline as a string."
)

agent_executor = create_react_agent(llm, tools=[fastapi_tool])

# ==========================================
# MODULE 4: THE MASTER CONTROLLER
# ==========================================

def run_prediction_pipeline(stock_name: str, ticker: str, indian_api_key: str, news_api_key: str):
    print(f"\n=========================================")
    print(f" STARTING PIPELINE FOR: {stock_name.upper()} ({ticker})")
    print(f"=========================================\n")
    
    # 1. TRIGGER THE SCRAPERS
    print("[1/3] Triggering Data APIs...")
    df_live = fetch_indianapi_live_news(stock_name, ticker, indian_api_key)
    df_history = fetch_newsapi_7day_news(stock_name, ticker, news_api_key)
    
    # 2. COMBINE DATA
    print("[2/3] Processing Data...")
    all_headlines = []
    if not df_live.empty:
        all_headlines.extend(df_live['Headline'].tolist())
    if not df_history.empty:
        all_headlines.extend(df_history['Headline'].tolist())
        
    # Remove duplicates by converting to a set, then back to a list
    all_headlines = list(set(all_headlines))
    print(f" -> Prepared {len(all_headlines)} unique headlines for the Agent.")

    if not all_headlines:
        print("\nNo news found across both APIs. Aborting AI analysis.")
        return

    # 3. UNLEASH THE AGENT
    print("\n[3/3] Unleashing Editorial Agent & Querying FastAPI...")
    agent_task = f"""
    Here is a list of recent news headlines for {stock_name} ({ticker}):
    {all_headlines[:15]} 

    Your task:
    1. Identify the 5 most critical, company-specific headlines from this list that will actually move the stock price. Ignore general market wrap-ups.
    2. For those 5 critical headlines ONLY, call the 'FinBERT_Sentiment_Analyzer' tool to get their sentiment scores.
    3. Output the final selected headlines and their corresponding FinBERT scores cleanly.
    """

    messages = [
        SystemMessage(content=f"You are a quantitative financial analyst covering {stock_name}."),
        HumanMessage(content=agent_task)
    ]

    result = agent_executor.invoke({"messages": messages})

    print("\n=========================================")
    print(f" FINAL AGENT INTELLIGENCE REPORT ")
    print(f"=========================================\n")
    print(result["messages"][-1].content)
    # 1. Clean up the Agent's raw output (removes the weird Google signature)
    raw_output = result["messages"][-1].content
    if isinstance(raw_output, list):
        clean_text = raw_output[0]['text']
    else:
        clean_text = raw_output
        
    print(clean_text)
    
    # 2. Extract the sentiment and confidence using Regex
    import re
    # This looks for patterns like "Positive (Confidence: 0.9368)"
    matches = re.findall(r"(Positive|Negative|Neutral).*?Confidence:\s*([0-9.]+)", clean_text, re.IGNORECASE)
    
    if matches:
        total_score = 0
        headline_count = len(matches)
        
        for sentiment, confidence in matches:
            sentiment = sentiment.capitalize()
            conf_val = float(confidence)
            
            # Apply the mathematical weights
            if sentiment == "Positive":
                total_score += (1 * conf_val)
            elif sentiment == "Negative":
                total_score += (-1 * conf_val)
            # Neutral adds 0, so we do nothing to the total_score
            
        # Calculate the final average sentiment
        average_sentiment = total_score / headline_count
        
        # 3. Generate the Trading Action based on the average
        if average_sentiment > 0.3:
            action = "STRONG BUY 🟢"
        elif average_sentiment > 0.05:
            action = "BUY ↗️"
        elif average_sentiment < -0.3:
            action = "STRONG SELL 🔴"
        elif average_sentiment < -0.05:
            action = "SELL ↘️"
        else:
            action = "HOLD / NEUTRAL ⚖️"
            
        print("\n=========================================")
        print(f" AGGREGATED MARKET SIGNAL")
        print(f"=========================================")
        print(f"Average Sentiment Score: {round(average_sentiment, 4)} (Scale: -1.0 to +1.0)")
        print(f"Recommended Action: {action}")
        print("=========================================\n")
    else:
        print("\nCould not parse exact numerical scores from the Agent's output.")

# ==========================================
# EXECUTION
# ==========================================
if __name__ == "__main__":
    # You can now easily change these variables to track ANY stock
    TARGET_STOCK = "Tata Motors"
    TARGET_TICKER = "TMPV"
    
    # Provide your API keys
    MY_INDIAN_API_KEY = "sk-live-SIoP9683vxB3OUEcvHkhnLVQhFungfJzZ03XCqhX" 
    MY_NEWS_API_KEY = "f238beeb8b1f4fd98cb21136ec72aeed"
    
    run_prediction_pipeline(TARGET_STOCK, TARGET_TICKER, MY_INDIAN_API_KEY, MY_NEWS_API_KEY)
    