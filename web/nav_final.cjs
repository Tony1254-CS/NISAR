const fs = require('fs');
let text = fs.readFileSync('d:/nasa 2026/web/src/components/Navbar.tsx', 'utf8');

text = text.replace('5-Sec X-Ray Optical/SAR Swipe', 'Auto-Narrated Mission Briefing');
text = text.replace('}Optical Swipe', '}Mission Briefing');

const search = '{layers.forecast ? \'\\u2713 \' : \'\'}Forecast Model\n                  </button>';
const replace = search + '\n                  <button onClick={() => setLayers({ risk: !layers.risk })} title="Predictive Risk Heatmap" style={{ color: \'var(--erosion)\' }}>\n                    {layers.risk ? \'\\u2713 \' : \'\'}Predictive Risk\n                  </button>';
text = text.replace(search, replace);

const navSearch = '<a href="/cases" className={linkClass(\'/cases\')}>\n                Investigations';
const navReplace = '<a href="/impact" className={linkClass(\'/impact\')} style={{ color: \'#E4572E\', textShadow: \'0 0 10px rgba(228,87,46,0.3)\', fontWeight: \'bold\' }}>\n                🚨 Impact\n              </a>\n              ' + navSearch;
text = text.replace(navSearch, navReplace);

const repSearch = '<a href="/about" className={linkClass(\'/about\')}>\n                About Us\n              </a>\n            </div>';
const repReplace = '<a href="/about" className={linkClass(\'/about\')}>\n                About Us\n              </a>\n              <a href="/report" className="navbar__btn" style={{ background: \'#fff\', color: \'#000\', padding: \'4px 12px\', fontSize: \'0.8rem\', marginLeft: \'8px\', textDecoration: \'none\' }}>\n                📄 Report\n              </a>\n            </div>';
text = text.replace(repSearch, repReplace);

fs.writeFileSync('d:/nasa 2026/web/src/components/Navbar.tsx', text);
console.log('done!');
