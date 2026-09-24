import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { fetchQC } from '../data/load';
import type { QC } from '../data/types';

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
  'DISCOVER — find candidate NISAR GCOV granules for the reach/time window',
  'FETCH — stream and AOI-clip only the layers needed (HHHH, mask, geometry)',
  'VALIDATE RAW — reject broken, partial, or wrong-geometry granules',
  'PREPROCESS — nodata mask → dB conversion → light speckle filter',
  'WATER — tile-based Otsu thresholding with bimodality check, per date',
  'STAGE — interpolate gauge height to each acquisition time (or proxy fallback)',
  'PAIRS — select an equal-stage (or later-lower) before/after pair',
  'CHANGE — classify erosion / accretion / seasonal / ambiguous, with persistence',
  'VALIDATE SCIENCE — cross-sensor agreement, null test, sensitivity, alignment',
  'RENDER — reproject rasters to EPSG:3857 PNGs for the map',
  'MANIFEST — attach provenance (granule IDs, params) to every displayed number',
  'CHECK BUNDLE — refuse to ship a bundle that fails schema or consistency checks',
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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--s6) var(--s4)', color: 'var(--text)' }}>
      <p>
        <a href="/" style={{ color: 'var(--water)' }}>
          ← Back to the map
        </a>
      </p>
      <h1>Methods</h1>
      <p style={{ color: 'var(--text-2)' }}>
        SAME RIVER TWICE compares NISAR L-band radar of the Jamuna at the same river height before and after
        the monsoon peak, so that what changed is land the river took — not a temporary flood.
      </p>

      <h2>Pipeline</h2>
      <ol>
        {PIPELINE_STEPS.map((s) => (
          <li key={s} style={{ marginBottom: 'var(--s1)' }}>
            {s}
          </li>
        ))}
      </ol>

      <h2>Data sources</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
            <th style={{ padding: 'var(--s2) 0' }}>Dataset</th>
            <th>Role</th>
            <th>Provider</th>
            <th>DOI</th>
          </tr>
        </thead>
        <tbody>
          {SOURCES.map((s) => (
            <tr key={s.name} style={{ borderBottom: '1px solid var(--line)' }}>
              <td style={{ padding: 'var(--s2) 0' }}>{s.name}</td>
              <td style={{ color: 'var(--text-2)' }}>{s.role}</td>
              <td style={{ color: 'var(--text-2)' }}>{s.provider}</td>
              <td style={{ fontFamily: 'var(--font-num)', color: 'var(--text-3)' }}>{s.doi}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Erosion definition</h2>
      <p style={{ color: 'var(--text-2)' }}>
        A pixel is classified <strong>erosion</strong> if it was land at t0, water at t1, the river stage at t1
        was within 0.15 m of (or lower than) t0, and it stays water at every later valid pass. This controls for
        temporary flooding by requiring the comparison to happen at matched river height, and requires
        persistence so a single noisy pass cannot manufacture a result.
      </p>

      {manifest && (
        <>
          <h2>Parameters used for this reach</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <tbody>
              {manifest.metrics
                .filter((m) => m.params)
                .flatMap((m) =>
                  Object.entries(m.params ?? {}).map(([k, v]) => (
                    <tr key={`${m.id}-${k}`} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: 'var(--s1) 0', color: 'var(--text-2)' }}>{k}</td>
                      <td style={{ fontFamily: 'var(--font-num)' }}>{String(v)}</td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </>
      )}

      {qc && (
        <>
          <h2>Quality checks for this reach</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <tbody>
              {qc.checks.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: 'var(--s1) 0' }}>{c.label ?? c.id}</td>
                  <td style={{ fontFamily: 'var(--font-num)' }}>
                    {c.value !== undefined && c.value !== null ? `${c.value} ${c.unit ?? ''}` : '—'}
                  </td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>What we don't claim</h2>
      <ul>
        <li>Causes of erosion.</li>
        <li>Number of people displaced (we may quote CEGIS's own figures with attribution only).</li>
        <li>"Accuracy" — we have no ground truth; we report cross-sensor agreement.</li>
        <li>Flood forecasts.</li>
      </ul>

      <h2>Limitations</h2>
      <ul>
        <li>Otsu thresholding on SAR backscatter can be confused by wind-roughened water, emergent vegetation, or very narrow channels.</li>
        <li>Stage matching depends on a nearby gauge reading within 24 hours; where unavailable, a stage proxy from imagery is used instead (labeled in the UI).</li>
        <li>NISAR PROVISIONAL products may carry residual RFI or incomplete-raw-data artifacts; affected dates are flagged and excluded from pairing.</li>
      </ul>

      <h2>Reproduce this</h2>
      <pre
        style={{
          background: 'var(--map-bg)',
          border: '1px solid var(--line)',
          padding: 'var(--s3)',
          overflowX: 'auto',
          fontFamily: 'var(--font-num)',
          fontSize: '0.85rem',
        }}
      >{`mamba env create -f environment.yml && conda activate srt
cd web && npm ci && cd ..
cp .env.example .env   # fill EARTHDATA_USERNAME / EARTHDATA_PASSWORD
make reproduce REACH=<reach_id>`}</pre>

      <h2>Credits</h2>
      <p style={{ color: 'var(--text-2)' }}>
        Built for an independent NASA Space Apps-style submission. Pipeline and UI code assisted by AI coding
        tools (Claude Code); every scientific number shown in the app resolves to <code>manifest.json</code>,
        generated by the offline pipeline from the sources listed above — no number in this app is hand-typed.
      </p>
    </div>
  );
}
