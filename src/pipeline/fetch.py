import os
import json
import yaml
import concurrent.futures
import argparse
from pipeline.io_nisar import stream_and_clip_granule

def fetch_all(reach_id):
    catalog_path = f"data/raw/{reach_id}/catalog.json"
    with open(catalog_path) as f:
        catalog = json.load(f)
        
    with open(f"config/reaches/{reach_id}.yaml") as f:
        cfg = yaml.safe_load(f)
    
    bbox = cfg['bbox']
    granules = [f["properties"]["sceneName"] for f in catalog["features"]]
    
    print(f"Fetching {len(granules)} granules for {reach_id}...")
    
    def process(g):
        out = f"data/raw/{reach_id}/nisar/{g}"
        if os.path.exists(os.path.join(out, "meta.json")):
            print(f"Skipping {g} (already exists)")
            return
        print(f"Processing {g}...")
        try:
            stream_and_clip_granule(g, bbox, out)
        except Exception as e:
            print(f"Error processing {g}: {e}")

    # Orchestrate with thread pool <= 4
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        executor.map(process, granules)
        
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=True)
    args = parser.parse_args()
    fetch_all(args.reach)
