from fastapi import FastAPI
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import uvicorn

# Initialize the API application
app = FastAPI(title="FinBERT Sentiment Engine", description="Local AI microservice for stock sentiment")

# --- MODEL LOADING (HAPPENS ONLY ONCE) ---
print("--- Waking up FinBERT... ---")
print("Loading model into RAM (this takes a moment but only happens once)...")
tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")
print("--- FinBERT is online and listening on port 8000 ---")

# Define the expected input format (JSON)
class NewsInput(BaseModel):
    headline: str

# --- THE API ENDPOINT ---
@app.post("/analyze")
def analyze_sentiment(data: NewsInput):
    """
    Receives a headline via HTTP POST, runs the math instantly, and returns JSON.
    """
    # 1. Tokenize the incoming text
    inputs = tokenizer(data.headline, padding=True, truncation=True, return_tensors='pt')
    
    # 2. Run the AI inference without calculating gradients (saves memory/time)
    with torch.no_grad():
        outputs = model(**inputs)
        
    # 3. Calculate probabilities
    predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
    labels = ['Positive', 'Negative', 'Neutral']
    
    # 4. Extract the highest score
    sentiment_index = torch.argmax(predictions).item()
    confidence = predictions[0][sentiment_index].item()
    
    # Return the clean JSON response
    return {
        "headline": data.headline,
        "sentiment": labels[sentiment_index],
        "confidence": round(confidence, 4)
    }

# --- SERVER EXECUTION ---
if __name__ == "__main__":
    # Runs the server locally on port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)