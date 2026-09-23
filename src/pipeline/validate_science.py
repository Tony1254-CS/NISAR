import numpy as np

def compute_metrics(nisar_mask, dswx_mask, dswx_valid):
    """
    Computes agreement metrics between NISAR and DSWx water masks.
    nisar_mask: boolean array (1 = water, 0 = not water)
    dswx_mask: boolean array (1 = water, 0 = not water)
    dswx_valid: boolean array of valid pixels to compare
    """
    n_valid = np.sum(dswx_valid)
    if n_valid == 0:
        return 0.0, 0.0, 0.0
        
    n_w = nisar_mask[dswx_valid].astype(int)
    d_w = dswx_mask[dswx_valid].astype(int)
    
    # Confusion matrix elements
    tp = np.sum((n_w == 1) & (d_w == 1))
    tn = np.sum((n_w == 0) & (d_w == 0))
    fp = np.sum((n_w == 1) & (d_w == 0))
    fn = np.sum((n_w == 0) & (d_w == 1))
    
    # Overall agreement
    p_o = (tp + tn) / n_valid
    
    # Expected agreement
    marg_n_1 = tp + fp
    marg_n_0 = tn + fn
    marg_d_1 = tp + fn
    marg_d_0 = tn + fp
    
    p_e = ((marg_n_1 * marg_d_1) + (marg_n_0 * marg_d_0)) / (n_valid ** 2)
    
    # Cohen's kappa
    if p_e == 1.0:
        kappa = 1.0
    else:
        kappa = (p_o - p_e) / (1.0 - p_e)
        
    # Water IoU
    union = tp + fp + fn
    iou = tp / union if union > 0 else 0.0
    
    return p_o, kappa, iou

def evaluate_dswx_agreement(nisar_mask, dswx_data):
    """
    Evaluates DSWx agreement. 
    Assumes nisar_mask is already reprojected to DSWx grid.
    dswx_data: 2D array of DSWx classes.
    """
    # Exclude DSWx 250, 251, 255 (Cloud, Cloud shadow, Fill)
    dswx_valid = ~np.isin(dswx_data, [250, 251, 255])
    
    # DSWx water classes: 1 (Open Water), maybe 3 (Snow/Ice? No, partial surface water is often 2 or 3 depending on product. Let's assume 1 for open water, wait...
    # The prompt says: "DSWx-S1 (nearest to t1) in {1,3}". So 1 and 3 are water.
    dswx_water_mask = np.isin(dswx_data, [1, 3])
    
    p_o, kappa, iou = compute_metrics(nisar_mask, dswx_water_mask, dswx_valid)
    
    if kappa >= 0.6:
        status = "PASS"
    elif kappa >= 0.4:
        status = "WARN"
    else:
        status = "FAIL"
        
    return {
        "id": "dswx_agreement",
        "label": "NISAR water vs DSWx-S1",
        "value": kappa,
        "unit": "kappa",
        "status": status,
        "rule": "PASS >= 0.6; WARN 0.4-0.6; FAIL < 0.4",
        "explanation": f"Agreement: {p_o:.2f}, IoU: {iou:.2f}",
        "inputs": []
    }

from scipy.ndimage import distance_transform_edt

def evaluate_null_test(erosion_mask, jrc_occurrence, pixel_size_m=20):
    """
    Evaluates null_test.
    erosion_mask: boolean array
    jrc_occurrence: array of JRC occurrence (0-100)
    pixel_size_m: size of pixel in meters
    """
    # JRC occurrence > 0
    water_ever = jrc_occurrence > 0
    
    # distance transform requires 0 for background, so we invert
    # distance to nearest water_ever pixel
    dist = distance_transform_edt(~water_ever)
    dist_m = dist * pixel_size_m
    
    # Stable-land zone: JRC == 0 and dist >= 3000m
    stable_zone = (jrc_occurrence == 0) & (dist_m >= 3000)
    
    zone_px = np.sum(stable_zone)
    if zone_px == 0:
        return {
            "id": "null_test",
            "status": "NOT_EVALUATED",
            "reason": "No stable land zone found."
        }
        
    erosion_px = np.sum(erosion_mask & stable_zone)
    rate = erosion_px / zone_px
    rate_pct = rate * 100
    
    if rate_pct <= 1.0:
        status = "PASS"
    elif rate_pct <= 3.0:
        status = "WARN"
    else:
        status = "FAIL"
        
    return {
        "id": "null_test",
        "label": "False change on land that shouldn't change",
        "value": rate_pct,
        "unit": "%",
        "status": status,
        "rule": "PASS <= 1%; WARN <= 3%; FAIL > 3%",
        "explanation": f"Erosion in stable zone: {erosion_px} / {zone_px}",
        "inputs": []
    }

