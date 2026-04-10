# 📈 Regime-Aware Multi-Agent Stock Advisory System

## 🚀 Overview

This project implements a **Regime-Aware Multi-Agent Stock Advisory System** that provides **context-aware trading and investment recommendations** by combining:

- Market regime detection  
- Technical analysis using machine learning  
- Risk-aware decision making  
- Agent-based architecture  

Instead of predicting exact stock prices, the system focuses on **probabilistic market behavior**, **risk management**, and **explainable advisory outputs**, similar to how professional trading desks operate.

---

## 🎯 Problem Statement

Retail investors often struggle because:

- Market behavior changes over time (bull, bear, high-volatility)
- Single models fail across all conditions
- Most advisory tools ignore market context and risk

This system addresses these issues by:

- Detecting the current market regime  
- Analyzing stock-level technical behavior  
- Combining multiple expert agents  
- Producing risk-adjusted, interpretable recommendations  

---

## 🧠 Core Idea

**Market context first, decisions second.**

The system separates:

- **Market context** (regime detection using index data)
- **Stock behavior analysis** (technical indicators + ML)
- **Decision logic** (agent fusion + risk control)

This makes the system **robust, explainable, and realistic**.

---

## 🧩 System Architecture (High Level)

Market Index Data (NIFTY-50)
↓
Market Regime Detection (HMM)
↓
| Technical Analysis Agent |
| Sentiment Analysis Agent |
| Risk Management Agent |
    ↓


Decision Fusion Agent
↓
Advisory Output
(Trend • Confidence • Risk • Targets)


---

## 🤖 Agents in the System

### 1️⃣ Market Regime Detection Agent
- Trained on **NIFTY-50 index data**
- Uses **Hidden Markov Model (HMM)**
- Detects latent regimes such as:
  - Bull
  - Bear
  - Sideways
  - High Volatility

📌 Regimes provide **context**, not direct buy/sell signals.

---

### 2️⃣ Technical Analysis Agent
- Operates on **individual stock data**
- Uses machine learning (**XGBoost / Random Forest**)
- Learns from technical indicators such as:
  - Moving Averages
  - RSI
  - MACD
  - ATR
  - Volume metrics

📌 Indicators are treated as **features**, not hard-coded trading rules.

---

### 3️⃣ Risk Management Agent
- Evaluates volatility and uncertainty
- Computes:
  - Risk level
  - Position size
  - Stop-loss distance
- Adjusts exposure based on the detected regime

---

### 4️⃣ Decision Fusion Agent
- Aggregates outputs from all agents
- Applies regime-aware logic
- Produces the final advisory along with confidence

---

## 📤 System Output

For each stock, the system generates:

- Directional Bias (Bullish / Bearish / Neutral)
- Confidence Score
- Expected Return (statistical)
- Suggested Position Size
- Stop-Loss & Target Levels
- Time Horizon

### Example



Stock: RELIANCE
Regime: Bull
Bias: Bullish
Confidence: 72%
Expected Return (3 days): +1.3%
Position Size: 12%
Stop Loss: −1.5 × ATR
Target: 2.5 × ATR


---

## 📊 Backtesting Philosophy

- Uses **walk-forward backtesting**
- No look-ahead bias
- Backtesting is used to:
  - Estimate expected returns
  - Calibrate confidence scores
  - Optimize position sizing rules

📌 The system **does not train explicit time-series price prediction models**.

---

## 🛠 Tech Stack

### Core
- Python
- Pandas, NumPy

### Market Regime Detection
- `hmmlearn` (Gaussian HMM)

### Machine Learning
- Scikit-learn
- XGBoost / Random Forest

### Technical Indicators
- TA-Lib / `ta` library

### Data Sources
- Yahoo Finance
- NSE data (optional)

### Visualization (Optional)
- Streamlit
- Plotly / Matplotlib

---

## 📅 Data Update Strategy

- **End-of-day (EOD)** system
- Data updated daily after market close
- Models retrained periodically (weekly/monthly)
- No intraday or high-frequency trading

---

## 🚀 How to Run the Project Local Development

This system consists of three interconnected layers: A React Frontend, a Node.js Express Backend, and a Python Sentiment Agent. 

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Supabase Account (for Database and Authentication)

### 1. Environment variables
Ensure you have `.env` files properly placed as `dotenv` relies on the execution path.

**Root `.env` and Server `.env` (`C:\Stock-prediction-system\.env` / `server\.env`)**:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=5000
GOOGLE_API_KEY=your_gemini_key
INDIAN_API_KEY=your_indianapi_key
NEWS_API_KEY=your_newsapi_key
```

**Frontend `.env` (`C:\Stock-prediction-system\front-end\.env`)**:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Start the Frontend
The frontend is built with React + Vite. Open a terminal:
```bash
cd front-end
npm install
npm run dev
```
*The dashboard will be available at `http://localhost:5173`*

### 3. Start the Backend API
The Express Node.js backend serves as the bridge between the database, the frontend, and the python machine learning pipelines. Open a second terminal:
```bash
cd server
npm install
node index.js
```
*The Express server will be available at `http://localhost:5000`*

### 4. Start the FinBERT AI Server
The Sentiment Agent relies on a locally hosted generic HuggingFace transformers FastApi server. Open a third terminal at the root directory:
```bash
# Activate your virtual environment
.venv\Scripts\activate   # Windows

# Start the FastApi microservice
python server/models/sentiment_agent/finbert_server.py
```
*The NLP model will load into memory and run on `http://localhost:8000`*

---

## 🧠 Market Regime Detection Agent

The **Regime Agent** is a standalone Python module that uses a **Gaussian Hidden Markov Model (HMM)** to classify the current market into one of four regimes based on 3 years of historical OHLC data.

### Regimes Detected

| Regime | Color | Meaning |
|---|---|---|
| **Bull** | 🟢 Green | Highest positive mean return — strong uptrend |
| **Bear** | 🔴 Red | Most negative mean return — downtrend |
| **HighVolatility** | 🟠 Orange | Highest mean volatility — erratic price swings |
| **Sideways** | 🟡 Yellow | Near-zero return, low volatility — no clear trend |

### How It Works

1. **Data Fetching** — Downloads 3 years of daily OHLC data via `yfinance`
2. **Feature Engineering** — Computes `daily_return`, `volatility` (20-day rolling std), `RSI` (14-day), and `MACD`
3. **Standardization** — All features are scaled to mean=0 / std=1 using `StandardScaler` (prevents HMM covariance errors)
4. **HMM Training** — Fits a 4-state `GaussianHMM` on the scaled feature matrix
5. **Regime Labeling** — Maps HMM integer states to labels based on per-state mean return and volatility statistics
6. **Current Regime** — Takes the last 60 trading rows (~3 months) and uses majority-vote on the predicted states

### Running Standalone

```bash
# Activate virtual environment first
.venv\Scripts\activate    # Windows

# Default — NIFTY 50 index
python server/models/regime_agent/regime_agent.py

# Any US stock
python server/models/regime_agent/regime_agent.py TSLA
python server/models/regime_agent/regime_agent.py AAPL 1y

# Indian NSE stocks (agent auto-appends .NS if needed)
python server/models/regime_agent/regime_agent.py RELIANCE
python server/models/regime_agent/regime_agent.py INFY
python server/models/regime_agent/regime_agent.py HDFCBANK
```

### Yahoo Finance Ticker Reference

| Stock | Ticker |
|---|---|
| NIFTY 50 | `^NSEI` |
| Reliance Industries | `RELIANCE.NS` |
| TCS | `TCS.NS` |
| Infosys | `INFY.NS` |
| HDFC Bank | `HDFCBANK.NS` |
| Tata Motors | `TATAMOTORS.NS` |

> **Note:** For Indian NSE stocks, the agent will automatically try appending `.NS` if the bare ticker fails on Yahoo Finance.

### API Endpoint (via Node.js Backend)

Once `node index.js` is running, the regime can be queried via HTTP:

```
GET http://localhost:5000/api/regime/:ticker
```

**Example:**
```bash
curl http://localhost:5000/api/regime/RELIANCE
```

**Response:**
```json
{
  "success": true,
  "data": {
    "regime": "Bear",
    "ticker": "RELIANCE.NS"
  }
}
```

> **Performance Note:** The regime agent downloads 3y of data and trains an HMM, which takes **30–60 seconds**. The frontend shows a "Training Gaussian HMM..." loading spinner while this runs in the background, independently of the Sentiment Agent.

### Dependencies

The following packages are required (already in `requirements.txt`):

```
yfinance
pandas_ta
hmmlearn
matplotlib
numpy
scikit-learn
```

Install all with:
```bash
pip install -r requirements.txt
```
