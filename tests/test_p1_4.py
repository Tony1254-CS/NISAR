import os
import glob
import rasterio
import numpy as np

def test_dswx_classes():
    reach = "jamuna-chilmari"
    dswx_dir = f"data/raw/{reach}/dswx"

    date_dirs = glob.glob(os.path.join(dswx_dir, "*"))
    assert len(date_dirs) > 0, "No DSWx dates found"
    
    checked = 0
    for d_dir in date_dirs:
        if not os.path.isdir(d_dir):
            continue
        wtr_files = glob.glob(os.path.join(d_dir, "*_B01_WTR.tif"))
        if not wtr_files:
            continue
        
        for w_file in wtr_files:
            with rasterio.open(w_file) as src:
                data = src.read(1)
                classes = np.unique(data)
                valid_subset = set([0, 1, 3, 250, 251, 255])
                
                diff = set(classes) - valid_subset
                assert not diff, f"File {w_file} has unexpected classes: {diff}"
                checked += 1
                
    assert checked > 0, "No B01_WTR files checked"
    print(f"Successfully checked {checked} WTR files. All classes valid.")

if __name__ == "__main__":
    test_dswx_classes()
