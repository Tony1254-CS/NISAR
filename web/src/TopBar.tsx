import { useStore } from './state/store';
import type { ReachListItem } from './data/types';

export function TopBar({ reaches }: { reaches: ReachListItem[] | null }) {
  const { reachId, setReachId, reach } = useStore();
  const current = reaches?.find((r) => r.reach_id === reachId) ?? null;

  return (
    <div
      style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--s4)',
        borderBottom: '1px solid var(--line)',
        background: 'var(--panel)',
        color: 'var(--text)',
        fontSize: '0.85rem',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
        <a href="/" style={{ color: 'var(--text)', textDecoration: 'none' }}>
          <strong style={{ letterSpacing: '0.02em' }}>SAME RIVER TWICE</strong>
        </a>
        <a href="/cases" style={{ color: 'var(--text-2)', textDecoration: 'none', fontSize: '0.8rem' }}>
          &larr; all investigations
        </a>
        {reaches && reaches.length > 0 && (
          <select
            aria-label="Reach"
            value={reachId ?? ''}
            onChange={(e) => setReachId(e.target.value)}
            style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--line-strong)',
              borderRadius: 'var(--r)',
              padding: '2px 6px',
            }}
          >
            {reaches.map((r) => (
              <option key={r.reach_id} value={r.reach_id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', color: 'var(--text-2)' }}>
        {reach && (
          <span title="Data freshness">
            NISAR data through {reach.dates.length > 0 ? reach.dates[reach.dates.length - 1].date : '—'}
            {current ? ` · processed ${current.data_frozen_at}` : ''}
          </span>
        )}
        <a href="/methods" style={{ color: 'var(--text)' }}>
          Methods
        </a>
      </div>
    </div>
  );
}
