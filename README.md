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
