import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import '../styles/globe.css';

/* ═══════════════════════════════════════════════════════════════
   SAR SCIENCE LAB — Interactive Radar Remote Sensing Education
   Shows deep domain expertise in SAR / InSAR / NISAR science.
   ═══════════════════════════════════════════════════════════════ */

const BANDS = [
  { name: 'X-band', freq: '8–12 GHz', wl: '2.5–3.75 cm', pen: '~1 cm', use: 'Urban mapping, subsidence', color: '#ff5a5a', sat: 'TerraSAR-X, COSMO-SkyMed' },
  { name: 'C-band', freq: '4–8 GHz', wl: '3.75–7.5 cm', pen: '~5 cm', use: 'Sea ice, agriculture, Sentinel-1', color: '#E0B34A', sat: 'Sentinel-1 A/B, Radarsat-2' },
  { name: 'L-band', freq: '1–2 GHz', wl: '15–30 cm', pen: '~30 cm', use: 'Forest biomass, soil moisture, NISAR', color: 'var(--water)', sat: 'NISAR, ALOS-2 PALSAR', highlight: true },
  { name: 'P-band', freq: '0.3–1 GHz', wl: '30–100 cm', pen: '>1 m', use: 'Subsurface, biomass (BIOMASS mission)', color: '#7FBF8E', sat: 'ESA BIOMASS (planned)' },
];

const POL_CHANNELS = [
  { id: 'HH', label: 'Horizontal–Horizontal', desc: 'Co-polarization. Strong returns from bare soil, water surfaces (specular reflection). Used for flood/inundation mapping.', color: 'var(--water)', mechanism: 'Surface scattering', simVal: -11.4 },
  { id: 'HV', label: 'Horizontal–Vertical', desc: 'Cross-polarization. Strong returns from vegetation canopy (volume scattering). Key for biomass estimation and forest change.', color: 'var(--accretion)', mechanism: 'Volume scattering', simVal: -18.7 },
  { id: 'VV', label: 'Vertical–Vertical', desc: 'Co-polarization. Similar to HH but with different sensitivity to surface roughness. Often used in combination with HH.', color: 'var(--pass)', mechanism: 'Surface scattering', simVal: -12.1 },
  { id: 'VH', label: 'Vertical–Horizontal', desc: 'Cross-polarization. Reciprocal of HV in monostatic SAR. Sensitive to vegetation structure and moisture content.', color: '#E0B34A', mechanism: 'Volume scattering', simVal: -19.2 },
];

const INSAR_STEPS = [
  { title: 'Acquire SAR Pair', desc: 'Two SAR images from same orbital track, different dates. NISAR has 12-day exact repeat orbit — ideal for coherent change detection.', icon: '🛰️' },
  { title: 'Co-registration', desc: 'Sub-pixel alignment of reference (primary) and secondary image using orbital ephemeris + cross-correlation. Accuracy: <0.1 pixel.', icon: '🎯' },
  { title: 'Interferogram Formation', desc: 'Complex multiplication of aligned SLC images produces phase difference map. Each fringe = half-wavelength displacement (11.55 cm for L-band).', icon: '🌀' },
  { title: 'Coherence Estimation', desc: 'Spatial window (5×5) correlation between acquisitions. High coherence (>0.7) = stable surface. Low coherence (<0.3) = surface change detected.', icon: '📊' },
  { title: 'Phase Unwrapping', desc: 'Convert wrapped 2π-ambiguous phase into continuous displacement field using minimum cost flow algorithm. Critical for measuring actual ground movement.', icon: '📈' },
  { title: 'Geocoding & Output', desc: 'Project unwrapped phase from radar geometry (range/azimuth) to geographic coordinates using DEM. Output: displacement map in mm/year.', icon: '🗺️' },
];

const NISAR_SPECS = [
  { param: 'Launch', value: 'March 2024', icon: '🚀' },
  { param: 'Orbit', value: '747 km, Sun-synchronous', icon: '🌍' },
  { param: 'Repeat Cycle', value: '12 days (exact)', icon: '🔄' },
  { param: 'L-band Frequency', value: '1.257 GHz (λ = 23.8 cm)', icon: '📡' },
  { param: 'Resolution', value: '3–10 m (ScanSAR: 5–25 m)', icon: '🔍' },
  { param: 'Swath Width', value: '240 km', icon: '📐' },
  { param: 'Polarization', value: 'Quad-pol (HH+HV+VH+VV)', icon: '⚡' },
  { param: 'Data Rate', value: '26 Tbits/day (largest Earth science mission)', icon: '💾' },
  { param: 'Mission Life', value: '3 years (design), 5+ years (goal)', icon: '⏱️' },
  { param: 'Partnership', value: 'NASA JPL + ISRO SAC', icon: '🤝' },
];

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="glass-panel" style={{ padding: 'var(--s5)', ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 'var(--s5)' }}>
      <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
      <p style={{ fontSize: '1rem', color: 'var(--text-3)', marginTop: 8, maxWidth: 800, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

export function SARLabPage() {
  const [activeBand, setActiveBand] = useState(2); // Default to L-band
  const [activePol, setActivePol] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [showCoherence, setShowCoherence] = useState(false);

  return (
    <div style={{ background: '#07090A', minHeight: '100vh', color: 'var(--text)' }}>
      <Navbar />
      <div className="navbar-spacer" />

      <div style={{ padding: 'var(--s6) var(--s5)', maxWidth: 1400, margin: '0 auto' }}>

        {/* ═══ HERO ═══ */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--s8)', paddingTop: 'var(--s4)' }}>
          <div className="globe-hero__badge" style={{ borderColor: 'var(--water)', color: 'var(--water)' }}>
            <span className="globe-hero__badge-dot" style={{ background: 'var(--water)', boxShadow: '0 0 8px var(--water)' }} />
            INTERACTIVE SAR SCIENCE LAB
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, marginBottom: 'var(--s3)', marginTop: 'var(--s3)', letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--text)' }}>Radar Remote Sensing</span><br />
            <span className="glow-text">Deep Dive</span>
          </h1>
          <p style={{ color: 'var(--text-3)', maxWidth: 750, margin: '0 auto', fontSize: '1.15rem', lineHeight: 1.7 }}>
            Understand the science behind our analysis. How synthetic aperture radar works,
            why NISAR's L-band is revolutionary, and how we extract surface change from radar signals.
          </p>
        </div>

        {/* ═══ SECTION 1: NISAR MISSION SPECS ═══ */}
        <div style={{ marginBottom: 'var(--s8)' }}>
          <SectionTitle title="NISAR Mission Parameters" subtitle="The most expensive Earth science radar satellite ever built — a joint NASA-ISRO mission designed to measure Earth's changing ecosystems." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--s3)' }}>
            {NISAR_SPECS.map((spec) => (
              <div key={spec.param} className="glass-panel" style={{ padding: 'var(--s4)', display: 'flex', gap: 'var(--s3)', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.5rem', flexShrink: 0, width: 40, textAlign: 'center' }}>{spec.icon}</div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{spec.param}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--water)', fontWeight: 600, marginTop: 2 }}>{spec.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 2: FREQUENCY BANDS ═══ */}
        <div style={{ marginBottom: 'var(--s8)' }}>
          <SectionTitle title="SAR Frequency Bands" subtitle="Different radar frequencies penetrate Earth's surface to different depths. NISAR uses L-band — the sweet spot for vegetation penetration and soil moisture sensing." />
          
          <GlassCard>
            {/* Band selector tabs */}
            <div style={{ display: 'flex', gap: 'var(--s2)', marginBottom: 'var(--s5)', flexWrap: 'wrap' }}>
              {BANDS.map((b, i) => (
                <button
                  key={b.name}
                  onClick={() => setActiveBand(i)}
                  style={{
                    padding: '10px 20px',
                    border: `2px solid ${activeBand === i ? b.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 'var(--r-md)',
                    background: activeBand === i ? `${b.color}15` : 'transparent',
                    color: activeBand === i ? b.color : 'var(--text-3)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s',
                    boxShadow: activeBand === i ? `0 0 20px ${b.color}20` : 'none'
                  }}
                >
                  {b.name} {b.highlight ? '★' : ''}
                </button>
              ))}
            </div>

            {/* Active band details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s5)' }}>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase' }}>Frequency Range</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: BANDS[activeBand].color, fontFamily: 'var(--font-num)' }}>{BANDS[activeBand].freq}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase' }}>Wavelength</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: BANDS[activeBand].color, fontFamily: 'var(--font-num)' }}>{BANDS[activeBand].wl}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase' }}>Vegetation Penetration</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: BANDS[activeBand].color, fontFamily: 'var(--font-num)' }}>{BANDS[activeBand].pen}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase' }}>Key Missions</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-2)', marginTop: 2 }}>{BANDS[activeBand].sat}</div>
                  </div>
                </div>
                <div style={{ marginTop: 'var(--s4)', padding: 'var(--s3)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)', borderLeft: `3px solid ${BANDS[activeBand].color}` }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    <strong>Primary Use:</strong> {BANDS[activeBand].use}
                  </div>
                </div>
              </div>

              {/* Penetration depth visualization */}
              <div style={{ position: 'relative', height: 250, borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                {/* Sky */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%', background: 'linear-gradient(180deg, #0a1628 0%, #152238 100%)' }} />
                {/* Canopy */}
                <div style={{ position: 'absolute', top: '20%', left: 0, right: 0, height: '30%', background: 'linear-gradient(180deg, #1a3a1a 0%, #0f2810 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>🌿 Forest Canopy</span>
                </div>
                {/* Soil */}
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '30%', background: 'linear-gradient(180deg, #3a2a1a 0%, #2a1a0a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>🏔️ Soil / Ground</span>
                </div>
                {/* Bedrock */}
                <div style={{ position: 'absolute', top: '80%', left: 0, right: 0, height: '20%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>⛰️ Bedrock</span>
                </div>
                {/* Penetration arrow */}
                <div style={{
                  position: 'absolute',
                  left: '70%',
                  top: '15%',
                  width: 4,
                  height: `${activeBand === 0 ? 15 : activeBand === 1 ? 25 : activeBand === 2 ? 45 : 65}%`,
                  background: `linear-gradient(180deg, ${BANDS[activeBand].color}, transparent)`,
                  borderRadius: 2,
                  transition: 'height 0.5s ease',
                  boxShadow: `0 0 15px ${BANDS[activeBand].color}50`
                }} />
                <div style={{
                  position: 'absolute',
                  left: 'calc(70% + 10px)',
                  top: '18%',
                  fontSize: '0.7rem',
                  color: BANDS[activeBand].color,
                  fontWeight: 700,
                  fontFamily: 'var(--font-num)',
                  writingMode: 'vertical-rl'
                }}>
                  PENETRATION: {BANDS[activeBand].pen}
                </div>
                {/* SAR satellite icon */}
                <div style={{ position: 'absolute', left: 'calc(70% - 12px)', top: '8%', fontSize: '1.5rem' }}>🛰️</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ═══ SECTION 3: POLARIMETRY ═══ */}
        <div style={{ marginBottom: 'var(--s8)' }}>
          <SectionTitle title="SAR Polarimetry" subtitle="NISAR transmits and receives radar in multiple polarization orientations. Different polarizations reveal different scattering mechanisms on the ground." />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--s4)' }}>
            {POL_CHANNELS.map((pol, i) => (
              <div
                key={pol.id}
                className="glass-panel"
                onClick={() => setActivePol(i)}
                style={{
                  padding: 'var(--s4)',
                  cursor: 'pointer',
                  border: activePol === i ? `2px solid ${pol.color}` : '1px solid var(--glass-border)',
                  transition: 'all 0.3s',
                  boxShadow: activePol === i ? `0 0 30px ${pol.color}20` : 'var(--glass-shadow)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s3)' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: pol.color, fontFamily: 'var(--font-num)' }}>{pol.id}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: pol.color, fontFamily: 'var(--font-num)' }}>
                    {pol.simVal} <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>dB</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>{pol.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 'var(--s2)' }}>{pol.desc}</div>
                <div style={{ display: 'inline-block', padding: '3px 10px', background: `${pol.color}15`, border: `1px solid ${pol.color}30`, borderRadius: 'var(--r-full)', fontSize: '0.65rem', color: pol.color, fontWeight: 600 }}>
                  {pol.mechanism}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 4: InSAR PIPELINE ═══ */}
        <div style={{ marginBottom: 'var(--s8)' }}>
          <SectionTitle title="InSAR Processing Pipeline" subtitle="Interferometric SAR (InSAR) combines two radar acquisitions to measure ground displacement with millimeter-precision. Here's how our pipeline works, step by step." />
          
          <GlassCard>
            <div style={{ display: 'flex', gap: 'var(--s4)', overflowX: 'auto', paddingBottom: 'var(--s3)' }}>
              {INSAR_STEPS.map((step, i) => (
                <div
                  key={i}
                  onClick={() => setActiveStep(i)}
                  style={{
                    minWidth: 200,
                    padding: 'var(--s4)',
                    background: activeStep === i ? 'rgba(57,196,217,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${activeStep === i ? 'var(--water)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    position: 'relative',
                    flexShrink: 0
                  }}
                >
                  {/* Step number */}
                  <div style={{ position: 'absolute', top: -12, left: 16, background: activeStep === i ? 'var(--water)' : 'var(--surface-2, #1a1d21)', padding: '2px 10px', borderRadius: 'var(--r-full)', fontSize: '0.65rem', fontWeight: 700, color: activeStep === i ? '#000' : 'var(--text-3)', border: `1px solid ${activeStep === i ? 'var(--water)' : 'rgba(255,255,255,0.1)'}` }}>
                    STEP {i + 1}
                  </div>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--s2)', marginTop: 'var(--s2)' }}>{step.icon}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: activeStep === i ? 'var(--water)' : 'var(--text)', marginBottom: 8 }}>{step.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{step.desc}</div>
                  {i < INSAR_STEPS.length - 1 && (
                    <div style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', color: 'var(--water)', fontSize: '1.2rem', opacity: 0.5 }}>→</div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ═══ SECTION 5: COHERENCE SIMULATOR ═══ */}
        <div style={{ marginBottom: 'var(--s8)' }}>
          <SectionTitle title="Coherence Change Detection" subtitle="InSAR coherence is the fundamental signal we use to detect surface change. Click the button below to simulate what happens when the ground surface changes between SAR acquisitions." />
          
          <GlassCard>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--s4)', marginBottom: 'var(--s4)' }}>
              {/* Before */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 'var(--s2)' }}>SAR Acquisition 1 (t₀)</div>
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: 'linear-gradient(135deg, #1a2a3a 0%, #0a1520 30%, #2a3a4a 60%, #0a1520 100%)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid rgba(57,196,217,0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Speckle noise pattern */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(57,196,217,0.3) 0%, transparent 3%), radial-gradient(circle at 60% 70%, rgba(57,196,217,0.2) 0%, transparent 4%), radial-gradient(circle at 80% 20%, rgba(57,196,217,0.15) 0%, transparent 3%), radial-gradient(circle at 40% 80%, rgba(57,196,217,0.25) 0%, transparent 2%)', backgroundSize: '50px 50px' }} />
                  <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.6rem', color: 'var(--water)', fontFamily: 'var(--font-num)' }}>Aug 26, 2026</div>
                </div>
              </div>

              {/* After */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 'var(--s2)' }}>SAR Acquisition 2 (t₁)</div>
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: showCoherence
                    ? 'linear-gradient(135deg, #1a2a3a 0%, #3a1515 30%, #2a3a4a 60%, #0a1520 100%)'
                    : 'linear-gradient(135deg, #1a2a3a 0%, #0a1520 30%, #2a3a4a 60%, #0a1520 100%)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid rgba(57,196,217,0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 0.8s'
                }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(57,196,217,0.3) 0%, transparent 3%), radial-gradient(circle at 55% 65%, rgba(228,87,46,0.4) 0%, transparent 8%), radial-gradient(circle at 80% 20%, rgba(57,196,217,0.15) 0%, transparent 3%)', backgroundSize: '50px 50px' }} />
                  {showCoherence && <div style={{ position: 'absolute', top: '25%', left: '30%', width: '40%', height: '35%', border: '2px dashed var(--erosion)', borderRadius: 'var(--r-md)', animation: 'pulse 2s infinite' }} />}
                  <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.6rem', color: 'var(--water)', fontFamily: 'var(--font-num)' }}>Sep 19, 2026</div>
                </div>
              </div>

              {/* Coherence map */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 'var(--s2)' }}>Coherence Map (γ)</div>
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: showCoherence
                    ? 'linear-gradient(135deg, #1a5a1a 0%, #5a1a1a 30%, #1a5a1a 60%, #1a5a1a 100%)'
                    : 'linear-gradient(135deg, #1a5a1a 0%, #1a5a1a 30%, #1a5a1a 60%, #1a5a1a 100%)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid rgba(127,191,142,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 0.8s'
                }}>
                  {showCoherence && (
                    <div style={{ position: 'absolute', top: '25%', left: '30%', width: '40%', height: '35%', background: 'rgba(228,87,46,0.6)', borderRadius: 'var(--r-md)', boxShadow: '0 0 20px rgba(228,87,46,0.5)' }}>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-num)' }}>γ = 0.12</div>
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.6rem', color: 'var(--pass)', fontFamily: 'var(--font-num)' }}>
                    {showCoherence ? 'CHANGE DETECTED' : 'γ = 0.89 (stable)'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowCoherence(!showCoherence)}
                style={{
                  padding: '12px 32px',
                  border: '2px solid var(--erosion)',
                  borderRadius: 'var(--r-full)',
                  background: showCoherence ? 'rgba(228,87,46,0.15)' : 'transparent',
                  color: 'var(--erosion)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: showCoherence ? '0 0 30px rgba(228,87,46,0.2)' : 'none'
                }}
              >
                {showCoherence ? '↺ Reset to Stable Surface' : '⚡ Simulate Surface Change Event'}
              </button>
            </div>

            <div style={{ marginTop: 'var(--s4)', padding: 'var(--s3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-md)', fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-2)' }}>How it works:</strong> When the ground surface changes between two SAR acquisitions (erosion, landslide, flood, wildfire), 
              the radar signal loses <em>coherence</em> — the phase relationship between the two images breaks down.
              Our system detects these coherence drops and maps them as change polygons.
              A coherence value γ near 1.0 means no change; γ near 0.0 means complete surface disruption.
            </div>
          </GlassCard>
        </div>

        {/* ═══ SECTION 6: WHY NISAR L-BAND MATTERS ═══ */}
        <div style={{ marginBottom: 'var(--s8)' }}>
          <SectionTitle title="Why L-band Changes Everything" subtitle="NISAR's L-band radar solves fundamental limitations of existing C-band systems like Sentinel-1." />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s4)' }}>
            <GlassCard style={{ borderLeft: '3px solid var(--warn)' }}>
              <h3 style={{ margin: '0 0 var(--s3) 0', color: 'var(--warn)', fontSize: '1.1rem' }}>❌ C-band Limitations (Sentinel-1)</h3>
              <ul style={{ margin: 0, paddingLeft: 'var(--s4)', color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.8, listStyleType: "'– '" }}>
                <li>Short wavelength (5.6 cm) cannot penetrate vegetation canopy</li>
                <li>Rapid decorrelation in forested areas (coherence lost in days)</li>
                <li>Cannot distinguish soil moisture change from surface deformation</li>
                <li>12-day revisit (single satellite), 6-day with constellation</li>
                <li>Limited to surface-only scattering information</li>
              </ul>
            </GlassCard>

            <GlassCard style={{ borderLeft: '3px solid var(--water)' }}>
              <h3 style={{ margin: '0 0 var(--s3) 0', color: 'var(--water)', fontSize: '1.1rem' }}>✅ L-band Advantages (NISAR)</h3>
              <ul style={{ margin: 0, paddingLeft: 'var(--s4)', color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.8, listStyleType: "'✓ '" }}>
                <li>Long wavelength (23.8 cm) penetrates through forest canopy to trunk/ground</li>
                <li>Maintains coherence for months — enables true change detection</li>
                <li>Quad-polarization reveals scattering mechanism (surface vs volume)</li>
                <li>12-day exact repeat orbit with 240 km swath — global coverage</li>
                <li>Sensitive to biomass, soil moisture, AND surface deformation simultaneously</li>
              </ul>
            </GlassCard>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: 'var(--s8) 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            This educational module is part of <strong>Same River Twice</strong> — built for NASA Space Apps Challenge 2026, "Dancing with the SARs".
            All scientific content is sourced from NASA JPL NISAR documentation, ESA Sentinel-1 User Guide, and peer-reviewed SAR literature.
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}} />
    </div>
  );
}
