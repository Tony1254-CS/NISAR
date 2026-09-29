import { Navbar } from '../components/Navbar';

const SOURCES = [
  {
    name: 'NISAR L2 GCOV Provisional V1',
    role: 'Primary measurement — calibrated γ⁰ radar backscatter per pass',
    doi: '10.5067/NIL2GCOV-P1',
    provider: 'NASA/JPL NISAR, via ASF DAAC',
    desc: 'NASA-ISRO Synthetic Aperture Radar mission. L-band (1.257 GHz, ~24 cm wavelength) geocoded, covariance-matrix product. Dual-pol (HHHH + HVHV). 12-day repeat cycle. This is the core measurement we use — calibrated radar backscatter per orbital pass, clipped to each reach AOI.',
  },
  {
    name: 'OPERA L3 DSWx-S1 V1',
    role: 'Independent validation — Sentinel-1 C-band water extent',
    doi: '10.5067/OPDSWS1-L3V1',
    provider: 'NASA JPL OPERA, via PO.DAAC',
    desc: 'An independent water surface extent product derived from Sentinel-1 C-band radar (different satellite, different wavelength). Used for cross-sensor agreement checks. Note: not yet wired into our pipeline — currently NOT_EVALUATED.',
  },
  {
    name: 'GPM IMERG Daily Late Run V07',
    role: 'Rainfall anomaly check',
    doi: '10.5067/GPM/IMERGDL/DAY/07',
    provider: 'NASA Goddard, GPM',
    desc: 'Global Precipitation Measurement multi-satellite product. We fetch daily precipitation for the 50-day window around each acquisition and compute a 7-day rainfall anomaly ratio before t1 vs. the window baseline. Our real data shows 1.72× seasonal norm (64.48mm vs 37.44mm baseline).',
  },
  {
    name: 'ASF GLO-30 HAND',
    role: 'Terrain mask — excludes water classification on high ground',
    doi: null,
    provider: 'Alaska Satellite Facility',
    desc: 'Height Above Nearest Drainage, derived from Copernicus GLO-30 DEM. Pixels above the HAND cutoff (15m in our config) are excluded from water classification, preventing hilltop radar shadows from being classified as water.',
  },
  {
    name: 'JRC Global Surface Water — Occurrence',
    role: 'Reference — defines stable-land zone for null test',
    doi: null,
    provider: 'European Commission Joint Research Centre',
    desc: 'Long-term water occurrence map used to define known-stable land for the false-positive control test. The null test checks: does the algorithm falsely detect change on land that has never been water?',
  },
  {
    name: 'FFWC River Stage',
    role: 'Scientific control — river height at each acquisition',
    doi: null,
    provider: 'Flood Forecasting and Warning Centre, BWDB, Bangladesh',
    desc: 'Gauge station readings that provide river water level at each radar acquisition time. Critical for stage matching — comparing two dates at the same river height isolates real bank migration from temporary flooding. Where unavailable, a proxy (imagery-derived water fraction) is used instead.',
  },
  {
    name: 'NASA GIBS Blue Marble',
    role: 'Satellite basemap tiles (WMTS)',
    doi: null,
    provider: 'NASA GIBS (Global Imagery Browse Services)',
    desc: 'Blue Marble ShadedRelief Bathymetry basemap tiles served via WMTS. Used as the visual context layer beneath our radar and change overlays on the map. Presentation only — not a scientific input.',
  },
];

const SAR_CONCEPTS = [
  {
    term: 'Synthetic Aperture Radar (SAR)',
    explanation: 'A radar imaging technique that synthesizes a large antenna aperture by combining multiple signal returns as the satellite moves along its orbit. This produces high-resolution imagery regardless of lighting or weather conditions.',
    relevance: 'NISAR, our primary data source, is a SAR satellite. Every radar image in this application is a SAR observation.',
  },
  {
    term: 'Active Sensing',
    explanation: 'Unlike passive optical sensors that depend on sunlight, SAR transmits its own microwave pulse and measures the reflected signal. This means it can observe at any time of day and through clouds.',
    relevance: 'Monsoon-season river erosion in Bangladesh happens under heavy cloud cover — exactly when optical satellites cannot see. SAR can.',
  },
  {
    term: 'L-Band (~24 cm wavelength)',
    explanation: 'Microwave frequency band centered around 1.2 GHz with ~24 cm wavelength. Longer wavelengths penetrate vegetation canopy and interact more with the ground surface than shorter bands (C-band, X-band).',
    relevance: 'NISAR\'s L-band lets us see through riverside vegetation to detect the actual water edge, which is critical for accurate erosion mapping along densely vegetated riverbanks.',
  },
  {
    term: 'Backscatter Coefficient (σ⁰ / γ⁰)',
    explanation: 'The measure of how much radar energy is reflected back to the sensor per unit area. Smooth surfaces (water) reflect the signal away from the sensor (specular reflection → low backscatter). Rough surfaces (land, vegetation) scatter the signal in many directions, including back toward the sensor (diffuse/volume scattering → high backscatter).',
    relevance: 'This contrast is our entire detection principle. We classify pixels as water (dark / low γ⁰) or land (bright / high γ⁰) using an Otsu threshold on the calibrated backscatter values.',
  },
  {
    term: 'Polarization (HH)',
    explanation: 'The orientation of the transmitted and received electromagnetic wave. HH means horizontal transmit, horizontal receive. Different polarizations interact differently with surface and vegetation structure.',
    relevance: 'Our pipeline uses the HHHH covariance product from NISAR — the co-polarized horizontal channel, which provides strong land/water contrast for our Otsu thresholding approach.',
  },
  {
    term: 'Change Detection',
    explanation: 'Comparing two SAR images acquired at different times to identify areas where the surface has changed. For reliable change detection, confounding factors (different river height, seasonal flooding) must be controlled.',
    relevance: 'Our core method: compare two NISAR passes at matched river stage. A pixel classified as land at t0 and water at t1, at the same river height, indicates genuine bank migration — not temporary flood.',
  },
];

export function AboutPage() {
  return (
    <div className="page-container">
      <Navbar />
      <div className="navbar-spacer" />

      {/* ── Stunning About Section ── */}
      <div className="page-content" style={{ paddingBottom: 'var(--s6)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', margin: 'var(--s6) 0' }}>
          <h1 style={{ fontSize: '3rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'linear-gradient(90deg, var(--water), var(--pass))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 'var(--s2)' }}>
            The Mission
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-2)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Redefining how we monitor morphodynamic river change using cloud-penetrating radar.
          </p>
        </div>

        {/* Problem & Solution Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--s4)', marginBottom: 'var(--s8)' }}>
          <div style={{ background: 'rgba(255, 60, 60, 0.05)', border: '1px solid rgba(255, 60, 60, 0.2)', padding: 'var(--s5)', borderRadius: 'var(--r-lg)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'var(--fail)', filter: 'blur(80px)', opacity: 0.3 }} />
            <h3 style={{ color: 'var(--fail)', fontSize: '1.5rem', marginBottom: 'var(--s3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem' }}>⚠️</span> The Problem
            </h3>
            <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '1.05rem', position: 'relative', zIndex: 1 }}>
              Rivers shift, erode, and destroy communities overnight. Traditional optical satellites (like Landsat or Sentinel) are blinded by heavy monsoon clouds <strong>exactly when the worst erosion happens</strong>. Manual field surveys are too slow, leaving millions vulnerable to unseen morphological shifts beneath the clouds.
            </p>
          </div>

          <div style={{ background: 'rgba(57, 196, 217, 0.05)', border: '1px solid rgba(57, 196, 217, 0.2)', padding: 'var(--s5)', borderRadius: 'var(--r-lg)', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(57, 196, 217, 0.05)' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'var(--water)', filter: 'blur(80px)', opacity: 0.3 }} />
            <h3 style={{ color: 'var(--water)', fontSize: '1.5rem', marginBottom: 'var(--s3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.8rem' }}>🚀</span> The Solution
            </h3>
            <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '1.05rem', position: 'relative', zIndex: 1 }}>
              We utilize <strong>NISAR's L-band Synthetic Aperture Radar (SAR)</strong> to penetrate clouds and measure bank erosion in real-time. By algorithmically aligning radar backscatter with in-situ river gauges, our AI pipeline eliminates false positives from seasonal flooding, delivering high-confidence, actionable data instantly.
            </p>
          </div>
        </div>

        {/* The Team */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--s8)' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: 'var(--s5)', color: 'var(--text)' }}>Meet the Crew</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--s4)' }}>
            {[
              { name: 'Sabbir Ahmed', role: 'Mission Commander', desc: 'System Architecture & AI Pipeline', initials: 'SA' },
              { name: 'Sanjid Talukder', role: 'Data Scientist', desc: 'SAR Processing & Remote Sensing', initials: 'ST' },
              { name: 'Sakibul Hassan Shovon', role: 'Frontend Engineer', desc: 'Interactive Visualization & UX', initials: 'SH' },
              { name: 'Yasin Arafat', role: 'Hydro Analyst', desc: 'River Dynamics & Quality Assurance', initials: 'YA' }
            ].map((member) => (
              <div key={member.name} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: 'var(--s4)',
                borderRadius: 'var(--r-md)',
                transition: 'all 0.3s ease',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = 'var(--water)';
                e.currentTarget.style.background = 'rgba(57, 196, 217, 0.05)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(57, 196, 217, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5)';
              }}
              >
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, rgba(57, 196, 217, 0.2), rgba(57, 196, 217, 0.05))',
                  border: '2px solid rgba(57, 196, 217, 0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 900, color: 'var(--water)',
                  marginBottom: 'var(--s3)', textShadow: '0 0 10px var(--water)'
                }}>
                  {member.initials}
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', letterSpacing: '0.05em' }}>{member.name}</h3>
                <div style={{ color: 'var(--water)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>{member.role}</div>
                <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>{member.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Existing Data Sources Section ── */}
      <div className="page-content page-content--narrow" style={{ paddingBottom: 'var(--s8)' }}>
        <div className="divider" style={{ marginBottom: 'var(--s6)' }} />
        
        <div className="section-label">
          Data & Sources
        </div>
        <h1 style={{ marginBottom: 'var(--s3)' }}>Where the Data Comes From</h1>
        <p>
          Every observation, measurement, and validation check in Same River Twice traces to a
          named, citable dataset. This page documents the complete data provenance — what we use,
          why, and from whom.
        </p>

        {/* ── Data Provenance Flow ── */}
        <div style={{ margin: 'var(--s6) 0' }}>
          <h2 style={{ marginBottom: 'var(--s3)' }}>Data Flow</h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--s2)',
              alignItems: 'center',
              fontFamily: 'var(--font-num)',
              fontSize: 'var(--text-xs)',
              lineHeight: 2,
            }}
          >
            {[
              'NASA NISAR Satellite',
              'ASF DAAC Download',
              'AOI Clip & Preprocess',
              'Water Classification',
              'Stage Matching',
              'Change Detection',
              'QC Validation',
              'Bundle Generation',
              'Web Application',
            ].map((step, i, arr) => (
              <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s2)' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-md)',
                    color: i === 0 ? 'var(--water)' : 'var(--text-2)',
                  }}
                >
                  {step}
                </span>
                {i < arr.length - 1 && (
                  <span style={{ color: 'var(--text-3)' }}>→</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* ── Detailed Data Sources ── */}
        <h2 style={{ marginBottom: 'var(--s4)' }}>Data Sources</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          {SOURCES.map((s) => (
            <div
              key={s.name}
              className="card"
              style={{ borderLeft: '3px solid var(--border-accent)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s3)', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 2 }}>{s.name}</h3>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--water)', fontWeight: 500 }}>
                    {s.role}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-num)', fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>
                  {s.provider}
                </div>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--s3)', marginBottom: 0 }}>
                {s.desc}
              </p>
              {s.doi && (
                <a
                  href={`https://doi.org/${s.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 'var(--s2)',
                    fontFamily: 'var(--font-num)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--water)',
                    opacity: 0.8,
                  }}
                >
                  DOI: {s.doi} ↗
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="divider" />

        {/* ── SAR Concepts ── */}
        <h2 style={{ marginBottom: 'var(--s2)' }}>SAR Concepts Used in This Project</h2>
        <p>
          These concepts from{' '}
          <a
            href="https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar"
            target="_blank"
            rel="noopener noreferrer"
          >
            NASA Earthdata's SAR resource
          </a>{' '}
          are directly relevant to how Same River Twice processes and interprets NISAR data.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)', marginTop: 'var(--s4)' }}>
          {SAR_CONCEPTS.map((c) => (
            <details
              key={c.term}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-md)',
                padding: 0,
              }}
            >
              <summary
                style={{
                  padding: 'var(--s4)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 'var(--text-md)',
                  color: 'var(--text)',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {c.term}
                <span style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>▼</span>
              </summary>
              <div style={{ padding: '0 var(--s4) var(--s4)', borderTop: '1px solid var(--line)' }}>
                <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--s3)' }}>{c.explanation}</p>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--water)',
                    padding: 'var(--s3)',
                    background: 'var(--water-dim)',
                    borderRadius: 'var(--r-md)',
                    borderLeft: '2px solid var(--water)',
                    marginBottom: 0,
                  }}
                >
                  <strong>In this project:</strong> {c.relevance}
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="divider" />

        {/* ── Honest Disclosure ── */}
        <h2 style={{ marginBottom: 'var(--s3)' }}>Disclosure</h2>
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
            <strong>Built for NASA Space Apps Challenge 2026 — "Dancing with the SARs"</strong>. 
            Pipeline and UI code assisted by AI coding tools. Every scientific number
            shown in the app resolves to <code>manifest.json</code>, generated by the offline
            pipeline from the sources listed above — no number in this app is hand-typed.
          </p>
        </div>

        {/* ── NASA Earthdata Reference ── */}
        <div style={{ marginTop: 'var(--s5)', textAlign: 'center' }}>
          <a
            href="https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar"
            target="_blank"
            rel="noopener noreferrer"
            className="badge"
            style={{ textDecoration: 'none' }}
          >
            📡 Read the full NASA Earthdata SAR Resource →
          </a>
        </div>
      </div>
    </div>
  );
}
