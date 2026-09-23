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
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "id": "poly-1",
            "properties": {"id": "poly-1", "pixel_count": 100},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[89.65, 24.45], [89.75, 24.45], [89.75, 24.55], [89.65, 24.55], [89.65, 24.45]]]
            }
        }
    ]
}
with open(os.path.join(bundle, "erosion.geojson"), "w") as f:
    json.dump(erosion, f)
    
reach = {
    "dates": [
        {"date": "20260601", "status": "ok"},
        {"date": "20260613", "status": "ok"}
    ],
    "primary_pair": {
        "t0": "20260601",
        "t1": "20260613",
        "type": "equal_stage",
        "dh_m": 0.1
    }
}
with open(os.path.join(bundle, "reach.json"), "w") as f:
    json.dump(reach, f)
    
stage = {
    "station": {"id": "dummy-station", "name": "Dummy", "river": "Jamuna", "danger_level_m": 15, "source": "FFWC"},
    "series": [{"t": "2026-06-01T00:00:00Z", "h": 14.0}, {"t": "2026-06-13T00:00:00Z", "h": 14.5}],
    "acquisitions": [
        {"date": "20260601", "t": "2026-06-01T00:00:00Z", "h": 14.0, "status": "ok"},
        {"date": "20260613", "t": "2026-06-13T00:00:00Z", "h": 14.1, "status": "ok"}
    ],
    "mode": "gauge"
}
with open(os.path.join(bundle, "stage.json"), "w") as f:
    json.dump(stage, f)

pairs = {
    "primary": {"t0": "20260601", "t1": "20260613", "type": "equal_stage", "dh_m": 0.1},
    "all_pairs": [{"t0": "20260601", "t1": "20260613", "type": "equal_stage", "dh_m": 0.1}]
}
with open(os.path.join(bundle, "pairs.json"), "w") as f:
    json.dump(pairs, f)

qc = {
    "checks": [
        {"id": "null_test", "status": "PASS"}
    ]
}
with open(os.path.join(bundle, "qc.json"), "w") as f:
    json.dump(qc, f)

bounds = {
    "coordinates": [[[89.60, 24.25], [89.90, 24.25], [89.90, 25.75], [89.60, 25.75], [89.60, 24.25]]],
    "radar_stretch_db": [-20, 0]
}
with open(os.path.join(bundle, "bounds.json"), "w") as f:
    json.dump(bounds, f)

open(os.path.join(img_dir, "radar_20260601.png"), "w").close()
open(os.path.join(img_dir, "water_20260601.png"), "w").close()

print("Dummy bundle created.")
