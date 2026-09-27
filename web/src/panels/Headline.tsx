import { useStore } from '../state/store';

export function Headline() {
  const { reach, manifest } = useStore();

  if (!reach || !manifest) return null;

  const metricId = reach.headline_metric_id;
  const metric = manifest.metrics.find(m => m.id === metricId);

  if (!metric) return <div>No headline data</div>;

  return (
    <div style={{ marginBottom: 'var(--s4)' }}>
      <h2 style={{ margin: 0, fontSize: '3rem', color: 'var(--erosion)' }}>
        {metric.value.toLocaleString()} {metric.unit}
      </h2>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--fail)', padding: '6px 12px', borderRadius: '4px', marginTop: '8px', boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fail)" strokeWidth="2" style={{ animation: 'pulse-dot 1.5s infinite' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        <p style={{ margin: 0, color: 'var(--fail)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{metric.label}</p>
      </div>
    </div>
  );
}
