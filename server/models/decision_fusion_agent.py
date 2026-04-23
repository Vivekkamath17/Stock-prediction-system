import os
import sys
import json
import traceback

# Add parent directory to path so we can import peer modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from regime_agent.regime_agent import RegimeAgent
from specialist_models import SpecialistModelManager

# Force UTF-8 stdout
if sys.stdout.encoding.lower() != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

def print_json(data):
    """Print strictly formatted JSON for the Node.js backend to parse."""
    print("\n---JSON_OUTPUT---")
    print(json.dumps(data, indent=2))
    print("---JSON_OUTPUT---\n")

def run_fusion(ticker, exchange="NSE"):
    try:
        full_ticker = f"{ticker}.{exchange}" if exchange else ticker
        
        # 1. Get Regime
        regime_agent = RegimeAgent()
        try:
            regime_agent.load()
        except:
            print("[Fusion] HMM not found. Fetching and training...", file=sys.stderr)
            regime_agent.fetch_data()
            regime_agent.train()
            
        regime_agent.fetch_data() # fetch live data for today
        regime_result = regime_agent.get_current_regime()
        
        # 2. Get Specialist Prediction based on Regime
        specialist_mgr = SpecialistModelManager(ticker=full_ticker, regime_agent=regime_agent)
        
        # Train if needed
        specialist_mgr.load_all()
        if not specialist_mgr.models:
            print(f"[Fusion] Models not found or stale for {full_ticker}. Training...", file=sys.stderr)
            specialist_mgr.fetch_and_label()
            specialist_mgr.train_all()
            
        prediction = specialist_mgr.predict(regime_result)
        
        # 3. Output Fusion
        fusion_output = {
            "regime": regime_result,
            "specialist": prediction
        }
        
        print_json(fusion_output)
        
    except Exception as e:
        error_dict = {"error": str(e), "traceback": traceback.format_exc()}
        print_json(error_dict)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_json({"error": "Missing ticker symbol."})
        sys.exit(1)
        
    ticker_arg = sys.argv[1]
    exchange_arg = sys.argv[2] if len(sys.argv) > 2 else "NS"
    
    # Map NSE to NS for yfinance compatibility
    if exchange_arg.upper() == "NSE":
        exchange_arg = "NS"
        
    # Simple cleanup if the frontend passes the suffix
    if ticker_arg.endswith('.NS'):
        ticker_arg = ticker_arg[:-3]
        exchange_arg = 'NS'
        
    run_fusion(ticker_arg, exchange_arg)
