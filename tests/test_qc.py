from src.pipeline.validate_science import (
    evaluate_stage_match,
    evaluate_persistence,
    evaluate_threshold_sensitivity,
    evaluate_alignment,
    evaluate_rfi,
    evaluate_ambiguous_area,
    evaluate_replicate
)

def test_remaining_qc():
    # stage_match
    assert evaluate_stage_match(10.0, 10.1, is_proxy=False)['status'] == "PASS"
    assert evaluate_stage_match(10.0, 10.1, is_proxy=True)['status'] == "NOT_EVALUATED"
    assert evaluate_stage_match(10.0, 9.0, is_proxy=False)['status'] == "WARN" # later-lower (1.0 > 0.15 diff but h1 <= h0)
    
    # persistence
    assert evaluate_persistence(None, 2)['status'] == "PASS"
    assert evaluate_persistence(None, 1)['status'] == "WARN"
    assert evaluate_persistence(None, 0)['status'] == "WARN"
    
    # sensitivity
    assert evaluate_threshold_sensitivity(100, 90, 110)['status'] == "PASS" # 20%
    assert evaluate_threshold_sensitivity(100, 70, 120)['status'] == "WARN" # 50%
    assert evaluate_threshold_sensitivity(100, 50, 150)['status'] == "FAIL" # 100%
    
    # alignment
    assert evaluate_alignment(0.3, 0.3)['status'] == "PASS" # ~0.42
    assert evaluate_alignment(0.6, 0.6)['status'] == "WARN" # ~0.84
    assert evaluate_alignment(1.0, 1.0)['status'] == "FAIL" # ~1.41
    
    # rfi
    assert evaluate_rfi(2)['status'] == "INFO"
    
    # ambiguous
    assert evaluate_ambiguous_area(5.5)['status'] == "INFO"
    
    # replicate
    assert evaluate_replicate(None)['status'] == "NOT_EVALUATED"
    assert evaluate_replicate(20)['status'] == "PASS"
    assert evaluate_replicate(40)['status'] == "FAIL"
