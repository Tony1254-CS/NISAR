import React from 'react';
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
      <p style={{ margin: 0, color: 'var(--text-2)' }}>{metric.label}</p>
    </div>
  );
}
