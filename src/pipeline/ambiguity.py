import numpy as np

def flag_ambiguous_sand(nisar_water, dswx_water):
    """
    Flags pixels as 'ambiguous_sand' if NISAR threshold classifies them as water,
    but the nearest DSWx-S1 image classifies them as not water.
    
    Args:
        nisar_water (np.ndarray): boolean array (True = water by NISAR threshold)
        dswx_water (np.ndarray): boolean array (True = water by DSWx-S1)
        
    Returns:
        np.ndarray: boolean array (True = ambiguous sand)
    """
    return nisar_water & (~dswx_water)

def flag_possible_water_under_vegetation(nisar_water, hh_t, hh_ref, jrc_occurrence):
    """
    Flags pixels as 'possible_water_under_vegetation' based on Section 10.2 rules:
    - not water by NISAR threshold
    - ΔHH = HH_t - HH_ref >= +3 dB
    - HH_t >= -8 dB
    - outside active river corridor (JRC occurrence < 5)
    
    Args:
        nisar_water (np.ndarray): boolean array (True = water by NISAR threshold)
        hh_t (np.ndarray): dB values at time t
        hh_ref (np.ndarray): reference median dB (lowest stage dates)
        jrc_occurrence (np.ndarray): JRC occurrence frequency (0-100)
        
    Returns:
        np.ndarray: boolean array (True = possible water under vegetation)
    """
    delta_hh = hh_t - hh_ref
    
    return (~nisar_water) & (delta_hh >= 3.0) & (hh_t >= -8.0) & (jrc_occurrence < 5)
