import numpy as np
import pytest
from src.pipeline.rfi_screen import check_rfi

def test_check_rfi():
    # 1. Clean data (no RFI)
    # Background noise around -15 dB
    data_clean = np.random.normal(-15, 1.0, (200, 200))
    assert not check_rfi(data_clean), "Clean data falsely flagged"
    
    # 2. RFI in rows
    data_row_rfi = np.copy(data_clean)
    # Add strong stripe > 3 dB (e.g. +5 dB) for 25 consecutive rows
    data_row_rfi[50:75, :] += 5.0
    assert check_rfi(data_row_rfi), "Row RFI not detected"
    
    # 3. RFI in cols
    data_col_rfi = np.copy(data_clean)
    # Add strong stripe > 3 dB for 25 consecutive cols
    data_col_rfi[:, 100:125] += 5.0
    assert check_rfi(data_col_rfi), "Col RFI not detected"
    
    # 4. Short stripe (should NOT be flagged)
    data_short = np.copy(data_clean)
    # Only 10 consecutive rows
    data_short[50:60, :] += 5.0
    assert not check_rfi(data_short), "Short stripe falsely flagged"
