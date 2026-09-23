import os
import glob
import json
import rasterio
from rasterio.transform import from_origin
import numpy as np
import pytest
from src.pipeline.hand_mask import create_hand_mask

@pytest.fixture
def setup_hand_test(tmp_path):
    reach = "test_reach"
    
    nisar_dir = tmp_path / "data" / "processed" / reach / "hh_db"
    nisar_dir.mkdir(parents=True, exist_ok=True)
    
    hand_dir = tmp_path / "data" / "raw" / "common" / "hand"
    hand_dir.mkdir(parents=True, exist_ok=True)
    
    # Create fake NISAR grid
    trans_nisar = from_origin(100, 100, 10, 10)
    crs_nisar = '+proj=utm +zone=45 +datum=WGS84'
    nisar_data = np.zeros((20, 20), dtype=np.float32)
    with rasterio.open(
        nisar_dir / "NISAR_dummy.tif", 'w', driver='GTiff',
        height=20, width=20, count=1, dtype='float32',
        crs=crs_nisar, transform=trans_nisar
    ) as dst:
        dst.write(nisar_data, 1)
        
    # Create fake HAND grid (latlon) overlapping the same area approximately
    # Actually just to test if warp works, we can just use the same CRS for the fake HAND or a simple transform
    trans_hand = from_origin(100, 100, 10, 10)
    hand_data = np.full((20, 20), 10.0, dtype=np.float32) # mostly 10m height
    hand_data[5:10, 5:10] = 20.0 # Some > 15m height
    with rasterio.open(
        hand_dir / "HAND_dummy.tif", 'w', driver='GTiff',
        height=20, width=20, count=1, dtype='float32',
        crs=crs_nisar, transform=trans_hand
    ) as dst:
        dst.write(hand_data, 1)
        
    return tmp_path, reach

def test_create_hand_mask(setup_hand_test, monkeypatch):
    tmp_path, reach = setup_hand_test
    
    # Change working directory to tmp_path so script sees the fake data dirs
    monkeypatch.chdir(tmp_path)
    
    success = create_hand_mask(reach)
    assert success
    
    # Check outputs
    out_path = tmp_path / "data" / "processed" / reach / "hand_invalid.tif"
    assert out_path.exists()
    
    with rasterio.open(out_path) as src:
        mask = src.read(1)
        # 5x5 region was > 15m
        assert mask.sum() == 25
        
    log_path = tmp_path / "data" / "processed" / reach / "hand_mask.log.json"
    with open(log_path) as f:
        log = json.load(f)
    assert log["hand_mask"] == "EVALUATED"
    assert log["invalid_pixel_count"] == 25
    assert log["total_pixels"] == 400
