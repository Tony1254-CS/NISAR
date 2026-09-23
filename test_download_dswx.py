import earthaccess

earthaccess.login(strategy="environment")
results = earthaccess.search_data(
    short_name="OPERA_L3_DSWX-S1_V1",
    bounding_box=(89.60, 25.40, 89.90, 25.75),
    temporal=("2026-06-17", "2026-06-30")
)
if results:
    print(f"Found {len(results)} tiles. Trying to download first tile...")
    earthaccess.download([results[0]], local_path=".")
    print("Download success.")
else:
    print("No tiles found.")
