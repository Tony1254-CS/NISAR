import React from 'react';
import { useStore } from '../state/store';

export function LayerToggles() {
  const { layers, setLayers } = useStore();

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers({ [layer]: !layers[layer] });
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--s2)', marginBottom: 'var(--s4)', flexWrap: 'wrap' }}>
      {(['water', 'accretion', 'erosion', 'ambiguous', 'forecast'] as const).map(layer => (
        <button
          key={layer}
          onClick={() => toggleLayer(layer)}
          style={{
            background: layers[layer] ? 'var(--line)' : 'transparent',
            border: '1px solid var(--line-strong)',
            color: 'var(--text)',
            padding: '4px 12px',
            borderRadius: 'var(--r)',
            cursor: 'pointer',
            textTransform: 'capitalize'
          }}
        >
          {layer}
        </button>
      ))}
    </div>
  );
}
