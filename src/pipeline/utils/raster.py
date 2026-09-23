import rasterio
from rasterio.warp import reproject, Resampling
import numpy as np

def check_grid_consistency(reference_path, target_path, out_path=None):
    """
    Checks if target_path has the same EPSG, pixel size, and integer origin offset
    relative to reference_path. If mismatch and out_path is provided, reprojects 
    target_path to reference_path's grid and saves to out_path.
    
    Returns:
        (bool, str): True if consistent, False if mismatched.
                     str contains reason or reprojection log.
    """
    with rasterio.open(reference_path) as ref:
        ref_crs = ref.crs
        ref_transform = ref.transform
        ref_res = (ref_transform.a, ref_transform.e)
        ref_width = ref.width
        ref_height = ref.height
        
    with rasterio.open(target_path) as tgt:
        tgt_crs = tgt.crs
        tgt_transform = tgt.transform
        tgt_res = (tgt_transform.a, tgt_transform.e)
        
        # Check CRS
        if ref_crs != tgt_crs:
            mismatch_reason = f"CRS mismatch: {ref_crs} vs {tgt_crs}"
            needs_reproj = True
        # Check resolution
        elif not np.isclose(ref_res[0], tgt_res[0], atol=1e-6) or not np.isclose(ref_res[1], tgt_res[1], atol=1e-6):
            mismatch_reason = f"Resolution mismatch: {ref_res} vs {tgt_res}"
            needs_reproj = True
        else:
            # Check integer origin offset
            dx = (tgt_transform.c - ref_transform.c) / ref_res[0]
            dy = (tgt_transform.f - ref_transform.f) / ref_res[1]
            if not (np.isclose(dx, np.round(dx), atol=1e-3) and np.isclose(dy, np.round(dy), atol=1e-3)):
                mismatch_reason = f"Origin offset not integer pixels: dx={dx}, dy={dy}"
                needs_reproj = True
            else:
                needs_reproj = False
                
        if not needs_reproj:
            return True, "Consistent"
            
        if out_path is None:
            return False, mismatch_reason
            
        # Reproject
        data = tgt.read(1)
        out_data = np.empty((ref_height, ref_width), dtype=tgt.dtypes[0])
        
        reproject(
            source=data,
            destination=out_data,
            src_transform=tgt_transform,
            src_crs=tgt_crs,
            dst_transform=ref_transform,
            dst_crs=ref_crs,
            resampling=Resampling.nearest,
            src_nodata=tgt.nodata,
            dst_nodata=tgt.nodata
        )
        
        kwargs = tgt.meta.copy()
        kwargs.update({
            'crs': ref_crs,
            'transform': ref_transform,
            'width': ref_width,
            'height': ref_height
        })
        
        with rasterio.open(out_path, 'w', **kwargs) as dst:
            dst.write(out_data, 1)
            
        return False, f"Reprojected due to: {mismatch_reason}"
