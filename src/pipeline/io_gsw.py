import urllib.request
import os
import argparse
import yaml

def fetch_gsw(reach_id):
    out_dir = "data/raw/common/jrc_gsw"
    os.makedirs(out_dir, exist_ok=True)
    
    with open(f"config/reaches/{reach_id}.yaml") as f:
        cfg = yaml.safe_load(f)
    bbox = cfg['bbox']
    
    # Calculate top-left corner of the 10x10 degree tile containing the bbox
    # Longitude
    lon = int(bbox[0] // 10) * 10
    lon_str = f"{lon}E" if lon >= 0 else f"{-lon}W"
    
    # Latitude (top means we need the ceiling to nearest 10 for N, or floor for S? Wait.
    # The grid is 80-90E, 20-30N -> the tile is named 80E_30N.
    # So lon is floor(bbox[0]//10)*10
    # lat is ceil(bbox[3]/10)*10
    lat = int((bbox[3] // 10) + 1) * 10 if bbox[3] % 10 != 0 else int(bbox[3])
    lat_str = f"{lat}N" if lat >= 0 else f"{-lat}S"
    
    # Wait, 25.75 -> 30N
    # 89.60 -> 80E
    # So 80E_30N
    
    fname = f"occurrence_{lon_str}_{lat_str}_v1_5_2024.tif"
    url = f"https://s3.waw4-1.cloudferro.com/swift/v1/global-surface-water/download2024/Aggregated/VER1-5/occurrence/{fname}"
    out_path = os.path.join(out_dir, fname)
    
    if os.path.exists(out_path):
        print(f"Already exists: {fname}")
        return
        
    print(f"Downloading {url}...")
    try:
        urllib.request.urlretrieve(url, out_path)
        print("Download successful.")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=True)
    args = parser.parse_args()
    fetch_gsw(args.reach)
