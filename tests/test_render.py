import os
import numpy as np
import rasterio
from rasterio.transform import from_origin
from src.pipeline.render import render_radar_png, render_water_png, compute_bounds, write_bounds_json

def test_render(tmp_path):
    # Setup dummy data
    db = np.array([
        [-30, -26],
        [-13, 0],
        [10, -5]
    ], dtype=np.float32)
    
    radar_path = tmp_path / "radar.png"
    render_radar_png(db, radar_path)
    assert radar_path.exists()
    
    import PIL.Image
    img = PIL.Image.open(radar_path)
    assert img.size == (2, 3)
    arr = np.array(img)
    # -30 -> clipped to -26 -> 0
    assert arr[0, 0] == 0
    # 0 -> 255
    assert arr[1, 1] == 255
    # 10 -> clipped to 0 -> 255
    assert arr[2, 0] == 255
    # -13 -> halfway -> 127
    assert 120 < arr[1, 0] < 135
    
    water = np.array([
        [True, False],
        [False, True],
        [True, True]
    ])
    water_path = tmp_path / "water.png"
    render_water_png(water, water_path)
    assert water_path.exists()
    
    # EPSG:3857 transform
    trans = from_origin(10000000, 3000000, 20, 20)
    bounds = compute_bounds(trans, width=2, height=3, crs="EPSG:3857")
    assert len(bounds) == 4
    
    bounds_path = tmp_path / "bounds.json"
    write_bounds_json(bounds, bounds_path)
    assert bounds_path.exists()
