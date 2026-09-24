import { useStore } from '../state/store';

export function LayerToggles() {
  const { layers, setLayers } = useStore();

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers({ [layer]: !layers[layer] });
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--s2)', marginBottom: 'var(--s4)', flexWrap: 'wrap' }}>
      {/* 'forecast' (CEGIS outlines) is SHOULD-tier and stays hidden until
          real forecast data ships (Section 1.5, P10.2). */}
      {(['water', 'accretion', 'erosion', 'ambiguous'] as const).map(layer => {
        const active = layers[layer];
        return (
          <button
            key={layer}
            onClick={() => toggleLayer(layer)}
            aria-pressed={active}
            style={{
              background: active ? 'var(--water)' : 'transparent',
              border: active ? '1px solid var(--water)' : '1px solid var(--line-strong)',
              color: active ? '#04222b' : 'var(--text)',
              fontWeight: active ? 700 : 400,
              padding: '4px 12px',
              borderRadius: 'var(--r)',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {active ? '✓ ' : ''}{layer}
          </button>
        );
      })}
    </div>
  );
}
