import numpy as np
from src.pipeline.ambiguity import flag_ambiguous_sand, flag_possible_water_under_vegetation

def test_ambiguous_sand():
    # nisar says water
    nisar_water = np.array([True, True, False, False])
    # dswx says water
    dswx_water = np.array([True, False, True, False])
    
    # ambiguous sand should be True where NISAR=True and DSWx=False
    expected = np.array([False, True, False, False])
    
    result = flag_ambiguous_sand(nisar_water, dswx_water)
    np.testing.assert_array_equal(result, expected)

def test_possible_water_under_veg():
    nisar_water = np.array([False, False, False, True])
    hh_t = np.array([-7.0, -9.0, -7.0, -7.0])
    hh_ref = np.array([-11.0, -11.0, -11.0, -11.0])
    jrc_occurrence = np.array([0, 0, 10, 0])
    
    # 0: not water, delta=4 (>=3), HH=-7 (>=-8), JRC=0 (<5) -> True
    # 1: not water, delta=2 (<3), HH=-9 (<-8), JRC=0 (<5) -> False
    # 2: not water, delta=4 (>=3), HH=-7 (>=-8), JRC=10 (>=5) -> False
    # 3: IS water -> False
    
    expected = np.array([True, False, False, False])
    
    result = flag_possible_water_under_vegetation(nisar_water, hh_t, hh_ref, jrc_occurrence)
    np.testing.assert_array_equal(result, expected)
