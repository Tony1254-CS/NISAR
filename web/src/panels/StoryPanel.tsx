import { Headline } from './Headline';
import { VerdictBadge } from './VerdictBadge';
import { LayerToggles } from './LayerToggles';
import { TelemetryPanel } from './TelemetryPanel';
import { useStore } from '../state/store';

export function StoryPanel() {
  const { reach } = useStore();

  if (!reach) return null;

  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      width: 400,
      bottom: 0,
      background: 'var(--panel)',
      borderRight: '1px solid var(--line)',
      padding: 'var(--s6)',
      overflowY: 'auto',
      zIndex: 100
    }}>
      <VerdictBadge />
      <h1 style={{ marginTop: 0 }}>{reach.river} / {reach.name}</h1>
      <Headline />
      
      <h3 style={{ borderBottom: '1px solid var(--line)', paddingBottom: 'var(--s2)' }}>Map Layers</h3>
      <LayerToggles />

      <div style={{ marginTop: '32px' }}>
        <TelemetryPanel />
      </div>
    </div>
  );
}
