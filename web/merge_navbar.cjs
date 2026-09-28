const fs = require('fs');
let content = fs.readFileSync('d:/nasa 2026/web/src/components/Navbar.tsx', 'utf8');

// 1. Add Impact to the main nav links (before Investigations)
content = content.replace(
  '<a href="/cases" className={linkClass(\'/cases\')}>\n                Investigations',
  `<a href="/impact" className={linkClass('/impact')} style={{ color: '#E4572E', textShadow: '0 0 10px rgba(228,87,46,0.3)' }}>
                🚨 Impact Dashboard
              </a>
              <a href="/cases" className={linkClass('/cases')}>
                Investigations`
);

// 2. Add Report button at the end of nav links
content = content.replace(
  '<a href="/about" className={linkClass(\'/about\')}>\n                About Us\n              </a>\n            </div>',
  `<a href="/about" className={linkClass('/about')}>
                About Us
              </a>
              <a href="/report" className="navbar__btn" style={{ background: '#fff', color: '#000', padding: '4px 12px', fontSize: '0.8rem', marginLeft: '8px', textDecoration: 'none' }}>
                📄 Report
              </a>
            </div>`
);

// 3. Update Map tools
content = content.replace(/<button onClick={\(\) => setCinematicMode\(!cinematicMode\)}.*?<\/button>/s, 
  `<button onClick={() => setCinematicMode(!cinematicMode)} title="Auto-Narrated Mission Briefing">
                      {cinematicMode ? '✔️ ' : ''}Mission Briefing
                    </button>`
);

content = content.replace(/<button onClick={\(\) => setLayers\(\{ forecast: !layers\.forecast \}\)}.*?<\/button>/s,
  `$&
                    <button onClick={() => setLayers({ risk: !layers.risk })} title="Predictive Risk Heatmap" style={{ color: 'var(--erosion)' }}>
                      {layers.risk ? '✔️ ' : ''}Predictive Risk
                    </button>`
);

fs.writeFileSync('d:/nasa 2026/web/src/components/Navbar.tsx', content);
console.log('done');
