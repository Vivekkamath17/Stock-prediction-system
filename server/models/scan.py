import os
files = [
    r"regime_agent\regime_agent.py",
    r"specialist_models.py",
    r"test_pipeline.py",
]
for f in files:
    txt = open(f, encoding="utf-8").read()
    hits = []
    for i, c in enumerate(txt):
        if ord(c) > 127:
            hits.append((i, repr(c)))
    if hits:
        print("--- " + f + " ---")
        for pos, c in hits[:40]:
            print("  pos " + str(pos) + ": " + c)
    else:
        print(f + ": clean")
