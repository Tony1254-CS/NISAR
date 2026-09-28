const fs = require('fs');
let content = fs.readFileSync('d:/nasa 2026/web/src/pages/Intelligence.tsx', 'utf8');

const coherenceSection = `
        {/* Section 2b: Coherence Decay Profiler */}
        <section className="glass-panel" style={{ padding: '3rem', marginBottom: '4rem', borderRadius: '16px' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>InSAR Coherence Decay Profiler (γ)</h2>
          <p style={{ color: 'var(--text-2, #94A3B8)', margin: '0 0 2rem 0' }}>Detecting surface anomalies through temporal decorrelation. A sudden drop indicates a change event.</p>
          
          <div style={{ height: '350px', position: 'relative', borderBottom: '1px solid #333', borderLeft: '1px solid #333', marginTop: '2rem' }}>
            <svg width="100%" height="100%" viewBox="0 0 800 350" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val, i) => (
                <g key={i}>
                  <line x1="0" y1={350 - val*300} x2="800" y2={350 - val*300} stroke="#333" strokeDasharray="4 4" />
                  <text x="-30" y={350 - val*300 + 4} fill="#888" fontSize="12">{val.toFixed(1)}</text>
                </g>
              ))}
              <text x="-40" y="20" fill="#aaa" fontSize="12" transform="rotate(-90 -40 20)">Coherence (γ)</text>
              <text x="400" y="380" fill="#aaa" fontSize="12" textAnchor="middle">Time (days)</text>
              
              {/* X Axis ticks */}
              {[0, 12, 24, 36, 48].map((day) => (
                <text key={day} x={(day/48)*800} y="365" fill="#888" fontSize="12" textAnchor="middle">{day}</text>
              ))}

              {/* Urban (τ=500d) */}
              <path d="M0 50 Q 400 65, 800 80" fill="none" stroke="#888" strokeWidth="2" />
              <text x="810" y="80" fill="#888" fontSize="12">Urban</text>

              {/* Bare soil (τ=365d) */}
              <path d="M0 50 Q 400 90, 800 130" fill="none" stroke="#D9B26A" strokeWidth="2" />
              <text x="810" y="130" fill="#D9B26A" fontSize="12">Bare Soil</text>

              {/* Vegetation (τ=15d) */}
              <path d="M0 50 Q 200 250, 800 300" fill="none" stroke="#7FBF8E" strokeWidth="2" />
              <text x="810" y="300" fill="#7FBF8E" fontSize="12">Vegetation</text>

              {/* Changed surface (ANOMALY) */}
              <path d="M0 50 L 200 70 L 200 300 L 800 320" fill="none" stroke="#E4572E" strokeWidth="3" />
              <circle cx="200" cy="300" r="5" fill="#E4572E" />
              <text x="215" y="295" fill="#E4572E" fontSize="14" fontWeight="bold">↓ DETECTION POINT</text>
              <text x="810" y="320" fill="#E4572E" fontSize="12" fontWeight="bold">Changed Surface</text>

              {/* Water */}
              <path d="M0 350 L 800 350" fill="none" stroke="var(--water)" strokeWidth="2" />
              <text x="810" y="350" fill="var(--water)" fontSize="12">Water (γ≈0)</text>
            </svg>
          </div>
        </section>
`;

content = content.replace('{/* Section 3: Polarimetric Decomposition Viewer */}', coherenceSection + '\n        {/* Section 3: Polarimetric Decomposition Viewer */}');
fs.writeFileSync('d:/nasa 2026/web/src/pages/Intelligence.tsx', content);
console.log('done');
