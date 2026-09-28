const fs = require('fs');
let text = fs.readFileSync('d:/nasa 2026/web/src/components/Navbar.tsx', 'utf8');

const navStart = '          {/* Nav links (hidden on /app to save space on laptops) */}';
const navEnd = '            </div>\n          )}';

const oldNav = text.substring(text.indexOf(navStart), text.indexOf(navEnd) + navEnd.length);

const newNav = `          {/* Nav links (hidden on /app to save space on laptops) */}
          {!showReachInfo && (
            <div className={\`navbar__nav\${mobileOpen ? ' navbar__nav--open' : ''}\`}>
              <a href="/impact" className={linkClass('/impact')} style={{ color: '#E4572E', textShadow: '0 0 10px rgba(228,87,46,0.3)', fontWeight: 'bold' }}>
                🚨 Impact
              </a>
              <a href="/cases" className={linkClass('/cases')}>
                Investigations
              </a>
              <a href="/intelligence" className={linkClass('/intelligence')} style={{ color: 'var(--water)', textShadow: '0 0 10px rgba(57,196,217,0.3)' }}>
                🧠 ML Intelligence
              </a>
              <a href="/sar-lab" className={linkClass('/sar-lab')} style={{ color: 'var(--pass)', textShadow: '0 0 10px rgba(127,191,142,0.3)' }}>
                🔬 SAR Lab
              </a>
              <a href="/methods" className={linkClass('/methods')}>
                Methods
              </a>
              <a href="/about" className={linkClass('/about')}>
                About Us
              </a>
              <a href="/report" className="navbar__btn" style={{ background: '#fff', color: '#000', padding: '4px 12px', fontSize: '0.8rem', marginLeft: '8px', textDecoration: 'none' }}>
                📄 Report
              </a>
            </div>
          )}`;

text = text.replace(oldNav, newNav);

// Now for the map buttons
const btnStart = '                    <button onClick={() => setCinematicMode(!cinematicMode)} title="5-Sec X-Ray Optical/SAR Swipe">';
const btnEnd = '                    </button>\n                  </div>\n                </div>\n              </div>';

const oldBtn = text.substring(text.indexOf(btnStart), text.indexOf(btnEnd) + btnEnd.length);

const newBtn = `                    <button onClick={() => setCinematicMode(!cinematicMode)} title="Auto-Narrated Mission Briefing">
                      {cinematicMode ? '✔️ ' : ''}Mission Briefing
                    </button>
                    <button onClick={() => setLayers({ forecast: !layers.forecast })} title="Erosion & Accretion Forecast">
                      {layers.forecast ? '✔️ ' : ''}Forecast Model
                    </button>
                    <button onClick={() => setLayers({ risk: !layers.risk })} title="Predictive Risk Heatmap" style={{ color: 'var(--erosion)' }}>
                      {layers.risk ? '✔️ ' : ''}Predictive Risk
                    </button>
                  </div>
                </div>
              </div>`;

text = text.replace(oldBtn, newBtn);

fs.writeFileSync('d:/nasa 2026/web/src/components/Navbar.tsx', text);
console.log('done navbar');
