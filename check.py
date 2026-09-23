import asf_search as asf
from collections import defaultdict
import shapely.geometry

REACHES = {
    'jamuna-chilmari': [89.60, 25.40, 89.90, 25.75]
}

wkt = shapely.geometry.box(*REACHES['jamuna-chilmari']).wkt
results = asf.search(dataset='NISAR', processingLevel='GCOV', intersectsWith=wkt, start='2026-06-17')
provisional = []
for r in results:
    if 'NISAR_L2_GCOV_PROVISIONAL' in r.properties.get('shortName', '') or 'P05023' in r.properties.get('sceneName', ''):
        provisional.append(r)
        
groups = defaultdict(list)
for p in provisional:
    name = p.properties['sceneName']
    parts = name.split('_')
    if len(parts) > 7:
        # parts: 0=NISAR, 1=L2, 2=PR, 3=GCOV, 4=cycle, 5=track, 6=dir, 7=frame
        groups[(parts[5], parts[7], parts[6])].append(name)
        
for k, v in groups.items():
    if len(v) >= 6:
        print(f"Track {k[0]}, Frame {k[1]}, Dir {k[2]}: {len(v)} granules")
