import React, { useEffect, useState } from 'react';
import { useStore } from './state/store';
import { useDeepLink } from './state/useDeepLink';
import { MapStage } from './map/MapStage';
import { Hydrograph } from './hydrograph/Hydrograph';
import { StoryPanel } from './panels/StoryPanel';
import { EvidencePanel } from './panels/EvidencePanel';
import { QCPanel } from './panels/QCPanel';

export default function App() {
  const { reachId, selectedFeatureId, panel } = useStore();
  const [loading, setLoading] = useState(false);

  useDeepLink();

  useEffect(() => {
    if (!reachId) return;
    setLoading(true);
    const baseUrl = `/data/v1/${reachId}`;
    
    Promise.all([
      fetch(`${baseUrl}/reach.json`).then(r => r.json()),
      fetch(`${baseUrl}/manifest.json`).then(r => r.json()),
      fetch(`${baseUrl}/stage.json`).then(r => r.json()),
      fetch(`${baseUrl}/qc.json`).then(r => r.json()).catch(() => null) // Optional
    ]).then(([reach, manifest, stage, qc]) => {
      useStore.setState({ reach, manifest, stage, qc });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [reachId]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <MapStage />
        {loading && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 1000, color: 'var(--text)', background: 'var(--panel)', padding: 'var(--s4)', borderRadius: 'var(--r)'
          }}>
            Loading {reachId}...
          </div>
        )}
        {reachId && !loading && <StoryPanel />}
        {selectedFeatureId && !loading && <EvidencePanel />}
        {panel === 'qc' && !loading && <QCPanel />}
      </div>
      <div style={{ height: 150 }}>
        {reachId && !loading ? <Hydrograph width={window.innerWidth} height={150} /> : <div style={{height: '100%', background: 'var(--bg)'}}></div>}
      </div>
    </div>
  );
}
