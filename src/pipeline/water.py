import numpy as np
from skimage.filters import threshold_otsu
from skimage.morphology import remove_small_objects, remove_small_holes
import warnings

def compute_ashman_d(data, threshold):
    class1 = data[data < threshold]
    class2 = data[data >= threshold]
    if len(class1) == 0 or len(class2) == 0:
        return 0.0
    mu1, std1 = np.mean(class1), np.std(class1)
    mu2, std2 = np.mean(class2), np.std(class2)
    # Ashman D = sqrt(2) * |mu1 - mu2| / sqrt(std1^2 + std2^2)
    denom = np.sqrt(std1**2 + std2**2)
    if denom == 0:
        return 0.0
    return np.sqrt(2) * np.abs(mu1 - mu2) / denom

def tile_based_otsu(data, tile_size=256, min_valid_frac=0.8):
    h, w = data.shape
    valid_mask = ~np.isnan(data)
    
    kept_tiles_data = []
    
    for y in range(0, h, tile_size):
        for x in range(0, w, tile_size):
            tile = data[y:y+tile_size, x:x+tile_size]
            mask = valid_mask[y:y+tile_size, x:x+tile_size]
            
            valid_frac = mask.sum() / tile.size
            if valid_frac >= min_valid_frac:
                valid_pixels = tile[mask]
                if len(np.unique(valid_pixels)) > 1: # Need at least 2 distinct values for Otsu
                    try:
                        t_tile = threshold_otsu(valid_pixels)
                        p = np.sum(valid_pixels < t_tile) / len(valid_pixels)
                        
                        if 0.2 <= p <= 0.8:
                            d_ashman = compute_ashman_d(valid_pixels, t_tile)
                            if d_ashman >= 2.0:
                                kept_tiles_data.extend(valid_pixels)
                    except Exception:
                        pass
                        
    if len(kept_tiles_data) > 0 and (len(kept_tiles_data) / (tile_size*tile_size)) >= 5:
        # Assuming we need at least 5 tiles worth of pixels, or specifically >= 5 tiles.
        # The logic appended pixels directly. Let's count how many tiles we appended.
        # Actually it's better to just check if we have enough pixels.
        pass
        
    # Wait, the rule is "if >= 5 tiles kept". Let me fix this to explicitly track tiles.

def compute_water_threshold(data, tile_size=256, min_valid_frac=0.8):
    h, w = data.shape
    valid_mask = ~np.isnan(data)
    
    kept_tiles_pixels = []
    tiles_kept = 0
    
    # Silence empty slice warnings from Otsu
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        for y in range(0, h, tile_size):
            for x in range(0, w, tile_size):
                tile = data[y:y+tile_size, x:x+tile_size]
                mask = valid_mask[y:y+tile_size, x:x+tile_size]
                
                valid_frac = mask.sum() / tile.size
                if valid_frac >= min_valid_frac:
                    valid_pixels = tile[mask]
                    if len(np.unique(valid_pixels)) > 1:
                        try:
                            t_tile = threshold_otsu(valid_pixels)
                            p = np.sum(valid_pixels < t_tile) / len(valid_pixels)
                            
                            if 0.2 <= p <= 0.8:
                                d_ashman = compute_ashman_d(valid_pixels, t_tile)
                                if d_ashman >= 2.0:
                                    kept_tiles_pixels.extend(valid_pixels)
                                    tiles_kept += 1
                        except Exception:
                            pass
                            
    if tiles_kept >= 5:
        T = threshold_otsu(np.array(kept_tiles_pixels))
        method = "tile_based"
    else:
        all_valid = data[valid_mask]
        if len(all_valid) > 0 and len(np.unique(all_valid)) > 1:
            T = threshold_otsu(all_valid)
        else:
            T = np.nan # Cannot compute
        method = "global_fallback"
        
    implausible = False
    if not np.isnan(T):
        if not (-26 <= T <= -12):
            implausible = True
            
    return T, method, tiles_kept, implausible

def classify_water(data, hand_invalid_mask=None):
    T, method, tiles_kept, implausible = compute_water_threshold(data)
    
    if np.isnan(T):
        return np.zeros_like(data, dtype=bool), T, method, implausible
        
    valid_mask = ~np.isnan(data)
    water = (data < T) & valid_mask
    
    if hand_invalid_mask is not None:
        water = water & (~hand_invalid_mask)
        
    # Remove small objects and holes
    # Connectivity 2 in skimage means full connectivity for 2D (diagonal included)
    water_cleaned = remove_small_objects(water, min_size=12, connectivity=2)
    # remove_small_holes actually operates on the True pixels, it fills holes of False pixels.
    water_cleaned = remove_small_holes(water_cleaned, area_threshold=12, connectivity=2)
    
    return water_cleaned, T, method, implausible

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=False)
    args = parser.parse_args()
    print('Dummy execution for', 'src/pipeline/water.py')

