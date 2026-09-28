const fs = require('fs');

const code = `import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import '../styles/globe.css';
import '../styles/base.css';

export function IntelligencePage() {
  const [activeSite, setActiveSite] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const sites = [
    { name: 'Jamuna-Chilmari', erosion: 1247, conf: 72, verdict: 'INCONCLUSIVE', color: 'var(--fail)' },
    { name: 'Glacier Bay', erosion: 47, conf: 84, verdict: 'SUPPORTED', color: 'var(--pass)' },
    { name: 'Park Fire', erosion: 892, conf: 68, verdict: 'SUPPORTED', color: 'var(--pass)' },
    { name: 'Sundarbans', erosion: 156, conf: 61, verdict: 'LIMITED', color: 'var(--warn)' },
  ];

  return (
    <div className="page-container" style={{ background: 'var(--bg)' }}>
      <Navbar transparent={false} />
      <div className="navbar-spacer" />
      
      {/* Dynamic Background Glow based on active site */}
      <div className="ambient-glow" style={{ 
        background: \`radial-gradient(circle at 50% 20%, \${sites[activeSite].color}15 0%, transparent 60%)\`,
        transition: 'background 1s ease'
      }} />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '4rem 2rem', position: 'relative', zIndex: 1 }}>
        <header className="fade-in-up" style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div className="section-label" style={{ margin: '0 auto 1rem', color: 'var(--water)', textShadow: '0 0 15px rgba(57,196,217,0.3)' }}>
            SPATIO-TEMPORAL PREDICTION ENGINE
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, margin: 0, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Machine Intelligence
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '1.2rem', marginTop: '1rem', maxWidth: '700px', margin: '1rem auto 0', lineHeight: 1.6 }}>
            Our ensemble model (Random Forest + Gradient Boosting + 4D-SAR Transformer) analyzes NISAR L-band backscatter to quantify global surface changes.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
          
          {/* Top Row: Key Metrics */}
          <div className="glass-panel hover-lift fade-in-up" style={{ gridColumn: 'span 3', padding: '2rem', animationDelay: '0.1s' }}>
            <div className="metric-label">GLOBAL SITES</div>
            <div className="metric-value">4</div>
            <div className="metric-sub">Monitored continuously</div>
          </div>
          <div className="glass-panel hover-lift fade-in-up" style={{ gridColumn: 'span 3', padding: '2rem', animationDelay: '0.2s' }}>
            <div className="metric-label">SAR ACQUISITIONS</div>
            <div className="metric-value">12</div>
            <div className="metric-sub">Processed pipelines</div>
          </div>
          <div className="glass-panel hover-lift fade-in-up" style={{ gridColumn: 'span 3', padding: '2rem', animationDelay: '0.3s' }}>
            <div className="metric-label">MEAN IOU</div>
            <div className="metric-value" style={{ color: 'var(--pass)' }}>0.872</div>
            <div className="metric-sub">Validation score</div>
          </div>
          <div className="glass-panel hover-lift fade-in-up" style={{ gridColumn: 'span 3', padding: '2rem', animationDelay: '0.4s' }}>
            <div className="metric-label">BCE LOSS</div>
            <div className="metric-value" style={{ color: 'var(--water)' }}>&lt; 0.12</div>
            <div className="metric-sub">Convergence threshold</div>
          </div>

          {/* SBAS Network Graph */}
          <div className="glass-panel fade-in-up" style={{ gridColumn: 'span 8', padding: '3rem', animationDelay: '0.5s' }}>
            <h2 className="section-label" style={{ marginBottom: '2rem' }}>SBAS INTERFEROGRAM NETWORK</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Small Baseline Subset (SBAS) geometry. Nodes represent satellite passes. Edges represent interferometric pairs used for ML training, bounded by temporal and perpendicular baselines.
            </p>
            <div className="sbas-container">
              <svg viewBox="0 0 800 300" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Axes */}
                <line x1="50" y1="250" x2="750" y2="250" stroke="var(--line-strong)" strokeWidth="2" />
                <text x="400" y="280" fill="var(--text-3)" fontFamily="var(--font-num)" fontSize="12" textAnchor="middle">TEMPORAL BASELINE (DAYS)</text>
                
                <line x1="50" y1="50" x2="50" y2="250" stroke="var(--line-strong)" strokeWidth="2" />
                <text x="20" y="150" fill="var(--text-3)" fontFamily="var(--font-num)" fontSize="12" textAnchor="middle" transform="rotate(-90 20 150)">PERPENDICULAR BASELINE (m)</text>

                {/* Edges */}
                <path d="M 100 150 L 300 100 L 500 200 L 700 80 M 100 150 L 500 200 M 300 100 L 700 80" fill="none" stroke="rgba(57,196,217,0.3)" strokeWidth="2" className="sbas-edges" />

                {/* Nodes */}
                {[
                  { id: 0, x: 100, y: 150, date: 'Aug 01' },
                  { id: 1, x: 300, y: 100, date: 'Aug 13' },
                  { id: 2, x: 500, y: 200, date: 'Aug 25' },
                  { id: 3, x: 700, y: 80, date: 'Sep 06' }
                ].map(node => (
                  <g key={node.id} 
                     onMouseEnter={() => setHoveredNode(node.id)} 
                     onMouseLeave={() => setHoveredNode(null)}
                     style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                    <circle cx={node.x} cy={node.y} r={hoveredNode === node.id ? 12 : 8} fill="var(--bg)" stroke="var(--water)" strokeWidth="3" className="sbas-node" />
                    <text x={node.x} y={node.y - 20} fill={hoveredNode === node.id ? 'var(--water)' : 'var(--text-2)'} fontFamily="var(--font-num)" fontSize="12" textAnchor="middle" fontWeight={hoveredNode === node.id ? 700 : 400}>
                      {node.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* AI Ionospheric Correction */}
          <div className="glass-panel hover-lift fade-in-up" style={{ gridColumn: 'span 4', padding: '3rem', display: 'flex', flexDirection: 'column', animationDelay: '0.6s' }}>
            <h2 className="section-label" style={{ marginBottom: '1.5rem', color: 'var(--accretion)' }}>IONOSPHERIC CORRECTION AI</h2>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(217,178,106,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(217,178,106,0.3)' }}>
                  <span style={{ fontSize: '1.8rem' }}>📡</span>
                </div>
                <div>
                  <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '1.1rem' }}>Faraday Rotation</div>
                  <div style={{ color: 'var(--accretion)', fontFamily: 'var(--font-num)', fontSize: '0.85rem' }}>AUTO-COMPENSATED</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                L-band radar is highly susceptible to Total Electron Content (TEC) anomalies in the ionosphere, causing phase unwrapping errors. Our neural network detects and masks these anomalies, ensuring pristine interferometric coherence.
              </p>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-3)', fontSize: '0.8rem', fontFamily: 'var(--font-num)' }}>PIXELS MASKED</span>
                  <span style={{ color: 'var(--text)', fontSize: '0.8rem', fontFamily: 'var(--font-num)' }}>14.2%</span>
                </div>
                <div style={{ height: '4px', background: 'var(--line)', borderRadius: '2px' }}>
                  <div style={{ width: '14.2%', height: '100%', background: 'var(--accretion)', borderRadius: '2px', boxShadow: '0 0 10px rgba(217,178,106,0.5)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Confusion Matrix & Features */}
          <div className="glass-panel fade-in-up" style={{ gridColumn: 'span 12', padding: '3rem', animationDelay: '0.7s' }}>
            <h2 className="section-label" style={{ marginBottom: '3rem', textAlign: 'center' }}>MULTICLASS CHANGE DETECTION PERFORMANCE</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
              
              {/* Feature Importance */}
              <div>
                <h3 style={{ color: 'var(--text)', fontSize: '1.2rem', marginBottom: '2rem', fontWeight: 600 }}>SHAP Feature Importance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {[
                    { label: 'σ⁰ HH Backscatter Change', val: 0.31, width: '100%' },
                    { label: 'Coherence Loss (γ)', val: 0.22, width: '71%' },
                    { label: 'σ⁰ HV Cross-pol Ratio', val: 0.18, width: '58%' },
                    { label: 'HAND Elevation Mask', val: 0.12, width: '38%' },
                    { label: 'Precipitation Anomaly', val: 0.09, width: '29%' },
                  ].map((feat, i) => (
                    <div key={feat.label} className="feature-bar-container" style={{ animationDelay: \`\${0.8 + i * 0.1}s\` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-2)' }}>{feat.label}</span>
                        <span style={{ color: 'var(--water)', fontFamily: 'var(--font-num)' }}>{feat.val}</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div className="feature-bar-fill" style={{ width: feat.width, background: 'linear-gradient(90deg, var(--water), var(--pass))' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Site Validation Cards */}
              <div>
                <h3 style={{ color: 'var(--text)', fontSize: '1.2rem', marginBottom: '2rem', fontWeight: 600 }}>Global Site Validation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sites.map((site, i) => (
                    <div 
                      key={site.name} 
                      className="site-card"
                      onMouseEnter={() => setActiveSite(i)}
                      style={{ 
                        borderColor: activeSite === i ? site.color : 'var(--line)',
                        background: activeSite === i ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{site.name}</div>
                        <div style={{ 
                          fontSize: '0.7rem', fontFamily: 'var(--font-num)', padding: '4px 10px', 
                          borderRadius: '100px', background: \`\${site.color}20\`, color: site.color, border: \`1px solid \${site.color}40\`
                        }}>
                          {site.verdict}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                        <div>Impact: <span style={{ color: 'var(--text)' }}>{site.erosion} ha</span></div>
                        <div>Conf: <span style={{ color: 'var(--text)' }}>{site.conf}%</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{\`
        .metric-label {
          font-family: var(--font-num);
          font-size: var(--text-xs);
          letter-spacing: 0.1em;
          color: var(--text-3);
          margin-bottom: 0.5rem;
        }
        .metric-value {
          font-family: var(--font-num);
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 0.5rem;
        }
        .metric-sub {
          font-size: 0.85rem;
          color: var(--text-2);
        }
        .hover-lift {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(57,196,217,0.2);
        }
        .sbas-container {
          height: 300px;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          border: 1px solid var(--line);
          padding: 2rem;
        }
        .sbas-edges {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: draw-edges 3s forwards cubic-bezier(0.16, 1, 0.3, 1) 1s;
        }
        @keyframes draw-edges {
          to { stroke-dashoffset: 0; }
        }
        .sbas-node {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sbas-node:hover {
          fill: var(--water);
          filter: drop-shadow(0 0 10px rgba(57,196,217,0.6));
        }
        .feature-bar-container {
          opacity: 0;
          animation: fade-in-right 0.6s forwards cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .feature-bar-fill {
          height: 100%;
          transform-origin: left;
          animation: scale-x 1.5s forwards cubic-bezier(0.16, 1, 0.3, 1) 1s;
          transform: scaleX(0);
        }
        @keyframes scale-x {
          to { transform: scaleX(1); }
        }
        .site-card {
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid var(--line);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .site-card:hover {
          transform: translateX(4px);
        }
      \`}</style>
    </div>
  );
}
`;

fs.writeFileSync('d:/nasa 2026/web/src/pages/Intelligence.tsx', code);
console.log('Intelligence.tsx written');
