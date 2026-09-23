import os
import rasterio
from rasterio.transform import from_origin
import numpy as np
import pytest
from src.pipeline.utils.raster import check_grid_consistency

@pytest.fixture
def setup_grids(tmp_path):
    ref_path = tmp_path / "ref.tif"
    tgt_ok = tmp_path / "tgt_ok.tif"
    tgt_bad = tmp_path / "tgt_bad.tif"
    
    # Reference
    data = np.ones((10, 10), dtype=np.float32)
    trans = from_origin(100, 100, 10, 10)
    crs = '+proj=utm +zone=45 +datum=WGS84'
    with rasterio.open(ref_path, 'w', driver='GTiff', height=10, width=10, count=1, dtype=data.dtype, crs=crs, transform=trans) as dst:
        dst.write(data, 1)
        
    # Target OK (shifted by exactly 2 pixels in X, 1 in Y)
    trans_ok = from_origin(120, 90, 10, 10)
    with rasterio.open(tgt_ok, 'w', driver='GTiff', height=10, width=10, count=1, dtype=data.dtype, crs=crs, transform=trans_ok) as dst:
        dst.write(data, 1)
        
    # Target Bad (shifted by 2.5 pixels)
    trans_bad = from_origin(125, 90, 10, 10)
    with rasterio.open(tgt_bad, 'w', driver='GTiff', height=10, width=10, count=1, dtype=data.dtype, crs=crs, transform=trans_bad) as dst:
        dst.write(data, 1)
        
    return tmp_path, ref_path, tgt_ok, tgt_bad

def test_check_grid_consistency(setup_grids):
    tmp_path, ref_path, tgt_ok, tgt_bad = setup_grids
    
    # 1. Consistent
    consistent, msg = check_grid_consistency(ref_path, tgt_ok)
    assert consistent
    assert msg == "Consistent"
    
    # 2. Inconsistent, no reproject
    consistent, msg = check_grid_consistency(ref_path, tgt_bad)
    assert not consistent
    assert "Origin offset not integer" in msg
    
    # 3. Inconsistent, reproject
    out_path = tmp_path / "tgt_reproj.tif"
    consistent, msg = check_grid_consistency(ref_path, tgt_bad, str(out_path))
    assert not consistent
    assert "Reprojected due to:" in msg
    
    # Verify reprojected file matches ref grid
    consistent2, msg2 = check_grid_consistency(ref_path, str(out_path))
    assert consistent2
