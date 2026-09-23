import earthaccess
import xarray as xr
import rioxarray
import json
import os
import shapely.geometry
import geopandas as gpd

def get_granule_info(granule_name):
    earthaccess.login(strategy='environment')
    results = earthaccess.search_data(
        short_name="NISAR_L2_GCOV_PROVISIONAL_V1",
        granule_name=granule_name
    )
    if not results:
        raise ValueError(f"Granule {granule_name} not found.")
    return results[0]

def stream_and_clip_granule(granule_name, bbox, out_dir):
    """
    Downloads/streams a NISAR GCOV granule, clips to bbox (in EPSG:4326), 
    and saves HHHH.tif, mask.tif, etc.
    """
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Get the granule via earthaccess
    granule = get_granule_info(granule_name)
    
    # Streaming is hanging, so we fallback to full download as per plan.
    print(f"Downloading granule to {out_dir}...")
    downloaded_paths = earthaccess.download([granule], local_path=out_dir)
    if not downloaded_paths:
        raise ValueError("Download failed.")
        
    local_file = downloaded_paths[0]
    ds = xr.open_datatree(local_file, engine="h5netcdf", decode_timedelta=False, phony_dims="access")

    # 2. Extract science data
    freqA = ds['science']['LSAR']['GCOV']['grids']['frequencyA']
    ident = ds['science']['LSAR']['identification']
    
    # 3. Read projection and create CRS
    epsg = freqA['projection'].attrs.get('epsg_code')
    crs = f"EPSG:{epsg}"
    
    # 4. Prepare clipping geometry
    min_lon, min_lat, max_lon, max_lat = bbox
    geom = shapely.geometry.box(min_lon, min_lat, max_lon, max_lat)
    gdf = gpd.GeoDataFrame({'geometry': [geom]}, crs="EPSG:4326")
    gdf_utm = gdf.to_crs(crs)
    clip_geom = gdf_utm.geometry.values[0]
    
    # 5. Extract metadata
    meta = {
        "granule_id": granule_name,
        "zeroDopplerStartTime": str(ident['zeroDopplerStartTime'].values),
        "zeroDopplerEndTime": str(ident['zeroDopplerEndTime'].values),
        "orbitPassDirection": str(ident['orbitPassDirection'].values),
        "absoluteOrbitNumber": int(ident['absoluteOrbitNumber'].values),
        "trackNumber": int(ident['trackNumber'].values),
        "frameNumber": int(ident['frameNumber'].values)
    }
    with open(os.path.join(out_dir, "meta.json"), "w") as mf:
        json.dump(meta, mf, indent=2)

    # 6. Process variables
    variables = ['HHHH', 'HVHV', 'mask', 'numberOfLooks']
    for var in variables:
        if var in freqA:
            print(f"Processing {var}...")
            da = freqA[var].to_dataset(name=var).to_array().squeeze()
            da = da.rename({'yCoordinates': 'y', 'xCoordinates': 'x'})
            
            # Set spatial dims for rioxarray
            da = da.rio.write_crs(crs)
            da = da.rio.set_spatial_dims(x_dim="x", y_dim="y")
            
            # Clip
            try:
                clipped = da.rio.clip([clip_geom], crs=crs)
                
                out_path = os.path.join(out_dir, f"{var}.tif")
                clipped.rio.to_raster(out_path)
                print(f"Saved {out_path}")
            except Exception as e:
                print(f"Error clipping {var}: {e}")
                
    # Cleanup local file if fallback was used
    if os.path.exists(local_file):
        os.remove(local_file)
        
if __name__ == "__main__":
    import sys
    # For testing P1.1
    # python src/pipeline/io_nisar.py jamuna-chilmari NISAR_L2_PR_GCOV_...
    if len(sys.argv) > 2:
        reach = sys.argv[1]
        granule = sys.argv[2]
        
        # Load reach bbox
        import yaml
        with open(f"config/reaches/{reach}.yaml") as f:
            cfg = yaml.safe_load(f)
        bbox = cfg['bbox']
        
        out = f"data/raw/{reach}/nisar/{granule}"
        stream_and_clip_granule(granule, bbox, out)
