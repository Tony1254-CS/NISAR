import { Headline } from './Headline';
import { VerdictBadge } from './VerdictBadge';
import { LayerToggles } from './LayerToggles';
import { TelemetryPanel } from './TelemetryPanel';
import { useStore } from '../state/store';

export function StoryPanel() {
  const { reach } = useStore();

  if (!reach) return null;

  return (
    <div className="story-panel">
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
