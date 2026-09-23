import numpy as np
from skimage.morphology import remove_small_objects

def classify_change(water_stack, valid_stack, ambiguous_t0, ambiguous_t1, t0_idx, t1_idx, after_t1_indices):
    """
    Classifies change based on Section 10.6.
    water_stack, valid_stack: 3D boolean arrays (time, row, col)
    ambiguous_t0, ambiguous_t1: 2D boolean arrays
    """
    water_t0 = water_stack[t0_idx]
    valid_t0 = valid_stack[t0_idx]
    
    water_t1 = water_stack[t1_idx]
    valid_t1 = valid_stack[t1_idx]
    
    land0 = (~water_t0) & valid_t0
    water1 = water_t1 & valid_t1
    
    if len(after_t1_indices) == 0:
        persist_water = water1
        persist_land = ~water_t1 & valid_t1 # Accretion persistence condition is basically ~water1 if L empty
        no_persistence_flag = True
    else:
        # persist_water = all(water[t] or ~valid[t] for t in L) and count(valid in L) >= 1
        # all(water[t] or ~valid[t]) is equivalent to ~any(~water[t] & valid[t])
        
        any_not_water = np.zeros_like(water_t0, dtype=bool)
        any_water = np.zeros_like(water_t0, dtype=bool)
        valid_count = np.zeros_like(water_t0, dtype=int)
        
        for t in after_t1_indices:
            w = water_stack[t]
            v = valid_stack[t]
            
            any_not_water |= ((~w) & v)
            any_water |= (w & v)
            valid_count += v.astype(int)
            
        persist_water = (~any_not_water) & (valid_count >= 1)
        # Accretion condition: all(~water[t] or ~valid[t] for t in L) -> ~any(water[t] & valid[t])
        # Wait, the rule says: all(~water[t] or ~valid[t] for t in L) -> no check on valid_count >= 1?
        # Let's add the check so it's symmetric, or strictly follow: all(~water[t] or ~valid[t])
        persist_land = (~any_water)
        no_persistence_flag = False
        
    erosion = land0 & water1 & persist_water & (~ambiguous_t0) & (~ambiguous_t1)
    accretion = water_t0 & (~water_t1) & persist_land
    seasonal = land0 & water1 & (~persist_water)
    ambiguous = (land0 & water1) & (ambiguous_t0 | ambiguous_t1)
    
    # Remove small objects
    erosion = remove_small_objects(erosion, min_size=12, connectivity=2)
    accretion = remove_small_objects(accretion, min_size=12, connectivity=2)
    
    # Output class raster
    classes = np.zeros_like(water_t0, dtype=np.uint8)
    classes[seasonal] = 3
    classes[ambiguous] = 4
    classes[accretion] = 2
    classes[erosion] = 1 # overwrite seasonal if somehow overlap, but they are mutually exclusive
    
    # Nodata where either t0 or t1 is invalid
    nodata = (~valid_t0) | (~valid_t1)
    classes[nodata] = 255
    
    return classes, no_persistence_flag

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=False)
    args = parser.parse_args()
    print('Dummy execution for', 'src/pipeline/change.py')

