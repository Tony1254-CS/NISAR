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
      <section style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#000000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
        <style>
          {`
            @keyframes subtle-sweep {
              0% { transform: translateX(-100%) rotate(15deg); opacity: 0; }
              50% { opacity: 0.15; }
              100% { transform: translateX(200%) rotate(15deg); opacity: 0; }
            }
            @keyframes pulse-mesh {
              0%, 100% { opacity: 0.2; transform: scale(1); }
              50% { opacity: 0.4; transform: scale(1.05); }
            }
            @keyframes float-up {
              0% { opacity: 0; transform: translateY(30px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            .elegant-bg {
              position: absolute;
              inset: 0;
              background: radial-gradient(circle at 50% 0%, #0c1824 0%, #000000 70%);
              z-index: 0;
            }
            .radar-light {
              position: absolute;
              top: -50%; bottom: -50%;
              left: 0; width: 200px;
              background: linear-gradient(90deg, transparent, #39C4D9, transparent);
              filter: blur(50px);
              animation: subtle-sweep 8s infinite ease-in-out;
              z-index: 1;
            }
            .grid-mesh {
              position: absolute;
              inset: 0;
              background-image: 
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
              background-size: 60px 60px;
              background-position: center center;
              mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
              -webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
              z-index: 1;
              animation: pulse-mesh 10s infinite ease-in-out;
            }
            .hero-content-elegant {
              position: relative;
              z-index: 10;
              text-align: center;
              max-width: 900px;
              padding: 0 2rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2rem;
              animation: float-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .eyebrow {
              color: #39C4D9;
              font-size: 0.8rem;
              font-weight: 600;
              letter-spacing: 0.3em;
              text-transform: uppercase;
              background: rgba(57, 196, 217, 0.1);
              padding: 6px 16px;
              border-radius: 100px;
              border: 1px solid rgba(57, 196, 217, 0.2);
              backdrop-filter: blur(10px);
            }
            .headline {
              font-size: clamp(3.5rem, 8vw, 6rem);
              font-weight: 800;
              line-height: 1.1;
              color: #ffffff;
              letter-spacing: -0.02em;
              margin: 0;
            }
            .headline-gradient {
              background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .headline-accent {
              background: linear-gradient(135deg, #39C4D9 0%, #3b82f6 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .subheadline {
              font-size: clamp(1.1rem, 2vw, 1.4rem);
              line-height: 1.6;
              color: #94a3b8;
              max-width: 700px;
              margin: 0;
              font-weight: 400;
            }
            .btn-group {
              display: flex;
              gap: 1.5rem;
              margin-top: 1rem;
            }
            @media (max-width: 600px) {
              .btn-group {
                flex-direction: column;
                gap: 1rem;
                width: 100%;
              }
              .btn-elegant-primary, .btn-elegant-secondary {
                width: 100%;
                text-align: center;
              }
            }
            .btn-elegant-primary {
              background: #ffffff;
              color: #000000;
              padding: 16px 32px;
              border-radius: 100px;
              font-weight: 600;
              font-size: 1.1rem;
              text-decoration: none;
              transition: all 0.3s ease;
              box-shadow: 0 0 20px rgba(255,255,255,0.2);
            }
            .btn-elegant-primary:hover {
              transform: translateY(-2px);
              box-shadow: 0 0 30px rgba(255,255,255,0.4);
            }
            .btn-elegant-secondary {
              background: rgba(255,255,255,0.05);
              color: #ffffff;
              padding: 16px 32px;
              border-radius: 100px;
              font-weight: 600;
              font-size: 1.1rem;
              text-decoration: none;
              border: 1px solid rgba(255,255,255,0.1);
              transition: all 0.3s ease;
              backdrop-filter: blur(10px);
            }
            .btn-elegant-secondary:hover {
              background: rgba(255,255,255,0.1);
              border-color: rgba(255,255,255,0.2);
            }
          `}
        </style>

        <div className="elegant-bg" />
        <div className="grid-mesh" />
        <div className="radar-light" />

        <div className="hero-content-elegant">
          <div className="eyebrow">
            GLOBAL CHANGE INTELLIGENCE
          </div>

          <h1 className="headline">
            <span className="headline-gradient">See the invisible.</span><br />
            <span className="headline-accent">Predict the inevitable.</span>
          </h1>

          <p className="subheadline">
            A cloud-native intelligence platform leveraging NISAR L-band radar to quantify global surface changes. From river erosion to glacial retreat, our ML engine decodes the physics of a transforming planet.
          </p>

          <div className="btn-group">
            <a href="/cases" className="btn-elegant-primary">
              Begin Investigation
            </a>
            <a href="/methods" className="btn-elegant-secondary">
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
