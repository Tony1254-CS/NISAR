import os
import json
import numpy as np
import rasterio
from rasterio.transform import from_origin
import shutil
import pytest
from src.pipeline.validate_raw import check_granule

@pytest.fixture
def setup_granules(tmp_path):
    valid_dir = tmp_path / "NISAR_valid"
    valid_dir.mkdir()
    
    with open(valid_dir / "meta.json", "w") as f:
        json.dump({"granule_id": "NISAR_valid", "zeroDopplerStartTime": "2026-06-12T00:00:00Z"}, f)
        
    corrupt_dir = tmp_path / "NISAR_corrupted"
    corrupt_dir.mkdir()
    
    with open(corrupt_dir / "meta.json", "w") as f:
        json.dump({"granule_id": "NISAR_corrupted", "zeroDopplerStartTime": "2026-06-12T00:00:00Z"}, f)
        
    # Create valid HHHH.tif (mostly data)
    valid_tif = valid_dir / "HHHH.tif"
    data = np.ones((150, 150), dtype=np.float32)
    transform = from_origin(0, 0, 10, 10)
    with rasterio.open(
        valid_tif, 'w', driver='GTiff',
        height=150, width=150,
        count=1, dtype=data.dtype,
        crs='+proj=latlong',
        transform=transform, nodata=-9999
    ) as dst:
        dst.write(data, 1)
        
    # Create corrupted HHHH.tif (mostly nodata)
    corrupt_tif = corrupt_dir / "HHHH.tif"
    data_corr = np.full((150, 150), -9999, dtype=np.float32)
    with rasterio.open(
        corrupt_tif, 'w', driver='GTiff',
        height=150, width=150,
        count=1, dtype=data_corr.dtype,
        crs='+proj=latlong',
        transform=transform, nodata=-9999
    ) as dst:
        dst.write(data_corr, 1)

    return tmp_path

def test_check_granule(setup_granules):
    bbox = [89.6, 25.4, 89.9, 25.75]
    
    valid_dir = os.path.join(setup_granules, "NISAR_valid")
    passed, reason = check_granule(valid_dir, bbox)
    assert passed, f"Valid granule failed: {reason}"
    
    corrupt_dir = os.path.join(setup_granules, "NISAR_corrupted")
    passed, reason = check_granule(corrupt_dir, bbox)
    assert not passed, "Corrupted granule should have failed"
    assert "NoData" in reason
