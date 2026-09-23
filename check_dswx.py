import earthaccess
import shapely.geometry
import datetime

REACHES = {
    'jamuna-chilmari': [89.60, 25.40, 89.90, 25.75],
    'jamuna-bahadurabad': [89.55, 25.05, 89.85, 25.40],
    'jamuna-kazipur': [89.55, 24.25, 89.85, 24.65],
    'teesta-dalia': [88.95, 25.85, 89.45, 26.20],
}

def bbox_to_wkt(bbox):
    return shapely.geometry.box(*bbox).wkt

earthaccess.login(strategy='environment')

print("--- DSWx-S1 Availability Check (P0.9) ---")
for reach_id, bbox in REACHES.items():
    wkt = bbox_to_wkt(bbox)
    try:
        results = earthaccess.search_data(
            short_name="OPERA_L3_DSWX-S1_V1",
            bounding_box=tuple(bbox),
            temporal=("2026-06-17", datetime.datetime.utcnow().strftime('%Y-%m-%d'))
        )
        print(f"{reach_id}: {len(results)} tiles found")
    except Exception as e:
        print(f"{reach_id}: Error querying - {e}")
