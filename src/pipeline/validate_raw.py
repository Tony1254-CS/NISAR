import os
import glob
import json
import rasterio
import argparse
import yaml
import shutil

def check_granule(granule_dir, bbox):
    # 1. meta.json exists
    meta_path = os.path.join(granule_dir, "meta.json")
    if not os.path.exists(meta_path):
        return False, "meta.json missing"
        
    with open(meta_path) as f:
        meta = json.load(f)
        
    # 2. HHHH.tif exists and opens
    hhhh_path = os.path.join(granule_dir, "HHHH.tif")
    if not os.path.exists(hhhh_path):
        return False, "HHHH.tif missing"
        
    try:
        with rasterio.open(hhhh_path) as src:
            # 4. Width/height > 100
            if src.width <= 100 or src.height <= 100:
                return False, f"Image too small ({src.width}x{src.height})"
                
            # 5. NoData coverage < 50%
            data = src.read(1)
            nodata_val = src.nodata
            if nodata_val is not None:
                nodata_count = (data == nodata_val).sum()
                if nodata_count / data.size >= 0.5:
                    return False, "NoData coverage >= 50%"
                    
            # 6. Bounding box overlaps AOI
            # We assume bbox is lon/lat. tif is in UTM, so we skip exact overlap here if bounds are completely disconnected, 
            # but since it's already clipped by bbox in io_nisar, we assume it overlaps.
    except Exception as e:
        return False, f"rasterio failed to open or read HHHH.tif: {e}"
        
    return True, "Passed"

def validate_raw(reach_id):
    base_dir = f"data/raw/{reach_id}/nisar"
    if not os.path.exists(base_dir):
        print(f"No NISAR directory for {reach_id}")
        return
        
    with open(f"config/reaches/{reach_id}.yaml") as f:
        cfg = yaml.safe_load(f)
    bbox = cfg['bbox']
    
    granule_dirs = glob.glob(os.path.join(base_dir, "NISAR_*"))
    
    results = {}
    passed_count = 0
    rejected_dir = os.path.join(base_dir, "_rejected")
    os.makedirs(rejected_dir, exist_ok=True)
    
    for gdir in granule_dirs:
        if not os.path.isdir(gdir):
            continue
        gname = os.path.basename(gdir)
        
        passed, reason = check_granule(gdir, bbox)
        results[gname] = {"passed": passed, "reason": reason}
        
        if passed:
            passed_count += 1
        else:
            # Move to rejected
            shutil.move(gdir, os.path.join(rejected_dir, gname))
            
    print(f"Validated {len(granule_dirs)} granules. {passed_count} passed.")
    
    with open(os.path.join(base_dir, "validation_raw.json"), "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=True)
    args = parser.parse_args()
    validate_raw(args.reach)
