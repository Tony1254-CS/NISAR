import rasterio
import yaml
import glob
import os

def test_hand_coverage():
    reach = "jamuna-chilmari"
    with open(f"config/reaches/{reach}.yaml") as f:
        cfg = yaml.safe_load(f)
    bbox = cfg['bbox']

    hand_files = glob.glob("data/raw/common/hand/*.tif")
    assert len(hand_files) > 0, "No HAND files found"

    with rasterio.open(hand_files[0]) as src:
        bounds = src.bounds
        print(f"HAND bounds: {bounds}")
        print(f"AOI bbox: {bbox}")
        
        assert bounds.left <= bbox[0], "HAND does not cover min_lon"
        assert bounds.bottom <= bbox[1], "HAND does not cover min_lat"
        assert bounds.right >= bbox[2], "HAND does not cover max_lon"
        assert bounds.top >= bbox[3], "HAND does not cover max_lat"
        
    print("HAND tile fully covers the AOI bounding box.")

if __name__ == "__main__":
    test_hand_coverage()
