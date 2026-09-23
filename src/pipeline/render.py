import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.transform import array_bounds
import PIL.Image
import json
import os

def render_radar_png(db_data, out_path):
    """
    Renders radar dB to a grayscale PNG.
    Clips to [-26, 0] dB.
    """
    clipped = np.clip(db_data, -26.0, 0.0)
    # Map [-26, 0] to [0, 255]
    scaled = ((clipped - (-26.0)) / 26.0 * 255.0).astype(np.uint8)
    
    img = PIL.Image.fromarray(scaled, mode='L')
    img.save(out_path)
    
def render_water_png(water_mask, out_path):
    """
    Renders boolean water mask to PNG (transparent background, colored water, or just RGBA).
    water_mask: boolean array
    """
    # Let's make water blue (0,0,255, 255), land transparent (0,0,0, 0)
    h, w = water_mask.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[water_mask] = [0, 0, 255, 255]
    
    img = PIL.Image.fromarray(rgba, mode='RGBA')
    img.save(out_path)
    
def compute_bounds(transform, width, height, crs="EPSG:3857"):
    """
    Returns bounds array [[lng, lat]*4] for MapLibre.
    """
    bounds = rasterio.transform.array_bounds(height, width, transform)
    left, bottom, right, top = bounds
    
    # Needs to be reprojected from CRS to WGS84 (EPSG:4326) for MapLibre
    # We can use rasterio.warp.transform
    src_crs = rasterio.crs.CRS.from_string(crs)
    dst_crs = rasterio.crs.CRS.from_epsg(4326)
    
    lons, lats = rasterio.warp.transform(
        src_crs, dst_crs,
        [left, right, right, left],
        [top, top, bottom, bottom]
    )
    
    return [
        [lons[0], lats[0]], # TL
        [lons[1], lats[1]], # TR
        [lons[2], lats[2]], # BR
        [lons[3], lats[3]]  # BL
    ]

def write_bounds_json(bounds_coords, out_path):
    with open(out_path, 'w') as f:
        json.dump({"coordinates": bounds_coords}, f)
