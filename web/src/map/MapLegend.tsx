import { useStore } from '../state/store';

export function MapLegend() {
  const { compare, layers } = useStore();

  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      right: '24px',
      background: 'var(--panel)',
      padding: 'var(--s3)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r)'
    }}>
      <h4 style={{ marginBottom: 'var(--s2)' }}>Legend</h4>
      
      {!compare.active ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: 'linear-gradient(90deg, #000, #fff)', border: '1px solid var(--line)' }}></span>
            <span>Radar: water looks dark, land looks bright.</span>
          </div>
          {layers.water && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginTop: 'var(--s1)' }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--water)', opacity: 0.55 }}></span>
              <span>Water</span>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--erosion)' }}></span>
            <span>Land lost to water (Erosion)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginTop: 'var(--s1)' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--accretion)' }}></span>
            <span>Water turned to land (Accretion)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginTop: 'var(--s1)' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--ambiguous)', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)' }}></span>
            <span>Ambiguous / excluded</span>
          </div>
        </>
      )}
      
      {layers.forecast && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginTop: 'var(--s1)' }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, borderTop: '2px dashed var(--forecast)' }}></span>
          <span>CEGIS 2026 forecast</span>
        </div>
      )}
    </div>
  );
}
