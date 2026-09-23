import numpy as np
from src.pipeline.change import classify_change

def test_classify_change():
    shape = (20, 20)
    
    # Stack size: 3 (t0, t1, t2)
    water_stack = np.zeros((3, 20, 20), dtype=bool)
    valid_stack = np.ones((3, 20, 20), dtype=bool)
    ambiguous_t0 = np.zeros((20, 20), dtype=bool)
    ambiguous_t1 = np.zeros((20, 20), dtype=bool)
    
    # 1. Erosion patch: land at t0, water at t1, water at t2
    # Make it 4x4 (16 pixels) -> > 12 MMU -> should be kept
    water_stack[1, 0:4, 0:4] = True
    water_stack[2, 0:4, 0:4] = True
    
    # 2. Accretion patch: water at t0, land at t1, land at t2
    # 4x4 (16 pixels) -> kept
    water_stack[0, 5:9, 5:9] = True
    # (t1, t2 already False)
    
    # 3. Seasonal patch: land at t0, water at t1, land at t2
    water_stack[1, 10:14, 10:14] = True
    # (t2 already False)
    
    # 4. Small erosion (10 pixels) -> should be removed
    water_stack[1, 15:17, 15:20] = True # 2x5 = 10 px
    water_stack[2, 15:17, 15:20] = True
    
    # 5. Ambiguous patch: land at t0, water at t1, water at t2, but ambiguous at t0
    water_stack[1, 0:4, 15:19] = True
    water_stack[2, 0:4, 15:19] = True
    ambiguous_t0[0:4, 15:19] = True
    
    classes, no_persistence_flag = classify_change(
        water_stack, valid_stack, ambiguous_t0, ambiguous_t1,
        t0_idx=0, t1_idx=1, after_t1_indices=[2]
    )
    
    assert not no_persistence_flag
    
    # Erosion count: 16 (the 4x4 patch). The small 10px one is removed.
    assert (classes == 1).sum() == 16
    
    # Accretion count: 16
    assert (classes == 2).sum() == 16
    
    # Seasonal count: 16 + 10 (the small erosion gets downgraded to nothing or seasonal? 
    # Wait: seasonal = land0 & water1 & ~persist_water. 
    # For the small erosion, persist_water is True, but it's removed by remove_small_objects.
    # It does NOT become seasonal, because we didn't reassign it. It stays 0 (none).
    # Let's check exactly: `erosion` is False after remove_small_objects. 
    # `seasonal` is evaluated BEFORE remove_small_objects, so it was False.
    # So the 10 pixels remain 0.
    assert (classes == 3).sum() == 16
    
    # Ambiguous count: 16
    assert (classes == 4).sum() == 16
