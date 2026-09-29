import re

with open(r'D:\nasa 2026\web\src\pages\SARLab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we add necessary imports (useRef, useMemo, useEffect, useCallback)
content = content.replace("import { useState } from 'react';", "import { useState, useEffect, useRef, useMemo, useCallback } from 'react';")

# 1. Coherence Simulator (Section 5)
coherence_new = """
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
"""

# 2. Otsu Histogram (Section 7.1)
otsu_new = """
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
"""

# 3. InSAR Fringe Synthesizer (Section 7.2)
insar_new = """
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
"""

# 4. H-Alpha Scatter Plot (Section 7.3)
halpha_new = """
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
"""


# Add new states and hooks inside the component
states_new = """  const [activeBand, setActiveBand] = useState(2); // Default to L-band
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
  const insarCanvasRef = useRef(null);

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
    const rect = insarCanvasRef.current.getBoundingClientRect();
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
"""

# Replace the states
old_states_start = "const [activeBand, setActiveBand] = useState(2); // Default to L-band"
old_states_end = "const [hAlphaMode, setHAlphaMode] = useState(false);"
import re
pattern = re.compile(re.escape(old_states_start) + r'.*?' + re.escape(old_states_end), re.DOTALL)
content = pattern.sub(states_new, content)

# Replace Coherence Simulator
coherence_start = "{/* ═══ SECTION 5: COHERENCE SIMULATOR ═══ */}"
coherence_end = "{/* ═══ SECTION 6: WHY NISAR L-BAND MATTERS ═══ */}"
pattern_coh = re.compile(re.escape(coherence_start) + r'.*?(?=' + re.escape(coherence_end) + ')', re.DOTALL)
content = pattern_coh.sub(coherence_new, content)

# Replace Advanced SAR Physics Console children
console_start = "{/* Otsu Threshold */}"
console_end = "</div>\n        </div>\n\n        {/* Footer */}"
pattern_console = re.compile(re.escape(console_start) + r'.*?(?=' + re.escape("</div>\n        </div>\n\n        {/* Footer */}") + ")", re.DOTALL)
content = pattern_console.sub(otsu_new + insar_new + halpha_new, content)

with open(r'D:\nasa 2026\web\src\pages\SARLab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Update script completed successfully.")
