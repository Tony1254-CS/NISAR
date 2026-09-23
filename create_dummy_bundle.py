import os
import json

bundle = "processed/dummy"
os.makedirs(bundle, exist_ok=True)
img_dir = os.path.join(bundle, "img")
os.makedirs(img_dir, exist_ok=True)

manifest = {
    "reach_id": "dummy",
    "metrics": [
        {
            "id": "erosion_area",
            "pixel_count": 100,
            "inputs": [{"kind": "NISAR_GCOV"}]
        }
    ]
}
with open(os.path.join(bundle, "manifest.json"), "w") as f:
    json.dump(manifest, f)
    
erosion = {
    "features": [
        {"properties": {"pixel_count": 40}},
        {"properties": {"pixel_count": 60}}
    ]
}
with open(os.path.join(bundle, "erosion.geojson"), "w") as f:
    json.dump(erosion, f)
    
reach = {
    "dates": [
        {"date": "20260601", "status": "ok"}
    ]
}
with open(os.path.join(bundle, "reach.json"), "w") as f:
    json.dump(reach, f)
    
open(os.path.join(img_dir, "radar_20260601.png"), "w").close()
open(os.path.join(img_dir, "water_20260601.png"), "w").close()

print("Dummy bundle created.")
