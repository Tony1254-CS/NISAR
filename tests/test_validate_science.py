import numpy as np
import pytest
from src.pipeline.validate_science import compute_metrics, evaluate_dswx_agreement

def test_compute_metrics():
    # Perfect agreement
    n = np.array([1, 1, 0, 0])
    d = np.array([1, 1, 0, 0])
    v = np.array([True, True, True, True])
    
    p_o, kappa, iou = compute_metrics(n, d, v)
    assert p_o == 1.0
    assert kappa == 1.0
    assert iou == 1.0
    
    # Partial agreement
    # n: 1, 1, 0, 0, 1
    # d: 1, 0, 0, 0, 0
    # TP=1, FP=2, TN=2, FN=0
    # p_o = 3/5 = 0.6
    n = np.array([1, 1, 0, 0, 1])
    d = np.array([1, 0, 0, 0, 0])
    v = np.array([True, True, True, True, True])
    
    p_o, kappa, iou = compute_metrics(n, d, v)
    assert p_o == 0.6
    # expected: n_1=3, n_0=2. d_1=1, d_0=4
    # p_e = (3*1 + 2*4) / 25 = 11/25 = 0.44
    # kappa = (0.6 - 0.44) / (1 - 0.44) = 0.16 / 0.56 = 0.2857
    assert np.isclose(kappa, 0.2857, atol=1e-3)
    assert iou == 1/3
    
def test_evaluate_dswx_agreement():
    # Construct a high-agreement scenario
    n = np.array([1, 1, 1, 0, 0, 0, 1])
    dswx = np.array([1, 1, 3, 0, 0, 250, 0]) # 250 is masked
    
    # Valid pixels: idx 0, 1, 2, 3, 4, 6 (6 valid)
    # n_valid: 1, 1, 1, 0, 0, 1
    # d_water (1 or 3): 1, 1, 1, 0, 0, 0
    # TP=3, FP=1, TN=2, FN=0
    # p_o = 5/6 = 0.833
    # n_1=4, n_0=2. d_1=3, d_0=3
    # p_e = (12 + 6)/36 = 18/36 = 0.5
    # kappa = (0.833 - 0.5) / 0.5 = 0.333 / 0.5 = 0.666
    
    res = evaluate_dswx_agreement(n, dswx)
    assert res['status'] == "PASS"
    assert np.isclose(res['value'], 0.666, atol=1e-2)

from src.pipeline.validate_science import evaluate_null_test

def test_evaluate_null_test():
    erosion = np.zeros((100, 500), dtype=bool)
    jrc = np.zeros((100, 500), dtype=np.uint8)
    
    # Put water at the far left (col 0)
    jrc[:, 0] = 50
    
    # Pixel size = 20m. 3000m / 20 = 150 pixels.
    # So stable zone is col >= 150. Size is 100 * (500 - 150) = 100 * 350 = 35000 px.
    # Put some erosion in stable zone.
    # To get FAIL (>3%), we need > 1050 px of erosion.
    # Put 1100 px erosion.
    erosion[0:11, 200:300] = True # 11 * 100 = 1100 px
    
    res = evaluate_null_test(erosion, jrc, pixel_size_m=20)
    assert res['status'] == "FAIL"
    # rate = 1100 / 35000 = 0.0314 = 3.14%
    assert np.isclose(res['value'], 3.14, atol=0.1)
    
    # Reduce erosion to get PASS
    erosion[:, :] = False
    erosion[0:5, 200:250] = True # 250 px -> 0.71%
    res = evaluate_null_test(erosion, jrc, pixel_size_m=20)
    assert res['status'] == "PASS"

