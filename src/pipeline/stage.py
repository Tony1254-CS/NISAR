import pandas as pd
import numpy as np

def interpolate_stage(acq_time_utc, gauge_df):
    """
    Interpolates gauge stage to acquisition time.
    acq_time_utc: datetime object in UTC
    gauge_df: DataFrame with 'datetime_local' and 'water_level_m_msl'
    """
    if gauge_df is None or len(gauge_df) == 0:
        return None
        
    # Convert acq time to local (Asia/Dhaka UTC+6)
    acq_local = acq_time_utc + pd.Timedelta(hours=6)
    
    # Ensure gauge_df datetime is parsed
    if not pd.api.types.is_datetime64_any_dtype(gauge_df['datetime_local']):
        gauge_df['datetime_local'] = pd.to_datetime(gauge_df['datetime_local'])
        
    # Sort
    df = gauge_df.sort_values('datetime_local')
    
    # Find nearest before and after
    before = df[df['datetime_local'] <= acq_local]
    after = df[df['datetime_local'] >= acq_local]
    
    if len(before) == 0 or len(after) == 0:
        return None
        
    t0 = before.iloc[-1]['datetime_local']
    h0 = before.iloc[-1]['water_level_m_msl']
    
    t1 = after.iloc[0]['datetime_local']
    h1 = after.iloc[0]['water_level_m_msl']
    
    # Check within 24h
    if abs((acq_local - t0).total_seconds()) > 24*3600 or abs((t1 - acq_local).total_seconds()) > 24*3600:
        return None
        
    if t0 == t1:
        return h0
        
    # Interpolate
    frac = (acq_local - t0).total_seconds() / (t1 - t0).total_seconds()
    h_interp = h0 + frac * (h1 - h0)
    
    return h_interp

def proxy_stage(water_mask, ref_box):
    """
    Computes proxy stage as water fraction within a reference floodplain box.
    water_mask: boolean 2D array
    ref_box: (min_row, max_row, min_col, max_col)
    """
    r0, r1, c0, c1 = ref_box
    box = water_mask[r0:r1, c0:c1]
    
    if box.size == 0:
        return np.nan
        
    # Water fraction
    return box.sum() / box.size

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--reach', required=False)
    args = parser.parse_args()
    print('Dummy execution for', 'src/pipeline/stage.py')

