import os
import glob
import json
import rasterio
import numpy as np
import argparse

def check_rfi(data, threshold_db=3.0, consecutive_pixels=20):
    """
    Checks for Radio Frequency Interference (RFI) by computing row/col mean profiles.
    Flags if any band of >= 20 consecutive rows/cols deviates > 3 dB from the date median profile.
    """
    # Use nanmean to ignore masked pixels
    row_means = np.nanmean(data, axis=1)
    col_means = np.nanmean(data, axis=0)
    
    row_median = np.nanmedian(row_means)
    col_median = np.nanmedian(col_means)
    
    # Deviations
    row_dev = np.abs(row_means - row_median) > threshold_db
    col_dev = np.abs(col_means - col_median) > threshold_db
    
    # Check for consecutive deviations
    def has_consecutive(arr, n):
        count = 0
        for val in arr:
            if val:
                count += 1
                if count >= n:
                    return True
            else:
                count = 0
        return False
        
    row_rfi = has_consecutive(row_dev, consecutive_pixels)
    col_rfi = has_consecutive(col_dev, consecutive_pixels)
    
    return row_rfi or col_rfi

def screen_rfi(reach_id):
    db_dir = f"data/processed/{reach_id}/hh_db"
    out_path = f"data/processed/{reach_id}/rfi_flags.json"
    
    tif_files = glob.glob(os.path.join(db_dir, "*.tif"))
    flags = {}
    
    for tif in tif_files:
        basename = os.path.basename(tif)
        try:
            with rasterio.open(tif) as src:
                data = src.read(1)
            
            has_rfi = check_rfi(data)
            flags[basename] = has_rfi
            if has_rfi:
                print(f"RFI detected in {basename}")
        except Exception as e:
            print(f"Failed to screen {basename}: {e}")
            flags[basename] = False # Assume no RFI if error
            
    with open(out_path, "w") as f:
        json.dump(flags, f, indent=2)
        
    print(f"RFI screening complete. Logged to {out_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=True)
    args = parser.parse_args()
    screen_rfi(args.reach)
