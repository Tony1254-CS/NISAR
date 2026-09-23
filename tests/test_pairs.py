import pytest
from src.pipeline.pairs import select_pair

def test_select_pair_equal_stage():
    dates = [0, 1, 2, 3, 4]
    # Peak is at idx 2 (stage 15.0)
    # i=1 (10.1) and j=4 (10.0) -> dh=0.1 <= 0.15. Time gap=3.
    # i=0 (9.0) and j=3 (9.1) -> dh=0.1 <= 0.15. Time gap=3.
    # If dh is same, tie breaks on gap. Both gap=3. It will just pick the first it evaluates as strictly better, 
    # but let's make i=1, j=4 slightly better dh to be deterministic.
    stages = [9.0, 10.05, 15.0, 9.2, 10.0]
    
    # Peak: idx 2
    # Before peak: 0, 1
    # After peak: 3, 4
    # i=0, j=3: h0=9.0, h1=9.2 -> dh=0.2 (fails equal stage)
    # i=1, j=4: h0=10.05, h1=10.0 -> dh=0.05 (passes equal stage)
    
    pair = select_pair(dates, stages, tolerance=0.15)
    assert pair == (1, 4)

def test_select_pair_later_lower():
    dates = [0, 1, 2, 3, 4]
    # Peak at 2 (15.0)
    # Before: 0(10.0), 1(12.0)
    # After: 3(8.0), 4(9.0)
    # No equal stage within 0.15.
    # i=0, j=3: h0=10.0, h1=8.0 -> dh_lower=2.0
    # i=0, j=4: h0=10.0, h1=9.0 -> dh_lower=1.0 (h1 <= h0)
    # i=1, j=3: h0=12.0, h1=8.0 -> dh_lower=4.0
    # i=1, j=4: h0=12.0, h1=9.0 -> dh_lower=3.0
    # Smallest dh_lower is 1.0 (idx 0 and idx 4)
    stages = [10.0, 12.0, 15.0, 8.0, 9.0]
    
    pair = select_pair(dates, stages, tolerance=0.15)
    assert pair == (0, 4)

def test_select_pair_none():
    dates = [0, 1, 2, 3]
    # Peak at 2 (15.0)
    # Before: 0(8.0), 1(9.0)
    # After: 3(14.0)
    # h1 is always > h0. So no equal stage (dh > 0.15) and no later-lower (h1 > h0).
    stages = [8.0, 9.0, 15.0, 14.0]
    
    pair = select_pair(dates, stages, tolerance=0.15)
    assert pair is None
