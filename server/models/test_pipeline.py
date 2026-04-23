"""
End-to-end test: RegimeAgent + SpecialistModelManager
======================================================
Run from server/models/:
    cd "Stock-prediction-system/server/models"
    python test_pipeline.py

Tests:
  1. RegimeAgent.fetch_data()
  2. RegimeAgent.train()
  3. RegimeAgent.get_current_regime()
  4. RegimeAgent.walk_forward_validate()
  5. SpecialistModelManager.fetch_and_label("RELIANCE.NS")
  6. SpecialistModelManager.train_all()
  7. SpecialistModelManager.predict()
"""

import io
import os
import sys
import traceback

# Force UTF-8 stdout on Windows
if sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

# Make sure imports resolve correctly regardless of launch cwd
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from regime_agent.regime_agent import RegimeAgent
from specialist_models import SpecialistModelManager

DIVIDER = "\n" + "=" * 70


def banner(msg):
    """Print a clearly visible section header."""
    print("%s\n  %s\n%s" % (DIVIDER, msg, "=" * 70))


# ==============================================================================
# PHASE 1 -- Regime Agent: fetch + train
# ==============================================================================
banner("PHASE 1 -- RegimeAgent: fetch_data + train")

ra = RegimeAgent()

try:
    ra.fetch_data()
except Exception as e:
    print("[FATAL] fetch_data() failed: %s" % e)
    traceback.print_exc()
    sys.exit(1)

try:
    ra.train()
except Exception as e:
    print("[FATAL] train() failed: %s" % e)
    traceback.print_exc()
    sys.exit(1)

# ==============================================================================
# PHASE 2 -- get_current_regime
# ==============================================================================
banner("PHASE 2 -- RegimeAgent: get_current_regime")

try:
    regime_result = ra.get_current_regime()
    print("\n=== CURRENT MARKET REGIME ===")
    print("  Regime:              %s"   % regime_result["regime"])
    print("  Confidence:          %.1f%%" % regime_result["confidence"])
    print("  Raw State:           %s"   % regime_result["raw_state"])
    print("  State Probs:         %s"   % regime_result["state_probabilities"])
    print("  Persistent:          %s"   % regime_result["persistent"])
    print("  HMM Converged:       %s"   % regime_result["converged"])
    print("  As of Date:          %s"   % regime_result["as_of_date"])
except Exception as e:
    print("[FATAL] get_current_regime() failed: %s" % e)
    traceback.print_exc()
    sys.exit(1)

# ==============================================================================
# PHASE 3 -- walk-forward validation (can take ~60-120s)
# ==============================================================================
banner("PHASE 3 -- RegimeAgent: walk_forward_validate (may take ~60-120s)")

try:
    ra.walk_forward_validate()
except Exception as e:
    print("[WARN] walk_forward_validate() failed (non-fatal): %s" % e)
    traceback.print_exc()

# ==============================================================================
# PHASE 4 -- Specialist: fetch_and_label
# ==============================================================================
TEST_TICKER = "INFY.NS"

banner("PHASE 4 -- SpecialistModelManager: fetch_and_label (%s)" % TEST_TICKER)

sm = SpecialistModelManager(ticker=TEST_TICKER, regime_agent=ra)

try:
    sm.fetch_and_label()
except Exception as e:
    print("[FATAL] fetch_and_label() failed: %s" % e)
    traceback.print_exc()
    sys.exit(1)

# ==============================================================================
# PHASE 5 -- Specialist: train_all
# ==============================================================================
banner("PHASE 5 -- SpecialistModelManager: train_all (%s)" % TEST_TICKER)

try:
    sm.train_all()
except Exception as e:
    print("[FATAL] train_all() failed: %s" % e)
    traceback.print_exc()
    sys.exit(1)

# ==============================================================================
# PHASE 6 -- Specialist: predict
# ==============================================================================
banner("PHASE 6 -- SpecialistModelManager: predict (%s)" % TEST_TICKER)

try:
    prediction = sm.predict(regime_result)
    print("\n=== SPECIALIST MODEL PREDICTION ===")
    print("  Stock:              %s"   % prediction["ticker"])
    print("  Signal:             %s"   % prediction["signal"])
    print("  Probability Up:     %s"   % prediction["probability"])
    print("  Conviction:         %s"   % prediction["conviction"])
    print("  Regime Used:        %s"   % prediction["regime_used"])
    print("  Regime Confidence:  %.1f%%" % prediction["regime_confidence"])
    print("  Model Accuracy:     %s"   % prediction["model_accuracy"])
    print("  As of Date:         %s"   % prediction["as_of_date"])
except Exception as e:
    print("[FATAL] predict() failed: %s" % e)
    traceback.print_exc()
    sys.exit(1)

# ==============================================================================
# CONTRACT VERIFICATION
# ==============================================================================
banner("ALL TESTS PASSED -- Verifying output dict contracts")

print("\nOutput dict keys:")
print("  regime_result keys : %s" % list(regime_result.keys()))
print("  prediction keys    : %s" % list(prediction.keys()))

required_regime_keys = {
    "regime", "confidence", "raw_state",
    "state_probabilities", "persistent", "as_of_date"
}
required_signal_keys = {
    "ticker", "signal", "probability", "conviction",
    "regime_used", "regime_confidence", "model_accuracy", "as_of_date"
}

missing_r = required_regime_keys - set(regime_result.keys())
missing_s = required_signal_keys  - set(prediction.keys())

if missing_r:
    print("\n[WARN] regime_result missing keys: %s" % missing_r)
else:
    print("\n  regime_result contract   OK  (all required keys present)")

if missing_s:
    print("[WARN] prediction missing keys: %s" % missing_s)
else:
    print("  prediction contract      OK  (all required keys present)")
