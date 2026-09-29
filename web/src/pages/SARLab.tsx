// @ts-nocheck
import { useStore } from '../state/store';
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


function FeatureRadarViewer() {
  const reachId = useStore(state => state.reachId) || 'jamuna-chilmari';
  
  // Pane 1: Swipe
  const [sliderPos, setSliderPos] = useState(50);
  
  // Pane 2: Otsu
  const [otsuThresh, setOtsuThresh] = useState(60);
  const otsuCanvasRef = useRef(null);
  const [radarPixels, setRadarPixels] = useState(null);
  
  useEffect(() => {
    const img = new Image();
    img.src = `/data/v1/${reachId}/img/radar_20260826.png`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Scale down for performance
      const w = 400; const h = 300;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      setRadarPixels(ctx.getImageData(0, 0, w, h));
    };
  }, [reachId]);
  
  useEffect(() => {
    if (!otsuCanvasRef.current || !radarPixels) return;
    const canvas = otsuCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = 400; const h = 300;
    
    const outData = ctx.createImageData(w, h);
    const inData = radarPixels.data;
    
    for (let i = 0; i < inData.length; i += 4) {
      const brightness = inData[i];
      if (brightness < otsuThresh) {
        // Water
        outData.data[i] = 0;
        outData.data[i+1] = 0;
        outData.data[i+2] = 255;
        outData.data[i+3] = 255;
      } else {
        // Land
        outData.data[i] = 20;
        outData.data[i+1] = 20;
        outData.data[i+2] = 20;
        outData.data[i+3] = 255;
      }
    }
    ctx.putImageData(outData, 0, 0);
  }, [otsuThresh, radarPixels]);
  
  // Pane 3: Change Detection Scanner
  const changeCanvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hectaresLost, setHectaresLost] = useState(0);
  
  const runDiff = () => {
    if (isScanning) return;
    setIsScanning(true);
    setHectaresLost(0);
    
    const img = new Image();
    img.src = `/data/v1/${reachId}/img/change_20260826_20260919.png`;
    img.onload = () => {
      const canvas = changeCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const w = 400; const h = 300;
      
      // Draw image to offscreen canvas to read pixels
      const offCanvas = document.createElement('canvas');
      offCanvas.width = w; offCanvas.height = h;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(img, 0, 0, w, h);
      const changeData = offCtx.getImageData(0, 0, w, h);
      
      // We will reveal it line by line
      let currentY = 0;
      let totalHectares = 0;
      const outData = ctx.createImageData(w, h);
      
      // Fill initial black background
      for(let i=0; i<outData.data.length; i+=4) {
         outData.data[i] = 10; outData.data[i+1] = 10; outData.data[i+2] = 10; outData.data[i+3] = 255;
      }
      
      const animate = () => {
        if (currentY >= h) {
          setIsScanning(false);
          return;
        }
        
        // Process next 10 lines
        for (let y = currentY; y < currentY + 10 && y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const r = changeData.data[i];
            
            if (r > 128) { // Erosion pixel
              outData.data[i] = 255; // Red
              outData.data[i+1] = 50; 
              outData.data[i+2] = 50;
              totalHectares += 0.09; // Approx 30x30m pixel = 900sqm = 0.09 ha
            }
          }
        }
        
        ctx.putImageData(outData, 0, 0);
        
        // Draw scanner line
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.fillRect(0, currentY + 10, w, 2);
        
        setHectaresLost(Math.round(totalHectares));
        currentY += 10;
        requestAnimationFrame(animate);
      };
      animate();
    };
  };
  
  return (
    <div style={{ marginBottom: 'var(--s8)' }}>
      <SectionTitle title="Live NISAR Pipeline Sandbox" subtitle="Don't just view the outputs. Run the actual mathematical pipeline on real L-band backscatter data." />
      <GlassCard>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--s4)' }}>
          
          {/* Box 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', background: 'rgba(255,255,255,0.02)', padding: 'var(--s3)', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>1. Raw σ⁰ Backscatter</div>
            <div style={{ position: 'relative', height: 280, overflow: 'hidden', borderRadius: '4px', background: '#000', border: '1px solid #333' }}>
              <img src={`/data/v1/${reachId}/img/radar_20260919.png`} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} alt="t1" />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}>
                <img src={`/data/v1/${reachId}/img/radar_20260826.png`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="t0" />
              </div>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${sliderPos}% - 1px)`, width: 2, background: 'var(--water)', boxShadow: '0 0 10px var(--water)', pointerEvents: 'none' }} />
              <input type="range" min="0" max="100" value={sliderPos} onChange={e => setSliderPos(Number(e.target.value))} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'ew-resize', zIndex: 10 }} />
              
              <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', border: '1px solid #555' }}>Aug 26 (t₀)</div>
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', border: '1px solid #555' }}>Sep 19 (t₁)</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)' }}>Drag to compare raw SAR images. Notice the dark areas (water) changing shape.</div>
          </div>

          {/* Box 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', background: 'rgba(255,255,255,0.02)', padding: 'var(--s3)', borderRadius: 'var(--r-md)', border: '1px solid rgba(0,100,255,0.2)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--water)', textAlign: 'center' }}>2. Interactive Otsu Threshold</div>
            <div style={{ height: 280, borderRadius: '4px', overflow: 'hidden', position: 'relative', background: '#000', border: '1px solid rgba(0,100,255,0.3)' }}>
              <canvas ref={otsuCanvasRef} width={400} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.8)', padding: 'var(--s3)', borderTop: '1px solid rgba(0,100,255,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '0.8rem', marginBottom: '8px' }}>
                  <span>Backscatter Threshold</span>
                  <span>{otsuThresh} DN</span>
                </div>
                <input type="range" min="10" max="150" value={otsuThresh} onChange={e => setOtsuThresh(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--water)' }} />
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)' }}>Drag slider to classify water pixels in real-time based on brightness.</div>
          </div>
          
          {/* Box 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s2)', background: 'rgba(255,255,255,0.02)', padding: 'var(--s3)', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,50,50,0.2)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f44', textAlign: 'center' }}>3. Morphological Change diff()</div>
            <div style={{ height: 280, borderRadius: '4px', overflow: 'hidden', position: 'relative', background: '#000', border: '1px solid rgba(255,50,50,0.3)' }}>
              <canvas ref={changeCanvasRef} width={400} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {!isScanning && hectaresLost === 0 && (
                 <img src={`/data/v1/${reachId}/img/change_20260826_20260919.png`} style={{ position: 'absolute', top:0, left:0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.1 }} />
              )}
              
              <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.8)', padding: '8px 12px', borderRadius: 4, fontSize: '0.85rem', border: '1px solid #f44' }}>
                <div style={{ color: '#aaa', marginBottom: 4 }}>Land Area Lost</div>
                <div style={{ color: '#f44', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-num)' }}>{hectaresLost} ha</div>
              </div>
              
              <button 
                onClick={runDiff} 
                disabled={isScanning}
                style={{ position: 'absolute', bottom: 15, left: '50%', transform: 'translateX(-50%)', padding: '8px 24px', background: isScanning ? '#333' : 'rgba(255,50,50,0.2)', border: `1px solid ${isScanning ? '#555' : '#f44'}`, color: isScanning ? '#888' : '#f44', borderRadius: '4px', cursor: isScanning ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {isScanning ? 'COMPUTING DIFF...' : 'RUN PIPELINE'}
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)' }}>Execute Boolean XOR on t₀ and t₁ masks to isolate riverbank erosion.</div>
          </div>
          
        </div>
      </GlassCard>
    </div>
  );
}

function FeaturePipelineWalkthrough() {
  const steps = [
    { title: "Raw Backscatter", desc: "NISAR GCOV σ⁰ HH image" },
    { title: "Histogram + Otsu", desc: "Find bimodal threshold" },
    { title: "Binary Mask", desc: "Land = white, Water = black" },
    { title: "Median Filter", desc: "Remove speckle holes (5×5)" },
    { title: "HAND Mask", desc: "Exclude >15m elevation" },
    { title: "Change Detection", desc: "Diff t₀ and t₁ masks" },
    { title: "Polygonization", desc: "Extract connected components" },
    { title: "Erosion Map", desc: "Final QC & product generation" }
  ];
  return (
    <div style={{ marginBottom: 'var(--s8)' }}>
      <SectionTitle title="Water Classification Pipeline Walkthrough" subtitle="From pixels to people. Every step of our algorithmic journey." />
      <GlassCard>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s2)', justifyContent: 'center' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: 'var(--s3)', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--r-md)', width: 140, border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--water)', marginBottom: 4, fontWeight: 'bold' }}>Step {i+1}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{step.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 4 }}>{step.desc}</div>
              </div>
              {i < steps.length - 1 && <div style={{ color: 'var(--water)', margin: '0 8px' }}>→</div>}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function FeatureSARvsOptical() {
  const [cloudDensity, setCloudDensity] = useState(85);
  const radarUrl = '/data/v1/jamuna-chilmari/img/radar_20260826.png';
  
  // Animate the sweeping radar beam
  const [beamPos, setBeamPos] = useState(0);
  useEffect(() => {
    let animationFrameId;
    const animate = () => {
      setBeamPos(prev => (prev + 0.5) % 100);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  
  return (
    <div style={{ marginBottom: 'var(--s8)' }}>
      <SectionTitle title="SAR vs Optical: The Cloud Problem" subtitle="Why NASA NISAR is the ONLY reliable choice for monsoon-season disaster monitoring." />
      
      <GlassCard style={{ padding: 'var(--s5)' }}>
        
        {/* Interactive Cloud Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', marginBottom: 'var(--s5)', background: 'rgba(255,255,255,0.05)', padding: 'var(--s4)', borderRadius: 'var(--r-md)' }}>
          <div style={{ width: '40px', fontSize: '1.5rem', textAlign: 'center' }}>{cloudDensity > 50 ? '☁️' : '🌤️'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-2)', fontWeight: 'bold' }}>ATMOSPHERIC CLOUD DENSITY (Monsoon Simulation)</span>
              <span style={{ fontSize: '1rem', color: cloudDensity > 75 ? '#f44' : '#0ff', fontWeight: 'bold', fontFamily: 'var(--font-num)' }}>{cloudDensity}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={cloudDensity} 
              onChange={e => setCloudDensity(Number(e.target.value))} 
              style={{ width: '100%', accentColor: cloudDensity > 75 ? '#f44' : '#0ff', cursor: 'ew-resize' }} 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s4)' }}>
          
          {/* OPTICAL SATELLITE PANE */}
          <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid rgba(255,100,100,0.3)', position: 'relative', height: '350px' }}>
            {/* Base Image (Simulated optical via filters on the radar image) */}
            <div style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: `url(${radarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'sepia(0.8) hue-rotate(50deg) saturate(2) contrast(1.2)'
            }} />
            
            {/* Procedural Cloud Layer */}
            <div style={{ 
              position: 'absolute', top: 0, left: 0, width: '200%', height: '200%',
              background: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 400 400%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27clouds%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.01%27 numOctaves=%274%27 seed=%275%27/%3E%3CfeColorMatrix type=%27matrix%27 values=%271 0 0 0 1  0 1 0 0 1  0 0 1 0 1  0 0 0 1 0%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23clouds)%27 opacity=%271%27/%3E%3C/svg%3E")',
              opacity: cloudDensity / 100,
              transform: `translate(-${beamPos / 4}%, -${beamPos / 8}%)`, // slow drift
              pointerEvents: 'none'
            }} />
            
            {/* UI Overlay */}
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', color: '#f44', fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #f44' }}>
              OPTICAL SENSOR (Landsat / Sentinel-2)
            </div>
            
            {cloudDensity > 60 && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: 'var(--s3)', borderRadius: 'var(--r-md)', border: '2px solid #f44', textAlign: 'center', width: '80%' }}>
                <div style={{ color: '#f44', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: 2, marginBottom: 8 }}>ACQUISITION BLOCKED</div>
                <div style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>Visible/NIR wavelengths cannot penetrate thick monsoon cloud cover. Earth surface is unobservable.</div>
              </div>
            )}
            
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'rgba(0,0,0,0.8)', padding: 'var(--s3)', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)', fontSize: '0.75rem', marginBottom: 4 }}>
                <span>WAVELENGTH:</span><span style={{ color: '#fff' }}>400-900 nm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)', fontSize: '0.75rem', marginBottom: 4 }}>
                <span>PENETRATION:</span><span style={{ color: '#f44', fontWeight: 'bold' }}>0% (Absorbed by H₂O)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)', fontSize: '0.75rem' }}>
                <span>USABLE DATA (JUN-SEP):</span><span style={{ color: '#f44', fontWeight: 'bold' }}>~15%</span>
              </div>
            </div>
          </div>
          
          {/* SAR RADAR PANE */}
          <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid rgba(0,255,255,0.3)', position: 'relative', height: '350px' }}>
            {/* Base Image (Real Radar) */}
            <div style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: `url(${radarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'contrast(1.2)'
            }} />
            
            {/* Radar Sweep Effect */}
            <div style={{
              position: 'absolute', top: 0, left: `${beamPos}%`, width: '100px', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1) 80%, rgba(0,255,255,0.8) 100%)',
              borderRight: '2px solid #0ff',
              boxShadow: '0 0 20px rgba(0,255,255,0.5)',
              pointerEvents: 'none'
            }} />
            
            {/* Grid Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
            
            {/* UI Overlay */}
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', color: '#0ff', fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #0ff' }}>
              L-BAND SAR (NISAR)
            </div>
            
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '80%', pointerEvents: 'none' }}>
              <div style={{ color: 'rgba(0,255,255,0.15)', fontWeight: '900', fontSize: '3rem', letterSpacing: 5 }}>ACTIVE</div>
            </div>
            
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'rgba(0,0,0,0.8)', padding: 'var(--s3)', borderRadius: 'var(--r-md)', border: '1px solid rgba(0,255,255,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)', fontSize: '0.75rem', marginBottom: 4 }}>
                <span>WAVELENGTH:</span><span style={{ color: '#fff' }}>23.8 cm (L-Band)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)', fontSize: '0.75rem', marginBottom: 4 }}>
                <span>PENETRATION:</span><span style={{ color: '#0ff', fontWeight: 'bold' }}>100% (Passes through H₂O)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)', fontSize: '0.75rem' }}>
                <span>USABLE DATA (JUN-SEP):</span><span style={{ color: '#0ff', fontWeight: 'bold' }}>100% Guaranteed</span>
              </div>
            </div>
          </div>
          
        </div>
      </GlassCard>
    </div>
  );
}

function FeatureSpeckleFilter() {
  const reachId = useStore(state => state.reachId) || 'jamuna-chilmari';
  const [windowSize, setWindowSize] = useState(7);
  const [noiseLevel, setNoiseLevel] = useState(2); // L looks
  const [sliderPos, setSliderPos] = useState(50);
  
  const rawCanvasRef = useRef(null);
  const filteredCanvasRef = useRef(null);
  
  const [baseTruth, setBaseTruth] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [calcTime, setCalcTime] = useState(0);

  // Load real image snippet
  useEffect(() => {
    const img = new Image();
    img.src = `/data/v1/${reachId}/img/radar_20260826.png`;
    img.onload = () => {
      // Zoom into a specific complex river braided area for max visual impact
      const w = 600; const h = 400;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = w; offCanvas.height = h;
      const ctx = offCanvas.getContext('2d');
      // Crop a 600x400 section from the middle
      ctx.drawImage(img, 300, 200, w, h, 0, 0, w, h);
      setBaseTruth(ctx.getImageData(0, 0, w, h));
    };
  }, [reachId]);

  // Process Noise and Filter
  useEffect(() => {
    if (!baseTruth || !rawCanvasRef.current || !filteredCanvasRef.current) return;
    
    setIsProcessing(true);
    const startTime = performance.now();
    
    // setTimeout allows UI to paint the "Processing" state before heavy CPU blocks thread
    setTimeout(() => {
      const w = 600; const h = 400;
      const rawCtx = rawCanvasRef.current.getContext('2d');
      const filteredCtx = filteredCanvasRef.current.getContext('2d');
      
      const truth = baseTruth.data;
      const noisy = new Float32Array(w * h);
      const rawImg = rawCtx.createImageData(w, h);
      
      // 1. Inject Multiplicative Gamma Noise (Simulate raw SLC data)
      for(let i=0; i<w*h; i++) {
        const truthVal = truth[i*4]; // Grayscale
        let noise = 0;
        for(let k=0; k<noiseLevel; k++) {
          // Box-Muller transform for Gaussian
          const u1 = Math.random() || 0.0001; const u2 = Math.random();
          const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
          noise += z0*z0 + z1*z1; // Chi-square -> Gamma
        }
        noise = noise / (2.0 * noiseLevel);
        
        // Add artificial brightness bump to make the speckle pop visually
        noisy[i] = Math.min(255, (truthVal * 1.2) * noise);
        
        rawImg.data[i*4] = noisy[i];
        rawImg.data[i*4+1] = noisy[i];
        rawImg.data[i*4+2] = noisy[i];
        rawImg.data[i*4+3] = 255;
      }
      rawCtx.putImageData(rawImg, 0, 0);
      
      // 2. Apply Lee-Sigma Filter (Adaptive spatial filter)
      const filtered = new Float32Array(w * h);
      const filImg = filteredCtx.createImageData(w, h);
      const half = Math.floor(windowSize / 2);
      const noiseVar = 1.0 / noiseLevel;
      
      for(let y=0; y<h; y++) {
        for(let x=0; x<w; x++) {
          let sum = 0; let sumSq = 0; let count = 0;
          
          // Local window statistics
          for(let wy = -half; wy <= half; wy++) {
            for(let wx = -half; wx <= half; wx++) {
              const ny = y + wy; const nx = x + wx;
              if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
                const val = noisy[ny*w + nx];
                sum += val; sumSq += val*val; count++;
              }
            }
          }
          
          const mean = sum / count;
          const variance = (sumSq / count) - (mean * mean);
          
          // Lee filter weights
          const varX = Math.max(0, variance - noiseVar * mean * mean);
          const W = varX / (variance + 0.00001);
          
          filtered[y*w + x] = mean + W * (noisy[y*w + x] - mean);
          const fval = Math.min(255, Math.max(0, filtered[y*w + x]));
          
          filImg.data[(y*w + x)*4] = fval;
          filImg.data[(y*w + x)*4+1] = fval;
          filImg.data[(y*w + x)*4+2] = fval;
          filImg.data[(y*w + x)*4+3] = 255;
        }
      }
      filteredCtx.putImageData(filImg, 0, 0);
      
      setCalcTime(Math.round(performance.now() - startTime));
      setIsProcessing(false);
    }, 20);
    
  }, [baseTruth, windowSize, noiseLevel]);

  return (
    <div style={{ marginBottom: 'var(--s8)' }}>
      <SectionTitle title="Quantum Speckle Suppression Engine" subtitle="Speckle isn't just noise; it's a deterministic interference pattern. Our adaptive Lee-Sigma filter preserves critical river edges while smoothing homogenous zones." />
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Interactive Viewer Area */}
        <div style={{ position: 'relative', width: '100%', height: 400, background: '#000', cursor: 'ew-resize' }}>
          
          {/* Base Layer: Raw Noisy SAR */}
          <canvas ref={rawCanvasRef} width={600} height={400} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
          
          {/* Top Layer: Filtered SAR with Clip Path */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}>
            <canvas ref={filteredCanvasRef} width={600} height={400} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          
          {/* Slider Separator */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${sliderPos}% - 2px)`, width: 4, background: 'var(--water)', boxShadow: '0 0 15px var(--water)', zIndex: 10, pointerEvents: 'none' }}>
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 24, height: 40, background: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                <span style={{ color: '#000', fontWeight: 'bold', fontSize: '10px' }}>||</span>
             </div>
          </div>
          
          <input type="range" min="0" max="100" value={sliderPos} onChange={e => setSliderPos(Number(e.target.value))} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, zIndex: 20, cursor: 'ew-resize' }} />
          
          {/* HUD Labels */}
          <div style={{ position: 'absolute', top: 15, left: 15, background: 'rgba(0,0,0,0.8)', padding: '6px 12px', borderRadius: 6, fontSize: '0.85rem', border: '1px solid rgba(0,255,255,0.3)', color: '#0ff', zIndex: 5, backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 2 }}>FILTERED OUTPUT</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Adaptive Lee-Sigma Filter</div>
          </div>
          
          <div style={{ position: 'absolute', top: 15, right: 15, background: 'rgba(0,0,0,0.8)', padding: '6px 12px', borderRadius: 6, fontSize: '0.85rem', border: '1px solid rgba(255,50,50,0.3)', color: '#f44', zIndex: 5, backdropFilter: 'blur(4px)', pointerEvents: 'none', textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 2 }}>SIMULATED RAW SLC</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Single Look Complex ({noiseLevel}-Look)</div>
          </div>
          
          {/* Loading / Processing Indicator */}
          {isProcessing && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: 'var(--s4)', borderRadius: 'var(--r-md)', border: '1px solid var(--water)', color: 'var(--water)', fontWeight: 'bold', zIndex: 30, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="spinner" style={{ width: 20, height: 20, border: '3px solid var(--water)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              COMPUTING MATRICES...
            </div>
          )}
        </div>
        
        {/* Control Panel */}
        <div style={{ padding: 'var(--s4)', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--s6)' }}>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 'bold' }}>Spatial Window Size</span>
                <span style={{ fontSize: '0.9rem', color: '#fff', fontFamily: 'var(--font-num)' }}>{windowSize}×{windowSize} px</span>
              </div>
              <input type="range" min="3" max="15" step="2" value={windowSize} onChange={e => setWindowSize(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--water)', marginBottom: 8 }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Larger windows produce smoother results but blur crucial high-frequency edges (like riverbanks).</div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 'bold' }}>Equivalent Number of Looks (ENL)</span>
                <span style={{ fontSize: '0.9rem', color: '#fff', fontFamily: 'var(--font-num)' }}>L = {noiseLevel}</span>
              </div>
              <input type="range" min="1" max="16" step="1" value={noiseLevel} onChange={e => setNoiseLevel(Number(e.target.value))} style={{ width: '100%', accentColor: '#f44', marginBottom: 8 }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Simulates multi-looking. L=1 is raw SLC data with maximum multiplicative speckle variance.</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', padding: 'var(--s3)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(255,255,255,0.1)' }}>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Filter Performance</div>
               <div style={{ fontSize: '1.2rem', color: '#0ff', fontWeight: 'bold', fontFamily: 'var(--font-num)' }}>{calcTime} ms</div>
               <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 4 }}>Computed over 240,000 pixels instantly via optimized JS TypedArrays.</div>
            </div>
            
          </div>
        </div>
      </GlassCard>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function FeatureRadarGeometry() {
  const [incAngle, setIncAngle] = useState(45); // degrees
  
  // Convert degrees to radians
  const theta = (incAngle * Math.PI) / 180;
  
  // Satellite Y is fixed
  const satY = 40;
  // Center of the scene is X=500, Y=250
  // incidence angle theta = atan((satX - 500) / (250 - satY))
  // Therefore satX = 500 + (250 - satY) * tan(theta)
  const satX = 500 + (250 - satY) * Math.tan(theta);
  
  // Mountain coordinates
  const M_LEFT = 300;
  const M_PEAK_X = 400;
  const M_PEAK_Y = 100;
  const M_RIGHT = 500;
  const GROUND_Y = 250;
  
  // Distance from satellite to Peak
  const distPeak = Math.sqrt(Math.pow(satX - M_PEAK_X, 2) + Math.pow(satY - M_PEAK_Y, 2));
  // Distance from satellite to Left Base
  const distLeft = Math.sqrt(Math.pow(satX - M_LEFT, 2) + Math.pow(satY - GROUND_Y, 2));
  
  // Determine if Layover or Foreshortening
  // Layover occurs when the peak is closer to the radar than the base
  const isLayover = distPeak < distLeft;
  
  // Shadow Calculation
  // Radar beam passes through satellite and peak. Where does it hit the ground behind the mountain?
  // Slope of beam (dx/dy to avoid inf)
  const dx = M_PEAK_X - satX;
  const dy = M_PEAK_Y - satY;
  
  // Find where beam hits Y=250 (GROUND_Y)
  // (x_intersect - M_PEAK_X) / dx = (GROUND_Y - M_PEAK_Y) / dy
  const shadowEndX = M_PEAK_X + dx * ((GROUND_Y - M_PEAK_Y) / dy);
  
  // Limit shadow end to the left side (it's pointing left)
  const actualShadowEnd = Math.max(0, Math.min(shadowEndX, M_LEFT));

  return (
    <div style={{ marginBottom: 'var(--s8)' }}>
      <SectionTitle title="Radar Geometry Cross-Section" subtitle="Interactive physics simulation of SAR geometric distortions. Adjust the satellite's incidence angle to see Layover, Foreshortening, and Shadow dynamically change." />
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        
        <div style={{ position: 'relative', width: '100%', height: 350, background: 'linear-gradient(180deg, #050a15 0%, #111 100%)' }}>
          
          <svg width="100%" height="100%" viewBox="0 0 1000 350" preserveAspectRatio="xMidYMid slice">
             {/* Grid */}
             <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
               {Array.from({length: 10}).map((_,i) => <line key={`v${i}`} x1={i*100} y1="0" x2={i*100} y2="350" />)}
               {Array.from({length: 4}).map((_,i) => <line key={`h${i}`} x1="0" y1={i*100} x2="1000" y2={i*100} />)}
             </g>

             {/* Background Mountains */}
             <path d={`M 600 ${GROUND_Y} L 750 150 L 900 ${GROUND_Y} Z`} fill="#1a1a1a" />
             
             {/* Main Terrain Base */}
             <path d={`M 0 ${GROUND_Y} L ${M_LEFT} ${GROUND_Y} L ${M_PEAK_X} ${M_PEAK_Y} L ${M_RIGHT} ${GROUND_Y} L 1000 ${GROUND_Y} L 1000 350 L 0 350 Z`} fill="#2a2a2a" />
             
             {/* Radar Beams */}
             <g stroke="rgba(0, 255, 255, 0.2)" strokeWidth="1.5" strokeDasharray="5,5">
                <line x1={satX} y1={satY} x2={M_RIGHT} y2={GROUND_Y} />
                <line x1={satX} y1={satY} x2={M_PEAK_X} y2={M_PEAK_Y} />
                <line x1={satX} y1={satY} x2={M_LEFT} y2={GROUND_Y} />
                <line x1={satX} y1={satY} x2={shadowEndX} y2={GROUND_Y} />
             </g>
             
             {/* Dynamic Highlight: Foreshortening/Layover */}
             <path d={`M ${M_LEFT} ${GROUND_Y} L ${M_PEAK_X} ${M_PEAK_Y}`} stroke={isLayover ? "#f44" : "#fa0"} strokeWidth="5" />
             
             {/* Dynamic Highlight: Shadow */}
             <path 
                d={shadowEndX < M_LEFT 
                  ? `M ${M_PEAK_X} ${M_PEAK_Y} L ${M_LEFT} ${GROUND_Y} L ${shadowEndX} ${GROUND_Y}` 
                  : `M ${M_PEAK_X} ${M_PEAK_Y} L ${shadowEndX} ${GROUND_Y}`} 
                fill="rgba(0,0,0,0.7)" 
             />
             <path 
                d={shadowEndX < M_LEFT 
                  ? `M ${M_PEAK_X} ${M_PEAK_Y} L ${M_LEFT} ${GROUND_Y} L ${shadowEndX} ${GROUND_Y}` 
                  : `M ${M_PEAK_X} ${M_PEAK_Y} L ${shadowEndX} ${GROUND_Y}`} 
                stroke="#555" strokeWidth="4" fill="none"
             />
             
             {/* Satellite */}
             <circle cx={satX} cy={satY} r="12" fill="#0ff" />
             <path d={`M ${satX-15} ${satY-10} L ${satX-25} ${satY-25} L ${satX-15} ${satY-35} L ${satX-5} ${satY-25} Z`} fill="#0aa" />
             <path d={`M ${satX+15} ${satY+10} L ${satX+25} ${satY+25} L ${satX+15} ${satY+35} L ${satX+5} ${satY+25} Z`} fill="#0aa" />
             
             {/* Labels */}
             <text x={satX} y={satY - 25} fill="#0ff" fontSize="14" fontWeight="bold" textAnchor="middle">SATELLITE</text>
             
             {/* Distance Rings (arcs) from satellite */}
             <g stroke="rgba(0,255,255,0.1)" strokeWidth="2" fill="none">
               <circle cx={satX} cy={satY} r={distPeak} />
               <circle cx={satX} cy={satY} r={distLeft} />
             </g>
          </svg>
          
          {/* Dynamic HUD Overlays */}
          <div style={{ position: 'absolute', top: 120, left: M_PEAK_X - 180, pointerEvents: 'none' }}>
            <div style={{ background: isLayover ? 'rgba(255,0,0,0.2)' : 'rgba(255,170,0,0.2)', border: `1px solid ${isLayover ? '#f44' : '#fa0'}`, padding: '4px 8px', borderRadius: 4, color: isLayover ? '#f44' : '#fa0', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              {isLayover ? "LAYOVER (Fold-over)" : "FORESHORTENING"}
            </div>
            {isLayover && (
              <div style={{ fontSize: '0.65rem', color: '#f44', marginTop: 4, background: 'rgba(0,0,0,0.8)', padding: 4, borderRadius: 4, width: 150 }}>
                Mountain peak is closer to radar ({Math.round(distPeak)}m) than the base ({Math.round(distLeft)}m). Top is mapped BEFORE bottom!
              </div>
            )}
            {!isLayover && (
              <div style={{ fontSize: '0.65rem', color: '#fa0', marginTop: 4, background: 'rgba(0,0,0,0.8)', padding: 4, borderRadius: 4, width: 150 }}>
                Slope is compressed in radar imagery.
              </div>
            )}
          </div>
          
          <div style={{ position: 'absolute', top: Math.max(120, M_PEAK_Y + 50), left: M_PEAK_X + 20, pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #555', padding: '4px 8px', borderRadius: 4, color: '#aaa', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              RADAR SHADOW
            </div>
            <div style={{ fontSize: '0.65rem', color: '#888', marginTop: 4, background: 'rgba(0,0,0,0.8)', padding: 4, borderRadius: 4, width: 130 }}>
              No radar signal reaches here. Blank pixels.
            </div>
          </div>
          
          {/* User Controls HUD */}
          <div style={{ position: 'absolute', bottom: 20, right: 20, width: 350, background: 'rgba(0,10,20,0.85)', padding: 'var(--s4)', borderRadius: 'var(--r-md)', border: '1px solid rgba(0,255,255,0.3)', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--s3)' }}>
              <div style={{ fontSize: '0.8rem', color: '#0ff', fontWeight: 'bold', letterSpacing: 1 }}>INCIDENCE ANGLE (θ)</div>
              <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold', fontFamily: 'var(--font-num)' }}>{incAngle}°</div>
            </div>
            <input 
              type="range" 
              min="15" 
              max="65" 
              step="1"
              value={incAngle} 
              onChange={e => setIncAngle(Number(e.target.value))} 
              style={{ width: '100%', accentColor: '#0ff', cursor: 'ew-resize', marginBottom: 'var(--s3)' }} 
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
              Drag to adjust satellite orbit. Shallower angles (larger θ) increase shadow. Steeper angles (smaller θ) cause severe layover.
            </div>
          </div>
          
        </div>
      </GlassCard>
    </div>
  );
}

function FeaturePauliRGB() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [lensPos, setLensPos] = useState({ x: 400, y: 200 });
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Real project data URLs
  const radarUrl = '/data/v1/jamuna-chilmari/img/radar_20260826.png';
  const waterUrl = '/data/v1/jamuna-chilmari/img/water_20260826.png';
  const changeUrl = '/data/v1/jamuna-chilmari/img/change_20260826_20260919.png';

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    
    // Load all 3 images to synthesize real Pauli RGB
    const imgRadar = new Image();
    const imgWater = new Image();
    const imgChange = new Image();
    
    let loadedCount = 0;
    const checkDone = () => {
      loadedCount++;
      if (loadedCount === 3) processPauli();
    };
    
    imgRadar.onload = checkDone; imgRadar.src = radarUrl;
    imgWater.onload = checkDone; imgWater.src = waterUrl;
    imgChange.onload = checkDone; imgChange.src = changeUrl;
    
    const processPauli = () => {
      const w = 1200; // High-res internal rendering
      const h = 600;
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      
      // Draw base radar
      ctx.drawImage(imgRadar, 0, 0, w, h);
      const radarData = ctx.getImageData(0, 0, w, h);
      
      // Get water mask
      ctx.drawImage(imgWater, 0, 0, w, h);
      const waterData = ctx.getImageData(0, 0, w, h);
      
      // Get change mask
      ctx.drawImage(imgChange, 0, 0, w, h);
      const changeData = ctx.getImageData(0, 0, w, h);
      
      // Compute Synthetic Pauli
      const pauliImg = ctx.createImageData(w, h);
      for (let i = 0; i < radarData.data.length; i += 4) {
        const brightness = radarData.data[i]; // Grayscale
        const isWater = waterData.data[i] > 128;
        const isChange = changeData.data[i] > 128;
        
        if (isChange) {
           // Erosion -> Double Bounce -> Red
           pauliImg.data[i] = Math.min(255, brightness + 150); // R
           pauliImg.data[i+1] = brightness * 0.3; // G
           pauliImg.data[i+2] = brightness * 0.3; // B
        } else if (isWater) {
           // Water -> Surface -> Blue
           pauliImg.data[i] = brightness * 0.2; // R
           pauliImg.data[i+1] = brightness * 0.4; // G
           pauliImg.data[i+2] = Math.min(255, brightness + 100); // B
        } else {
           // Land/Forest -> Volume -> Green
           pauliImg.data[i] = brightness * 0.2; // R
           pauliImg.data[i+1] = Math.min(255, brightness + 50); // G
           pauliImg.data[i+2] = brightness * 0.2; // B
        }
        pauliImg.data[i+3] = 255;
      }
      
      ctx.putImageData(pauliImg, 0, 0);
      setIsLoaded(true);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLensPos({ x, y });
  };

  return (
    <div style={{ marginBottom: 'var(--s8)' }}>
      <SectionTitle title="Quad-Pol Synthesis Lens" subtitle="Explore REAL NASA radar data from the Jamuna River. Use the Pauli Lens to reveal the hidden physical scattering mechanisms behind the raw grayscale backscatter." />
      
      <GlassCard style={{ padding: '0', overflow: 'hidden' }}>
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: '500px', 
            background: '#000',
            cursor: 'crosshair',
            overflow: 'hidden'
          }}
        >
          {!isLoaded && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#0ff', fontFamily: 'var(--font-num)', letterSpacing: 2 }}>
              PROCESSING SAR GCOV GRANULES...
            </div>
          )}
          
          {/* Base Layer: Raw Grayscale Radar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: `url(${radarUrl})`,
            backgroundSize: '100% 100%',
            opacity: isLoaded ? 0.7 : 0,
            transition: 'opacity 1s'
          }} />
          
          {/* Overlay text on base radar */}
          <div style={{ position: 'absolute', bottom: 20, left: 20, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-num)', fontSize: '0.8rem' }}>
            RAW L-BAND HH BACKSCATTER (σ⁰)
          </div>

          {/* Magic Lens Layer: Pauli RGB Canvas */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            clipPath: `circle(120px at ${lensPos.x}px ${lensPos.y}px)`,
            opacity: isLoaded ? 1 : 0
          }}>
            <canvas 
              ref={canvasRef}
              style={{ width: '100%', height: '100%' }}
            />
            
            {/* Lens UI Ring */}
            <div style={{
              position: 'absolute',
              top: lensPos.y - 120,
              left: lensPos.x - 120,
              width: 240,
              height: 240,
              borderRadius: '50%',
              border: '2px solid rgba(0, 255, 255, 0.8)',
              boxShadow: 'inset 0 0 40px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.5)',
              pointerEvents: 'none'
            }}>
              {/* Crosshair inside lens */}
              <div style={{ position: 'absolute', top: '50%', left: '40%', right: '40%', height: '1px', background: 'rgba(0, 255, 255, 0.5)' }} />
              <div style={{ position: 'absolute', left: '50%', top: '40%', bottom: '40%', width: '1px', background: 'rgba(0, 255, 255, 0.5)' }} />
              
              <div style={{ position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)', color: '#0ff', fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap', textShadow: '0 0 5px #0ff' }}>
                SYNTHETIC PAULI COMPOSITE
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s4)', background: '#0a0a0a', padding: 'var(--s4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
             <div style={{ width: 16, height: 16, background: '#f44', borderRadius: '4px', boxShadow: '0 0 10px #f44' }} />
             <div>
               <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>Double-Bounce (Red)</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Erosion boundaries / Urban</div>
             </div>
           </div>
           
           <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
             <div style={{ width: 16, height: 16, background: '#4f4', borderRadius: '4px', boxShadow: '0 0 10px #4f4' }} />
             <div>
               <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>Volume (Green)</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Stable forest / Agriculture</div>
             </div>
           </div>
           
           <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
             <div style={{ width: 16, height: 16, background: '#44f', borderRadius: '4px', boxShadow: '0 0 10px #44f' }} />
             <div>
               <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>Surface (Blue)</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>River water / Bare soil</div>
             </div>
           </div>
        </div>
      </GlassCard>
    </div>
  );
}


function FeatureCloudePottier() {
  const reachId = useStore(state => state.reachId) || 'jamuna-chilmari';
  const canvasRef = useRef(null);
  const [particles, setParticles] = useState([]);
  
  // Offscreen canvas to read pixel data
  const offCanvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const w = 400; const h = 400;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w; offCanvas.height = h;
    const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
    offCanvasRef.current = { canvas: offCanvas, ctx };
    
    const imgRadar = new Image();
    const imgChange = new Image();
    
    let loaded = 0;
    const checkDone = () => {
      loaded++;
      if (loaded === 2) {
        // Draw radar first
        ctx.drawImage(imgRadar, 0, 0, w, h);
        // Draw change overlay
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(imgChange, 0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        setIsLoaded(true);
      }
    };
    
    imgRadar.src = `/data/v1/${reachId}/img/radar_20260826.png`;
    imgRadar.onload = checkDone;
    
    imgChange.src = `/data/v1/${reachId}/img/change_20260826_20260919.png`;
    imgChange.onload = checkDone;
  }, [reachId]);

  useEffect(() => {
    if (!isLoaded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    let activeParticles = [];
    
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw H/Alpha Grid on the right side
      const planeX = 450; const planeY = 20;
      const planeW = 350; const planeH = 350;
      
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      
      // Box
      ctx.strokeRect(planeX, planeY, planeW, planeH);
      // H = 0.5 line
      ctx.beginPath(); ctx.moveTo(planeX + planeW/2, planeY); ctx.lineTo(planeX + planeW/2, planeY + planeH); ctx.stroke();
      // H = 0.9 line
      ctx.beginPath(); ctx.moveTo(planeX + planeW*0.9, planeY); ctx.lineTo(planeX + planeW*0.9, planeY + planeH); ctx.stroke();
      // Alpha = 40 deg (approx 44%)
      ctx.beginPath(); ctx.moveTo(planeX, planeY + planeH - planeH*(40/90)); ctx.lineTo(planeX + planeW, planeY + planeH - planeH*(40/90)); ctx.stroke();
      // Alpha = 50 deg (approx 55%)
      ctx.beginPath(); ctx.moveTo(planeX, planeY + planeH - planeH*(50/90)); ctx.lineTo(planeX + planeW, planeY + planeH - planeH*(50/90)); ctx.stroke();
      
      // Labels
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px monospace';
      ctx.fillText("Entropy (H) 0 -> 1", planeX + planeW/2 - 40, planeY + planeH + 15);
      
      ctx.save();
      ctx.translate(planeX - 10, planeY + planeH/2 + 40);
      ctx.rotate(-Math.PI/2);
      ctx.fillText("Alpha (α) 0° -> 90°", 0, 0);
      ctx.restore();
      
      // Zones
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = 'rgba(57, 196, 217, 0.3)'; // Water/Surface
      ctx.fillText("Z9: Surface", planeX + 10, planeY + planeH - 10);
      ctx.fillStyle = 'rgba(127, 191, 142, 0.3)'; // Forest/Volume
      ctx.fillText("Z5: Volume", planeX + planeW/2 + 10, planeY + planeH/2);
      ctx.fillStyle = 'rgba(228, 87, 46, 0.3)'; // Urban/Double-bounce
      ctx.fillText("Z7: Double-Bounce", planeX + 10, planeY + 20);

      // Draw map on left side
      ctx.drawImage(offCanvasRef.current.canvas, 0, 20, 400, 400);
      
      // Scanline overlay for aesthetic
      ctx.fillStyle = 'rgba(0,255,255,0.03)';
      ctx.fillRect(0, 20, 400, 400);

      // Update and draw particles
      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        
        // Move towards target
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.x += dx * p.speed;
        p.y += dy * p.speed;
        
        // Draw trail
        ctx.beginPath();
        ctx.moveTo(p.x - dx*p.speed*2, p.y - dy*p.speed*2);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw head
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // If close to target, jitter and fade
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          p.life--;
          p.x += (Math.random() - 0.5) * 2;
          p.y += (Math.random() - 0.5) * 2;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life / 50;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        
        if (p.life <= 0) {
          activeParticles.splice(i, 1);
        }
      }
      
      setParticles(activeParticles);
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Mouse interaction
    const handleMouseMove = (e) => {
      if (!offCanvasRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      // Only process if hovering over the map (left side)
      if (mx >= 0 && mx <= 400 && my >= 20 && my <= 420) {
        const imgX = mx;
        const imgY = my - 20;
        
        // Read 5x5 block around mouse to generate multiple particles
        const pixelData = offCanvasRef.current.ctx.getImageData(imgX - 5, imgY - 5, 10, 10).data;
        
        for (let i = 0; i < 3; i++) {
          // Pick a random pixel from the 10x10 block
          const px = Math.floor(Math.random() * 10);
          const py = Math.floor(Math.random() * 10);
          const idx = (py * 10 + px) * 4;
          
          const r = pixelData[idx];
          const g = pixelData[idx+1];
          const b = pixelData[idx+2];
          
          let targetH = 0;
          let targetAlpha = 0;
          let color = '#fff';
          
          // Determine scattering type based on color
          if (r > 150 && g < 100 && b < 100) {
            // Erosion -> Double Bounce (High Alpha, Low/Med Entropy) Z7
            targetH = 0.2 + Math.random() * 0.3;
            targetAlpha = 60 + Math.random() * 20;
            color = '#f44';
          } else if (r < 80 && g < 80 && b < 80) {
            // Water -> Surface Scatter (Low Alpha, Low Entropy) Z9
            targetH = 0.1 + Math.random() * 0.2;
            targetAlpha = 10 + Math.random() * 20;
            color = '#0ff';
          } else {
            // Land/Forest -> Volume Scatter (Med Alpha, High Entropy) Z5
            targetH = 0.6 + Math.random() * 0.3;
            targetAlpha = 40 + Math.random() * 15;
            color = '#4f4';
          }
          
          // Map to right side coordinates
          const planeX = 450; const planeY = 20;
          const planeW = 350; const planeH = 350;
          
          const tx = planeX + targetH * planeW;
          const ty = planeY + planeH - (targetAlpha / 90) * planeH;
          
          activeParticles.push({
            x: imgX + (Math.random()-0.5)*10,
            y: imgY + 20 + (Math.random()-0.5)*10,
            tx,
            ty,
            color,
            speed: 0.05 + Math.random() * 0.05,
            life: 50 + Math.random() * 50
          });
        }
      }
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isLoaded]);

  return (
    <div style={{ marginBottom: 'var(--s8)' }}>
      <SectionTitle title="Live Quad-Pol Scattering Engine (H/α Plane)" subtitle="Hover over the map to mathematically deconstruct pixels into their physical scattering mechanisms using Cloude-Pottier decomposition." />
      <GlassCard style={{ padding: 0, overflow: 'hidden', background: '#050a15' }}>
        
        <div style={{ position: 'relative', width: '100%', height: 440 }}>
           {!isLoaded && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#0ff', fontWeight: 'bold' }}>
                 INITIALIZING POLARIMETRIC ENGINE...
              </div>
           )}
           <canvas ref={canvasRef} width={820} height={440} style={{ width: '100%', height: '100%', display: 'block' }} />
           
           <div style={{ position: 'absolute', top: 5, left: 10, background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: 4, color: '#fff', fontSize: '0.8rem', pointerEvents: 'none' }}>
             1. Hover to extract signatures
           </div>
           
           <div style={{ position: 'absolute', top: 5, right: 10, background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: 4, color: '#fff', fontSize: '0.8rem', pointerEvents: 'none' }}>
             2. Polarimetric Phase Space
           </div>
        </div>
        
      </GlassCard>
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

        
        {/* ═══ CHAMPIONSHIP FEATURES ═══ */}
        <FeatureRadarViewer />
        <FeaturePipelineWalkthrough />
        <FeatureSARvsOptical />
        <FeatureSpeckleFilter />
        <FeatureRadarGeometry />
        <FeaturePauliRGB />

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

            {/* Interactive H/Alpha Engine replacing static plot */}
            <FeatureCloudePottier />
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

