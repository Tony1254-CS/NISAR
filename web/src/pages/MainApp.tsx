import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { useDeepLink } from '../state/useDeepLink';
import { MapStage } from '../map/MapStage';
import { Hydrograph } from '../hydrograph/Hydrograph';
import { StoryPanel } from '../panels/StoryPanel';
import { EvidencePanel } from '../panels/EvidencePanel';
import { QCPanel } from '../panels/QCPanel';
import { TopBar } from '../TopBar';
import { Loading } from '../states/Loading';
import { ErrorState } from '../states/ErrorState';
import { fetchReaches, loadReachBundle, DataLoadError } from '../data/load';
import type { ReachListItem } from '../data/types';

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

export default function MainApp() {
  const { reachId, selectedFeatureId, panel, setReachId, loadBundle } = useStore();
  const [reaches, setReaches] = useState<ReachListItem[] | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorFile, setErrorFile] = useState('reaches.json');
  const [retryToken, setRetryToken] = useState(0);

  useDeepLink();

  // Bootstrap: load the reach catalog once, then default to the first reach
  // unless a deep link already selected one (Section 20.1/21.1 Empty state).
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchReaches()
      .then((list) => {
        if (cancelled) return;
        setReaches(list);
        const deepLinkedReach = useStore.getState().reachId;
        if (deepLinkedReach) {
          // A deep link (Section 20.1) may point at a reach not yet in the
          // picker list; let the per-reach fetch below decide if it exists.
          return;
        }
        if (list.length === 0) {
          setStatus('empty');
          return;
        }
        setReachId(list[0].reach_id);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setErrorFile('reaches.json');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken, setReachId]);

  useEffect(() => {
    if (!reachId) return;
    let cancelled = false;
    setStatus('loading');
    loadReachBundle(reachId)
      .then((bundle) => {
        if (cancelled) return;
        loadBundle(reachId, bundle);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setErrorFile(err instanceof DataLoadError ? err.message : 'bundle');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reachId, retryToken, loadBundle]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar reaches={reaches} />
      <div style={{ flex: 1, position: 'relative' }}>
        {status === 'loading' && <Loading />}
        {status === 'empty' && (
          <div style={{ padding: 'var(--s6)', color: 'var(--text-2)' }}>
            No processed reach in this bundle.{' '}
            <a href="/methods" style={{ color: 'var(--water)' }}>
              See Methods / how to reproduce
            </a>
          </div>
        )}
        {status === 'error' && (
          <ErrorState filename={errorFile} onRetry={() => setRetryToken((t) => t + 1)} />
        )}
        {status === 'ready' && (
          <>
            <MapStage />
            <StoryPanel />
            {selectedFeatureId && <EvidencePanel />}
            {panel === 'qc' && <QCPanel />}
          </>
        )}
      </div>
      <div style={{ height: 150 }}>
        {status === 'ready' ? (
          <Hydrograph width={window.innerWidth} height={150} />
        ) : (
          <div className="hydrograph-skeleton" style={{ height: '100%', background: 'var(--bg)' }} />
        )}
      </div>
    </div>
  );
}
