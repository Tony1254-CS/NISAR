import type { LayerSpecification, SourceSpecification } from 'maplibre-gl';

// Sources
export const sources: Record<string, SourceSpecification> = {
  gibs: {
    type: 'raster',
    tiles: [
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg'
    ],
    tileSize: 256,
    maxzoom: 8
  },
  // Vector basemap using OpenFreeMap (Positron style)
  // Actual sources will be loaded from style URL directly in MapStage
};

export const layers: LayerSpecification[] = [
  {
    id: 'layer-2-gibs',
    type: 'raster',
    source: 'gibs',
    maxzoom: 8,
    paint: {
      'raster-opacity': 1
    }
  },
  // 3. Neutral vector basemap (loaded via style URL, we'll insert our layers above its background or below its labels)
  {
    id: 'layer-4-radar',
    type: 'raster',
    source: 'radar-source', // dynamic source added in MapStage
    paint: {
      'raster-opacity': 1
    }
  },
  {
    id: 'layer-5-water',
    type: 'raster',
    source: 'water-source', // dynamic source
    paint: {
      'raster-opacity': 0.55
    }
  },
  {
    id: 'layer-6-ambiguous',
    type: 'fill',
    source: 'change-source',
    filter: ['==', 'class', 4],
    paint: {
      'fill-color': '#8A9299', // --ambiguous
      'fill-opacity': 1,
      'fill-pattern': 'hatching' // needs image loaded
    }
  },
  {
    id: 'layer-7-accretion',
    type: 'fill',
    source: 'accretion-source',
    paint: {
      'fill-color': '#D9B26A', // --accretion
      'fill-opacity': 0.75
    }
  },
  {
    id: 'layer-8-erosion',
    type: 'fill',
    source: 'erosion-source',
    paint: {
      'fill-color': '#E4572E', // --erosion
      'fill-opacity': 0.85
    }
  },
  {
    id: 'layer-9-outlines',
    type: 'line',
    source: 'erosion-source', // actually change source with hover logic
    paint: {
      'line-color': '#E4572E',
      'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0] // 0 default, 2 on hover
    }
  },
  {
    id: 'layer-10-cegis',
    type: 'line',
    source: 'cegis-source',
    paint: {
      'line-color': '#E6E8EA',
      'line-dasharray': [2, 2],
      'line-width': 1
    }
  },
  {
    id: 'layer-11-aoi',
    type: 'line',
    source: 'aoi-source',
    paint: {
      'line-color': '#2A3036', // --line
      'line-dasharray': [2, 4],
      'line-width': 1,
      'line-opacity': 0.5
    }
  }
  // 12. Place labels (we will use OpenFreeMap's built-in place labels)
];
