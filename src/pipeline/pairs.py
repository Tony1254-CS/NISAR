def find_peak_index(dates, stages):
    """Finds the index of the maximum stage."""
    if not stages:
        return -1
    return stages.index(max(stages))

def select_pair(dates, stages, tolerance=0.15):
    """
    Selects the primary pair (t0, t1) based on plan.md 10.5.
    Returns (idx0, idx1) or None.
    dates: list of acquisition datetimes/strings sorted by time
    stages: list of stage values (m) corresponding to dates
    tolerance: for real stage it's 0.15m. For proxy it's 0.02.
    """
    if len(dates) < 2:
        return None
        
    peak_idx = find_peak_index(dates, stages)
    if peak_idx == -1:
        return None
        
    best_equal = None
    min_dh = float('inf')
    max_gap = -1
    
    best_lower = None
    min_dh_lower = float('inf')
    
    for i in range(peak_idx):
        for j in range(peak_idx + 1, len(dates)):
            h0 = stages[i]
            h1 = stages[j]
            dh = abs(h1 - h0)
            
            # Equal-stage logic
            if dh <= tolerance:
                gap = j - i
                if dh < min_dh or (dh == min_dh and gap > max_gap):
                    best_equal = (i, j)
                    min_dh = dh
                    max_gap = gap
                    
            # Later-lower fallback logic
            if h1 <= h0:
                dh_lower = h0 - h1
                if dh_lower < min_dh_lower:
                    best_lower = (i, j)
                    min_dh_lower = dh_lower
                    
    if best_equal:
        return best_equal
    elif best_lower:
        return best_lower
    else:
        return None
