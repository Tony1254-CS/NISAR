import pandas as pd
import numpy as np
import pytest
from src.pipeline.stage import interpolate_stage, proxy_stage

def test_interpolate_stage():
    df = pd.DataFrame({
        'datetime_local': [
            '2026-06-12 06:00:00',
            '2026-06-12 18:00:00'
        ],
        'water_level_m_msl': [10.0, 11.0]
    })
    df['datetime_local'] = pd.to_datetime(df['datetime_local'])
    
    # Acq time in UTC that maps to 2026-06-12 12:00:00 local (UTC+6)
    # 12:00:00 local is exactly halfway between 06:00 and 18:00
    # So UTC is 06:00:00
    acq_utc = pd.to_datetime('2026-06-12 06:00:00')
    
    stage = interpolate_stage(acq_utc, df)
    assert stage == 10.5
    
    # Test > 24h gap
    df2 = pd.DataFrame({
        'datetime_local': [
            '2026-06-10 06:00:00',
            '2026-06-15 18:00:00'
        ],
        'water_level_m_msl': [10.0, 11.0]
    })
    df2['datetime_local'] = pd.to_datetime(df2['datetime_local'])
    
    stage_null = interpolate_stage(acq_utc, df2)
    assert stage_null is None
    
def test_proxy_stage():
    mask = np.zeros((100, 100), dtype=bool)
    # Box: 10:20, 10:20 (10x10 = 100 pixels)
    # Fill 25 pixels with True
    mask[10:15, 10:15] = True
    
    proxy = proxy_stage(mask, (10, 20, 10, 20))
    assert proxy == 0.25
