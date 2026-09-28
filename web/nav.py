import sys

with open('web/src/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Nav links replacement
old_nav = """          {/* Nav links (hidden on /app to save space on laptops) */}
          {!showReachInfo && (
            <div className={`navbar__nav${mobileOpen ? ' navbar__nav--open' : ''}`}>
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
            </div>
          )}"""

new_nav = """          {/* Nav links (hidden on /app to save space on laptops) */}
          {!showReachInfo && (
            <div className={`navbar__nav${mobileOpen ? ' navbar__nav--open' : ''}`}>
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
          )}"""

content = content.replace(old_nav, new_nav)

# 2. Map buttons replacement
old_btn = """                  <button onClick={() => setCinematicMode(!cinematicMode)} title="5-Sec X-Ray Optical/SAR Swipe">
                    {cinematicMode ? '✔️ ' : ''}Optical Swipe
                  </button>
                  <button onClick={() => setLayers({ forecast: !layers.forecast })} title="Erosion & Accretion Forecast">
                    {layers.forecast ? '✔️ ' : ''}Forecast Model
                  </button>
                </div>
              </div>"""

new_btn = """                  <button onClick={() => setCinematicMode(!cinematicMode)} title="Auto-Narrated Mission Briefing">
                    {cinematicMode ? '✔️ ' : ''}Mission Briefing
                  </button>
                  <button onClick={() => setLayers({ forecast: !layers.forecast })} title="Erosion & Accretion Forecast">
                    {layers.forecast ? '✔️ ' : ''}Forecast Model
                  </button>
                  <button onClick={() => setLayers({ risk: !layers.risk })} title="Predictive Risk Heatmap" style={{ color: 'var(--erosion)' }}>
                    {layers.risk ? '✔️ ' : ''}Predictive Risk
                  </button>
                </div>
              </div>"""

content = content.replace(old_btn, new_btn)

with open('web/src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("done python")
