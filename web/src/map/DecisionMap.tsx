import { useEffect, useRef } from 'react';
import maplibregl, { type ImageSource, type Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Bounds, ChangeFeature, ChangeFeatureCollection, ReachDetail } from '../data/types';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

function asGeoJson(data: ChangeFeatureCollection | null): GeoJSON.FeatureCollection {
  return (data ?? EMPTY) as unknown as GeoJSON.FeatureCollection;
}
void asGeoJson;

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
  showRisk: boolean;
  risk: GeoJSON.FeatureCollection | null;
  showPred: boolean;
  prediction: GeoJSON.FeatureCollection | null;
  scenario: GeoJSON.Feature<GeoJSON.Polygon> | null;
  osm: GeoJSON.FeatureCollection | null;
  topN: number;
  onSelectFeature?: (id: string) => void;
}

function imageCoordinates(bounds: Bounds): [[number, number], [number, number], [number, number], [number, number]] {
  return bounds.coordinates as [[number, number], [number, number], [number, number], [number, number]];
}

function addImage(map: MlMap, id: string, url: string, coordinates: DecisionMapProps['bounds']['coordinates']) {
  map.addSource(id, { type: 'image', url, coordinates: coordinates as [[number, number], [number, number], [number, number], [number, number]] });
}

/* ransack: chips (top-N) and timeline swipe (t0 vs t1) */
function filterToTopN(data: ChangeFeatureCollection | null, topN: number): GeoJSON.FeatureCollection {
  if (!data?.features?.length) return EMPTY;
  const sorted = [...data.features].sort((a, b) => (b.properties.area_ha ?? 0) - (a.properties.area_ha ?? 0));
  return { type: 'FeatureCollection', features: sorted.slice(0, topN).map(f => f as unknown as GeoJSON.Feature) } as unknown as GeoJSON.FeatureCollection;
}

export function DecisionMap(props: DecisionMapProps) {
  const { reach, bounds, dates, selectedDate, selectedFeatureId, erosion, accretion,
    showRadar, showWater, showOpera, showRisk, risk, showPred, prediction, scenario, osm, topN, onSelectFeature } = props;
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const coordinates = imageCoordinates(bounds);
  const base = `/data/v1/${reach.reach_id}`;
  const selectRef = useRef(onSelectFeature);
  selectRef.current = onSelectFeature;

  useEffect(() => {
    if (!element.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: element.current,
      style: {
        version: 8,
        sources: { satellite: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' } },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#10171a' } },
          { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-saturation': -0.35, 'raster-contrast': 0.12 } },
        ],
      },
      center: [89.75, 25.56], zoom: 8, minZoom: 5, maxZoom: 17,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: 'metric' }), 'bottom-left');

    map.once('load', () => {
      try {
        const date = selectedDate || dates[0];
        addImage(map, 'nisar-radar', `${base}/img/radar_${date}.png`, coordinates);
        map.addLayer({ id: 'nisar-radar-layer', type: 'raster', source: 'nisar-radar', paint: { 'raster-opacity': showRadar ? 0.97 : 0, 'raster-contrast': 0.14 } });
        addImage(map, 'nisar-water', `${base}/img/water_${date}.png`, coordinates);
        map.addLayer({ id: 'nisar-water-layer', type: 'raster', source: 'nisar-water', paint: { 'raster-opacity': showWater ? 0.9 : 0 } });
        map.addSource('candidate-erosion', { type: 'geojson', data: filterToTopN(erosion, topN) });
        map.addLayer({ id: 'candidate-erosion-fill', type: 'fill', source: 'candidate-erosion', paint: { 'fill-color': '#f07957', 'fill-opacity': 0.48 } });
        map.addLayer({ id: 'candidate-erosion-outline', type: 'line', source: 'candidate-erosion', paint: { 'line-color': '#ffb09b', 'line-width': 1.2, 'line-opacity': 0.95 } });
        map.addSource('candidate-accretion', { type: 'geojson', data: filterToTopN(accretion, topN) });
        map.addLayer({ id: 'candidate-accretion-fill', type: 'fill', source: 'candidate-accretion', paint: { 'fill-color': '#d9b26a', 'fill-opacity': 0.36 } });
        map.addLayer({ id: 'candidate-accretion-outline', type: 'line', source: 'candidate-accretion', paint: { 'line-color': '#f3d699', 'line-width': 1, 'line-opacity': 0.9 } });
        map.addSource('selected-candidate', { type: 'geojson', data: EMPTY });
        map.addLayer({ id: 'selected-candidate-outline', type: 'line', source: 'selected-candidate', paint: { 'line-color': '#ffffff', 'line-width': 3, 'line-dasharray': [1.5, 1.2] } });
        map.addSource('opera-dswx', { type: 'image', url: `${base}/context/opera-dswx-s1-20260617.png`, coordinates: [[89.5824523733, 25.7708844938], [89.9276049354, 25.7643464283], [89.9182429707, 25.3790721871], [89.5741909691, 25.3854987518]] });
        map.addLayer({ id: 'opera-dswx-layer', type: 'raster', source: 'opera-dswx', layout: { visibility: showOpera ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.95 } });
        map.addSource('risk-zone', { type: 'geojson', data: (risk ?? EMPTY) as unknown as GeoJSON.FeatureCollection });
        map.addLayer({ id: 'risk-fill', type: 'fill', source: 'risk-zone', layout: { visibility: 'none' }, paint: { 'fill-color': ['match', ['get', 'risk_category'], 'CRITICAL', '#E4572E', 'HIGH', '#E0B34A', '#39C4D9'], 'fill-opacity': 0.28 } });
        map.addLayer({ id: 'risk-outline', type: 'line', source: 'risk-zone', layout: { visibility: 'none' }, paint: { 'line-color': '#ffffff', 'line-width': 1, 'line-opacity': 0.7 } });
        map.addSource('pred-zone', { type: 'geojson', data: (prediction ?? EMPTY) as unknown as GeoJSON.FeatureCollection });
        map.addLayer({ id: 'pred-erosion', type: 'fill', source: 'pred-zone', filter: ['==', ['get', 'type'], 'erosion_risk'], layout: { visibility: 'none' }, paint: { 'fill-color': '#E4572E', 'fill-opacity': 0.3 } });
        map.addLayer({ id: 'pred-accretion', type: 'fill', source: 'pred-zone', filter: ['==', ['get', 'type'], 'accretion_risk'], layout: { visibility: 'none' }, paint: { 'fill-color': '#D9B26A', 'fill-opacity': 0.3 } });
        map.addLayer({ id: 'pred-ambiguity', type: 'fill', source: 'pred-zone', filter: ['==', ['get', 'type'], 'ambiguity'], layout: { visibility: 'none' }, paint: { 'fill-color': '#8A9299', 'fill-opacity': 0.28 } });
        map.addSource('scenario-zone', { type: 'geojson', data: scenario ?? EMPTY });
        map.addLayer({ id: 'scenario-fill', type: 'fill', source: 'scenario-zone', paint: { 'fill-color': '#efb64f', 'fill-opacity': 0.2 } });
        map.addLayer({ id: 'scenario-line', type: 'line', source: 'scenario-zone', paint: { 'line-color': '#ffd47c', 'line-width': 2.2, 'line-dasharray': [2, 1.5] } });
        map.addSource('osm-context', { type: 'geojson', data: osm ?? EMPTY });
        map.addLayer({ id: 'osm-buildings', type: 'fill', source: 'osm-context', filter: ['has', 'building'], paint: { 'fill-color': '#f2e7c9', 'fill-opacity': 0.85, 'fill-outline-color': '#fff7e4' } });
        map.addLayer({ id: 'osm-roads', type: 'line', source: 'osm-context', filter: ['has', 'highway'], paint: { 'line-color': '#ffffff', 'line-opacity': 0.95, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 15, 3] } });
        for (const layerId of ['candidate-erosion-fill', 'candidate-accretion-fill']) {
          map.on('click', layerId, (e) => {
            const feature = e.features?.[0];
            const id = (feature?.properties as { id?: unknown } | undefined)?.id;
            if (id != null && selectRef.current) selectRef.current(String(id));
          });
        }
        map.fitBounds([coordinates[0][0] as number, coordinates[2][1] as number, coordinates[1][0] as number, coordinates[0][1] as number], { padding: 0, duration: 0, maxZoom: 12 });
        map.setMaxBounds([coordinates[0][0] - 0.05, coordinates[3][1] - 0.05, coordinates[1][0] + 0.05, coordinates[0][1] + 0.05] as [number, number, number, number]);
      } catch (error) { console.error('Unable to initialize decision map layers', error); }
    });
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current; if (!map?.isStyleLoaded()) return;
    const source = map.getSource('nisar-radar') as ImageSource | undefined;
    if (source && selectedDate) source.updateImage({ url: `${base}/img/radar_${selectedDate}.png`, coordinates });
    const water = map.getSource('nisar-water') as ImageSource | undefined;
    if (water && selectedDate) water.updateImage({ url: `${base}/img/water_${selectedDate}.png`, coordinates });
  }, [selectedDate, base, coordinates]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (map.getLayer('nisar-radar-layer')) map.setPaintProperty('nisar-radar-layer', 'raster-opacity', showRadar ? 0.97 : 0);
    if (map.getLayer('nisar-water-layer')) map.setPaintProperty('nisar-water-layer', 'raster-opacity', showWater ? 0.9 : 0);
    if (map.getLayer('opera-dswx-layer')) map.setLayoutProperty('opera-dswx-layer', 'visibility', showOpera ? 'visible' : 'none');
    const riskVis = showRisk ? 'visible' : 'none';
    for (const id of ['risk-fill', 'risk-outline']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', riskVis);
    const predVis = showPred ? 'visible' : 'none';
    for (const id of ['pred-erosion', 'pred-accretion', 'pred-ambiguity']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', predVis);
  }, [showRadar, showWater, showOpera, showRisk, showPred]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    (map.getSource('candidate-erosion') as maplibregl.GeoJSONSource | undefined)?.setData(filterToTopN(erosion, topN));
    (map.getSource('candidate-accretion') as maplibregl.GeoJSONSource | undefined)?.setData(filterToTopN(accretion, topN));
    if (!selectedFeatureId) { (map.getSource('selected-candidate') as maplibregl.GeoJSONSource | undefined)?.setData(EMPTY); return; }
    const feature = [...(erosion?.features ?? []), ...(accretion?.features ?? [])].find((item) => String(item.properties.id) === selectedFeatureId);
    (map.getSource('selected-candidate') as maplibregl.GeoJSONSource | undefined)?.setData(feature ? ({ type: 'FeatureCollection', features: [feature] } as unknown as GeoJSON.FeatureCollection) : EMPTY);
  }, [erosion, accretion, selectedFeatureId, topN]);

  useEffect(() => { const map = mapRef.current; if (map) (map.getSource('scenario-zone') as maplibregl.GeoJSONSource | undefined)?.setData(scenario ?? EMPTY); }, [scenario]);
  useEffect(() => { const map = mapRef.current; if (map) (map.getSource('osm-context') as maplibregl.GeoJSONSource | undefined)?.setData(osm ?? EMPTY); }, [osm]);
  useEffect(() => { const map = mapRef.current; if (map) (map.getSource('risk-zone') as maplibregl.GeoJSONSource | undefined)?.setData((risk ?? EMPTY) as unknown as GeoJSON.FeatureCollection); }, [risk]);
  useEffect(() => { const map = mapRef.current; if (map) (map.getSource('pred-zone') as maplibregl.GeoJSONSource | undefined)?.setData((prediction ?? EMPTY) as unknown as GeoJSON.FeatureCollection); }, [prediction]);

  return <div className="decision-map" ref={element} aria-label="NISAR radar map — Jamuna Chilmari reach" />;
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
