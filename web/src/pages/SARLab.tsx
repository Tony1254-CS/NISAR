// @ts-nocheck
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import '../styles/globe.css';

/* ═══════════════════════════════════════════════════════════════
   SAR SCIENCE LAB — Interactive Radar Remote Sensing Education
   Shows deep domain expertise in SAR / InSAR / NISAR science.
   ═══════════════════════════════════════════════════════════════ */

const BANDS = [
  { name: 'X-band', freq: '8–12 GHz', wl: '2.5–3.75 cm', pen: '~1 cm', use: 'Urban mapping, subsidence', color: 'var(--erosion)', sat: 'TerraSAR-X, COSMO-SkyMed' },
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
    <div className="glass-panel hover-lift" style={{ padding: 'var(--s5)', ...style }}>
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
  
  // Coherence (3D)
  const [coherenceThreshold, setCoherenceThreshold] = useState(0.3);

  // Otsu (3A)
  const [otsuThreshold, setOtsuThreshold] = useState(-15);
  const otsuData = useMemo(() => {
    const data = [];
    for (let db = -25; db <= -5; db += 0.5) {
      // Bimodal mixture of gaussians
      const waterDist = 80 * Math.exp(-Math.pow(db - (-18), 2) / (2 * 1.5 * 1.5));
      const landDist = 60 * Math.exp(-Math.pow(db - (-10), 2) / (2 * 2 * 2));
      const noise = Math.random() * 5;
      data.push({ db, count: Math.round(waterDist + landDist + noise) });
    }
    return data;
  }, []);
  
  const otsuStats = useMemo(() => {
    let water = 0;
    let land = 0;
    otsuData.forEach(d => {
      if (d.db < otsuThreshold) water += d.count;
      else land += d.count;
    });
    return { water, land };
  }, [otsuData, otsuThreshold]);

  // InSAR (3B)
  const [insarMaxDisp, setInsarMaxDisp] = useState(10);
  const [insarRadius, setInsarRadius] = useState(500);
  const [insarCenter, setInsarCenter] = useState({ x: 200, y: 150 });
  const insarCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawFringes = useCallback(() => {
    const canvas = insarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    
    const D = insarMaxDisp; // cm
    const sigma = insarRadius / 10; // scaled
    const lambda = 23.8; // cm
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Displacement field
        const distSq = Math.pow(x - insarCenter.x, 2) + Math.pow(y - insarCenter.y, 2);
        const d = D * Math.exp(-distSq / (2 * sigma * sigma));
        
        // Phase calculation
        const phase = (4 * Math.PI / lambda) * d;
        const wrappedPhase = phase % (2 * Math.PI);
        
        // Convert to color (HSL)
        const hue = (wrappedPhase / (2 * Math.PI)) * 360;
        
        // HSL to RGB conversion inline for speed
        const s = 1.0;
        const l = 0.5;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const xp = c * (1 - Math.abs((hue / 60) % 2 - 1));
        const m = l - c / 2;
        let r=0, g=0, b=0;
        if(hue<60){r=c; g=xp; b=0;}
        else if(hue<120){r=xp; g=c; b=0;}
        else if(hue<180){r=0; g=c; b=xp;}
        else if(hue<240){r=0; g=xp; b=c;}
        else if(hue<300){r=xp; g=0; b=c;}
        else{r=c; g=0; b=xp;}
        
        const index = (y * width + x) * 4;
        imageData.data[index] = (r+m)*255;
        imageData.data[index+1] = (g+m)*255;
        imageData.data[index+2] = (b+m)*255;
        imageData.data[index+3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [insarMaxDisp, insarRadius, insarCenter]);

  useEffect(() => {
    drawFringes();
  }, [drawFringes]);
  
  const handleInsarClick = (e) => {
    const rect = insarCanvasRef.current!.getBoundingClientRect();
    setInsarCenter({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // H/Alpha (3C)
  const [showErosionZone, setShowErosionZone] = useState(false);
  const hAlphaPoints = useMemo(() => {
    const pts = [];
    // Water (low H, low alpha)
    for(let i=0; i<30; i++) pts.push({ H: 0.1 + Math.random()*0.2, alpha: 10 + Math.random()*20, type: 'water' });
    // Forest (high H, medium alpha)
    for(let i=0; i<40; i++) pts.push({ H: 0.6 + Math.random()*0.3, alpha: 40 + Math.random()*20, type: 'forest' });
    // Urban (low H, high alpha)
    for(let i=0; i<20; i++) pts.push({ H: 0.2 + Math.random()*0.3, alpha: 65 + Math.random()*20, type: 'urban' });
    return pts;
  }, []);
  
  // Mix in erosion points if toggled
  const currentHAlphaPoints = useMemo(() => {
    if (!showErosionZone) return hAlphaPoints;
    const erosionPts = [];
    for(let i=0; i<15; i++) erosionPts.push({ H: 0.3 + Math.random()*0.2, alpha: 30 + Math.random()*20, type: 'erosion' });
    return [...hAlphaPoints, ...erosionPts];
  }, [hAlphaPoints, showErosionZone]);


  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
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
              <div key={spec.param} className="glass-panel hover-lift" style={{ padding: 'var(--s4)', display: 'flex', gap: 'var(--s3)', alignItems: 'flex-start' }}>
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
                className="glass-panel hover-lift"
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--s4)' }}>
              {INSAR_STEPS.map((step, i) => (
                <div
                  key={i}
                  onClick={() => setActiveStep(i)}
                  style={{
                    padding: 'var(--s5) var(--s4) var(--s4) var(--s4)',
                    background: activeStep === i ? 'rgba(57,196,217,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${activeStep === i ? 'var(--water)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    position: 'relative'
                  }}
                >
                  {/* Step number */}
                  <div style={{ position: 'absolute', top: -12, left: 16, background: activeStep === i ? 'var(--water)' : 'var(--surface-2, #1a1d21)', padding: '2px 10px', borderRadius: 'var(--r-full)', fontSize: '0.65rem', fontWeight: 700, color: activeStep === i ? '#000' : 'var(--text-3)', border: `1px solid ${activeStep === i ? 'var(--water)' : 'rgba(255,255,255,0.1)'}` }}>
                    STEP {i + 1}
                  </div>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--s2)' }}>{step.icon}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: activeStep === i ? 'var(--water)' : 'var(--text)', marginBottom: 8 }}>{step.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        
        {/* ═══ SECTION 5: COHERENCE DECAY SIMULATOR ═══ */}
        <div style={{ marginBottom: 'var(--s8)' }}>
          <SectionTitle title="Coherence Decay Simulator" subtitle="InSAR coherence is the fundamental signal we use to detect surface change. This chart shows coherence (γ) decay curves over temporal baseline (0-90 days)." />
          
          <GlassCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
              <div style={{ position: 'relative', height: '300px', width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--r-md)', padding: '20px' }}>
                <svg width="100%" height="100%" viewBox="0 0 900 100" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map(v => (
                    <line key={v} x1="0" y1={100 - v*100} x2="900" y2={100 - v*100} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  ))}
                  
                  {/* Curves */}
                  {/* Urban (τ=500) */}
                  <path d={Array.from({length: 91}).map((_, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${100 - (0.9 * Math.exp(-i/500)) * 100}`).join(' ')} fill="none" stroke="#e0e0e0" strokeWidth="3" />
                  {/* Bare Soil (τ=365) */}
                  <path d={Array.from({length: 91}).map((_, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${100 - (0.85 * Math.exp(-i/365)) * 100}`).join(' ')} fill="none" stroke="#E0B34A" strokeWidth="3" />
                  {/* Vegetation (τ=15) */}
                  <path d={Array.from({length: 91}).map((_, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${100 - (0.7 * Math.exp(-i/15)) * 100}`).join(' ')} fill="none" stroke="#7FBF8E" strokeWidth="3" />
                  {/* Active Erosion (drops at day 12) */}
                  <path d={Array.from({length: 91}).map((_, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${100 - (i < 12 ? 0.8 - (i * 0.01) : 0.1) * 100}`).join(' ')} fill="none" stroke="var(--erosion)" strokeWidth="3" />
                  
                  {/* Threshold Line */}
                  <line x1="0" y1={100 - coherenceThreshold*100} x2="900" y2={100 - coherenceThreshold*100} stroke="var(--warn)" strokeWidth="2" strokeDasharray="5,5" />
                </svg>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-3)' }}>Detection Threshold (γ): {coherenceThreshold.toFixed(2)}</span>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={coherenceThreshold} 
                  onChange={e => setCoherenceThreshold(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--warn)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--s4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 16, height: 4, background: '#e0e0e0' }}></div><span style={{ fontSize: '0.85rem' }}>Urban (τ=500d)</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 16, height: 4, background: '#E0B34A' }}></div><span style={{ fontSize: '0.85rem' }}>Bare Soil (τ=365d)</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 16, height: 4, background: '#7FBF8E' }}></div><span style={{ fontSize: '0.85rem' }}>Vegetation (τ=15d)</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 16, height: 4, background: 'var(--erosion)' }}></div><span style={{ fontSize: '0.85rem' }}>Active Erosion (Day 12 drop)</span></div>
              </div>
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

        {/* ═══ SECTION 7: ADVANCED SAR PHYSICS ═══ */}
        <div style={{ marginBottom: 'var(--s8)' }}>
          <SectionTitle title="Advanced SAR Physics Console" subtitle="Deep dive into processing techniques used in our analysis. Adjust parameters in real-time." />
          
          <div style={{ display: 'grid', gap: 'var(--s4)' }}>
            
            {/* Otsu Threshold */}
            <GlassCard>
              <h3 style={{ margin: '0 0 var(--s3) 0', color: 'var(--water)', fontSize: '1.2rem' }}>Dynamic Otsu Threshold (σ⁰)</h3>
              <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: 'var(--s3)' }}>Minimizes intra-class variance of the bimodal backscatter histogram. Adjust to distinguish water (-18dB) from land (-10dB).</p>
              
              <div style={{ position: 'relative', height: '150px', display: 'flex', alignItems: 'flex-end', gap: '2px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {otsuData.map((d, i) => {
                  const isWater = d.db < otsuThreshold;
                  return (
                    <div key={i} style={{ 
                      flex: 1, 
                      height: `${(d.count / Math.max(...otsuData.map(o => o.count))) * 100}%`,
                      background: isWater ? 'var(--water)' : 'var(--warn)',
                      opacity: 0.8
                    }} title={`${d.db.toFixed(1)} dB: ${d.count} pixels`} />
                  );
                })}
                {/* Threshold line overlay */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, top: 0, 
                  left: `${((otsuThreshold + 25) / 20) * 100}%`, 
                  width: '2px', background: '#fff', 
                  boxShadow: '0 0 8px #fff', zIndex: 10 
                }} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginTop: 'var(--s4)' }}>
                <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-num)' }}>-25 dB</span>
                <input 
                  type="range" 
                  min="-25" max="-5" step="0.5" 
                  value={otsuThreshold} 
                  onChange={(e) => setOtsuThreshold(parseFloat(e.target.value))} 
                  style={{ flex: 1, accentColor: '#fff' }} 
                />
                <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-num)' }}>-5 dB</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--s3)' }}>
                <div style={{ color: 'var(--water)', fontWeight: 700 }}>Water Pixels: {otsuStats.water}</div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-num)' }}>Threshold: {otsuThreshold.toFixed(1)} dB</div>
                <div style={{ color: 'var(--warn)', fontWeight: 700 }}>Land Pixels: {otsuStats.land}</div>
              </div>
            </GlassCard>

            {/* InSAR Fringes */}
            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--s3)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--s2) 0', color: 'var(--erosion)', fontSize: '1.2rem' }}>InSAR Fringe Synthesizer</h3>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0 }}>Mathematical phase generator: φ(x,y) = (4π/λ) × d(x,y). L-band λ = 23.8 cm.</p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Click on the canvas to set deformation center.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--s4)', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <canvas 
                    ref={insarCanvasRef}
                    width={400} 
                    height={300}
                    onClick={handleInsarClick}
                    style={{ width: '100%', height: 'auto', background: '#000', borderRadius: 'var(--r-md)', cursor: 'crosshair', border: '1px solid var(--glass-border)' }} 
                  />
                </div>
                
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '4px' }}>Max Displacement (D): {insarMaxDisp} cm</div>
                    <input type="range" min="1" max="20" step="0.5" value={insarMaxDisp} onChange={e => setInsarMaxDisp(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--erosion)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '4px' }}>Deformation Radius (σ): {insarRadius} m</div>
                    <input type="range" min="100" max="2000" step="100" value={insarRadius} onChange={e => setInsarRadius(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--erosion)' }} />
                  </div>
                  
                  <div style={{ padding: 'var(--s3)', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--r-md)', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '4px' }}>Calculated Fringes</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--erosion)', fontFamily: 'var(--font-num)' }}>
                      {(insarMaxDisp / (23.8 / 2)).toFixed(1)} <span style={{ fontSize: '1rem' }}>fringes</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* H-Alpha Scatter Plot */}
            <GlassCard>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s3)' }}>
                <div>
                  <h3 style={{ margin: '0 0 var(--s2) 0', color: 'var(--accretion)', fontSize: '1.2rem' }}>H/α Cloude-Pottier Classification</h3>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0 }}>2D polarimetric decomposition space.</p>
                </div>
                <button 
                  onClick={() => setShowErosionZone(!showErosionZone)}
                  style={{ padding: '8px 16px', background: showErosionZone ? 'rgba(228,87,46,0.2)' : 'transparent', border: `1px solid ${showErosionZone ? 'var(--erosion)' : 'var(--glass-border)'}`, color: showErosionZone ? 'var(--erosion)' : 'var(--text)', borderRadius: 'var(--r-full)', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  {showErosionZone ? 'Hide Erosion Zone' : 'Show River Erosion Zone'}
                </button>
              </div>

              <div style={{ position: 'relative', height: '400px', width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 100 90" preserveAspectRatio="none">
                  {/* Grid / Zones */}
                  <line x1="50" y1="0" x2="50" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <line x1="90" y1="0" x2="90" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  
                  {/* Labels */}
                  <text x="2" y="88" fill="rgba(255,255,255,0.4)" fontSize="3">Surface (Z9)</text>
                  <text x="2" y="4" fill="rgba(255,255,255,0.4)" fontSize="3">Double-Bounce (Z7)</text>
                  <text x="52" y="45" fill="rgba(255,255,255,0.4)" fontSize="3">Volume (Z5)</text>

                  {/* Scatter points */}
                  {currentHAlphaPoints.map((p, i) => (
                    <circle 
                      key={i} 
                      cx={p.H * 100} 
                      cy={90 - p.alpha} 
                      r="1.5" 
                      fill={p.type === 'water' ? '#39C4D9' : p.type === 'forest' ? '#7FBF8E' : p.type === 'urban' ? '#E4572E' : 'var(--erosion)'} 
                      opacity={0.8}
                    >
                      <title>{`H: ${p.H.toFixed(2)}, Alpha: ${p.alpha.toFixed(1)}° (${p.type})`}</title>
                    </circle>
                  ))}
                  
                  {/* Erosion Zone Highlight */}
                  {showErosionZone && (
                    <ellipse cx="30" cy="50" rx="15" ry="10" fill="none" stroke="var(--erosion)" strokeWidth="1" strokeDasharray="2,2" />
                  )}
                </svg>
                {/* Axes labels */}
                <div style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.8rem', color: 'var(--text-3)' }}>Entropy (H) 0 → 1</div>
                <div style={{ position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '0.8rem', color: 'var(--text-3)' }}>Alpha (α) 0° → 90°</div>
              </div>
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

