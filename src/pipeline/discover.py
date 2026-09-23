import asf_search as asf
import argparse
from datetime import datetime
import json
import os
import shapely.geometry

REACHES = {
    'jamuna-chilmari': [89.60, 25.40, 89.90, 25.75],
    'jamuna-bahadurabad': [89.55, 25.05, 89.85, 25.40],
    'jamuna-kazipur': [89.55, 24.25, 89.85, 24.65],
    'teesta-dalia': [88.95, 25.85, 89.45, 26.20],
}

def bbox_to_wkt(bbox):
    min_lon, min_lat, max_lon, max_lat = bbox
    return shapely.geometry.box(min_lon, min_lat, max_lon, max_lat).wkt

def discover(reach_id):
    if reach_id not in REACHES:
        raise ValueError(f"Unknown reach: {reach_id}")
    
    bbox = REACHES[reach_id]
    wkt = bbox_to_wkt(bbox)
    print(f"Searching for {reach_id}...")
    
    results = asf.search(
        dataset='NISAR',
        processingLevel='GCOV',
        intersectsWith=wkt,
        start='2026-06-17',
        end=datetime.utcnow().strftime('%Y-%m-%d')
    )
    
    provisional = []
    for r in results:
        props = r.properties
        short_name = props.get('shortName', '')
        scene = props.get('sceneName', '')
        
        if 'NISAR_L2_GCOV_PROVISIONAL' in short_name:
            provisional.append(r.geojson())
        else:
            parts = scene.split('_')
            for p in parts:
                if p.startswith('P0') and len(p) >= 6:
                    try:
                        crid = int(p[1:])
                        if crid >= 5023:
                            provisional.append(r.geojson())
                            break
                    except ValueError:
                        pass
                        
    out_dir = f"data/raw/{reach_id}"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "catalog.json")
    
    with open(out_file, "w") as f:
        json.dump({"type": "FeatureCollection", "features": provisional}, f, indent=2)
        
    print(f"Wrote {len(provisional)} granules to {out_file}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=True)
    args = parser.parse_args()
    discover(args.reach)
