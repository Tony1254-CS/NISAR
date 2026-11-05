import { useMemo } from 'react';
import type { Stage } from '../data/types';

// The stage story is the hero evidence of the Decision Desk: the pair's verdict is
// INCONCLUSIVE because the two epochs are not stage-matched. This panel plots ONLY
// what the bundle's stage.json contains — two acquisition-time proxy values
// (imagery-derived fraction, NOT gauge metres; the bundle holds no gauge series and
// no discharge series). The ±0.02 band is the bundle's own stage_match QC rule
// (PASS if |h1−h0| ≤ 0.02 proxy fraction): t1 falls outside it, which is the WARN.
// The FFWC block below it uses only figures verified from FFWC's own published
// forecast file (see research record 2026-11-05) and is dated context, never
// pair-date stage — pair-date FFWC values are not in this bundle.
export function StageHydro({ stage, t0Label, t1Label }: { stage: Stage; t0Label: string; t1Label: string }) {
  const W = 860;
  const H = 210;
  const M = { top: 30, right: 30, bottom: 34, left: 64 };
  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;

  const model = useMemo(() => {
    const pts = stage.series.map((p) => ({ t: new Date(p.t).valueOf(), h: p.h, iso: p.t }));
    if (!pts.length) return null;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const nextPassT = last.t + 12 * 86400000; // NISAR exact 12-day repeat — DERIVED
    const hs = pts.map((p) => p.h);
    const lo = Math.min(...hs, first.h - 0.02);
    const hi = Math.max(...hs, first.h + 0.02);
    const pad = Math.max((hi - lo) * 0.55, 0.008);
    return { pts, first, last, nextPassT, minH: lo - pad, maxH: hi + pad, tMin: first.t, tMax: nextPassT };
  }, [stage]);

  if (!model) return null;
  const { pts, first, last, nextPassT, minH, maxH, tMin, tMax } = model;
  const x = (t: number) => ((t - tMin) / Math.max(tMax - tMin, 1)) * iw;
  const y = (h: number) => ih - ((h - minH) / (maxH - minH)) * ih;
  const fmt = (t: number) => new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(t));
  const dh = last.h - first.h;

  return (
    <figure className="dd-hydro" aria-label="Stage record for the NISAR pair">
      <figcaption className="dd-hydro-head">
        <span className="dd-hydro-title">STAGE AT THE TWO PASSES · WHY THIS PAIR CANNOT BE CALLED EROSION</span>
        <span className="dd-stamp is-derived">DERIVED · bundle stage.json · proxy (imagery-derived), no gauge</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="dd-hydro-svg" role="img"
        aria-label={`Stage proxy ${first.h.toFixed(3)} at t0 and ${last.h.toFixed(3)} at t1; t1 is outside the plus-minus 0.02 stage-match tolerance.`}>
        <g transform={`translate(${M.left},${M.top})`}>
          {/* stage-match tolerance band around t0 (±0.02, the bundle's own QC rule) */}
          <rect x={0} width={iw} y={y(first.h + 0.02)} height={Math.max(y(first.h - 0.02) - y(first.h + 0.02), 1)} className="dd-hydro-band" />
          <text x={iw - 4} y={y(first.h + 0.02) - 5} textAnchor="end" className="dd-hydro-axis">
            stage-match tolerance ±0.02 (bundle QC rule)
          </text>
          {[minH, (minH + maxH) / 2, maxH].map((v) => (
            <g key={v} transform={`translate(0,${y(v)})`}>
              <line x2={iw} className="dd-hydro-grid" />
              <text x={-8} dy="0.32em" textAnchor="end" className="dd-hydro-axis">{v.toFixed(3)}</text>
            </g>
          ))}
          {/* the honest segment: two observations, nothing between */}
          <line x1={x(first.t)} y1={y(first.h)} x2={x(last.t)} y2={y(last.h)} className="dd-hydro-segment" />
          <text x={(x(first.t) + x(last.t)) / 2} y={Math.min(y(first.h), y(last.h)) - 10} textAnchor="middle" className="dd-hydro-axis">
            no observations between passes
          </text>
          {pts.map((p, i) => (
            <g key={p.iso} transform={`translate(${x(p.t)},${y(p.h)})`}>
              <line y1={-12} y2={ih - y(p.h) + 4} className="dd-hydro-pin" />
              <circle r={5.5} className="dd-hydro-dot" />
              <text y={-18} textAnchor="middle" className="dd-hydro-pinlabel">
                {i === 0 ? `NISAR t0 · ${t0Label}` : `NISAR t1 · ${t1Label}`}
              </text>
              <text y={ih - y(p.h) + 24} textAnchor="middle" className="dd-hydro-axis">proxy {p.h.toFixed(3)}</text>
            </g>
          ))}
          {/* next pass: the designed tie-breaker */}
          <g transform={`translate(${x(nextPassT)},0)`}>
            <line y1={10} y2={ih} className="dd-hydro-nextline" />
            <text y={ih + 24} textAnchor="middle" className="dd-hydro-axis">next pass · {fmt(nextPassT)}</text>
            <text y={22} textAnchor="middle" className="dd-hydro-pinlabel">PERSISTENCE TEST</text>
          </g>
        </g>
      </svg>
      <p className="dd-hydro-note">
        The reach record types this pair <strong>later/lower</strong>. Between the passes the stage proxy moved
        <strong> Δ {dh >= 0 ? '+' : ''}{dh.toFixed(3)}</strong> — outside the ±0.02 stage-match tolerance, so the bundle’s own
        stage_match gate is <strong>WARN</strong>: water-level difference between epochs cannot be separated from land
        change in this window. Rule enforced across this desk: <strong>while stage moved between epochs, mapped
        land→water switches are called transition candidates — never “erosion.”</strong> Falling water exposes the
        river’s own bars; only persistence at comparable stage can tell emergence from bank loss.
      </p>
      <div className="dd-ffwc">
        <div className="dd-ffwc-head">
          <span>FFWC GAUGE CONTEXT · CHILMARI STATION</span>
          <span className="dd-stamp is-context">CONTEXT · FFWC published bulletin · not in bundle</span>
        </div>
        <p>
          FFWC lists this gauge as <strong>Chilmari — Brahmaputra</strong>: the same river is called the
          <strong> Jamuna</strong> downstream in Bangladesh, so this is the gauge for this reach.
          Danger Level <strong>23.25 mMSL</strong>. FFWC’s published 3 &amp; 5-day deterministic forecast file dated
          <strong> 14 Oct 2026</strong> records the station at <strong>20.29 mMSL and falling</strong> (forecast 20.14 → 19.72 mMSL
          over the following 24–120 h). That bulletin <em>postdates</em> the NISAR pair — it documents the station and its
          falling regime, it is <strong>not</strong> pair-date stage. Pair-date FFWC values are not in this bundle and are
          shown here as <strong>UNAVAILABLE</strong>, not reconstructed. Source: FFWC forecast file via api.ffwc.gov.bd;
          FFWC gauge readings carry ≈ ±10 cm precision (FFWC definitions).
        </p>
        <p className="dd-hydro-context">
          <span className="dd-stamp is-context">CONTEXT · NOT IN BUNDLE</span>
          Brief context figures for the Jamuna at this pair — discharge ≈ 35,236 → 11,994 m³/s — are not present in
          this bundle’s stage.json and are not plotted above. Treat them as brief context until a gauge/GloFAS series
          is wired into the bundle.
        </p>
      </div>
    </figure>
  );
}
