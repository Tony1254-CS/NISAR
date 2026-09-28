
import { Navbar } from '../components/Navbar';
import '../styles/base.css'; // or similar

export function ImpactPage() {
  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar transparent={false} />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 2rem 2rem' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', color: '#39c4d9', margin: 0 }}>Impact Quantifier</h1>
          <p style={{ color: '#aaa', fontSize: '1.2rem', marginTop: '0.5rem' }}>
            Translating satellite detections into human terms for Jamuna-Chilmari.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Panel 1: Population at Risk */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>👥</span>
              <h2 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '2px', color: '#888' }}>POPULATION AT RISK</h2>
            </div>
            
            <div style={{ fontSize: '4rem', fontWeight: 800, color: '#ff4d4d', lineHeight: 1 }}>3,247</div>
            <p style={{ color: '#aaa', marginTop: '1rem' }}>people within 500m of active erosion front</p>
            
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#888' }}>Vulnerability Index</span>
                <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>82%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '82%', height: '100%', background: '#ff4d4d', boxShadow: '0 0 10px #ff4d4d' }}></div>
              </div>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '1.5rem' }}>Source: WorldPop 2024 + detected erosion polygon buffer</p>
          </div>

          {/* Panel 2: Infrastructure Exposure */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', letterSpacing: '2px', color: '#888' }}>INFRASTRUCTURE EXPOSURE</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🏫</span>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>14</div>
                  <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Schools</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🏥</span>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>3</div>
                  <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Health Clinics</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🛣️</span>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>4.7 km</div>
                  <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Roads</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🌾</span>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>847 ha</div>
                  <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Cropland</div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: '#888', fontSize: '0.9rem' }}>Est. Displacement Cost</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffb84d' }}>$4.2M USD</div>
            </div>
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          
          {/* Panel 3: Risk Timeline (SVG Animation) */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            padding: '2rem'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', letterSpacing: '2px', color: '#888' }}>RISK TIMELINE</h2>
            
            <div style={{ width: '100%', height: '200px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                <path d="M 0 150 Q 100 120 200 140 T 400 100" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5" />
                <path d="M 0 180 Q 100 150 200 170 T 400 130" fill="none" stroke="#ff4d4d" strokeWidth="4">
                  <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="3s" fill="freeze" />
                </path>
                <circle cx="200" cy="170" r="6" fill="#ff4d4d">
                  <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="200" y="150" fill="#fff" fontSize="12" textAnchor="middle">Current Front</text>
                
                <circle cx="400" cy="130" r="6" fill="#ffb84d" />
                <text x="350" y="110" fill="#ffb84d" fontSize="12">12 Mo Projection</text>
              </svg>
            </div>
          </div>

          {/* Panel 4: Affected Settlements */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            padding: '2rem'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', letterSpacing: '2px', color: '#888' }}>AFFECTED SETTLEMENTS</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Chilmari Bazar</span>
                <span style={{ color: '#ccc' }}>120m</span>
                <span style={{ color: '#ff4d4d', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ff4d4d' }}></span> CRITICAL</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,184,77,0.1)', border: '1px solid rgba(255,184,77,0.3)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Rowmari</span>
                <span style={{ color: '#ccc' }}>340m</span>
                <span style={{ color: '#ffb84d', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ffb84d' }}></span> HIGH</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(102,204,102,0.1)', border: '1px solid rgba(102,204,102,0.3)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Nageshwari</span>
                <span style={{ color: '#ccc' }}>890m</span>
                <span style={{ color: '#66cc66', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#66cc66' }}></span> MODERATE</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
