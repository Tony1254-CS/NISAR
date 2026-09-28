import { Navbar } from '../components/Navbar';
import '../styles/landing.css';

/* ─── Real pipeline steps from our run_reach.py ─── */
const PIPELINE_STEPS = [
  { label: 'Discover', desc: 'Find NISAR GCOV granules' },
  { label: 'Fetch', desc: 'Stream & AOI-clip' },
  { label: 'Validate', desc: 'Reject broken granules' },
  { label: 'Preprocess', desc: 'dB conversion & filter' },
  { label: 'Water', desc: 'Otsu thresholding' },
  { label: 'Stage', desc: 'Gauge height matching' },
  { label: 'Pairs', desc: 'Equal-stage pairing' },
  { label: 'Change', desc: 'Erosion / accretion' },
  { label: 'Validate', desc: 'Cross-sensor QC' },
  { label: 'Render', desc: 'Map-ready PNGs' },
  { label: 'Manifest', desc: 'Provenance chain' },
  { label: 'Check', desc: 'Bundle integrity' },
];

/* ─── Evidence trail stages — these are our real tabs ─── */
const EVIDENCE_STAGES = [
  {
    num: '01',
    title: 'Detect',
    desc: 'NISAR L-band radar measures the surface. Water reflects the signal away — dark pixels. Land scatters it back — bright pixels. The threshold between them is computed, not guessed.',
  },
  {
    num: '02',
    title: 'Investigate',
    desc: 'Cross-check the radar finding against independent sources: OPERA DSWx-S1, river stage data, GPM IMERG rainfall, and temporal persistence. Not all pass — that matters.',
  },
  {
    num: '03',
    title: 'Challenge',
    desc: 'Actively try to break the finding. Threshold sensitivity, RFI interference, scene alignment, order-of-magnitude plausibility. If a check fails, the verdict says so.',
  },
  {
    num: '04',
    title: 'Explain',
    desc: 'A template-generated summary from the actual data bundle — dates, areas, confidence ranges, verdict reasons. No language model wrote it; every number traces to manifest.json.',
  },
  {
    num: '05',
    title: 'Field',
    desc: 'Connect the satellite observation to the ground. Check your GPS proximity to the investigation footprint, log field notes, photograph evidence — all on-device, nothing uploaded.',
  },
];

/* ─── SAR concept cards — only concepts our project actually uses ─── */
const SAR_CONCEPTS = [
  {
    icon: '📡',
    title: 'Active Sensing',
    body: 'SAR sends its own microwave pulse and measures the return signal. Unlike optical sensors, it works through clouds, at night, and during monsoon — exactly when river change happens.',
  },
  {
    icon: '〰️',
    title: 'L-Band Radar (~24 cm)',
    body: 'NISAR transmits at L-band: a ~24 cm wavelength that penetrates vegetation canopy and interacts with the ground surface. This lets us see through trees to the water edge beneath.',
  },
  {
    icon: '⬛',
    title: 'Backscatter & Water',
    body: 'Open water acts like a mirror, reflecting the radar pulse away — appearing dark (low σ⁰). Land and vegetation scatter the signal back to the sensor — appearing bright. This contrast is our detection principle.',
  },
  {
    icon: '🔄',
    title: 'Change Detection',
    body: 'By comparing two radar passes at the same river height, we isolate real bank migration from temporary flooding. A pixel that was land and became water, at matched stage — that is our signal.',
  },
];

/* ─── Data sources used in our project ─── */
const DATA_SOURCES = [
  {
    badge: '🛰️',
    name: 'NISAR L2 GCOV Provisional V1',
    role: 'Primary measurement — calibrated γ⁰ backscatter per pass',
    doi: '10.5067/NIL2GCOV-P1',
  },
  {
    badge: '🌊',
    name: 'OPERA L3 DSWx-S1 V1',
    role: 'Independent validation — Sentinel-1 water extent, different wavelength',
    doi: '10.5067/OPDSWS1-L3V1',
  },
  {
    badge: '🌧️',
    name: 'GPM IMERG Daily',
    role: 'Rainfall context — precipitation anomaly check',
    doi: '10.5067/GPM/IMERGDL/DAY/07',
  },
  {
    badge: '⛰️',
    name: 'ASF GLO-30 HAND',
    role: 'Terrain mask — excludes water on high ground',
    doi: null,
  },
  {
    badge: '🌍',
    name: 'NASA GIBS Blue Marble',
    role: 'Satellite basemap tiles via WMTS',
    doi: null,
  },
  {
    badge: '📊',
    name: 'FFWC River Stage',
    role: 'Scientific control — river height at each acquisition',
    doi: null,
  },
];

export function Landing() {
  return (
    <div className="page-container">
      <Navbar transparent />

      {/* ════ Hero ════ */}
      <section className="landing-hero">
        <div
          className="landing-hero__bg"
          aria-hidden
          style={{ backgroundImage: 'url(/data/v1/jamuna-chilmari/img/radar_20260919.png)' }}
        />
        <div className="landing-hero__sweep" aria-hidden />
        <div className="landing-hero__grid" aria-hidden />

        <div className="landing-hero__content">
          <div className="landing-hero__tag">
            <span className="landing-hero__tag-dot" />
            NASA NISAR &middot; L-BAND SAR &middot; JAMUNA RIVER, BANGLADESH
          </div>

          <h1>
            Prove the river moved.
            <br />
            <span>Don&rsquo;t just claim it.</span>
          </h1>

          <p className="landing-hero__subtitle">
            Same River Twice compares real NISAR satellite radar of the same stretch of the
            Jamuna on two dates — and shows exactly where land turned to water and water turned
            to land, with the evidence chain to back every claim.
          </p>

          <div className="landing-hero__actions">
            <a href="/cases" className="landing-hero__cta landing-hero__cta--primary">
              Begin Investigation →
            </a>
            <a href="/methods" className="landing-hero__cta landing-hero__cta--secondary">
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* ════ SAR Concepts ════ */}
      <section className="sar-intro">
        <div className="section-label">How SAR Works</div>
        <h2>Synthetic Aperture Radar for Earth Observation</h2>
        <p style={{ maxWidth: 640, marginTop: 'var(--s2)' }}>
          SAR is an active microwave remote sensing technology. Unlike optical cameras, it
          provides its own illumination — enabling observation regardless of time of day, cloud
          cover, or weather conditions.{' '}
          <a
            href="https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            Learn more on NASA Earthdata →
          </a>
        </p>

        <div className="sar-intro__grid">
          {SAR_CONCEPTS.map((c) => (
            <div key={c.title} className="sar-card">
              <span className="sar-card__icon">{c.icon}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* ════ Pipeline ════ */}
      <section className="pipeline-section">
        <div className="section-label">Processing Pipeline</div>
        <h2>12-Step Analysis Pipeline</h2>
        <p style={{ maxWidth: 640, marginTop: 'var(--s2)' }}>
          Every number on this site passes through twelve offline processing steps — from raw
          NISAR granule to verified, bundled result. No step is skipped, and no number is hand-typed.
        </p>

        <div className="pipeline-flow">
          {PIPELINE_STEPS.map((step, i) => (
            <div className="pipeline-step" key={`${step.label}-${i}`}>
              <div className="pipeline-node">
                <span className="pipeline-node__label">{step.label}</span>
                <span className="pipeline-node__desc">{step.desc}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && <span className="pipeline-arrow">→</span>}
            </div>
          ))}
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* ════ Evidence Trail ════ */}
      <section className="evidence-trail">
        <div className="section-label">Evidence Trail</div>
        <h2>Five-Stage Verification</h2>
        <p style={{ maxWidth: 640, marginTop: 'var(--s2)' }}>
          Every investigation follows the same five-step trail: detect the change, investigate
          with independent sources, challenge the finding, explain the result, connect to the field.
        </p>

        <div className="evidence-trail__flow">
          {EVIDENCE_STAGES.map((s) => (
            <div key={s.num} className="evidence-trail__step">
              <span className="evidence-trail__step-num">STEP {s.num}</span>
              <span className="evidence-trail__step-title">{s.title}</span>
              <span className="evidence-trail__step-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* ════ Data Sources ════ */}
      <section className="data-sources">
        <div className="section-label">Data Sources</div>
        <h2>Built on NASA Open Data</h2>
        <p style={{ maxWidth: 640, marginTop: 'var(--s2)' }}>
          Every observation, validation, and context layer comes from a named, citable dataset.
          No data is fabricated or simulated.
        </p>

        <div className="data-sources__grid">
          {DATA_SOURCES.map((s) => (
            <div key={s.name} className="data-source-card">
              <div className="data-source-card__badge">{s.badge}</div>
              <div className="data-source-card__info">
                <div className="data-source-card__name">{s.name}</div>
                <div className="data-source-card__role">{s.role}</div>
                {s.doi && (
                  <a
                    className="data-source-card__doi"
                    href={`https://doi.org/${s.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    DOI: {s.doi}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════ Footer ════ */}
      <footer className="landing-footer">
        Same River Twice &middot; NASA Space Apps Challenge 2026 &middot; Dancing with the SARs
        &middot;{' '}
        <a href="/methods">full methods &amp; sources</a> &middot;{' '}
        <a
          href="https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar"
          target="_blank"
          rel="noopener noreferrer"
        >
          NASA SAR Reference
        </a>
      </footer>
    </div>
  );
}
