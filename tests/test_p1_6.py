import rasterio
import glob
import numpy as np

def test_gsw_occurrence():
    files = glob.glob("data/raw/common/jrc_gsw/occurrence_*.tif")
    assert len(files) > 0, "No GSW occurrence files found"
    
    with rasterio.open(files[0]) as src:
        assert src.count > 0, "No bands found in the GSW file"
        
        # Read a small window to check values to avoid loading the whole 10x10 degree file in memory
        window = rasterio.windows.Window(0, 0, 1000, 1000)
        data = src.read(1, window=window)
        
        # In JRC GSW Occurrence, valid values are [0, 100], and nodata is usually 255
        nodata = src.nodata
        
        unique_vals = np.unique(data)
        for v in unique_vals:
            assert (0 <= v <= 100) or (v == nodata) or (v == 255), f"Unexpected value in GSW occurrence: {v}"
            
    print(f"GSW Occurrence file '{files[0]}' verified.")

if __name__ == "__main__":
    test_gsw_occurrence()
