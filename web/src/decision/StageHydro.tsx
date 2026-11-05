import { useMemo } from 'react';
import type { Stage } from '../data/types';

// Stage hydrograph built ONLY from the bundle's stage.json series (stage source:
// "proxy (imagery-derived)", fraction units — the bundle contains no gauge metres
// and no discharge series). Both NISAR acquisition dates are pinned on the curve.
// The redesign brief's discharge context figures are shown as a separate, stamped
// context strip — they are NOT plotted as bundle data.
export function StageHydro({ stage, t0Label, t1Label }: { stage: Stage; t0Label: string; t1Label: string }) {
  const W = 860;
  const H = 190;
  const M = { top: 26, right: 24, bottom: 30, left: 64 };
  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;

  const { points, minH, maxH } = useMemo(() => {
    const pts = stage.series.map((p) => ({ t: new Date(p.t).valueOf(), h: p.h, iso: p.t }));
    const hs = pts.map((p) => p.h);
    const lo = Math.min(...hs);
    const hi = Math.max(...hs);
    const pad = Math.max((hi - lo) * 0.6, 0.01);
    return { points: pts, minH: lo - pad, maxH: hi + pad };
  }, [stage]);

  if (points.length === 0) return null;
  const tMin = points[0].t;
  const tMax = points[points.length - 1].t;
  const x = (t: number) => (tMax === tMin ? iw / 2 : ((t - tMin) / (tMax - tMin)) * iw);
  const y = (h: number) => ih - ((h - minH) / (maxH - minH)) * ih;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.h).toFixed(1)}`).join(' ');

  return (
    <figure className="dd-hydro" aria-label="Stage record for the NISAR pair">
      <figcaption className="dd-hydro-head">
        <span className="dd-hydro-title">STAGE RECORD · THE CONFOUND, ON THE MAP’S OWN DATA</span>
        <span className="dd-stamp is-derived">DERIVED · bundle stage.json · proxy (imagery-derived), no gauge</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="dd-hydro-svg" role="img" aria-label={`Stage proxy at the two passes: ${points.map((p) => p.h.toFixed(3)).join(' to ')}`}>
        <g transform={`translate(${M.left},${M.top})`}>
          {[minH, (minH + maxH) / 2, maxH].map((v) => (
            <g key={v} transform={`translate(0,${y(v)})`}>
              <line x2={iw} className="dd-hydro-grid" />
              <text x={-8} dy="0.32em" textAnchor="end" className="dd-hydro-axis">{v.toFixed(3)}</text>
            </g>
          ))}
          <path d={path} className="dd-hydro-line" fill="none" />
          {points.map((p, i) => (
            <g key={p.iso} transform={`translate(${x(p.t)},${y(p.h)})`}>
              <line y1={-14} y2={ih - y(p.h) + 6} className="dd-hydro-pin" />
              <circle r={5} className="dd-hydro-dot" />
              <text y={-20} textAnchor="middle" className="dd-hydro-pinlabel">
                {i === 0 ? `NISAR t0 · ${t0Label}` : `NISAR t1 · ${t1Label}`}
              </text>
              <text y={ih - y(p.h) + 22} textAnchor="middle" className="dd-hydro-axis">
                proxy {p.h.toFixed(3)}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <p className="dd-hydro-note">
        Only two acquisitions exist in this bundle, so the “curve” is the honest segment between them —
        no invented daily series. The pair is typed <strong>later/lower</strong> in the reach record with
        Δstage <strong>+0.039 proxy fraction</strong>: the stage signal cannot be separated cleanly from land
        change in this window, which is exactly why the verdict is stage-confounded.
      </p>
      <p className="dd-hydro-context">
        <span className="dd-stamp is-context">CONTEXT · NOT IN BUNDLE</span>
        Redesign-brief context figures for the Jamuna at this pair — discharge ≈ 35,236 → 11,994 m³/s —
        are not present in this bundle’s stage.json and are not plotted above. Treat them as brief context
        until a gauge/GloFAS series is wired into the bundle.
      </p>
    </figure>
  );
}
