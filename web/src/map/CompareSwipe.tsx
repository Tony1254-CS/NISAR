import React, { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../state/store';
import { layers, sources } from './layers';

export function CompareSwipe({ primaryMap }: { primaryMap: maplibregl.Map | null }) {
  const { compare } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const secondaryMapRef = useRef<maplibregl.Map | null>(null);
  const [position, setPosition] = useState(50); // 0 to 100
  const isDragging = useRef(false);

  useEffect(() => {
    if (!compare.active || !containerRef.current || !primaryMap) return;

    if (!secondaryMapRef.current) {
      secondaryMapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: primaryMap.getCenter(),
        zoom: primaryMap.getZoom(),
        interactive: false,
        attributionControl: false
      });

      secondaryMapRef.current.on('load', () => {
        const map = secondaryMapRef.current!;
        map.addSource('gibs', sources.gibs);
        ['radar-source', 'water-source', 'change-source', 'accretion-source', 'erosion-source', 'cegis-source', 'aoi-source'].forEach(id => {
           map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }});
        });
        layers.forEach(layer => map.addLayer(layer as maplibregl.LayerSpecification));
      });
    }

    const primary = primaryMap;
    const secondary = secondaryMapRef.current;

    const syncMaps = () => {
      secondary.jumpTo({
        center: primary.getCenter(),
        zoom: primary.getZoom(),
        bearing: primary.getBearing(),
        pitch: primary.getPitch(),
      });
    };

    primary.on('move', syncMaps);
    syncMaps();

    return () => {
      primary.off('move', syncMaps);
      if (secondaryMapRef.current) {
        secondaryMapRef.current.remove();
        secondaryMapRef.current = null;
      }
    };
  }, [compare.active, primaryMap]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newPos = ((e.clientX - rect.left) / rect.width) * 100;
    newPos = Math.max(0, Math.min(100, newPos));
    setPosition(newPos);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPosition(p => Math.max(0, p - 5));
    if (e.key === 'ArrowRight') setPosition(p => Math.min(100, p + 5));
  }, []);

  if (!compare.active) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {/* Secondary Map Container */}
      <div 
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          clipPath: `inset(0 0 0 ${position}%)`,
          pointerEvents: 'none'
        }}
      />

      {/* Swipe handle */}
      <div
        role="slider"
        aria-valuenow={position}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${position}%`,
          width: 4,
          marginLeft: -2,
          background: 'var(--line-strong)',
          cursor: 'col-resize',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none'
        }}
      >
        <div style={{
          width: 24,
          height: 48,
          background: 'var(--panel)',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--r)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly'
        }}>
          <div style={{ width: 1, height: 16, background: 'var(--text-3)' }} />
          <div style={{ width: 1, height: 16, background: 'var(--text-3)' }} />
        </div>
      </div>
      
      {/* Date Stamps */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'var(--bg)', padding: '4px 8px', color: 'var(--text)', zIndex: 10 }}>
        {compare.t0}
      </div>
      <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'var(--bg)', padding: '4px 8px', color: 'var(--text)', zIndex: 10 }}>
        {compare.t1}
      </div>
    </div>
  );
}
