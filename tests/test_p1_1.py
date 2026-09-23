import rasterio
import json
import os

reach = "jamuna-chilmari"
granule = "NISAR_L2_PR_GCOV_031_019_D_076_2005_QPDH_A_20260919T124240_20260919T124314_P05023_F_F_J_001"
out = f"data/raw/{reach}/nisar/{granule}"

# Check meta.json
meta_path = os.path.join(out, "meta.json")
with open(meta_path) as f:
    meta = json.load(f)
    print("Meta json valid.")
    print("Keys:", list(meta.keys()))

# Check HHHH.tif
tif_path = os.path.join(out, "HHHH.tif")
with rasterio.open(tif_path) as src:
    print(f"HHHH.tif opened successfully.")
    print(f"CRS: {src.crs}")
    print(f"Shape: {src.shape}")
