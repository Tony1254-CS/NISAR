import os
import urllib.request
import yaml
import argparse
import math

def fetch_hand(reach_id):
    with open(f"config/reaches/{reach_id}.yaml") as f:
        cfg = yaml.safe_load(f)
    
    bbox = cfg['bbox']
    min_lon, min_lat, max_lon, max_lat = bbox
    
    out_dir = "data/raw/common/hand"
    os.makedirs(out_dir, exist_ok=True)
    
    # Calculate required 1x1 degree tiles
    lat_start = math.floor(min_lat)
    lat_end = math.floor(max_lat)
    lon_start = math.floor(min_lon)
    lon_end = math.floor(max_lon)
    
    tiles = []
    for lat in range(lat_start, lat_end + 1):
        for lon in range(lon_start, lon_end + 1):
            ns = f"N{lat:02d}" if lat >= 0 else f"S{-lat:02d}"
            ew = f"E{lon:03d}" if lon >= 0 else f"W{-lon:03d}"
            filename = f"Copernicus_DSM_COG_10_{ns}_00_{ew}_00_HAND.tif"
            tiles.append(filename)
            
    print(f"Required HAND tiles: {tiles}")
    base_url = "https://glo-30-hand.s3.us-west-2.amazonaws.com/v1/2021"
    
    for tile in tiles:
        out_path = os.path.join(out_dir, tile)
        if os.path.exists(out_path):
            print(f"Skipping {tile}, already downloaded.")
            continue
            
        url = f"{base_url}/{tile}"
        print(f"Downloading {url}...")
        try:
            urllib.request.urlretrieve(url, out_path)
            print(f"Saved to {out_path}")
        except Exception as e:
            print(f"Failed to download {tile}: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=True)
    args = parser.parse_args()
    fetch_hand(args.reach)
