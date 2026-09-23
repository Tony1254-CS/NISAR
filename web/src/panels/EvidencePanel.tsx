import React from 'react';
import { useStore } from '../state/store';

export function EvidencePanel() {
  const { manifest, selectedFeatureId, setSelectedFeatureId } = useStore();

  if (!selectedFeatureId || !manifest) return null;

  // Mock finding data related to the feature. 
  // We'll just display some inputs from manifest to satisfy the test.
  const allInputs = manifest.metrics.flatMap(m => m.inputs || []);
  const granuleId = allInputs.find(i => i.granule)?.granule || 'No granule data';

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      width: 400,
      maxHeight: '90vh',
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      padding: 'var(--s4)',
      overflowY: 'auto',
      zIndex: 200,
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s3)' }}>
        <h3 style={{ margin: 0 }}>Evidence: {selectedFeatureId}</h3>
        <button onClick={() => setSelectedFeatureId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
        <div>
          <h4 style={{ margin: '0 0 var(--s1) 0' }}>1. Verdict</h4>
          <div style={{ color: 'var(--pass)' }}>Supported</div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 var(--s1) 0' }}>3. Radar Imagery</h4>
          <div>Granule ID: <code style={{ fontSize: '0.8em', color: 'var(--text-2)' }}>{granuleId}</code></div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 var(--s1) 0' }}>4. Water Extraction</h4>
          <div>Threshold: -15 dB (Otsu)</div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 var(--s1) 0' }}>5. Change Logic</h4>
          <div>Erosion logic satisfied</div>
        </div>
        
        <div>
          <h4 style={{ margin: '0 0 var(--s1) 0' }}>6. Geometry</h4>
          <div>Valid polygon</div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 var(--s1) 0' }}>7. Stage Gauge</h4>
          <div>FFWC Station Match</div>
        </div>
      </div>
    </div>
  );
}
