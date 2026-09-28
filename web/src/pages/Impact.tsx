import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import '../styles/globe.css';

export function ImpactPage() {
  const [hazardMode, setHazardMode] = useState<'erosion' | 'synergy'>('erosion');

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar transparent={false} />
      
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '6rem 2rem 4rem' }}>
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '3.5rem', color: 'var(--erosion, #E4572E)', margin: 0, textShadow: '0 0 30px rgba(228,87,46,0.3)' }}>Impact Quantifier</h1>
            <p style={{ color: '#aaa', fontSize: '1.2rem', marginTop: '0.5rem', letterSpacing: '1px' }}>
              TRANSLATING RADAR DETECTIONS INTO OPERATIONAL DECISION INTELLIGENCE.
            </p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => setHazardMode('erosion')}
              style={{ 
                padding: '8px 16px', background: hazardMode === 'erosion' ? 'rgba(228,87,46,0.2)' : 'transparent',
                border: '1px solid', borderColor: hazardMode === 'erosion' ? '#E4572E' : 'transparent',
                color: hazardMode === 'erosion' ? '#E4572E' : '#888', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.3s'
              }}>
              Primary Hazard (Erosion)
            </button>
            <button 
              onClick={() => setHazardMode('synergy')}
              style={{ 
                padding: '8px 16px', background: hazardMode === 'synergy' ? 'rgba(217,178,106,0.2)' : 'transparent',
                border: '1px solid', borderColor: hazardMode === 'synergy' ? '#D9B26A' : 'transparent',
                color: hazardMode === 'synergy' ? '#D9B26A' : '#888', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.3s'
              }}>
              Multi-Hazard Synergy (Erosion + Subsidence)
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
          
          {/* Panel 1: Population at Risk & Evacuation */}
          <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '2.5rem', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
            <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', letterSpacing: '2px', color: '#888' }}>POPULATION AT RISK</h2>
            
            <div style={{ fontSize: '4.5rem', fontWeight: 800, color: hazardMode === 'erosion' ? '#E4572E' : '#D9B26A', lineHeight: 1, transition: 'color 0.5s' }}>
              {hazardMode === 'erosion' ? '3,247' : '8,451'}
            </div>
            <p style={{ color: '#aaa', marginTop: '1rem', height: '40px' }}>
              {hazardMode === 'erosion' 
                ? 'people within 500m of the active riverbank erosion front.'
                : 'people exposed when combining erosion with -3.2cm/yr land subsidence.'}
            </p>
            
            <div style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#888' }}>Critical Vulnerability Index</span>
                <span style={{ color: hazardMode === 'erosion' ? '#E4572E' : '#D9B26A', fontWeight: 'bold' }}>
                  {hazardMode === 'erosion' ? '82%' : '96%'}
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: hazardMode === 'erosion' ? '82%' : '96%', 
                  height: '100%', 
                  background: hazardMode === 'erosion' ? '#E4572E' : '#D9B26A', 
                  boxShadow: `0 0 10px ${hazardMode === 'erosion' ? '#E4572E' : '#D9B26A'}`,
                  transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}></div>
              </div>
            </div>

            <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
              <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}>Evacuation Routing (OSM Intersect)</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(127,191,142,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(127,191,142,0.3)' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <div>
                  <div style={{ color: 'var(--pass, #7FBF8E)', fontWeight: 'bold' }}>2 Safe Zones Identified</div>
                  <div style={{ color: '#aaa', fontSize: '0.85rem' }}>Elevation &gt; 14m (SRTM/HAND verified)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Infrastructure Lifeline Severance */}
          <div className="glass-panel" style={{ gridColumn: 'span 8', padding: '2.5rem', borderRadius: '16px' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', letterSpacing: '2px', color: '#888' }}>CRITICAL LIFELINE SEVERANCE</h2>
            <p style={{ color: '#aaa', marginBottom: '2rem' }}>Predictive intersection of SAR erosion trajectory with OpenStreetMap infrastructure networks.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: '4px solid #E4572E' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏥</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Route N509</div>
                <div style={{ color: '#E4572E', fontWeight: 'bold', marginTop: '0.5rem' }}>SEVERED IN 14 DAYS</div>
                <div style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '0.5rem' }}>Isolating 12,000 from primary hospital.</div>
              </div>
              
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: '4px solid #D9B26A' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏫</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>14 Schools</div>
                <div style={{ color: '#D9B26A', fontWeight: 'bold', marginTop: '0.5rem' }}>STRUCTURAL RISK</div>
                <div style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '0.5rem' }}>Within 50m of active bank slump zone.</div>
              </div>

              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: '4px solid var(--water, #39C4D9)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Power Grid</div>
                <div style={{ color: 'var(--water, #39C4D9)', fontWeight: 'bold', marginTop: '0.5rem' }}>3 TOWERS COMPROMISED</div>
                <div style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '0.5rem' }}>Foundations destabilized by flooding.</div>
              </div>
            </div>

            {/* Simulated Infrastructure Network Graph */}
            <div style={{ height: '200px', position: 'relative', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
              <svg width="100%" height="100%" viewBox="0 0 800 150" preserveAspectRatio="none">
                <path d="M 50 100 L 200 100 L 300 50 L 500 50 L 600 100 L 750 100" fill="none" stroke="#333" strokeWidth="4" />
                <path d="M 50 100 L 200 100" fill="none" stroke="#E4572E" strokeWidth="4" strokeDasharray="5 5" className="pulse-stroke" />
                <circle cx="200" cy="100" r="8" fill="#E4572E" />
                <text x="180" y="80" fill="#E4572E" fontSize="12" fontWeight="bold">N509 BREACH POINT</text>
                
                <circle cx="300" cy="50" r="6" fill="#D9B26A" />
                <text x="290" y="35" fill="#D9B26A" fontSize="12">School Node</text>

                <circle cx="500" cy="50" r="6" fill="#39C4D9" />
                <text x="470" y="35" fill="#39C4D9" fontSize="12">Hospital Node</text>
              </svg>
            </div>
          </div>

          {/* Panel 3: Socio-Economic Temporal Decay */}
          <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '3rem', borderRadius: '16px' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', letterSpacing: '2px', color: '#888' }}>SOCIO-ECONOMIC TEMPORAL DECAY</h2>
            <p style={{ color: '#aaa', marginBottom: '2rem', maxWidth: '800px' }}>
              Physical land loss is instantaneous, but economic destruction cascades over time. This predictive model shows the delayed economic shockwaves resulting from the August erosion events hitting the November harvest season.
            </p>
            
            <div style={{ height: '300px', position: 'relative', borderLeft: '1px solid #333', borderBottom: '1px solid #333' }}>
              <svg width="100%" height="100%" viewBox="0 0 1200 300" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(val => (
                  <line key={val} x1="0" y1={300 - val*300} x2="1200" y2={300 - val*300} stroke="#222" strokeDasharray="4 4" />
                ))}
                
                {/* Axis Labels */}
                <text x="-40" y="150" fill="#888" transform="rotate(-90 -40 150)" textAnchor="middle">Economic Output ($ Millions)</text>
                <text x="600" y="340" fill="#888" textAnchor="middle">Timeline (Months)</text>
                
                {/* X-Axis Ticks */}
                {['Aug', 'Sep', 'Oct', 'Nov (Harvest)', 'Dec', 'Jan', 'Feb'].map((month, i) => (
                  <text key={month} x={i * 200} y="320" fill="#888" textAnchor="middle" fontSize="14">{month}</text>
                ))}

                {/* Baseline Projection */}
                <path d="M 0 50 L 1200 50" fill="none" stroke="#333" strokeWidth="2" strokeDasharray="5 5" />
                <text x="1100" y="40" fill="#555">Expected Baseline</text>

                {/* Physical Land Loss Curve (Immediate drop in August) */}
                <path d="M 0 50 L 100 50 L 150 150 L 1200 150" fill="none" stroke="#E4572E" strokeWidth="3" />
                <circle cx="125" cy="100" r="6" fill="#E4572E" />
                <text x="140" y="110" fill="#E4572E" fontWeight="bold">SAR Land Loss Event</text>

                {/* Economic Output Curve (Delayed drop in November) */}
                <path 
                  d={hazardMode === 'erosion' 
                    ? "M 0 50 L 600 50 Q 700 50, 700 220 L 1200 220" 
                    : "M 0 50 L 600 50 Q 700 50, 700 280 L 1200 280"} 
                  fill="none" 
                  stroke="var(--water, #39C4D9)" 
                  strokeWidth="4" 
                  style={{ transition: 'all 1s' }}
                />
                <circle cx="700" cy={hazardMode === 'erosion' ? 220 : 280} r="6" fill="var(--water, #39C4D9)" style={{ transition: 'all 1s' }} />
                <text x="720" y={hazardMode === 'erosion' ? 210 : 270} fill="var(--water, #39C4D9)" fontWeight="bold" style={{ transition: 'all 1s' }}>
                  Harvest Failure Shock
                </text>
                
                {/* Highlight Zone */}
                <rect x="600" y="0" width="200" height="300" fill="rgba(57,196,217,0.05)" />
              </svg>
            </div>
            
            <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Economic Damage</div>
                <div style={{ fontSize: '2rem', color: '#fff', fontWeight: 'bold' }}>
                  ${hazardMode === 'erosion' ? '4.2' : '11.8'} Million
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 2rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Cropland Eradicated</div>
                <div style={{ fontSize: '2rem', color: '#fff', fontWeight: 'bold' }}>
                  {hazardMode === 'erosion' ? '847' : '1,204'} Hectares
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .pulse-stroke {
          animation: stroke-pulse 1.5s infinite;
        }
        @keyframes stroke-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
