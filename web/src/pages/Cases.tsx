import { useEffect, useState } from 'react';
import { fetchReaches, DataLoadError } from '../data/load';
import type { ReachListItem } from '../data/types';
import { Navbar } from '../components/Navbar';

const VERDICT_COLOR: Record<string, string> = {
  SUPPORTED: 'var(--pass)',
  LIMITED: 'var(--warn)',
  INCONCLUSIVE: 'var(--fail)',
};

const VERDICT_ICON: Record<string, string> = {
  SUPPORTED: '✓',
  LIMITED: '~',
  INCONCLUSIVE: '?',
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
    <div className="page-container">
      <Navbar />
      <div className="navbar-spacer" />

      <div className="page-content" style={{ maxWidth: 860 }}>
        <div className="section-label" style={{ marginTop: 'var(--s4)' }}>
          Investigation Hub
        </div>
        <h1 style={{ marginBottom: 'var(--s2)' }}>Active Investigations</h1>
        <p style={{ maxWidth: 620 }}>
          Each case below is a real river reach with a processed NISAR bundle behind it. Select
          one to open its full{' '}
          <span style={{ color: 'var(--water)', fontWeight: 600 }}>
            Detect → Investigate → Challenge → Explain → Field
          </span>{' '}
          evidence trail.
        </p>

        {error && (
          <div
            className="card"
            style={{ borderColor: 'var(--fail)', color: 'var(--fail)', marginTop: 'var(--s4)' }}
          >
            Couldn&apos;t load the case list: {error}
          </div>
        )}

        {!reaches && !error && (
          <div style={{ color: 'var(--text-3)', padding: 'var(--s5) 0' }}>
            <span className="mono">Loading investigations…</span>
          </div>
        )}

        {reaches && reaches.length === 0 && (
          <div style={{ color: 'var(--text-3)', padding: 'var(--s5) 0' }}>
            No processed cases yet.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)', marginTop: 'var(--s5)' }}>
          {reaches?.map((r) => {
            const color = VERDICT_COLOR[r.verdict] ?? 'var(--text-3)';
            const icon = VERDICT_ICON[r.verdict] ?? '·';

            return (
              <a
                key={r.reach_id}
                href={`/app?reach=${r.reach_id}`}
                className="card"
                style={{
                  textDecoration: 'none',
                  color: 'var(--text)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 'var(--s4)',
                  borderLeft: `3px solid ${color}`,
                }}
              >
                {/* Left content */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginBottom: 'var(--s2)' }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-3)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {r.reach_id}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color,
                        padding: '2px 8px',
                        border: `1px solid ${color}`,
                        borderRadius: 'var(--r-full)',
                      }}
                    >
                      {icon} {r.verdict}
                    </span>
                  </div>

                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--s2)' }}>
                    {r.river} — {r.name}
                  </div>

                  {/* Observation metadata */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--s3)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-num)',
                    }}
                  >
                    <span>📡 NISAR L-band</span>
                    <span>📍 {r.bbox.map((n) => n.toFixed(2)).join(', ')}</span>
                    <span>🕐 {r.data_frozen_at.split('T')[0]}</span>
                  </div>
                </div>

                {/* Right: CTA arrow */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-3)',
                    fontSize: 'var(--text-lg)',
                  }}
                >
                  →
                </div>
              </a>
            );
          })}
        </div>

        {/* Pipeline explanation */}
        <div
          style={{
            marginTop: 'var(--s6)',
            padding: 'var(--s4)',
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--line)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-3)',
          }}
        >
          <strong style={{ color: 'var(--text-2)' }}>How verdicts work:</strong> Each reach runs
          through our 12-step analysis pipeline. If any quality check fails —
          threshold sensitivity, plausibility, insufficient acquisitions — the verdict reflects it
          honestly: <span style={{ color: 'var(--pass)' }}>SUPPORTED</span>,{' '}
          <span style={{ color: 'var(--warn)' }}>LIMITED</span>, or{' '}
          <span style={{ color: 'var(--fail)' }}>INCONCLUSIVE</span>.
        </div>
      </div>
    </div>
  );
}
