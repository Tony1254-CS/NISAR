import numpy as np
from rasterio.transform import from_origin
import shapely.geometry
from src.pipeline.geom import polygonize_change

def test_polygonize_change():
    # 20x20 raster
    change = np.zeros((20, 20), dtype=np.uint8)
    
    # One 10x10 square of erosion (class 1)
    change[5:15, 5:15] = 1
    
    # Transform (20m pixels)
    trans = from_origin(1000, 1000, 20, 20)
    
    features = polygonize_change(change, trans, class_value=1, tolerance=20.0)
    
    assert len(features) == 1
    feat = features[0]
    
    assert feat['properties']['class'] == 1
    assert feat['properties']['pixel_count'] == 100
    
    geom = shapely.geometry.shape(feat['geometry'])
    assert geom.is_valid
    
    # A 10x10 square of 20m pixels -> 200x200 meters. Area = 40000 m2.
    assert np.isclose(geom.area, 40000)
