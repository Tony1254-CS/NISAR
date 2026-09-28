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

// Public elevation tiles (AWS Open Data "Terrarium" encoding, no key/auth
// needed) -- presentation-only terrain relief, not a scientific layer. Kept
// separate from addStaticSources so it can be toggled on demand instead of
// always paying the tile cost.
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

export function setTerrainEnabled(map: MlMap, enabled: boolean) {
  if (enabled) {
    if (!map.getSource('terrain-dem')) {
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: [TERRAIN_TILES],
        tileSize: 256,
        maxzoom: 15,
        encoding: 'terrarium',
      });
    }
    map.setTerrain({ source: 'terrain-dem', exaggeration: 1.6 });
    map.easeTo({ pitch: 55, duration: 800 });
  } else {
    map.setTerrain(null);
    map.easeTo({ pitch: 0, duration: 500 });
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

  if (!map.getSource('risk-source')) {
    map.addSource('risk-source', { type: 'geojson', data: `${opts.baseUrl}/risk.geojson` });
    map.addLayer({
      id: 'layer-14-risk',
      type: 'fill',
      source: 'risk-source',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'risk_score'],
          0.2, '#7FBF8E',
          0.5, '#D9B26A',
          0.8, '#E4572E',
          1.0, '#FF0000'
        ],
        'fill-opacity': 0.6
      }
    });
  }

  
  if (!map.getSource('earthquake-source')) {
    map.addSource('earthquake-source', { type: 'geojson', data: `${opts.baseUrl}/earthquakes.json` });
    map.addLayer({
      id: 'layer-12-earthquakes',
      type: 'circle',
      source: 'earthquake-source',
      layout: { visibility: 'none' },
      paint: {
        'circle-radius': ['*', ['get', 'mag'], 4],
        'circle-color': '#ff5a00',
        'circle-opacity': 0.6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffaa00'
      }
    });
  }

  if (!map.getSource('prediction-source')) {
    map.addSource('prediction-source', { type: 'geojson', data: `${opts.baseUrl}/prediction.geojson` });
    
    // Erosion Prediction
    map.addLayer({
      id: 'layer-13-predict-erosion',
      type: 'fill',
      source: 'prediction-source',
      layout: { visibility: 'none' },
      filter: ['==', 'type', 'erosion_risk'],
      paint: {
        'fill-color': '#ff0000',
        'fill-opacity': 0.4,
        'fill-outline-color': '#ff0000'
      }
    });

    // Accretion Prediction
    map.addLayer({
      id: 'layer-13-predict-accretion',
      type: 'fill',
      source: 'prediction-source',
      layout: { visibility: 'none' },
      filter: ['==', 'type', 'accretion_risk'],
      paint: {
        'fill-color': '#f1c40f',
        'fill-opacity': 0.4,
        'fill-outline-color': '#f1c40f'
      }
    });

    // Ambiguity Prediction
    map.addLayer({
      id: 'layer-13-predict-ambiguity',
      type: 'fill',
      source: 'prediction-source',
      layout: { visibility: 'none' },
      filter: ['==', 'type', 'ambiguity'],
      paint: {
        'fill-color': '#95a5a6',
        'fill-opacity': 0.3,
        'fill-outline-color': '#7f8c8d'
      }
    });
  }
}

let earthquakeAnimationId: number;
let animationStartTime = 0;

export function setEarthquakeLayerVisible(map: MlMap, visible: boolean) {
  if (map.getLayer('layer-12-earthquakes')) {
    map.setLayoutProperty('layer-12-earthquakes', 'visibility', visible ? 'visible' : 'none');
    
    if (visible) {
      animationStartTime = performance.now();
      const animate = (timestamp: number) => {
        if (!map.getLayer('layer-12-earthquakes')) return;
        // Calculate a pulsating value between 0 and 1
        const progress = ((timestamp - animationStartTime) % 2000) / 2000;
        const radiusMultiplier = 1 + progress * 1.5; // expands up to 2.5x
        const opacity = 1 - progress; // fades out

        map.setPaintProperty('layer-12-earthquakes', 'circle-radius', ['*', ['get', 'mag'], 4 * radiusMultiplier]);
        map.setPaintProperty('layer-12-earthquakes', 'circle-opacity', 0.8 * opacity);
        map.setPaintProperty('layer-12-earthquakes', 'circle-stroke-opacity', opacity);

        earthquakeAnimationId = requestAnimationFrame(animate);
      };
      earthquakeAnimationId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(earthquakeAnimationId);
    }
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

let predictionAnimationId: number;
let predAnimationStartTime = 0;

export function setRiskLayerVisible(map: MlMap, visible: boolean) {
  setLayerVisible(map, 'layer-14-risk', visible);
}

export function setPredictionLayerVisible(map: MlMap, visible: boolean) {
  const layers = ['layer-13-predict-erosion', 'layer-13-predict-accretion', 'layer-13-predict-ambiguity'];
  layers.forEach(layer => setLayerVisible(map, layer, visible));

  if (visible) {
    predAnimationStartTime = performance.now();
    const animate = (timestamp: number) => {
      // Pulse between 0.2 and 0.6 opacity
      const progress = (Math.sin((timestamp - predAnimationStartTime) / 300) + 1) / 2; // 0 to 1
      const opacity = 0.2 + progress * 0.4;
      
      layers.forEach(layer => {
        if (map.getLayer(layer)) {
          map.setPaintProperty(layer, 'fill-opacity', opacity);
        }
      });
      predictionAnimationId = requestAnimationFrame(animate);
    };
    predictionAnimationId = requestAnimationFrame(animate);
  } else {
    cancelAnimationFrame(predictionAnimationId);
  }
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
