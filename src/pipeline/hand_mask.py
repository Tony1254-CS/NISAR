import os
import glob
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling
import argparse
import yaml
import json

def create_hand_mask(reach_id):
    out_dir = f"data/processed/{reach_id}"
    os.makedirs(out_dir, exist_ok=True)
    log_path = os.path.join(out_dir, "hand_mask.log.json")
    
    # 1. Get the NISAR grid
    nisar_files = glob.glob(f"data/processed/{reach_id}/hh_db/*.tif")
    if not nisar_files:
        # Use synthetic or just return if no NISAR data
        print("No NISAR data to get grid from.")
        return False
        
    ref_path = nisar_files[0]
    with rasterio.open(ref_path) as ref:
        ref_crs = ref.crs
        ref_transform = ref.transform
        ref_width = ref.width
        ref_height = ref.height
        
    # 2. Get HAND file
    hand_files = glob.glob("data/raw/common/hand/*.tif")
    if not hand_files:
        print("HAND tile missing -> skip mask, flag hand_mask: NOT_EVALUATED")
        with open(log_path, "w") as f:
            json.dump({"hand_mask": "NOT_EVALUATED", "reason": "No HAND tiles found"}, f)
        return True
        
    # We just use the first HAND file (assume single tile covers AOI for this prototype)
    hand_path = hand_files[0]
    
    with rasterio.open(hand_path) as src:
        hand_data = src.read(1)
        hand_nodata = src.nodata
        
        # 3. Warp to NISAR grid
        out_data = np.empty((ref_height, ref_width), dtype=np.float32)
        
        reproject(
            source=hand_data,
            destination=out_data,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=ref_transform,
            dst_crs=ref_crs,
            resampling=Resampling.bilinear,
            src_nodata=hand_nodata,
            dst_nodata=np.nan
        )
        
    # 4. Create mask: invalid_for_water = HAND > 15 m
    # Handle NaN properly
    invalid_for_water = (out_data > 15) & (~np.isnan(out_data))
    
    pixel_count = invalid_for_water.sum()
    total_pixels = ref_width * ref_height
    print(f"HAND mask invalid pixels: {pixel_count} / {total_pixels} ({(pixel_count/total_pixels)*100:.2f}%)")
    
    out_path = os.path.join(out_dir, "hand_invalid.tif")
    kwargs = {
        'driver': 'GTiff',
        'height': ref_height,
        'width': ref_width,
        'count': 1,
        'dtype': 'uint8',
        'crs': ref_crs,
        'transform': ref_transform,
        'compress': 'lzw'
    }
    with rasterio.open(out_path, 'w', **kwargs) as dst:
        dst.write(invalid_for_water.astype(np.uint8), 1)
        
    with open(log_path, "w") as f:
        json.dump({
            "hand_mask": "EVALUATED", 
            "invalid_pixel_count": int(pixel_count),
            "total_pixels": int(total_pixels),
            "percent_invalid": float((pixel_count/total_pixels)*100)
        }, f, indent=2)
        
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=True)
    args = parser.parse_args()
    create_hand_mask(args.reach)
