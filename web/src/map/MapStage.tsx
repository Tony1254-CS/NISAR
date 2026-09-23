import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { layers, sources } from './layers';
import { FlyIn } from './FlyIn';

export function MapStage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (mapContainer.current && !mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/positron', // Neutral vector basemap (Layer 3)
        center: [89.7, 24.5], // Jamuna approx
        zoom: 6,
        attributionControl: true
      });

      mapRef.current.on('load', () => {
        const map = mapRef.current!;
        
        // Add sources
        map.addSource('gibs', sources.gibs);
        
        // Add dummy sources for missing dynamic ones just to satisfy layers
        ['radar-source', 'water-source', 'change-source', 'accretion-source', 'erosion-source', 'cegis-source', 'aoi-source'].forEach(id => {
           map.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }});
        });

        // Add layers in order, before labels if they exist
        layers.forEach(layer => {
          map.addLayer(layer as maplibregl.LayerSpecification);
        });

        // Hardcode approx Jamuna bounds for now until we load reach data
        const bounds: [number, number, number, number] = [89.60, 24.25, 89.90, 25.75];
        const flyIn = new FlyIn(map, bounds);
        flyIn.start();
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}
