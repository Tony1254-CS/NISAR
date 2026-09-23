import numpy as np
import pytest
from src.pipeline.water import compute_water_threshold

def test_threshold_bimodal():
    # Create a synthetic bimodal image
    # Size needs to be large enough to have >= 5 tiles. 
    # Tile size is 256. Let's make an image 1024x1024 (16 tiles).
    shape = (1024, 1024)
    np.random.seed(42)
    
    # Class 1: Water (mean = -20 dB, std = 2)
    # Class 2: Land (mean = -8 dB, std = 2)
    water = np.random.normal(-20, 2, shape)
    land = np.random.normal(-8, 2, shape)
    
    # Mix them: top half water, bottom half land (this creates pure tiles, which we DON'T want)
    # We need tiles with BOTH classes to pass the 0.2 <= p <= 0.8 and Ashman D >= 2 tests.
    mask = np.random.choice([True, False], size=shape, p=[0.4, 0.6])
    data = np.where(mask, water, land)
    
    # The actual threshold should be around -14 dB (the split)
    expected_split = -14.0
    
    T, method, tiles_kept, implausible = compute_water_threshold(data, tile_size=256)
    
    assert method == "tile_based", f"Expected tile_based, got {method}"
    assert tiles_kept >= 5
    assert not implausible
    assert abs(T - expected_split) < 0.5, f"Otsu threshold {T} not within 0.5 dB of {expected_split}"

def test_threshold_unimodal():
    # Unimodal data that fails Ashman D / p threshold
    shape = (1024, 1024)
    np.random.seed(42)
    # Lognormal(sigma=1) yields p > 0.8 and D < 2.0 when split by Otsu
    data = np.random.lognormal(mean=0, sigma=1, size=shape)
    
    T, method, tiles_kept, implausible = compute_water_threshold(data, tile_size=256)
    
    assert method == "global_fallback"
    assert tiles_kept < 5
