import { useEffect, useRef } from 'react';
import maplibregl, { type ImageSource, type Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Bounds, ChangeFeature, ChangeFeatureCollection, ReachDetail } from '../data/types';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

function asGeoJson(data: ChangeFeatureCollection | null): GeoJSON.FeatureCollection {
  return (data ?? EMPTY) as unknown as GeoJSON.FeatureCollection;
}

interface DecisionMapProps {
  reach: ReachDetail;
  bounds: Bounds;
  dates: string[];
  selectedDate: string;
  selectedFeatureId: string | null;
  erosion: ChangeFeatureCollection | null;
  accretion: ChangeFeatureCollection | null;
  showRadar: boolean;
  showWater: boolean;
  showOpera: boolean;
  scenario: GeoJSON.Feature<GeoJSON.Polygon> | null;
  osm: GeoJSON.FeatureCollection | null;
}

function imageCoordinates(bounds: Bounds): [[number, number], [number, number], [number, number], [number, number]] {
  const coordinates = bounds.coordinates as [[number, number], [number, number], [number, number], [number, number]];
  return coordinates;
}

function addImage(map: MlMap, id: string, url: string, coordinates: DecisionMapProps['bounds']['coordinates']) {
  map.addSource(id, { type: 'image', url, coordinates: coordinates as [[number, number], [number, number], [number, number], [number, number]] });
}

export function DecisionMap({
  reach, bounds, dates, selectedDate, selectedFeatureId, erosion, accretion,
  showRadar, showWater, showOpera, scenario, osm,
}: DecisionMapProps) {
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const coordinates = imageCoordinates(bounds);
  const base = `/data/v1/${reach.reach_id}`;

  useEffect(() => {
    if (!element.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: element.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
          },
        },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#10171a' } },
          { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-saturation': -0.35, 'raster-contrast': 0.12 } },
        ],
      },
      center: [89.75, 25.56],
      zoom: 8,
      minZoom: 5,
      maxZoom: 17,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.once('load', async () => {
      try {
        const date = selectedDate || dates[0];
        addImage(map, 'nisar-radar', `${base}/img/radar_${date}.png`, coordinates);
        map.addLayer({ id: 'nisar-radar-layer', type: 'raster', source: 'nisar-radar', paint: { 'raster-opacity': showRadar ? 0.76 : 0 } });
        addImage(map, 'nisar-water', `${base}/img/water_${date}.png`, coordinates);
        map.addLayer({ id: 'nisar-water-layer', type: 'raster', source: 'nisar-water', paint: { 'raster-opacity': showWater ? 0.82 : 0 } });
        map.addSource('candidate-erosion', { type: 'geojson', data: asGeoJson(erosion) });
        map.addLayer({ id: 'candidate-erosion-fill', type: 'fill', source: 'candidate-erosion', paint: { 'fill-color': '#f07957', 'fill-opacity': 0.42 } });
        map.addLayer({ id: 'candidate-erosion-outline', type: 'line', source: 'candidate-erosion', paint: { 'line-color': '#ffb09b', 'line-width': 1.15, 'line-opacity': 0.9 } });
        map.addSource('candidate-accretion', { type: 'geojson', data: asGeoJson(accretion) });
        map.addLayer({ id: 'candidate-accretion-fill', type: 'fill', source: 'candidate-accretion', paint: { 'fill-color': '#d9b26a', 'fill-opacity': 0.34 } });
        map.addLayer({ id: 'candidate-accretion-outline', type: 'line', source: 'candidate-accretion', paint: { 'line-color': '#f3d699', 'line-width': 1, 'line-opacity': 0.85 } });
        map.addSource('selected-candidate', { type: 'geojson', data: EMPTY });
        map.addLayer({ id: 'selected-candidate-outline', type: 'line', source: 'selected-candidate', paint: { 'line-color': '#ffffff', 'line-width': 2.5, 'line-dasharray': [1.5, 1.2] } });
        map.addSource('opera-dswx', {
          type: 'image',
          url: `${base}/context/opera-dswx-s1-20260617.png`,
          coordinates: [[89.5824523733, 25.7708844938], [89.9276049354, 25.7643464283], [89.9182429707, 25.3790721871], [89.5741909691, 25.3854987518]],
        });
        map.addLayer({ id: 'opera-dswx-layer', type: 'raster', source: 'opera-dswx', layout: { visibility: showOpera ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.92 } });
        map.addSource('scenario-zone', { type: 'geojson', data: scenario ?? EMPTY });
        map.addLayer({ id: 'scenario-fill', type: 'fill', source: 'scenario-zone', paint: { 'fill-color': '#efb64f', 'fill-opacity': 0.18 } });
        map.addLayer({ id: 'scenario-line', type: 'line', source: 'scenario-zone', paint: { 'line-color': '#ffd47c', 'line-width': 2, 'line-dasharray': [2, 1.5] } });
        map.addSource('osm-context', { type: 'geojson', data: osm ?? EMPTY });
        map.addLayer({ id: 'osm-buildings', type: 'fill', source: 'osm-context', filter: ['has', 'building'], paint: { 'fill-color': '#f2e7c9', 'fill-opacity': 0.78, 'fill-outline-color': '#fff7e4' } });
        map.addLayer({ id: 'osm-roads', type: 'line', source: 'osm-context', filter: ['has', 'highway'], paint: { 'line-color': '#ffffff', 'line-opacity': 0.92, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 15, 3] } });
        map.fitBounds(reach.bbox as [number, number, number, number], { padding: 42, duration: 0 });
      } catch (error) {
        console.error('Unable to initialize decision map layers', error);
      }
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
  // Layer inputs are updated by the effects below; the map itself is created once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource('nisar-radar') as ImageSource | undefined;
    if (source && selectedDate) source.updateImage({ url: `${base}/img/radar_${selectedDate}.png`, coordinates });
    const water = map.getSource('nisar-water') as ImageSource | undefined;
    if (water && selectedDate) water.updateImage({ url: `${base}/img/water_${selectedDate}.png`, coordinates });
  }, [selectedDate, base, coordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('nisar-radar-layer')) map.setPaintProperty('nisar-radar-layer', 'raster-opacity', showRadar ? 0.76 : 0);
    if (map.getLayer('nisar-water-layer')) map.setPaintProperty('nisar-water-layer', 'raster-opacity', showWater ? 0.82 : 0);
    if (map.getLayer('opera-dswx-layer')) map.setLayoutProperty('opera-dswx-layer', 'visibility', showOpera ? 'visible' : 'none');
  }, [showRadar, showWater, showOpera]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const erosionSource = map.getSource('candidate-erosion') as maplibregl.GeoJSONSource | undefined;
    const accretionSource = map.getSource('candidate-accretion') as maplibregl.GeoJSONSource | undefined;
    erosionSource?.setData(asGeoJson(erosion));
    accretionSource?.setData(asGeoJson(accretion));
    if (!selectedFeatureId) {
      (map.getSource('selected-candidate') as maplibregl.GeoJSONSource | undefined)?.setData(EMPTY);
      return;
    }
    const feature = [...(erosion?.features ?? []), ...(accretion?.features ?? [])]
      .find((item) => String(item.properties.id) === selectedFeatureId);
    (map.getSource('selected-candidate') as maplibregl.GeoJSONSource | undefined)?.setData(
      feature ? ({ type: 'FeatureCollection', features: [feature] } as unknown as GeoJSON.FeatureCollection) : EMPTY,
    );
  }, [erosion, accretion, selectedFeatureId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map.getSource('scenario-zone') as maplibregl.GeoJSONSource | undefined)?.setData(scenario ?? EMPTY);
  }, [scenario]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map.getSource('osm-context') as maplibregl.GeoJSONSource | undefined)?.setData(osm ?? EMPTY);
  }, [osm]);

  return <div className="decision-map" ref={element} aria-label="Interactive NISAR and context map" />;
}

export function featureCentroid(feature: ChangeFeature): [number, number] {
  const centroid = feature.properties.centroid;
  if (Array.isArray(centroid) && centroid.length >= 2) return [centroid[0], centroid[1]];
  const coordinates = feature.geometry.coordinates as number[][][];
  const ring = coordinates?.[0] ?? [];
  if (ring.length === 0) return [89.75, 25.56];
  const points = ring.slice(0, -1);
  return [points.reduce((sum, point) => sum + point[0], 0) / points.length, points.reduce((sum, point) => sum + point[1], 0) / points.length];
}
