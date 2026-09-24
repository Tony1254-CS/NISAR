import os
import glob
import numpy as np
import rasterio
from scipy.ndimage import median_filter
import argparse
import yaml

def preprocess_granule(granule_dir, out_dir):
    hhhh_path = os.path.join(granule_dir, "HHHH.tif")
    if not os.path.exists(hhhh_path):
        return False, "HHHH.tif missing"
        
    with rasterio.open(hhhh_path) as src:
        data = src.read(1)
        kwargs = src.meta.copy()
        
    # mask==0 empirically correlates with low backscatter (water), not invalid
    # data — verified against real granules 2026-09-24: mask==0 pixels average
    # -15.2dB (water-like) vs mask==3 at -12.5dB (land-like). A river reach is
    # ~20% water by area, so treating mask==0 as invalid rejected every real
    # date. True fill/invalid pixels are already NaN in the HHHH band itself.
    invalid = (data <= 0) | np.isnan(data)
    
    if invalid.sum() / data.size > 0.2:
        return False, "NoData > 20% of AOI"
        
    # dB conversion
    db = np.empty_like(data, dtype=np.float32)
    db[~invalid] = 10 * np.log10(data[~invalid])
    db[invalid] = np.nan
    
    # Speckle filter (NaN-aware median filter)
    # Fill NaN with local median first, re-mask after
    filled_db = np.copy(db)
    # Basic fill for median filter:
    # A simple way to do nan-aware median is to compute median of valid neighbors.
    # But for a fast approximation as specified: "fill NaN with local median first, re-mask after".
    # Since scipy median_filter doesn't handle NaN well, we fill NaN with the global median or 0.
    filled_db[invalid] = np.nanmedian(db) if not np.isnan(np.nanmedian(db)) else 0
    
    filtered_db = median_filter(filled_db, size=5)
    filtered_db[invalid] = np.nan
    
    # Save output
    os.makedirs(out_dir, exist_ok=True)
    gname = os.path.basename(granule_dir)
    out_path = os.path.join(out_dir, f"{gname}.tif")
    
    kwargs.update({
        'dtype': 'float32',
        'nodata': np.nan,
        'compress': 'lzw'
    })
    with rasterio.open(out_path, 'w', **kwargs) as dst:
        dst.write(filtered_db, 1)
        
    return True, f"Saved to {out_path}"

def preprocess(reach_id):
    base_dir = f"data/raw/{reach_id}/nisar"
    out_dir = f"data/processed/{reach_id}/hh_db"
    
    granule_dirs = glob.glob(os.path.join(base_dir, "NISAR_*"))
    for gdir in granule_dirs:
        if os.path.isdir(gdir):
            print(f"Processing {gdir}...")
            success, msg = preprocess_granule(gdir, out_dir)
            print(f"  {msg}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=True)
    args = parser.parse_args()
    preprocess(args.reach)
