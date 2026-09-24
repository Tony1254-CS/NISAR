import { useEffect, useState } from 'react';
import { fetchReaches, DataLoadError } from '../data/load';
import type { ReachListItem } from '../data/types';

const VERDICT_COLOR: Record<string, string> = {
  SUPPORTED: 'var(--pass)',
  LIMITED: 'var(--warn)',
  INCONCLUSIVE: 'var(--fail)',
};

export function CasesPage() {
  const [reaches, setReaches] = useState<ReachListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReaches()
      .then(setReaches)
      .catch((e) => setError(e instanceof DataLoadError ? e.message : 'failed to load'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-text)' }}>
      <header
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--s4) var(--s6)', borderBottom: '1px solid var(--line)',
        }}
      >
        <a href="/" style={{ color: 'var(--text)', textDecoration: 'none' }}>
          <strong style={{ letterSpacing: '0.04em' }}>SAME RIVER TWICE</strong>
        </a>
        <a href="/methods" style={{ color: 'var(--text-2)', textDecoration: 'none', fontSize: '0.9rem' }}>
          Methods
        </a>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--s6) var(--s4)' }}>
        <h1 style={{ margin: '0 0 var(--s1)' }}>Investigations</h1>
        <p style={{ color: 'var(--text-2)', margin: '0 0 var(--s5)' }}>
          Every case below is a real river reach with a processed NISAR bundle behind it. Pick one to
          open its full Detect → Investigate → Challenge → Explain trail.
        </p>

        {error && <p style={{ color: 'var(--fail)' }}>Couldn't load the case list: {error}</p>}
        {!reaches && !error && <p style={{ color: 'var(--text-3)' }}>Loading cases…</p>}
        {reaches && reaches.length === 0 && <p style={{ color: 'var(--text-3)' }}>No processed cases yet.</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
          {reaches?.map((r) => {
            const color = VERDICT_COLOR[r.verdict] ?? 'var(--text-3)';
            return (
              <a
                key={r.reach_id}
                href={`/app?reach=${r.reach_id}`}
                style={{
                  display: 'block', textDecoration: 'none', color: 'var(--text)',
                  background: 'var(--panel)', border: '1px solid var(--line)', borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--r)', padding: 'var(--s4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-num)', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    {r.reach_id}
                  </span>
                  <span style={{ color, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {r.verdict}
                  </span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{r.river} — {r.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 4 }}>
                  bbox {r.bbox.map((n) => n.toFixed(2)).join(', ')} · processed {r.data_frozen_at}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
