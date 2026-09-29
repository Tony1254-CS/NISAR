import { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import '../styles/globe.css';
import '../styles/base.css';
import '../styles/impact.css';

// Counter Hook for animated numbers
function useCounter(end: number, duration = 2000, start = 0) {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(progress === 1 ? end : Math.floor(easeOutQuart * (end - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);
  
  return count;
}

// Telemetry Stream Hook
function useTelemetryStream() {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const messages = [
      "ACQUIRING NISAR L-BAND SCENE...",
      "CALIBRATING RADIOMETRY...",
      "PERFORMING PHASE UNWRAPPING...",
      "WARNING: COHERENCE LOSS (γ < 0.3) DETECTED",
      "ESTIMATING DEFORMATION VELOCITY...",
      "CROSS-REFERENCING SENTINEL-1 BASELINE...",
      "PINN PREDICTION: BANK FAILURE IMMINENT",
      "CALCULATING SOCIO-ECONOMIC IMPACT...",
      "UPDATING EVACUATION ROUTES..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < messages.length) {
        setLogs(prev => [...prev, messages[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, []);
  
  return logs;
}

export function ImpactPage() {
  const [hazardMode, setHazardMode] = useState<'erosion' | 'synergy'>('erosion');
  const logs = useTelemetryStream();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Scientific & Impact Metrics
  const popRisk = useCounter(hazardMode === 'erosion' ? 12450 : 34890, 2000, hazardMode === 'erosion' ? 0 : 12450);
  const econDamage = useCounter(hazardMode === 'erosion' ? 18.4 : 52.7, 2000, hazardMode === 'erosion' ? 0 : 18.4);
  const cropLost = useCounter(hazardMode === 'erosion' ? 2450 : 6120, 2000, hazardMode === 'erosion' ? 0 : 2450);
  const coherenceDrop = useCounter(hazardMode === 'erosion' ? 68 : 84, 2000, 0); // percentage drop
  const vulnIndex = hazardMode === 'erosion' ? 88 : 97;

  const primaryColor = hazardMode === 'erosion' ? 'var(--erosion)' : 'var(--fail)';
  const secondaryColor = 'var(--water)';

  return (
    <div className="page-container impact-dashboard-root">
      <Navbar transparent={false} />
      
      {/* Deep Space / NASA Aesthetic Background */}
      <div className="ambient-glow" style={{ background: `radial-gradient(circle at 15% 20%, ${primaryColor}20 0%, transparent 40%)` }} />
      <div className="ambient-glow" style={{ background: `radial-gradient(circle at 85% 80%, ${secondaryColor}15 0%, transparent 50%)` }} />
      <div className="grid-overlay" />

      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '6rem 2rem 4rem', position: 'relative', zIndex: 1 }}>
        <header className="fade-in-up impact-header">
          <div>
            <div className="section-label neon-text" style={{ color: primaryColor, marginBottom: '1rem' }}>
              <span className="live-dot" /> NISAR ACTIVE TELEMETRY
            </div>
            <h1 className="cyber-title">
              IMPACT DASHBOARD
            </h1>
            <p className="cyber-subtitle">
              Translating L-Band phase decorrelation and backscatter anomalies into predictive socio-economic trajectories. Powered by Physics-Informed Neural Networks (PINN).
            </p>
          </div>
          
          <div className="glass-panel toggle-container">
            <button 
              onClick={() => setHazardMode('erosion')}
              className={`mode-btn ${hazardMode === 'erosion' ? 'active' : ''}`}
              style={{ '--accent': 'var(--erosion)' } as any}>
              Bank Erosion
            </button>
            <button 
              onClick={() => setHazardMode('synergy')}
              className={`mode-btn ${hazardMode === 'synergy' ? 'active' : ''}`}
              style={{ '--accent': 'var(--fail)' } as any}>
              Erosion + Subsidence
            </button>
          </div>
        </header>

        <div className="dashboard-grid-advanced">
          
          {/* Panel 1: NISAR Telemetry & Coherence */}
          <div className="glass-panel cyber-card fade-in-up" style={{ gridColumn: 'span 4', animationDelay: '0.1s' }}>
            <div className="card-header">
              <h2 className="card-eyebrow">INTERFEROMETRIC COHERENCE (L-BAND)</h2>
              <div className="badge-tech">NISAR L2</div>
            </div>
            
            <div className="telemetry-display">
              <div className="telemetry-screen">
                {logs.map((log, i) => (
                  <div key={i} className="log-line">{'>'} {log}</div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="coherence-stats">
              <div className="stat-block">
                <div className="stat-title">PHASE DECORRELATION</div>
                <div className="stat-value error-text">-{coherenceDrop}%</div>
                <div className="stat-desc">Critical threshold exceeded</div>
              </div>
              <div className="stat-block">
                <div className="stat-title">BACKSCATTER (σ⁰)</div>
                <div className="stat-value">-12.4 dB</div>
                <div className="stat-desc">Water saturation detected</div>
              </div>
            </div>
          </div>

          {/* Panel 2: Socio-Economic Impact */}
          <div className="glass-panel cyber-card fade-in-up" style={{ gridColumn: 'span 4', animationDelay: '0.2s' }}>
            <div className="card-header">
              <h2 className="card-eyebrow">SOCIO-ECONOMIC EXPOSURE</h2>
              <div className="badge-tech">PINN ENSEMBLE</div>
            </div>
            
            <div className="impact-huge-metric" style={{ color: primaryColor }}>
              {popRisk.toLocaleString()}
            </div>
            <div className="impact-subtitle">
              POPULATION AT IMMINENT RISK
            </div>
            
            <div className="impact-row">
              <div className="impact-col">
                <div className="impact-icon">💰</div>
                <div className="impact-val">${hazardMode === 'erosion' ? econDamage.toFixed(1) : (econDamage).toFixed(1)}M</div>
                <div className="impact-lbl">ECONOMIC LOSS</div>
              </div>
              <div className="impact-col">
                <div className="impact-icon">🌾</div>
                <div className="impact-val">{cropLost.toLocaleString()} ha</div>
                <div className="impact-lbl">CROP ERADICATION</div>
              </div>
            </div>

            <div className="vulnerability-meter">
              <div className="meter-label">
                <span>SYSTEM VULNERABILITY</span>
                <span style={{ color: primaryColor }}>{vulnIndex}%</span>
              </div>
              <div className="meter-track">
                <div className="meter-fill striped-bg" style={{ width: `${vulnIndex}%`, backgroundColor: primaryColor }} />
              </div>
            </div>
          </div>

          {/* Panel 3: Infrastructure Severance */}
          <div className="glass-panel cyber-card fade-in-up" style={{ gridColumn: 'span 4', animationDelay: '0.3s' }}>
            <div className="card-header">
              <h2 className="card-eyebrow">INFRASTRUCTURE SEVERANCE</h2>
              <div className="badge-tech">OSM SYNERGY</div>
            </div>
            
            <div className="infra-list">
              <div className="infra-item critical">
                <div className="infra-icon-box">🏥</div>
                <div className="infra-details">
                  <div className="infra-name">Regional Hospital Route</div>
                  <div className="infra-status">SEVERED IN 7 DAYS</div>
                </div>
              </div>
              <div className="infra-item warning">
                <div className="infra-icon-box">⚡</div>
                <div className="infra-details">
                  <div className="infra-name">High-Voltage Substation</div>
                  <div className="infra-status">FOUNDATION DESTABILIZED</div>
                </div>
              </div>
              <div className="infra-item warning">
                <div className="infra-icon-box">🏫</div>
                <div className="infra-details">
                  <div className="infra-name">14 Evacuation Centers</div>
                  <div className="infra-status">COMPROMISED BY FLOODING</div>
                </div>
              </div>
            </div>

            <div className="infra-svg-box">
              <div className="radar-sweep" />
              <svg viewBox="0 0 400 100" className="infra-network-svg">
                <path d="M 10 50 L 150 50 L 200 20 L 350 20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                <path d="M 10 50 L 150 50" fill="none" stroke="var(--erosion)" strokeWidth="3" className="draw-path" />
                <circle cx="150" cy="50" r="5" fill="var(--erosion)" className="ping-dot" />
                <text x="140" y="35" fill="var(--erosion)" fontSize="10" fontFamily="monospace">BREACH</text>
              </svg>
            </div>
          </div>

          {/* Panel 4: Predictive Analytics Chart */}
          <div className="glass-panel cyber-card fade-in-up" style={{ gridColumn: 'span 12', animationDelay: '0.4s', position: 'relative' }}>
            <div className="card-header">
              <h2 className="card-eyebrow">PREDICTIVE LOSS TRAJECTORY (CONFIDENCE INTERVALS)</h2>
              <div className="badge-tech">AI FORECAST</div>
            </div>
            
            <div className="chart-wrapper">
              <svg width="100%" height="350" viewBox="0 0 1200 350" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="confidence-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--fail)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--fail)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Background Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map(val => (
                  <line key={val} x1="0" y1={300 - val*300} x2="1200" y2={300 - val*300} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                ))}
                
                {/* Labels */}
                <text x="-20" y="150" fill="var(--text-3)" transform="rotate(-90 -20 150)" textAnchor="middle" fontFamily="monospace" fontSize="12">CUMULATIVE ECONOMIC LOSS ($M)</text>
                
                {['T-30 Days', 'Present (NISAR Scan)', 'T+30 Days', 'T+60 Days', 'T+90 Days', 'T+120 Days'].map((lbl, i) => (
                  <text key={lbl} x={i * 240} y="330" fill="var(--text-3)" textAnchor="middle" fontFamily="monospace" fontSize="12">{lbl}</text>
                ))}

                {/* Baseline */}
                <path d="M 0 250 L 1200 250" fill="none" stroke="var(--water)" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" />
                <text x="1100" y="240" fill="var(--water)" fontFamily="monospace" fontSize="12">EXPECTED BASELINE</text>

                {/* Confidence Interval (Polygon) */}
                <polygon 
                  points={hazardMode === 'erosion' 
                    ? "240,250 480,200 720,120 960,80 1200,60 1200,140 960,160 720,220 480,250" 
                    : "240,250 480,180 720,90 960,40 1200,20 1200,100 960,120 720,190 480,250"}
                  fill="url(#confidence-grad)" 
                  className="fade-in-poly"
                  style={{ transition: 'all 1s' }}
                />

                {/* Predictive Line */}
                <path 
                  d={hazardMode === 'erosion' 
                    ? "M 0 250 L 240 250 L 480 225 L 720 170 L 960 120 L 1200 100" 
                    : "M 0 250 L 240 250 L 480 215 L 720 140 L 960 80 L 1200 60"} 
                  fill="none" 
                  stroke={primaryColor} 
                  strokeWidth="4" 
                  className="draw-predictive"
                  style={{ transition: 'all 1s' }}
                />

                {/* Event Markers */}
                <circle cx="240" cy="250" r="6" fill="var(--water)" className="ping-dot" />
                <text x="240" y="270" fill="var(--water)" textAnchor="middle" fontFamily="monospace" fontSize="11">S-1 CALIBRATION</text>

                <circle cx="480" cy={hazardMode === 'erosion' ? 225 : 215} r="8" fill="var(--fail)" className="ping-dot pulse-fast" />
                <text x="480" y={hazardMode === 'erosion' ? 200 : 190} fill="var(--fail)" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="bold">CRITICAL COHERENCE LOSS</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
