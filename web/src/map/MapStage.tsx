import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../state/store';
import {
  addStaticSources,
  ensureReachLayers,
  updateRadarWaterImage,
  setWaterVisible,
  setChangeLayersVisible,
  ensureAmbiguousLayer,
  setTerrainEnabled,
} from './bundleLayers';
import { FlyIn } from './FlyIn';
import { OutsideCoverage } from '../states/OutsideCoverage';
import { MapLegend } from './MapLegend';
import { CompareSwipe } from './CompareSwipe';

export function MapStage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isOutside, setIsOutside] = useState(false);
  const [terrainOn, setTerrainOn] = useState(false);
  const flownRef = useRef(false);
  const reachLayersReadyRef = useRef(false);
  const displayedDateRef = useRef<string | null>(null);

  const { reachId, reach, bounds, selectedDate, compare, layers } = useStore();

  // Mount the map once.
  useEffect(() => {
    if (mapContainer.current && !mapRef.current) {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [89.7, 24.5],
        zoom: 6,
      });
      mapRef.current = map;

      map.on('load', () => {
        addStaticSources(map);
        setMapInstance(map);
        setMapLoaded(true);
      });

      map.on('move', () => {
        const bbox = useStore.getState().reach?.bbox;
        if (!bbox) return;
        const center = map.getCenter();
        const [w, s, e, n] = bbox;
        const pad = 0.045; // ~5km
        const outside = center.lng < w - pad || center.lng > e + pad || center.lat < s - pad || center.lat > n + pad;
        setIsOutside(outside);
      });
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly in once, as soon as we know the reach's AOI.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !reach || flownRef.current) return;
    flownRef.current = true;
    new FlyIn(map, reach.bbox as [number, number, number, number]).start();
  }, [mapLoaded, reach]);

  // Add per-reach sources/layers once bounds + an initial date are known.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !reach || !bounds || !selectedDate) return;
    const baseUrl = `/data/v1/${reachId}`;

    if (!reachLayersReadyRef.current) {
      ensureReachLayers(map, { baseUrl, bounds, bbox: reach.bbox, initialDate: selectedDate });
      reachLayersReadyRef.current = true;
      displayedDateRef.current = selectedDate;

      const interactiveLayers = ['layer-8-erosion', 'layer-7-accretion'];
      
      interactiveLayers.forEach(layerId => {
        map.on('click', layerId, (e) => {
          const f = e.features?.[0];
          if (f) useStore.getState().setSelectedFeatureId(String(f.properties?.id));
        });
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });
    }
  }, [mapLoaded, reach, bounds, selectedDate, reachId]);

  // Reset per-reach layer state when the reach changes.
  useEffect(() => {
    reachLayersReadyRef.current = false;
    flownRef.current = false;
    displayedDateRef.current = null;
  }, [reachId]);

  // Radar/water image swaps: browse mode shows selectedDate; compare mode
  // shows t0 on the primary (left) map (Section 21.1 interaction table).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !reachId || !reachLayersReadyRef.current) return;
    const date = compare.active && compare.t0 ? compare.t0 : selectedDate;
    if (!date || date === displayedDateRef.current) return;
    displayedDateRef.current = date;
    updateRadarWaterImage(map, `/data/v1/${reachId}`, date);
  }, [mapLoaded, reachId, selectedDate, compare.active, compare.t0]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    setWaterVisible(map, layers.water);
  }, [mapLoaded, layers.water]);

  // Change layers (erosion/accretion/ambiguous): only meaningful in compare
  // mode, and each also gated by its own LayerToggles state.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !reachLayersReadyRef.current || !bounds || !reachId) return;
    if (compare.active && compare.t0 && compare.t1) {
      ensureAmbiguousLayer(map, { baseUrl: `/data/v1/${reachId}`, bounds, t0: compare.t0, t1: compare.t1 });
    }
    setChangeLayersVisible(map, {
      erosion: compare.active && layers.erosion,
      accretion: compare.active && layers.accretion,
      ambiguous: compare.active && layers.ambiguous,
    });
  }, [mapLoaded, compare.active, compare.t0, compare.t1, bounds, reachId, layers.erosion, layers.accretion, layers.ambiguous]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <CompareSwipe primaryMap={mapInstance} />
      {isOutside && (
        <OutsideCoverage
          onFlyBack={() => {
            if (reach) mapRef.current?.fitBounds(reach.bbox as [number, number, number, number], { padding: 20 });
          }}
        />
      )}
      {mapLoaded && (
        <button
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            const next = !terrainOn;
            setTerrainOn(next);
            setTerrainEnabled(map, next);
          }}
          title="Terrain relief is a presentation layer (public elevation tiles) -- not a scientific measurement"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 50,
            background: terrainOn ? 'var(--water)' : 'var(--panel)',
            color: terrainOn ? '#04222b' : 'var(--text)',
            border: '1px solid var(--line-strong)', borderRadius: 'var(--r)',
            padding: '5px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: terrainOn ? 700 : 400,
          }}
        >
          {terrainOn ? '✓ 3D relief' : '3D relief'}
        </button>
      )}
      <MapLegend />
    </div>
  );
}
