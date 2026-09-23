import numpy as np
from src.pipeline.area import compute_area_and_uncertainty

def test_compute_area():
    # 10x10 square of erosion in a 20x20 grid
    erosion = np.zeros((20, 20), dtype=bool)
    erosion[5:15, 5:15] = True
    
    # pixel count = 100
    # area_ha = 100 * 400 / 10000 = 4.0 ha
    
    # perimeter: 10x10 square has 10+10+8+8 = 36 perimeter pixels
    # b_m2 = 36 * 0.5 * 400 = 7200 m2 = 0.72 ha
    
    # Let area_low_thr = 3.5, area_high_thr = 4.5
    # low = min(3.5, 4.0 - 0.72) = min(3.5, 3.28) = 3.28
    # high = max(4.5, 4.0 + 0.72) = max(4.5, 4.72) = 4.72
    
    area_ha, low, high, perim = compute_area_and_uncertainty(erosion, 3.5, 4.5, pixel_area_m2=400)
    
    assert np.isclose(area_ha, 4.0)
    assert perim == 36
    assert np.isclose(low, 3.28)
    assert np.isclose(high, 4.72)
