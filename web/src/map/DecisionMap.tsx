import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import maplibregl, { type ImageSource, type Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Bounds, ChangeFeature, ChangeFeatureCollection, ReachDetail } from '../data/types';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

export interface MapSwipe {
  t0: string;
  t1: string;
  /** Divider position, percent of map width (left of divider = t0, right = t1). */
  position: number;
  onPositionChange: (n: number) => void;
}

export interface SiteMarker {
  id: string;
  label: string;
  centroid: [number, number];
  active: boolean;
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
  topN: number;
  onSelectFeature?: (id: string) => void;
  /** In-canvas before/after swipe. When set, the primary canvas shows t0 radar and a
   *  second, camera-synced MapLibre canvas clipped to the right of the divider shows
   *  t1 radar — the comparison lives inside the map, not in a separate image panel. */
  swipe?: MapSwipe | null;
  siteMarkers?: SiteMarker[];
  onSelectSite?: (id: string) => void;
}

function imageCoordinates(bounds: Bounds): [[number, number], [number, number], [number, number], [number, number]] {
  return bounds.coordinates as [[number, number], [number, number], [number, number], [number, number]];
}

function baseStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: { satellite: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' } },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#10171a' } },
      { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-saturation': -0.35, 'raster-contrast': 0.12 } },
    ],
  } as maplibregl.StyleSpecification;
}

function filterToTopN(data: ChangeFeatureCollection | null, topN: number): GeoJSON.FeatureCollection {
  if (!data?.features?.length) return EMPTY;
  const sorted = [...data.features].sort((a, b) => (b.properties.area_ha ?? 0) - (a.properties.area_ha ?? 0));
  return { type: 'FeatureCollection', features: sorted.slice(0, topN).map(f => f as unknown as GeoJSON.Feature) } as unknown as GeoJSON.FeatureCollection;
}

export function DecisionMap(props: DecisionMapProps) {
  const { reach, bounds, dates, selectedDate, selectedFeatureId, erosion, accretion,
    showRadar, showWater, showOpera, scenario, osm, topN, onSelectFeature, swipe, siteMarkers, onSelectSite } = props;
  const element = useRef<HTMLDivElement>(null);
  const swipeElement = useRef<HTMLDivElement>(null);
  const wrapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const swipeMapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const coordinates = imageCoordinates(bounds);
  const base = `/data/v1/${reach.reach_id}`;
  const selectRef = useRef(onSelectFeature);
  selectRef.current = onSelectFeature;
  const selectSiteRef = useRef(onSelectSite);
  selectSiteRef.current = onSelectSite;
  const swipeActive = !!swipe;
  const radarDate = swipe ? swipe.t0 : selectedDate;

  useEffect(() => {
    if (!element.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: element.current,
      style: baseStyle(),
      center: [89.75, 25.56], zoom: 8, minZoom: 5, maxZoom: 17,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: 'metric' }), 'bottom-left');
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(element.current);

    map.once('load', () => {
      try {
        const date = radarDate || dates[0];
        map.addSource('nisar-radar', { type: 'image', url: `${base}/img/radar_${date}.png`, coordinates });
        map.addLayer({ id: 'nisar-radar-layer', type: 'raster', source: 'nisar-radar', paint: { 'raster-opacity': showRadar ? 0.97 : 0, 'raster-contrast': 0.14 } });
        map.addSource('nisar-water', { type: 'image', url: `${base}/img/water_${date}.png`, coordinates });
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
    return () => { resizeObserver.disconnect(); map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── In-canvas swipe: second MapLibre canvas (t1) clipped right of the divider ── */
  useEffect(() => {
    const primary = mapRef.current;
    if (!swipe || !primary || !swipeElement.current) {
      if (swipeMapRef.current) { swipeMapRef.current.remove(); swipeMapRef.current = null; }
      return;
    }
    if (!swipeMapRef.current) {
      const secondary = new maplibregl.Map({
        container: swipeElement.current,
        style: baseStyle(),
        center: primary.getCenter(), zoom: primary.getZoom(),
        bearing: primary.getBearing(), pitch: primary.getPitch(),
        interactive: false, attributionControl: false, fadeDuration: 0,
      });
      swipeMapRef.current = secondary;
      secondary.on('load', () => {
        try {
          secondary.addSource('swipe-radar', { type: 'image', url: `${base}/img/radar_${swipe.t1}.png`, coordinates });
          secondary.addLayer({ id: 'swipe-radar-layer', type: 'raster', source: 'swipe-radar', paint: { 'raster-opacity': 0.97, 'raster-contrast': 0.14 } });
        } catch (error) { console.error('Unable to initialize swipe map', error); }
      });
      const sync = () => secondary.jumpTo({ center: primary.getCenter(), zoom: primary.getZoom(), bearing: primary.getBearing(), pitch: primary.getPitch() });
      primary.on('move', sync);
      sync();
      return () => { primary.off('move', sync); };
    }
    const source = swipeMapRef.current.getSource('swipe-radar') as ImageSource | undefined;
    if (source) source.updateImage({ url: `${base}/img/radar_${swipe.t1}.png`, coordinates });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipeActive, swipe?.t1, base]);

  /* ── Site markers (HTML markers — the desk style has no glyph source) ── */
  const markersKey = JSON.stringify((siteMarkers ?? []).map((m) => [m.id, m.active]));
  useEffect(() => {
    const map = mapRef.current;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (!map || !siteMarkers?.length) return;
    for (const site of siteMarkers) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `dd-site-marker${site.active ? ' is-active' : ''}`;
      el.textContent = site.label;
      el.setAttribute('aria-label', `Open ${site.id}`);
      el.addEventListener('click', () => selectSiteRef.current?.(site.id));
      markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat(site.centroid).addTo(map));
    }
    return () => { markersRef.current.forEach((m) => m.remove()); markersRef.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersKey]);

  useEffect(() => {
    const map = mapRef.current; if (!map?.isStyleLoaded()) return;
    const source = map.getSource('nisar-radar') as ImageSource | undefined;
    if (source && radarDate) source.updateImage({ url: `${base}/img/radar_${radarDate}.png`, coordinates });
    const water = map.getSource('nisar-water') as ImageSource | undefined;
    if (water && selectedDate) water.updateImage({ url: `${base}/img/water_${selectedDate}.png`, coordinates });
  }, [radarDate, selectedDate, base, coordinates]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (map.getLayer('nisar-radar-layer')) map.setPaintProperty('nisar-radar-layer', 'raster-opacity', showRadar ? 0.97 : 0);
    if (map.getLayer('nisar-water-layer')) map.setPaintProperty('nisar-water-layer', 'raster-opacity', showWater ? 0.9 : 0);
    if (map.getLayer('opera-dswx-layer')) map.setLayoutProperty('opera-dswx-layer', 'visibility', showOpera ? 'visible' : 'none');
  }, [showRadar, showWater, showOpera]);

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

  const dragRef = useRef(false);
  const handleSwipeDown = (e: ReactPointerEvent) => {
    dragRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleSwipeMove = (e: ReactPointerEvent) => {
    if (!dragRef.current || !wrapElement.current || !swipe) return;
    const rect = wrapElement.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    swipe.onPositionChange(Math.max(3, Math.min(97, pct)));
  };
  const handleSwipeUp = (e: ReactPointerEvent) => {
    dragRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="dd-map-wrap" ref={wrapElement}>
      <div className="decision-map" ref={element} aria-label="NISAR radar map — Jamuna Chilmari reach" />
      {swipe && (
        <>
          <div
            ref={swipeElement}
            className="decision-map decision-map-swipe"
            style={{ clipPath: `inset(0 0 0 ${swipe.position}%)` }}
            aria-hidden="true"
          />
          <span className="dd-swipe-tag is-t0" style={{ left: `${Math.max(swipe.position - 2, 1)}%` }}>t0 · {swipe.t0}</span>
          <span className="dd-swipe-tag is-t1" style={{ left: `${Math.min(swipe.position + 2, 82)}%` }}>t1 · {swipe.t1}</span>
          <div
            className="dd-swipe-handle"
            role="slider"
            aria-label="Swipe between the two NISAR dates"
            aria-valuenow={Math.round(swipe.position)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            style={{ left: `${swipe.position}%` }}
            onPointerDown={handleSwipeDown}
            onPointerMove={handleSwipeMove}
            onPointerUp={handleSwipeUp}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') swipe.onPositionChange(Math.max(3, swipe.position - 4));
              if (e.key === 'ArrowRight') swipe.onPositionChange(Math.min(97, swipe.position + 4));
            }}
          >
            <span className="dd-swipe-grip">⇆</span>
          </div>
        </>
      )}
    </div>
  );
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
