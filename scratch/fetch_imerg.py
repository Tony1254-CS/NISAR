import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

for line in open(os.path.join(os.path.dirname(__file__), "..", ".env"), encoding="utf-8"):
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        os.environ[k.strip()] = v.strip()

os.chdir(os.path.join(os.path.dirname(__file__), ".."))

from pipeline.io_imerg import fetch_imerg_range, daily_aoi_precip, rainfall_anomaly
import json

paths = fetch_imerg_range("2026-08-01", "2026-09-19")
print("total files:", len(paths))
series = daily_aoi_precip(paths, [89.6, 25.4, 89.9, 25.75])
print("series len:", len(series))
print(series[:3])
print(series[-3:])
t0_anom = rainfall_anomaly(series, "2026-08-26")
t1_anom = rainfall_anomaly(series, "2026-09-19")
print("t0 anomaly:", t0_anom)
print("t1 anomaly:", t1_anom)

os.makedirs("data/processed/jamuna-chilmari", exist_ok=True)
with open("data/processed/jamuna-chilmari/imerg.json", "w") as f:
    json.dump({"series": series, "t0_anomaly": t0_anom, "t1_anomaly": t1_anom}, f, indent=2)
print("wrote data/processed/jamuna-chilmari/imerg.json")
