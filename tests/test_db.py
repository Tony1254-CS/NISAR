import os
import numpy as np
import rasterio
from rasterio.transform import from_origin
import pytest
from src.pipeline.preprocess import preprocess_granule

@pytest.fixture
def setup_preprocess(tmp_path):
    granule_dir = tmp_path / "NISAR_test"
    granule_dir.mkdir()
    
    # Create HHHH.tif with linear power values
    # Let's say linear values from 0.001 to 10 (which is -30 dB to +10 dB)
    data = np.linspace(0.001, 10, 100*100).reshape((100, 100)).astype(np.float32)
    # Inject some <= 0 values to test masking
    data[0:10, 0:10] = -1
    
    trans = from_origin(0, 0, 10, 10)
    with rasterio.open(
        granule_dir / "HHHH.tif", 'w', driver='GTiff',
        height=100, width=100, count=1, dtype=data.dtype,
        crs='+proj=utm +zone=45', transform=trans
    ) as dst:
        dst.write(data, 1)
        
    # No mask.tif for simplicity, default to all valid
    
    out_dir = tmp_path / "out"
    return granule_dir, out_dir

def test_preprocess(setup_preprocess):
    granule_dir, out_dir = setup_preprocess
    
    success, msg = preprocess_granule(str(granule_dir), str(out_dir))
    assert success
    
    out_file = out_dir / "NISAR_test.tif"
    assert out_file.exists()
    
    with rasterio.open(out_file) as src:
        assert src.dtypes[0] == 'float32'
        
        data = src.read(1)
        # NaN where data <= 0 (top left 10x10)
        assert np.isnan(data[0:10, 0:10]).all()
        
        # Valid values should be in plausible dB range (-35 to +10)
        valid_data = data[~np.isnan(data)]
        assert valid_data.min() >= -35
        assert valid_data.max() <= 15 # allowing some leeway
        
        # Check nodata property
        assert np.isnan(src.nodata)
