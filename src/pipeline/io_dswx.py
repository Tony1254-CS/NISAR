import os
import json
import yaml
import datetime
import earthaccess
import argparse

def fetch_dswx(reach_id):
    earthaccess.login(strategy='environment')
    
    with open(f"config/reaches/{reach_id}.yaml") as f:
        cfg = yaml.safe_load(f)
        
    bbox = cfg['bbox']
    window_days = cfg['params']['dswx_window_days']
    
    catalog_path = f"data/raw/{reach_id}/catalog.json"
    with open(catalog_path) as f:
        catalog = json.load(f)
        
    nisar_dates = []
    for feat in catalog['features']:
        start_str = feat['properties']['startTime']
        date_obj = datetime.datetime.strptime(start_str[:10], "%Y-%m-%d")
        nisar_dates.append(date_obj)
        
    nisar_dates = sorted(list(set(nisar_dates)))
    print(f"Found {len(nisar_dates)} unique NISAR dates for DSWx query.")
    
    out_dir = f"data/raw/{reach_id}/dswx"
    os.makedirs(out_dir, exist_ok=True)
    
    for d in nisar_dates:
        t_start = (d - datetime.timedelta(days=window_days)).strftime("%Y-%m-%d")
        t_end = (d + datetime.timedelta(days=window_days)).strftime("%Y-%m-%d")
        
        date_str = d.strftime("%Y%m%d")
        date_dir = os.path.join(out_dir, date_str)
        os.makedirs(date_dir, exist_ok=True)
        
        if os.path.exists(os.path.join(date_dir, "meta.json")):
            print(f"Skipping {date_str} (already fetched)")
            continue
            
        print(f"Searching DSWx for NISAR date {date_str} (window {t_start} to {t_end})...")
        results = earthaccess.search_data(
            short_name="OPERA_L3_DSWX-S1_V1",
            bounding_box=tuple(bbox),
            temporal=(t_start, t_end)
        )
        
        print(f"  Found {len(results)} granules.")
        if results:
            print(f"  Downloading {len(results)} granules...")
            earthaccess.download(results, local_path=date_dir)
            
            meta = {
                "nisar_date": date_str,
                "window": [t_start, t_end],
                "tiles_found": len(results)
            }
            with open(os.path.join(date_dir, "meta.json"), "w") as mf:
                json.dump(meta, mf, indent=2)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=True)
    args = parser.parse_args()
    fetch_dswx(args.reach)
