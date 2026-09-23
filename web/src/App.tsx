import React, { useEffect } from 'react';
import { useStore } from './state/store';
import { useDeepLink } from './state/useDeepLink';
import { MapStage } from './map/MapStage';
import { Hydrograph } from './hydrograph/Hydrograph';
import { StoryPanel } from './panels/StoryPanel';
import { EvidencePanel } from './panels/EvidencePanel';
import { QCPanel } from './panels/QCPanel';

export default function App() {
  const { reachId, selectedFeatureId, panel } = useStore();

  useDeepLink();

  // If there's no reach loaded, we could show a welcome screen
  // But we have load.ts that we are supposed to call.
  // Wait, the data loading is handled outside or in App.tsx?
  
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <MapStage />
        {reachId && <StoryPanel />}
        {selectedFeatureId && <EvidencePanel />}
        {panel === 'qc' && <QCPanel />}
      </div>
      <div style={{ height: 150 }}>
        <Hydrograph width={window.innerWidth} height={150} />
      </div>
    </div>
  );
}
