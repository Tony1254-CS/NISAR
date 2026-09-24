import type { Map as MlMap, ImageSource } from 'maplibre-gl';
import type { Bounds } from '../data/types';

// Shared source/layer setup used by both the primary MapStage map and the
// secondary CompareSwipe map, so the two stay structurally identical
// (Section 22.1 layer stack, image sources keyed to bounds.json corners).

export const GIBS_TEMPLATE =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg';

export function boundsToCoordinates(bounds: Bounds): [[number, number], [number, number], [number, number], [number, number]] {
  // bounds.json coordinates are 4 [lng,lat] pairs in order TL,TR,BR,BL
  // (Section 13.3) — the exact order MapLibre image sources expect.
  const c = bounds.coordinates as [number, number][];
  return [c[0], c[1], c[2], c[3]];
}

export function bboxToPolygon(bbox: number[]): GeoJSON.Feature {
  const [w, s, e, n] = bbox;
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [w, s],
          [e, s],
          [e, n],
          [w, n],
          [w, s],
        ],
      ],
    },
  };
}

export function addStaticSources(map: MlMap) {
  if (!map.getSource('gibs')) {
    map.addSource('gibs', { type: 'raster', tiles: [GIBS_TEMPLATE], tileSize: 256, maxzoom: 8 });
  }
  if (!map.getLayer('layer-2-gibs')) {
    map.addLayer({ id: 'layer-2-gibs', type: 'raster', source: 'gibs', maxzoom: 8, paint: { 'raster-opacity': 1 } });
  }
}

export function radarUrl(baseUrl: string, date: string) {
  return `${baseUrl}/img/radar_${date}.png`;
}
export function waterUrl(baseUrl: string, date: string) {
  return `${baseUrl}/img/water_${date}.png`;
}
export function changeUrl(baseUrl: string, t0: string, t1: string) {
  return `${baseUrl}/img/change_${t0}_${t1}.png`;
}

/** Adds the per-reach sources/layers once (radar, water, erosion, accretion, AOI). Idempotent. */
export function ensureReachLayers(
  map: MlMap,
  opts: { baseUrl: string; bounds: Bounds; bbox: number[]; initialDate: string }
) {
  const coords = boundsToCoordinates(opts.bounds);

  if (!map.getSource('radar-source')) {
    map.addSource('radar-source', { type: 'image', url: radarUrl(opts.baseUrl, opts.initialDate), coordinates: coords });
    map.addLayer({ id: 'layer-4-radar', type: 'raster', source: 'radar-source', paint: { 'raster-opacity': 1 } });
  }
  if (!map.getSource('water-source')) {
    map.addSource('water-source', { type: 'image', url: waterUrl(opts.baseUrl, opts.initialDate), coordinates: coords });
    map.addLayer({
      id: 'layer-5-water',
      type: 'raster',
      source: 'water-source',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.55 },
    });
  }
  if (!map.getSource('accretion-source')) {
    map.addSource('accretion-source', { type: 'geojson', data: `${opts.baseUrl}/accretion.geojson` });
    map.addLayer({
      id: 'layer-7-accretion',
      type: 'fill',
      source: 'accretion-source',
      layout: { visibility: 'none' },
      paint: { 'fill-color': '#D9B26A', 'fill-opacity': 0.75 },
    });
  }
  if (!map.getSource('erosion-source')) {
    map.addSource('erosion-source', { type: 'geojson', data: `${opts.baseUrl}/erosion.geojson` });
    map.addLayer({
      id: 'layer-8-erosion',
      type: 'fill',
      source: 'erosion-source',
      layout: { visibility: 'none' },
      paint: { 'fill-color': '#E4572E', 'fill-opacity': 0.85 },
    });
    map.addLayer({
      id: 'layer-9-outlines',
      type: 'line',
      source: 'erosion-source',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#E4572E',
        'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 1],
      },
    });
  }
  if (!map.getSource('aoi-source')) {
    map.addSource('aoi-source', { type: 'geojson', data: bboxToPolygon(opts.bbox) as GeoJSON.Feature<GeoJSON.Geometry> });
    map.addLayer({
      id: 'layer-11-aoi',
      type: 'line',
      source: 'aoi-source',
      paint: { 'line-color': '#2A3036', 'line-dasharray': [2, 4], 'line-width': 1, 'line-opacity': 0.5 },
    });
  }
}

export function updateRadarWaterImage(map: MlMap, baseUrl: string, date: string) {
  const radar = map.getSource('radar-source') as ImageSource | undefined;
  const water = map.getSource('water-source') as ImageSource | undefined;
  radar?.updateImage({ url: radarUrl(baseUrl, date) });
  water?.updateImage({ url: waterUrl(baseUrl, date) });
}

export function setWaterVisible(map: MlMap, visible: boolean) {
  if (map.getLayer('layer-5-water')) {
    map.setLayoutProperty('layer-5-water', 'visibility', visible ? 'visible' : 'none');
  }
}

export function setLayerVisible(map: MlMap, layerId: string, visible: boolean) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

export function setChangeLayersVisible(
  map: MlMap,
  opts: { erosion: boolean; accretion: boolean; ambiguous: boolean }
) {
  setLayerVisible(map, 'layer-7-accretion', opts.accretion);
  setLayerVisible(map, 'layer-8-erosion', opts.erosion);
  setLayerVisible(map, 'layer-9-outlines', opts.erosion);
  setLayerVisible(map, 'layer-6-ambiguous', opts.ambiguous);
}

/** Ambiguous overlay: pre-rendered raster PNG (class 4 pixels only), Section 22.1 row 6. */
export function ensureAmbiguousLayer(map: MlMap, opts: { baseUrl: string; bounds: Bounds; t0: string; t1: string }) {
  const coords = boundsToCoordinates(opts.bounds);
  const url = changeUrl(opts.baseUrl, opts.t0, opts.t1);
  const existing = map.getSource('change-source') as ImageSource | undefined;
  if (existing) {
    existing.updateImage({ url });
  } else {
    map.addSource('change-source', { type: 'image', url, coordinates: coords });
    map.addLayer(
      { id: 'layer-6-ambiguous', type: 'raster', source: 'change-source', paint: { 'raster-opacity': 1 } },
      'layer-7-accretion'
    );
  }
}
