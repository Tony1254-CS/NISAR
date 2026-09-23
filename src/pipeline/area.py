import numpy as np
from scipy.ndimage import binary_dilation

def compute_area_and_uncertainty(erosion_mask, area_low_thr, area_high_thr, pixel_area_m2=400):
    """
    Computes area and uncertainty bounds per Section 10.7.
    erosion_mask: boolean 2D array of erosion pixels
    area_low_thr: area (ha) with T-1 dB
    area_high_thr: area (ha) with T+1 dB
    pixel_area_m2: area of a single pixel in square meters
    """
    pixel_count = erosion_mask.sum()
    area_ha = pixel_count * pixel_area_m2 / 10000.0
    
    # Boundary term: perimeter pixels = erosion pixels with >=1 non-erosion 4-neighbour
    # We can find perimeter by dilating non-erosion and intersecting with erosion
    # Or dilating erosion and intersecting with non-erosion (outer boundary)
    # The rule says: "erosion pixels with >=1 non-erosion 4-neighbour" -> this is the inner boundary.
    # We can get inner boundary by: erosion & ~(erosion eroded)
    # Alternatively: erosion & (binary_dilation(~erosion))
    
    struct = np.array([[0, 1, 0],
                       [1, 1, 1],
                       [0, 1, 0]])
    non_erosion = ~erosion_mask
    perimeter_mask = erosion_mask & binary_dilation(non_erosion, structure=struct)
    
    perimeter_pixel_count = perimeter_mask.sum()
    b_m2 = perimeter_pixel_count * 0.5 * pixel_area_m2
    b_ha = b_m2 / 10000.0
    
    low = min(area_low_thr, area_ha - b_ha)
    low = max(low, 0.0) # clipped at 0
    
    high = max(area_high_thr, area_ha + b_ha)
    
    return area_ha, low, high, perimeter_pixel_count

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=False)
    args = parser.parse_args()
    print('Dummy execution for', 'src/pipeline/area.py')

