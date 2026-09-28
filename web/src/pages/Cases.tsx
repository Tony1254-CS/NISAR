import { useEffect, useState } from 'react';
import { fetchReaches, DataLoadError } from '../data/load';
import type { ReachListItem } from '../data/types';
import { Navbar } from '../components/Navbar';
import '../styles/globe.css';

/* ── Location metadata for the world map ── */
const LOCATION_META: Record<string, {
  icon: string;
  changeType: string;
  changeClass: string;
  region: string;
  description: string;
  mapX: number; // % from left on equirectangular projection
  mapY: number; // % from top
}> = {
  'jamuna-chilmari': {
    icon: '🏞️',
    changeType: 'River Erosion',
    changeClass: 'erosion',
    region: 'South Asia',
    description: 'Monsoon-driven bank migration on the Jamuna — detected through clouds using L-band SAR.',
    mapX: 74.9, mapY: 28.5,
  },
  'glacier-bay-alaska': {
    icon: '🏔️',
    changeType: 'Glacier Retreat',
    changeClass: 'glacier',
    region: 'North America',
    description: 'Glacier terminus retreat measured by radar coherence loss at the calving front.',
    mapX: 12.2, mapY: 17.0,
  },
  'norcal-wildfire': {
    icon: '🔥',
    changeType: 'Wildfire Burn Scar',
    changeClass: 'wildfire',
    region: 'North America',
    description: 'Forest canopy destruction mapped via SAR backscatter decrease in burned areas.',
    mapX: 16.2, mapY: 27.8,
  },
  'sundarbans-mangrove': {
    icon: '🌿',
    changeType: 'Wetland Loss',
    changeClass: 'wetland',
    region: 'South Asia',
    description: 'Mangrove degradation along the Passur River estuary tracked through tidal-adjusted SAR.',
    mapX: 74.7, mapY: 32.0,
  },
};

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

  const activeReaches = reaches?.filter(r => r.reach_id !== 'dummy') ?? [];

  return (
    <div className="page-container">
      <Navbar />
      <div className="navbar-spacer" />

      {/* ════ Hero ════ */}
      <section className="globe-hero">
        <div className="globe-hero__badge">
          <span className="globe-hero__badge-dot" />
          GLOBAL SURFACE CHANGE MONITORING · NISAR L-BAND SAR
        </div>
        <h1>
          <span>Monitoring Earth's Surface</span><br />
          Across the Globe
        </h1>
        <p className="globe-hero__subtitle">
          Four active investigations spanning three continents — tracking river erosion,
          glacier retreat, wildfire burn scars, and mangrove loss using NASA's NISAR radar
          that sees through clouds, darkness, and weather.
        </p>

        {/* Stats */}
        <div className="globe-stats">
          <div className="globe-stat">
            <div className="globe-stat__value">{activeReaches.length || 4}</div>
            <div className="globe-stat__label">Active Sites</div>
          </div>
          <div className="globe-stat">
            <div className="globe-stat__value">4</div>
            <div className="globe-stat__label">Change Types</div>
          </div>
          <div className="globe-stat">
            <div className="globe-stat__value">3</div>
            <div className="globe-stat__label">Continents</div>
          </div>
          <div className="globe-stat">
            <div className="globe-stat__value">12</div>
            <div className="globe-stat__label">Pipeline Steps</div>
          </div>
        </div>
      </section>

      {/* ════ World Map ════ */}
      <div className="world-map">
        <div className="world-map__container">
          {/* SVG World Map — simplified equirectangular */}
          <svg className="world-map__svg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            <g className="world-map__grid">
              {/* Latitude lines */}
              {[100, 150, 200, 250, 300, 350, 400].map(y => (
                <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} />
              ))}
              {/* Longitude lines */}
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(x => (
                <line key={`lng-${x}`} x1={x} y1="0" x2={x} y2="500" />
              ))}
            </g>

            {/* Simplified continent outlines */}
            <g className="world-map__land">
              {/* North America */}
              <path d="M80,80 L200,60 L260,80 L280,120 L290,160 L270,200 L230,220 L200,240 L160,260 L140,240 L120,200 L100,180 L80,140 Z" />
              {/* South America */}
              <path d="M200,260 L240,250 L260,280 L280,320 L290,380 L270,420 L240,440 L210,420 L190,380 L180,320 L190,280 Z" />
              {/* Europe */}
              <path d="M460,80 L520,70 L560,90 L540,120 L520,140 L500,130 L480,140 L460,120 L440,100 Z" />
              {/* Africa */}
              <path d="M460,160 L520,150 L560,180 L570,240 L560,300 L540,360 L510,380 L480,360 L460,300 L450,240 L440,200 Z" />
              {/* Asia */}
              <path d="M560,60 L650,50 L740,60 L800,80 L840,120 L830,160 L800,180 L760,200 L720,180 L680,200 L650,180 L620,160 L580,140 L560,100 Z" />
              {/* South/Southeast Asia */}
              <path d="M680,200 L720,190 L760,210 L770,240 L750,260 L720,250 L700,260 L690,240 L680,220 Z" />
              {/* Australia */}
              <path d="M780,320 L840,310 L880,330 L890,370 L870,400 L830,410 L790,390 L780,360 Z" />
            </g>

            {/* Connection lines from pins */}
            {activeReaches.map(r => {
              const meta = LOCATION_META[r.reach_id];
              if (!meta) return null;
              const cx = meta.mapX * 10;
              const cy = meta.mapY * 10;
              return (
                <g key={`conn-${r.reach_id}`}>
                  <circle cx={cx} cy={cy} r="4" fill={VERDICT_COLOR[r.verdict] ?? '#6F7880'} opacity="0.9">
                    <animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={cx} cy={cy} r="3" fill={VERDICT_COLOR[r.verdict] ?? '#6F7880'} />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ════ Error State ════ */}
      {error && (
        <div className="page-content" style={{ textAlign: 'center' }}>
          <div className="card" style={{ borderColor: 'var(--fail)', color: 'var(--fail)' }}>
            Couldn&apos;t load investigations: {error}
          </div>
        </div>
      )}

      {/* ════ Loading State ════ */}
      {!reaches && !error && (
        <div className="page-content" style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <span className="mono">Loading global investigations…</span>
        </div>
      )}

      {/* ════ Case Study Cards ════ */}
      <div className="cases-grid">
        {activeReaches.map((r, i) => {
          const meta = LOCATION_META[r.reach_id];
          const color = VERDICT_COLOR[r.verdict] ?? 'var(--text-3)';
          const icon = VERDICT_ICON[r.verdict] ?? '·';
          const verdictClass = r.verdict.toLowerCase();

          return (
            <a
              key={r.reach_id}
              href={`/app?reach=${r.reach_id}`}
              className={`case-card case-card--${verdictClass}`}
              style={{ animationDelay: `${0.1 * i}s`, animation: `fade-in-up 0.5s var(--ease-out) ${0.1 * i}s both` }}
            >
              {/* Change type badge */}
              <div className="case-card__type">
                <span className="case-card__type-icon">{meta?.icon ?? '📡'}</span>
                {meta?.changeType ?? 'Surface Change'} · {meta?.region ?? 'Global'}
              </div>

              {/* Title */}
              <div className="case-card__title">
                {r.name}
              </div>

              {/* Location */}
              <div className="case-card__location">
                {r.river}
                {meta && ` — ${meta.description}`}
              </div>

              {/* Verdict */}
              <div className="case-card__verdict" style={{ color, borderColor: color }}>
                {icon} {r.verdict}
              </div>

              {/* Change type tag */}
              {meta && (
                <span className={`change-type-badge change-type-badge--${meta.changeClass}`}>
                  {meta.changeType}
                </span>
              )}

              {/* Metadata */}
              <div className="case-card__meta">
                <span>📡 NISAR L-band</span>
                <span>📍 {r.bbox.map(n => n.toFixed(1)).join(', ')}</span>
                <span>🕐 {r.data_frozen_at.split('T')[0]}</span>
              </div>

              {/* CTA */}
              <div className="case-card__cta">
                Open Investigation <span>→</span>
              </div>
            </a>
          );
        })}
      </div>

      {/* ════ Info Footer ════ */}
      <div className="cases-footer">
        <div className="cases-footer__info">
          <span className="cases-footer__icon">🔬</span>
          <div>
            <strong style={{ color: 'var(--text)' }}>How verdicts work:</strong> Each site runs through our 12-step
            analysis pipeline. The system actively tries to break its own findings — if any quality check fails
            (threshold sensitivity, plausibility, insufficient acquisitions), the verdict reflects it honestly:{' '}
            <span style={{ color: 'var(--pass)', fontWeight: 600 }}>SUPPORTED</span>,{' '}
            <span style={{ color: 'var(--warn)', fontWeight: 600 }}>LIMITED</span>, or{' '}
            <span style={{ color: 'var(--fail)', fontWeight: 600 }}>INCONCLUSIVE</span>.
            <em> Our system was designed to be honest, not impressive.</em>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer" style={{ marginTop: 'var(--s4)' }}>
        Same River Twice · NASA Space Apps Challenge 2026 · Dancing with the SARs ·{' '}
        <a href="/methods">Full Methods</a> ·{' '}
        <a href="https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar" target="_blank" rel="noopener noreferrer">
          NASA SAR Reference
        </a>
      </footer>
    </div>
  );
}
