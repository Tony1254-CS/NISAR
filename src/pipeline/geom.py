import numpy as np
import rasterio
from rasterio.features import shapes
import shapely.geometry
import json

def polygonize_change(change_raster, transform, class_value=1, tolerance=20.0):
    """
    Polygonizes a change class, simplifies using Douglas-Peucker, and returns GeoJSON features.
    change_raster: 2D array of class values (e.g. 1 for erosion)
    transform: rasterio affine transform
    class_value: value to polygonize
    tolerance: simplification tolerance in map units (meters for UTM)
    """
    mask = (change_raster == class_value)
    if not mask.any():
        return []
        
    features = []
    
    for geom, val in shapes(mask.astype(np.uint8), mask=mask, transform=transform):
        # geom is a dict, val is the class value
        shape = shapely.geometry.shape(geom)
        
        # Simplify
        simplified = shape.simplify(tolerance, preserve_topology=True)
        
        # Exact raster pixel count
        # We can either count pixels in the raster by re-rasterizing, or we just trust
        # the original mask. But the spec says: "pixel_count attribute holds the exact
        # raster pixel count for that polygon (by masking the original raster before simplification)."
        # Actually rasterio.features.shapes gives us one polygon per connected component.
        # So we can just rasterize THIS specific polygon (unsimplified) to count its pixels,
        # OR since it's exactly the connected component, its area / pixel_area gives the exact pixel count!
        # shape.area is in map units.
        pixel_area = transform.a * abs(transform.e)
        pixel_count = int(round(shape.area / pixel_area))
        
        feat = {
            "type": "Feature",
            "geometry": shapely.geometry.mapping(simplified),
            "properties": {
                "class": int(val),
                "pixel_count": pixel_count
            }
        }
        features.append(feat)
        
    return features
