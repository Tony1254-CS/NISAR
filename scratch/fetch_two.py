import os
os.chdir(os.path.join(os.path.dirname(__file__), ".."))

for line in open(".env", encoding="utf-8"):
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        os.environ[k.strip()] = v.strip()

import sys
sys.path.insert(0, os.path.join(os.getcwd(), "src"))

import time
import yaml
from pipeline.io_nisar import stream_and_clip_granule

REACH = "jamuna-chilmari"
TARGET_SCENES = [
    "NISAR_L2_PR_GCOV_029_019_D_076_2005_QPDH_A_20260826T124240_20260826T124315_P05023_N_F_J_001",
    "NISAR_L2_PR_GCOV_031_019_D_076_2005_QPDH_A_20260919T124240_20260919T124314_P05023_F_F_J_001",
]

with open(f"config/reaches/{REACH}.yaml") as f:
    cfg = yaml.safe_load(f)
bbox = cfg["bbox"]

for scene in TARGET_SCENES:
    out = f"data/raw/{REACH}/nisar/{scene}"
    if os.path.exists(os.path.join(out, "meta.json")):
        print(f"SKIP (already done): {scene}", flush=True)
        continue
    print(f"=== Fetching {scene} ===", flush=True)
    for attempt in range(1, 6):
        try:
            stream_and_clip_granule(scene, bbox, out)
            print(f"=== DONE {scene} (attempt {attempt}) ===", flush=True)
            break
        except Exception as e:
            print(f"=== attempt {attempt}/5 FAILED for {scene}: {e} ===", flush=True)
            if attempt == 5:
                print(f"=== GIVING UP on {scene} after 5 attempts ===", flush=True)
                raise
            wait_s = 20 * attempt
            print(f"Retrying in {wait_s}s...", flush=True)
            time.sleep(wait_s)

print("=== ALL FETCHES COMPLETE ===", flush=True)
