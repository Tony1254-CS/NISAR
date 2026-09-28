import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import '../styles/globe.css';
import '../styles/base.css';

// Counter Hook for animated numbers
function useCounter(end: number, duration = 2000, start = 0) {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * (end - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);
  
  return count;
}

export function ImpactPage() {
  const [hazardMode, setHazardMode] = useState<'erosion' | 'synergy'>('erosion');
  
  
  

  const popRisk = useCounter(hazardMode === 'erosion' ? 3247 : 8451, 1500, hazardMode === 'erosion' ? 0 : 3247);
  const econDamage = useCounter(hazardMode === 'erosion' ? 4.2 : 11.8, 1500, hazardMode === 'erosion' ? 0 : 4.2);
  const cropLost = useCounter(hazardMode === 'erosion' ? 847 : 1204, 1500, hazardMode === 'erosion' ? 0 : 847);
  const vulnIndex = hazardMode === 'erosion' ? 82 : 96;

  const primaryColor = hazardMode === 'erosion' ? 'var(--erosion)' : 'var(--accretion)';

  return (
    <div className="page-container">
      <Navbar transparent={false} />
      
      {/* Background Ambience */}
      <div className="ambient-glow" style={{ background: `radial-gradient(circle at 20% 30%, ${primaryColor}15 0%, transparent 50%)` }} />
      <div className="ambient-glow" style={{ background: `radial-gradient(circle at 80% 70%, ${primaryColor}10 0%, transparent 40%)` }} />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '6rem 2rem 4rem', position: 'relative', zIndex: 1 }}>
        <header className="fade-in-up" style={{ marginBottom: '4rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="section-label" style={{ color: primaryColor, marginBottom: '1rem', textShadow: `0 0 20px ${primaryColor}40` }}>
              DECISION INTELLIGENCE
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, margin: 0, lineHeight: 1.1, color: 'var(--text)' }}>
              Impact Quantifier
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '1.2rem', marginTop: '1rem', maxWidth: '600px', lineHeight: 1.6 }}>
              Translating raw radar detections into operational realities. 
              Physical land loss is instantaneous; economic destruction cascades over time.
            </p>
          </div>
          
          <div className="glass-panel" style={{ padding: '6px', display: 'flex', gap: '4px', borderRadius: '12px' }}>
            <button 
              onClick={() => setHazardMode('erosion')}
              className="mode-btn"
              style={{ 
                background: hazardMode === 'erosion' ? 'var(--erosion)' : 'transparent',
                color: hazardMode === 'erosion' ? '#fff' : 'var(--text-2)',
                boxShadow: hazardMode === 'erosion' ? '0 0 20px rgba(228,87,46,0.4)' : 'none'
              }}>
              Primary Hazard (Erosion)
            </button>
            <button 
              onClick={() => setHazardMode('synergy')}
              className="mode-btn"
              style={{ 
                background: hazardMode === 'synergy' ? 'var(--accretion)' : 'transparent',
                color: hazardMode === 'synergy' ? '#000' : 'var(--text-2)',
                boxShadow: hazardMode === 'synergy' ? '0 0 20px rgba(217,178,106,0.4)' : 'none'
              }}>
              Multi-Hazard Synergy
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          
          {/* Panel 1: Population at Risk */}
          <div className="glass-panel interactive-card fade-in-up" style={{ gridColumn: 'span 4', padding: '2.5rem', animationDelay: '0.1s' }}>
            <h2 className="card-eyebrow">POPULATION AT RISK</h2>
            
            <div className="metric-huge" style={{ color: primaryColor }}>
              {popRisk.toLocaleString()}
            </div>
            <p style={{ color: 'var(--text-2)', marginTop: '0.5rem', height: '48px', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {hazardMode === 'erosion' 
                ? 'People within 500m of the active riverbank erosion front.'
                : 'People exposed when combining erosion with -3.2cm/yr land subsidence.'}
            </p>
            
            <div style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontFamily: 'var(--font-num)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-3)' }}>VULNERABILITY INDEX</span>
                <span style={{ color: primaryColor, fontWeight: 700 }}>{vulnIndex}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill glow-pulse" style={{ width: `${vulnIndex}%`, background: primaryColor }} />
              </div>
            </div>

            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--line)', paddingTop: '2rem' }}>
              <h3 style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Evacuation Routing (OSM)</h3>
              <div className="status-badge status-pass">
                <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 700 }}>2 Safe Zones Identified</div>
                  <div style={{ opacity: 0.8, fontSize: '0.85rem', fontFamily: 'var(--font-num)' }}>ELEVATION &gt; 14M (SRTM)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Infrastructure */}
          <div className="glass-panel interactive-card fade-in-up" style={{ gridColumn: 'span 8', padding: '2.5rem', display: 'flex', flexDirection: 'column', animationDelay: '0.2s' }}>
            <h2 className="card-eyebrow">CRITICAL LIFELINE SEVERANCE</h2>
            <p style={{ color: 'var(--text-2)', marginBottom: '2rem', fontSize: '0.95rem' }}>Predictive intersection of SAR erosion trajectory with OpenStreetMap infrastructure networks.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', flex: 1 }}>
              <div className="infra-card" style={{ '--accent': 'var(--erosion)' } as any}>
                <div className="infra-icon">🏥</div>
                <div className="infra-title">Route N509</div>
                <div className="infra-alert">SEVERED IN 14 DAYS</div>
                <div className="infra-desc">Isolating 12,000 from primary hospital.</div>
              </div>
              
              <div className="infra-card" style={{ '--accent': 'var(--accretion)' } as any}>
                <div className="infra-icon">🏫</div>
                <div className="infra-title">14 Schools</div>
                <div className="infra-alert">STRUCTURAL RISK</div>
                <div className="infra-desc">Within 50m of active bank slump zone.</div>
              </div>

              <div className="infra-card" style={{ '--accent': 'var(--water)' } as any}>
                <div className="infra-icon">⚡</div>
                <div className="infra-title">Power Grid</div>
                <div className="infra-alert">3 TOWERS COMPROMISED</div>
                <div className="infra-desc">Foundations destabilized by flooding.</div>
              </div>
            </div>

            {/* Radar Sweep Infrastructure Vis */}
            <div className="infra-network">
              <div className="radar-scanner" />
              <svg width="100%" height="100%" viewBox="0 0 800 120" preserveAspectRatio="none">
                <path d="M 50 80 L 200 80 L 300 40 L 500 40 L 600 80 L 750 80" fill="none" stroke="var(--line-strong)" strokeWidth="3" />
                <path d="M 50 80 L 200 80" fill="none" stroke="var(--erosion)" strokeWidth="3" className="stroke-dash-anim" />
                
                <circle cx="200" cy="80" r="8" fill="var(--erosion)" className="pulse-dot" />
                <text x="180" y="60" fill="var(--erosion)" fontSize="12" fontFamily="var(--font-num)" fontWeight="600">BREACH</text>
                
                <circle cx="300" cy="40" r="6" fill="var(--accretion)" className="pulse-dot" style={{ animationDelay: '0.5s' }} />
                <circle cx="500" cy="40" r="6" fill="var(--water)" className="pulse-dot" style={{ animationDelay: '1s' }} />
              </svg>
            </div>
          </div>

          {/* Panel 3: Temporal Decay SVG Chart */}
          <div className="glass-panel interactive-card fade-in-up" style={{ gridColumn: 'span 12', padding: '3rem', animationDelay: '0.3s' }}>
            <h2 className="card-eyebrow">SOCIO-ECONOMIC TEMPORAL DECAY</h2>
            <p style={{ color: 'var(--text-2)', marginBottom: '3rem', maxWidth: '800px', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Physical land loss is instantaneous, but economic destruction cascades over time. This predictive model shows the delayed economic shockwaves resulting from the August erosion events hitting the November harvest season.
            </p>
            
            <div className="chart-container">
              <svg width="100%" height="100%" viewBox="0 0 1200 300" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map(val => (
                  <line key={val} x1="0" y1={300 - val*300} x2="1200" y2={300 - val*300} stroke="var(--line)" strokeDasharray="4 4" />
                ))}
                
                {/* Axes */}
                <text x="-15" y="150" fill="var(--text-3)" transform="rotate(-90 -15 150)" textAnchor="middle" fontFamily="var(--font-num)" fontSize="12" letterSpacing="2">ECONOMIC OUTPUT</text>
                
                {['Aug', 'Sep', 'Oct', 'Nov (Harvest)', 'Dec', 'Jan', 'Feb'].map((month, i) => (
                  <text key={month} x={i * 200} y="330" fill="var(--text-3)" textAnchor="middle" fontFamily="var(--font-num)" fontSize="12">{month}</text>
                ))}

                {/* Baseline */}
                <path d="M 0 50 L 1200 50" fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="5 5" />
                <text x="1100" y="35" fill="var(--text-3)" fontFamily="var(--font-num)" fontSize="12">EXPECTED BASELINE</text>

                {/* Physical Loss */}
                <path d="M 0 50 L 100 50 L 150 150 L 1200 150" fill="none" stroke="var(--erosion)" strokeWidth="3" className="draw-line" />
                <circle cx="125" cy="100" r="6" fill="var(--erosion)" className="pulse-dot" />
                <text x="140" y="110" fill="var(--erosion)" fontFamily="var(--font-num)" fontSize="12" fontWeight="700">LAND LOSS EVENT</text>

                {/* Economic Curve */}
                <path 
                  d={hazardMode === 'erosion' 
                    ? "M 0 50 L 600 50 Q 700 50, 700 220 L 1200 220" 
                    : "M 0 50 L 600 50 Q 700 50, 700 280 L 1200 280"} 
                  fill="none" 
                  stroke="var(--water)" 
                  strokeWidth="4" 
                  className="draw-line-delayed"
                  style={{ transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                <circle cx="700" cy={hazardMode === 'erosion' ? 220 : 280} r="6" fill="var(--water)" style={{ transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)' }} className="pulse-dot" />
                <text x="720" y={hazardMode === 'erosion' ? 210 : 270} fill="var(--water)" fontFamily="var(--font-num)" fontSize="12" fontWeight="700" style={{ transition: 'all 1s' }}>
                  HARVEST FAILURE SHOCK
                </text>
                
                {/* Highlight */}
                <rect x="600" y="0" width="200" height="300" fill="var(--water)" opacity="0.05" />
              </svg>
            </div>
            
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-label">TOTAL ECONOMIC DAMAGE</div>
                <div className="stat-value" style={{ color: primaryColor }}>
                  $	{hazardMode === 'erosion' ? econDamage.toFixed(1) : (econDamage).toFixed(1)} Million
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">CROPLAND ERADICATED</div>
                <div className="stat-value" style={{ color: primaryColor }}>
                  {Math.floor(cropLost).toLocaleString()} Hectares
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .ambient-glow {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          transition: background 1.5s ease;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 2rem;
        }
        .interactive-card {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        }
        .interactive-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(57,196,217,0.2);
        }
        .mode-btn {
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: var(--font-num);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .card-eyebrow {
          margin: 0 0 2rem 0;
          font-family: var(--font-num);
          font-size: var(--text-xs);
          letter-spacing: 0.15em;
          color: var(--text-3);
          text-transform: uppercase;
        }
        .metric-huge {
          font-family: var(--font-num);
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 800;
          line-height: 1;
          text-shadow: 0 0 40px currentColor;
          transition: color 1s ease;
        }
        .progress-track {
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
        }
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1), background 1s ease;
        }
        .glow-pulse {
          animation: glow-pulse 2s infinite alternate;
        }
        @keyframes glow-pulse {
          0% { filter: brightness(1) drop-shadow(0 0 5px currentColor); }
          100% { filter: brightness(1.3) drop-shadow(0 0 15px currentColor); }
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
        }
        .status-pass {
          border-color: rgba(127,191,142,0.2);
          background: rgba(127,191,142,0.05);
          color: var(--pass);
        }
        .status-pass:hover {
          background: rgba(127,191,142,0.1);
          box-shadow: 0 0 20px rgba(127,191,142,0.1);
        }
        .infra-card {
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          padding: 1.5rem;
          border-left: 4px solid var(--accent);
          transition: all 0.3s ease;
        }
        .infra-card:hover {
          background: rgba(255,255,255,0.04);
          transform: translateX(4px);
        }
        .infra-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));
        }
        .infra-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
        }
        .infra-alert {
          color: var(--accent);
          font-family: var(--font-num);
          font-size: 0.8rem;
          font-weight: 700;
          margin-top: 0.5rem;
          letter-spacing: 0.05em;
        }
        .infra-desc {
          color: var(--text-3);
          font-size: 0.85rem;
          margin-top: 0.5rem;
          line-height: 1.5;
        }
        .infra-network {
          height: 120px;
          margin-top: 3rem;
          position: relative;
          border-top: 1px solid var(--line);
          padding-top: 2rem;
          overflow: hidden;
        }
        .radar-scanner {
          position: absolute;
          top: 2rem; bottom: 0; width: 100px;
          background: linear-gradient(90deg, transparent, rgba(57,196,217,0.2), transparent);
          animation: scan 4s infinite linear;
          pointer-events: none;
        }
        @keyframes scan {
          0% { left: -100px; }
          100% { left: 100%; }
        }
        .stroke-dash-anim {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 3s forwards cubic-bezier(0.16, 1, 0.3, 1);
        }
        .draw-line {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: draw 2s forwards cubic-bezier(0.16, 1, 0.3, 1) 0.5s;
        }
        .draw-line-delayed {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: draw 2.5s forwards cubic-bezier(0.16, 1, 0.3, 1) 1s;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        .pulse-dot {
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .chart-container {
          height: 300px;
          position: relative;
          border-left: 1px solid var(--line-strong);
          border-bottom: 1px solid var(--line-strong);
          margin-bottom: 3rem;
        }
        .stats-row {
          display: flex;
          gap: 2rem;
          justify-content: center;
        }
        .stat-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 1.5rem 3rem;
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .stat-box:hover {
          background: rgba(255,255,255,0.04);
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.1);
        }
        .stat-label {
          color: var(--text-3);
          font-family: var(--font-num);
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }
        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          transition: color 1s ease;
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid > div { grid-column: span 12 !important; }
          .infra-card { grid-column: span 3; }
        }
        @media (max-width: 768px) {
          .infra-card { grid-column: span 1 !important; }
          .stats-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
