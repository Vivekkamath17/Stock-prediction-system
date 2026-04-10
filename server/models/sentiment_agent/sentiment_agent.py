import pandas as pd
import torch
import os
from dotenv import load_dotenv
from transformers import AutoTokenizer, AutoModelForSequenceClassification

load_dotenv()

# 1. The Modern LangGraph Imports
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import Tool
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

print("--- Initializing AI Components ---")

# 2. Initialize FinBERT (The Sentiment Engine)
print("Loading FinBERT Model...")
tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")

def score_with_finbert(headline: str) -> str:
    """
    Calculates the financial sentiment (Positive/Negative/Neutral) of a headline.
    """
    inputs = tokenizer(headline, padding=True, truncation=True, return_tensors='pt')
    
    # torch.no_grad() speeds up the model since we aren't training it
    with torch.no_grad():
        outputs = model(**inputs)
    
    predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
    labels = ['Positive', 'Negative', 'Neutral']
    sentiment_index = torch.argmax(predictions).item()
    confidence = predictions[0][sentiment_index].item()
    
    return f"Sentiment: {labels[sentiment_index]} (Confidence: {round(confidence, 4)})"

# 3. Setup the LangGraph Agent (The Brain)
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY") 
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

# Wrap FinBERT into a strict Tool definition
finbert_tool = Tool(
    name="FinBERT_Sentiment_Analyzer",
    func=score_with_finbert,
    description="Calculate the financial sentiment of a specific stock market headline. Pass the exact headline as a string."
)
tools = [finbert_tool]

# Initialize the state-of-the-art React Agent
agent_executor = create_react_agent(llm, tools)

# --- EXECUTION ---

# 4. Load your datasets safely
print("\n--- Loading Data ---")
try:
    df_live = pd.read_csv("RELIANCE_IndianAPI_News.csv")
    df_history = pd.read_csv("RELIANCE_7Day_News.csv") 
    
    # Combine and drop duplicates
    all_headlines = pd.concat([df_live['Headline'], df_history['Headline']]).drop_duplicates().tolist()
    print(f"Successfully loaded {len(all_headlines)} unique headlines.")
except FileNotFoundError:
    print("CSV files not found. Using sample headlines for demonstration.")
    all_headlines = [
        "Reliance Industries restructures AI subsidiary; Meta to own 30% stake after allotment",
        "M-Cap of India's most-valued firms rise by over 63,000 crore",
        "Sensex slips 27 points, Nifty 50 rises 14 points" 
    ]

# 5. Define the Agent's Task
agent_task = f"""
Here is a list of recent news headlines for Reliance Industries:
{all_headlines[:10]} 

Your task is to:
1. Identify the 2-5 most critical, company-specific headlines from this list that will actually move the stock price. Ignore general market wrap-ups.
2. For those 2-5 critical headlines ONLY, call the 'FinBERT_Sentiment_Analyzer' tool to get their sentiment scores.
3. Output the final selected headlines and their corresponding FinBERT scores.
"""

print("\n--- Unleashing the LangGraph Agent ---")
# LangGraph manages state via a list of messages
messages = [
    SystemMessage(content="You are an expert financial data curator for the Indian Stock Market. You evaluate the sentiment of critical news using the provided tools."),
    HumanMessage(content=agent_task)
]

# Invoke the graph
result = agent_executor.invoke({"messages": messages})

print("\n--- FINAL AGENT OUTPUT ---")
# Extract the final AI response from the end of the message chain
print(result["messages"][-1].content)