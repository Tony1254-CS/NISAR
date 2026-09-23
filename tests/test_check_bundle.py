import pytest
import os
import json
from src.pipeline.check_bundle import check_bundle

def test_check_bundle(tmp_path):
    bundle = tmp_path / "jamuna-kazipur"
    img_dir = bundle / "img"
    img_dir.mkdir(parents=True)
    
    # Valid setup
    manifest = {
        "reach_id": "jamuna-kazipur",
        "metrics": [
            {
                "id": "erosion_area",
                "pixel_count": 100,
                "inputs": [{"kind": "NISAR_GCOV"}]
            }
        ]
    }
    with open(bundle / "manifest.json", "w") as f:
        json.dump(manifest, f)
        
    erosion = {
        "features": [
            {"properties": {"pixel_count": 40}},
            {"properties": {"pixel_count": 60}}
        ]
    }
    with open(bundle / "erosion.geojson", "w") as f:
        json.dump(erosion, f)
        
    reach = {
        "dates": [
            {"date": "20260601", "status": "ok"},
            {"date": "20260613", "status": "rejected"}
        ]
    }
    with open(bundle / "reach.json", "w") as f:
        json.dump(reach, f)
        
    (img_dir / "radar_20260601.png").touch()
    (img_dir / "water_20260601.png").touch()
    # 20260613 rejected, so no PNG needed
    
    assert check_bundle(str(bundle))
    
    # Broken setup: mismatched pixel count
    erosion_broken = {
        "features": [
            {"properties": {"pixel_count": 40}}
        ]
    }
    with open(bundle / "erosion.geojson", "w") as f:
        json.dump(erosion_broken, f)
        
    with pytest.raises(ValueError, match="Mismatched erosion pixel_count"):
        check_bundle(str(bundle))
        
    # Fix erosion, break PNG
    with open(bundle / "erosion.geojson", "w") as f:
        json.dump(erosion, f)
        
    os.remove(img_dir / "radar_20260601.png")
    
    with pytest.raises(ValueError, match="Missing PNG"):
        check_bundle(str(bundle))
