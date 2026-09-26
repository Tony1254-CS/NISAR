import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { fetchQC } from '../data/load';
import type { QC } from '../data/types';
import { Navbar } from '../components/Navbar';

const SOURCES: { name: string; role: string; doi: string; provider: string }[] = [
  {
    name: 'NISAR L2 GCOV PROVISIONAL V1',
    role: 'Primary measurement — calibrated γ⁰ radar backscatter per pass',
    doi: '10.5067/NIL2GCOV-P1',
    provider: 'NASA/JPL NISAR, via ASF DAAC',
  },
  {
    name: 'OPERA L3 DSWx-S1 V1',
    role: 'Independent validation — Sentinel-1 water extent, different sensor and wavelength',
    doi: '10.5067/OPDSWS1-L3V1',
    provider: 'NASA JPL OPERA, via PO.DAAC',
  },
  {
    name: 'ASF GLO-30 HAND',
    role: 'Terrain mask — excludes water classifications on high ground',
    doi: 'CC0, no DOI',
    provider: 'Alaska Satellite Facility',
  },
  {
    name: 'JRC Global Surface Water — occurrence',
    role: 'Reference — defines stable-land zone for the null test',
    doi: 'n/a',
    provider: 'EC Joint Research Centre',
  },
  {
    name: 'FFWC river stage',
    role: 'Scientific control — river height at each acquisition',
    doi: 'n/a',
    provider: 'Flood Forecasting and Warning Centre, BWDB',
  },
];

const PIPELINE_STEPS = [
  { label: 'DISCOVER', desc: 'Find candidate NISAR GCOV granules for the reach/time window' },
  { label: 'FETCH', desc: 'Stream and AOI-clip only the layers needed (HHHH, mask, geometry)' },
  { label: 'VALIDATE RAW', desc: 'Reject broken, partial, or wrong-geometry granules' },
  { label: 'PREPROCESS', desc: 'Nodata mask → dB conversion → light speckle filter' },
  { label: 'WATER', desc: 'Tile-based Otsu thresholding with bimodality check, per date' },
  { label: 'STAGE', desc: 'Interpolate gauge height to each acquisition time (or proxy fallback)' },
  { label: 'PAIRS', desc: 'Select an equal-stage (or later-lower) before/after pair' },
  { label: 'CHANGE', desc: 'Classify erosion / accretion / seasonal / ambiguous, with persistence' },
  { label: 'VALIDATE SCIENCE', desc: 'Cross-sensor agreement, null test, sensitivity, alignment' },
  { label: 'RENDER', desc: 'Reproject rasters to EPSG:3857 PNGs for the map' },
  { label: 'MANIFEST', desc: 'Attach provenance (granule IDs, params) to every displayed number' },
  { label: 'CHECK BUNDLE', desc: 'Refuse to ship a bundle that fails schema or consistency checks' },
];

export function MethodsPage() {
  const { manifest, reach } = useStore();
  const [qc, setQc] = useState<QC | null>(null);

  useEffect(() => {
    if (reach?.reach_id) {
      fetchQC(`/data/v1/${reach.reach_id}`).then(setQc).catch(() => setQc(null));
    }
  }, [reach?.reach_id]);

  return (
    <div className="page-container">
      <Navbar />
      <div className="navbar-spacer" />

      <div className="page-content page-content--narrow">
        <a href="/" style={{ fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← Back to home
        </a>

        <h1 style={{ marginTop: 'var(--s4)', marginBottom: 'var(--s3)' }}>Methods</h1>
        <p>
          SAME RIVER TWICE compares NISAR L-band radar of the Jamuna at the same river height before and after
          the monsoon peak, so that what changed is land the river took — not a temporary flood.
        </p>

        {/* ── Pipeline ── */}
        <div className="section-label" style={{ marginTop: 'var(--s6)' }}>Processing Pipeline</div>
        <h2 style={{ marginBottom: 'var(--s3)' }}>12-Step Analysis Pipeline</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {PIPELINE_STEPS.map((step, i) => (
            <div
              key={`${step.label}-${i}`}
              style={{
                display: 'flex',
                gap: 'var(--s3)',
                padding: 'var(--s3) 0',
                borderBottom: '1px solid var(--line)',
                alignItems: 'flex-start',
              }}
            >
              <span
                className="mono"
                style={{
                  flex: '0 0 28px',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--water)',
                  fontWeight: 600,
                  paddingTop: 2,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{step.label}</span>
                <span style={{ color: 'var(--text-3)', marginLeft: 'var(--s2)' }}>— {step.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Data Sources ── */}
        <div className="section-label" style={{ marginTop: 'var(--s6)' }}>Data Sources</div>
        <h2 style={{ marginBottom: 'var(--s3)' }}>Inputs</h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--line)' }}>
                <th style={{ padding: 'var(--s2) 0', color: 'var(--text-2)' }}>Dataset</th>
                <th style={{ color: 'var(--text-2)' }}>Role</th>
                <th style={{ color: 'var(--text-2)' }}>Provider</th>
                <th style={{ color: 'var(--text-2)' }}>DOI</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.name} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: 'var(--s2) var(--s2) var(--s2) 0', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ color: 'var(--text-2)' }}>{s.role}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{s.provider}</td>
                  <td>
                    {s.doi.startsWith('10.') ? (
                      <a
                        href={`https://doi.org/${s.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mono"
                        style={{ fontSize: 'var(--text-xs)' }}
                      >
                        {s.doi}
                      </a>
                    ) : (
                      <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>
                        {s.doi}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Erosion Definition ── */}
        <div className="section-label" style={{ marginTop: 'var(--s6)' }}>Methodology</div>
        <h2 style={{ marginBottom: 'var(--s3)' }}>Erosion Definition</h2>
        <div
          style={{
            borderLeft: '2px solid var(--water)',
            paddingLeft: 'var(--s4)',
            color: 'var(--text-2)',
          }}
        >
          A pixel is classified <strong style={{ color: 'var(--text)' }}>erosion</strong> if it was
          land at t0, water at t1, the river stage at t1 was within 0.15 m of (or lower than) t0,
          and it stays water at every later valid pass. This controls for temporary flooding by
          requiring the comparison to happen at matched river height, and requires persistence so a
          single noisy pass cannot manufacture a result.
        </div>

        {/* ── Parameters ── */}
        {manifest && (
          <>
            <div className="section-label" style={{ marginTop: 'var(--s6)' }}>Configuration</div>
            <h2 style={{ marginBottom: 'var(--s3)' }}>Parameters Used</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <tbody>
                {manifest.metrics
                  .filter((m) => m.params)
                  .flatMap((m) =>
                    Object.entries(m.params ?? {}).map(([k, v]) => (
                      <tr key={`${m.id}-${k}`} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td className="mono" style={{ padding: 'var(--s2) 0', color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{k}</td>
                        <td className="mono" style={{ fontWeight: 500 }}>{String(v)}</td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </>
        )}

        {/* ── QC Checks ── */}
        {qc && (
          <>
            <div className="section-label" style={{ marginTop: 'var(--s6)' }}>Quality Control</div>
            <h2 style={{ marginBottom: 'var(--s3)' }}>Checks</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <tbody>
                {qc.checks.map((c) => {
                  const statusColor =
                    c.status === 'PASS' || c.status === 'INFO'
                      ? 'var(--pass)'
                      : c.status === 'WARN'
                        ? 'var(--warn)'
                        : c.status === 'FAIL'
                          ? 'var(--fail)'
                          : 'var(--text-3)';
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: 'var(--s2) 0' }}>{c.label ?? c.id}</td>
                      <td className="mono" style={{ fontSize: 'var(--text-xs)' }}>
                        {c.value !== undefined && c.value !== null ? `${c.value} ${c.unit ?? ''}` : '—'}
                      </td>
                      <td style={{ color: statusColor, fontWeight: 600, fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>
                        {c.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {/* ── Limitations ── */}
        <div className="section-label" style={{ marginTop: 'var(--s6)' }}>Limitations</div>
        <h2 style={{ marginBottom: 'var(--s3)' }}>What We Don&apos;t Claim</h2>
        <ul style={{ paddingLeft: 'var(--s5)', color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>
          <li style={{ marginBottom: 'var(--s2)' }}>Causes of erosion.</li>
          <li style={{ marginBottom: 'var(--s2)' }}>Number of people displaced (we may quote CEGIS&apos;s own figures with attribution only).</li>
          <li style={{ marginBottom: 'var(--s2)' }}>&quot;Accuracy&quot; — we have no ground truth; we report cross-sensor agreement.</li>
          <li style={{ marginBottom: 'var(--s2)' }}>Flood forecasts.</li>
        </ul>

        <h2 style={{ marginTop: 'var(--s5)', marginBottom: 'var(--s3)' }}>Known Limitations</h2>
        <ul style={{ paddingLeft: 'var(--s5)', color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>
          <li style={{ marginBottom: 'var(--s2)' }}>Otsu thresholding on SAR backscatter can be confused by wind-roughened water, emergent vegetation, or very narrow channels.</li>
          <li style={{ marginBottom: 'var(--s2)' }}>Stage matching depends on a nearby gauge reading within 24 hours; where unavailable, a stage proxy from imagery is used instead (labeled in the UI).</li>
          <li style={{ marginBottom: 'var(--s2)' }}>NISAR PROVISIONAL products may carry residual RFI or incomplete-raw-data artifacts; affected dates are flagged and excluded from pairing.</li>
        </ul>

        {/* ── Reproduce ── */}
        <div className="section-label" style={{ marginTop: 'var(--s6)' }}>Reproducibility</div>
        <h2 style={{ marginBottom: 'var(--s3)' }}>Reproduce This</h2>
        <pre
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            padding: 'var(--s4)',
            overflowX: 'auto',
            fontFamily: 'var(--font-num)',
            fontSize: 'var(--text-sm)',
            borderRadius: 'var(--r-md)',
            lineHeight: 1.7,
          }}
        >{`mamba env create -f environment.yml && conda activate srt
cd web && npm ci && cd ..
cp .env.example .env   # fill EARTHDATA_USERNAME / EARTHDATA_PASSWORD
make reproduce REACH=<reach_id>`}</pre>

        {/* ── Credits ── */}
        <div className="section-label" style={{ marginTop: 'var(--s6)' }}>Credits</div>
        <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--s8)' }}>
          Built for an independent NASA Space Apps-style submission. Pipeline and UI code assisted by AI coding
          tools (Claude Code); every scientific number shown in the app resolves to <code>manifest.json</code>,
          generated by the offline pipeline from the sources listed above — no number in this app is hand-typed.
        </p>
      </div>
    </div>
  );
}
