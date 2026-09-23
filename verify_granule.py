import earthaccess
import xarray as xr
import json

earthaccess.login(strategy='environment')

with open("data/raw/jamuna-chilmari/catalog.json") as f:
    catalog = json.load(f)

# Use the first granule from catalog
feature = catalog["features"][0]
print(f"Checking granule: {feature['properties']['sceneName']}")

try:
    results = earthaccess.search_data(
        short_name="NISAR_L2_GCOV_PROVISIONAL_V1",
        granule_name=feature['properties']['sceneName']
    )
    if not results:
        print("Granule not found via earthaccess!")
        exit(1)
        
    print("Found granule via earthaccess.")
    files = earthaccess.open(results)
    print("Opened file stream.")
    
    ds = xr.open_datatree(files[0], engine='h5netcdf', phony_dims='access')
    print("--- ROOT ---")
    print(ds)
    
    print("\n--- /science/LSAR/GCOV/grids/frequencyA ---")
    try:
        freqA = ds['science']['LSAR']['GCOV']['grids']['frequencyA']
        print(freqA)
        print("\nVariables in frequencyA:")
        for var in freqA.variables:
            print(f"- {var}: {freqA[var].dims}, shape: {freqA[var].shape}, attrs: {freqA[var].attrs}")
    except KeyError:
        print("Could not access frequencyA group.")

    print("\n--- /science/LSAR/identification ---")
    try:
        ident = ds['science']['LSAR']['identification']
        for var in ident.variables:
            print(f"- {var}: {ident[var].values}")
    except KeyError:
        print("Could not access identification group.")
        
except Exception as e:
    print(f"Error: {e}")
