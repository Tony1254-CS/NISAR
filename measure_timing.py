import earthaccess
import time
import json
import os
import shutil

earthaccess.login(strategy='environment')

with open("data/raw/jamuna-chilmari/catalog.json") as f:
    catalog = json.load(f)

feature = catalog["features"][0]
granule_name = feature['properties']['sceneName']
print(f"Testing download time for: {granule_name}")

results = earthaccess.search_data(
    short_name="NISAR_L2_GCOV_PROVISIONAL_V1",
    granule_name=granule_name
)

out_dir = "data/raw/jamuna-chilmari/nisar_test"
os.makedirs(out_dir, exist_ok=True)

start_time = time.time()
downloaded_paths = earthaccess.download(results, local_path=out_dir)
end_time = time.time()

duration = end_time - start_time
print(f"Downloaded in {duration:.2f} seconds.")

# Extrapolate for ~15 granules
extrapolated = duration * 15
print(f"Estimated P1 time for 15 granules: {extrapolated:.2f} seconds ({extrapolated/60:.2f} minutes).")

# Cleanup
try:
    shutil.rmtree(out_dir)
except Exception as e:
    pass
