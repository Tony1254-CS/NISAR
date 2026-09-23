import json
import os
import glob

def check_bundle(processed_dir):
    """
    Runs consistency checks on a processed bundle directory.
    processed_dir: path to processed/<reach_id>
    """
    errors = []
    
    # 1. Sum of erosion.geojson pixel_count == manifest erosion_area.pixel_count
    manifest_path = os.path.join(processed_dir, "manifest.json")
    if not os.path.exists(manifest_path):
        errors.append(f"Missing {manifest_path}")
        manifest = None
    else:
        with open(manifest_path) as f:
            manifest = json.load(f)
            
    erosion_path = os.path.join(processed_dir, "erosion.geojson")
    if os.path.exists(erosion_path) and manifest:
        with open(erosion_path) as f:
            erosion = json.load(f)
            
        geom_sum = sum(f["properties"].get("pixel_count", 0) for f in erosion.get("features", []))
        
        manifest_count = None
        for m in manifest.get("metrics", []):
            if m["id"] == "erosion_area":
                manifest_count = m.get("pixel_count", 0)
                break
                
        if manifest_count is not None and geom_sum != manifest_count:
            errors.append(f"Mismatched erosion pixel_count: geojson sum {geom_sum} != manifest {manifest_count}")
            
    # 2. Every date with status ok has radar + water PNG
    reach_path = os.path.join(processed_dir, "reach.json")
    if os.path.exists(reach_path):
        with open(reach_path) as f:
            reach = json.load(f)
            
        for d in reach.get("dates", []):
            if d.get("status") == "ok":
                date_str = d["date"]
                radar_png = os.path.join(processed_dir, "img", f"radar_{date_str}.png")
                water_png = os.path.join(processed_dir, "img", f"water_{date_str}.png")
                
                if not os.path.exists(radar_png):
                    errors.append(f"Missing PNG: {radar_png}")
                if not os.path.exists(water_png):
                    errors.append(f"Missing PNG: {water_png}")
                    
    # 3. Every metric has >=1 input
    if manifest:
        for m in manifest.get("metrics", []):
            inputs = m.get("inputs", [])
            if not inputs:
                errors.append(f"Metric {m['id']} has no inputs")
                
    if errors:
        raise ValueError("\n".join(errors))
        
    return True
