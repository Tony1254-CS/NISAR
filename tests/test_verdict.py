import pytest
from src.pipeline.validate_science import compute_verdict

def test_compute_verdict():
    # Base supported
    qc = [
        {"id": "dswx_agreement", "status": "PASS"},
        {"id": "null_test", "status": "PASS"},
        {"id": "stage_match", "status": "PASS"},
        {"id": "alignment", "status": "PASS"},
        {"id": "threshold_sensitivity", "status": "WARN"}, # NOT FAIL
        {"id": "persistence", "status": "WARN"}
    ]
    assert compute_verdict(qc, has_valid_pair=True) == "SUPPORTED"
    
    # Any FAIL -> INCONCLUSIVE
    qc_fail = list(qc)
    qc_fail.append({"id": "some_other", "status": "FAIL"})
    assert compute_verdict(qc_fail, has_valid_pair=True) == "INCONCLUSIVE"
    
    # No valid pair -> INCONCLUSIVE
    assert compute_verdict(qc, has_valid_pair=False) == "INCONCLUSIVE"
    
    # Missing PASS for one of the mandatory -> LIMITED
    qc_lim = [
        {"id": "dswx_agreement", "status": "PASS"},
        {"id": "null_test", "status": "WARN"}, # Not PASS
        {"id": "stage_match", "status": "PASS"},
        {"id": "alignment", "status": "PASS"},
        {"id": "threshold_sensitivity", "status": "PASS"}
    ]
    assert compute_verdict(qc_lim, has_valid_pair=True) == "LIMITED"
    
    # Another LIMITED case (missing key entirely)
    qc_lim2 = [
        {"id": "dswx_agreement", "status": "PASS"},
        {"id": "null_test", "status": "PASS"},
        # missing stage_match
        {"id": "alignment", "status": "PASS"}
    ]
    assert compute_verdict(qc_lim2, has_valid_pair=True) == "LIMITED"
