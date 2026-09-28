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
      <section style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#07090A', minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>
          {`
            @keyframes radar-sweep {
              0% { transform: translateX(-100%) skewX(-15deg); }
              100% { transform: translateX(300%) skewX(-15deg); }
            }
            @keyframes pulse-glow {
              0%, 100% { filter: drop-shadow(0 0 10px rgba(57, 196, 217, 0.4)); }
              50% { filter: drop-shadow(0 0 25px rgba(57, 196, 217, 0.8)); }
            }
            @keyframes dash-anim {
              to { stroke-dashoffset: -1000; }
            }
            .hero-bg-layer {
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              background: radial-gradient(circle at center, #0a1118 0%, #07090A 100%);
              z-index: 0;
            }
            .radar-sweep-line {
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              background: linear-gradient(90deg, transparent, rgba(57, 196, 217, 0.05) 45%, rgba(57, 196, 217, 0.8) 50%, transparent 55%);
              animation: radar-sweep 5s infinite linear;
              z-index: 1;
              pointer-events: none;
            }
            .river-svg {
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              width: 140%;
              height: 140%;
              opacity: 0.6;
              z-index: 0;
            }
            .river-path {
              fill: none;
              stroke-width: 3;
              animation: pulse-glow 4s infinite alternate;
              stroke: #39C4D9;
            }
            .hero-content {
              position: relative;
              z-index: 10;
              text-align: center;
              max-width: 900px;
              padding: 0 2rem;
            }
            .cinematic-title {
              font-size: clamp(3rem, 6vw, 5.5rem);
              font-weight: 800;
              letter-spacing: -0.03em;
              line-height: 1.1;
              color: #ffffff;
              margin-bottom: 1.5rem;
              text-shadow: 0 0 20px rgba(57, 196, 217, 0.3);
            }
            .cinematic-title span {
              color: transparent;
              -webkit-text-stroke: 1px rgba(255, 255, 255, 0.3);
              background: linear-gradient(90deg, #39C4D9, #E4572E, #D9B26A);
              -webkit-background-clip: text;
              background-clip: text;
              animation: gradient-shift 6s infinite alternate;
              background-size: 200% 200%;
            }
            @keyframes gradient-shift {
              0% { background-position: 0% 50%; }
              100% { background-position: 100% 50%; }
            }
            .cinematic-subtitle {
              font-size: 1.25rem;
              color: #a0aec0;
              line-height: 1.7;
              margin-bottom: 3rem;
              font-weight: 300;
              max-width: 700px;
              margin-left: auto;
              margin-right: auto;
            }
            .hero-actions {
              display: flex;
              gap: 1.5rem;
              justify-content: center;
            }
            .btn-glow {
              padding: 1.2rem 2.5rem;
              font-size: 1.1rem;
              font-weight: 600;
              border-radius: 4px;
              text-decoration: none;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              transition: all 0.3s ease;
            }
            .btn-primary {
              background: #39C4D9;
              color: #07090A;
              box-shadow: 0 0 15px rgba(57, 196, 217, 0.4);
            }
            .btn-primary:hover {
              background: #fff;
              box-shadow: 0 0 30px rgba(57, 196, 217, 0.8);
              transform: translateY(-2px);
            }
            .btn-secondary {
              background: transparent;
              color: #39C4D9;
              border: 1px solid #39C4D9;
            }
            .btn-secondary:hover {
              background: rgba(57, 196, 217, 0.1);
              box-shadow: 0 0 20px rgba(57, 196, 217, 0.3);
              transform: translateY(-2px);
            }
            
            /* Radar rings */
            .radar-rings {
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              width: 80vw; height: 80vw;
              max-width: 900px; max-height: 900px;
              border-radius: 50%;
              border: 1px solid rgba(57, 196, 217, 0.1);
              z-index: 0;
            }
            .radar-rings::before, .radar-rings::after {
              content: '';
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              border-radius: 50%;
              border: 1px solid rgba(57, 196, 217, 0.15);
            }
            .radar-rings::before { width: 60%; height: 60%; }
            .radar-rings::after { width: 30%; height: 30%; }

            .morph-dot {
              position: absolute;
              width: 8px; height: 8px;
              border-radius: 50%;
              animation: blink-dot 2.5s infinite alternate;
              z-index: 2;
            }
            .morph-dot.erosion {
              background-color: #E4572E;
              box-shadow: 0 0 12px #E4572E, 0 0 24px #E4572E;
            }
            .morph-dot.accretion {
              background-color: #D9B26A;
              box-shadow: 0 0 12px #D9B26A, 0 0 24px #D9B26A;
              animation-direction: alternate-reverse;
            }
            @keyframes blink-dot {
              0% { opacity: 0.2; transform: scale(0.8); }
              100% { opacity: 1; transform: scale(1.5); }
            }
          `}
        </style>
        
        <div className="hero-bg-layer" />
        <div className="radar-rings" />
        
        {/* River Topography SVG */}
        <svg className="river-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
            {/* Global SAR Grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(57, 196, 217, 0.05)" strokeWidth="1"/>
            </pattern>
            <rect width="1000" height="600" fill="url(#grid)" />
            
            {/* Orbital Paths */}
            <ellipse cx="500" cy="300" rx="600" ry="200" fill="none" stroke="rgba(57,196,217,0.2)" strokeWidth="1" transform="rotate(-15 500 300)" strokeDasharray="10 15" />
            <ellipse cx="500" cy="300" rx="400" ry="150" fill="none" stroke="rgba(57,196,217,0.15)" strokeWidth="1" transform="rotate(20 500 300)" />
            
            {/* Hazard Nodes */}
            <circle cx="200" cy="200" r="4" fill="#E4572E" className="pulse-glow" />
            <text x="215" y="205" fill="#E4572E" fontSize="11" letterSpacing="1">GLACIAL RETREAT</text>
            
            <circle cx="800" cy="150" r="4" fill="#D9B26A" className="pulse-glow" />
            <text x="815" y="155" fill="#D9B26A" fontSize="11" letterSpacing="1">WILDFIRE SCARS</text>
            
            <circle cx="700" cy="450" r="4" fill="#39C4D9" className="pulse-glow" />
            <text x="715" y="455" fill="#39C4D9" fontSize="11" letterSpacing="1">MANGROVE LOSS</text>
            
            <circle cx="350" cy="400" r="4" fill="#E4572E" className="pulse-glow" />
            <text x="365" y="405" fill="#E4572E" fontSize="11" letterSpacing="1">RIVER EROSION</text>
            
            {/* Connecting telemetry lines */}
            <path d="M 200 200 L 500 300 L 800 150" fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
            <path d="M 700 450 L 500 300 L 350 400" fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
          </svg>

        {/* Scattered accretion and erosion points */}
        <div className="radar-sweep-line" />

        <div className="hero-content">
          <div style={{ color: '#39C4D9', fontWeight: 600, letterSpacing: '0.15em', fontSize: '0.85rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            NASA SPACE APPS 2026 &middot; DANCING WITH THE SARS &middot; GLOBAL CHANGE DETECTION
          </div>

          <h1 className="cinematic-title">
            Decode the Earth&rsquo;s rhythm.<br />
            <span>Don&rsquo;t just watch it change.</span>
          </h1>

          <p className="cinematic-subtitle">
            Same River Twice is a cloud-native intelligence platform that leverages NISAR L-band radar to quantify global surface changes. From <span style={{ color: '#E4572E', fontWeight: 500 }}>river erosion</span> and glacial retreat to <span style={{ color: '#D9B26A', fontWeight: 500 }}>wildfire scars</span>, our ML engine uncovers the physics of a transforming planet&mdash;with the evidence chain to back every claim.
          </p>

          <div className="hero-actions">
            <a href="/cases" className="btn-glow btn-primary">
              Begin Investigation →
            </a>
            <a href="/methods" className="btn-glow btn-secondary">
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
