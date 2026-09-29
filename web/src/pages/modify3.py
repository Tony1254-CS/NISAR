# -*- coding: utf-8 -*-
import re

file_path = r"d:\nasa 2026\web\src\pages\Intelligence.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update Section 2 title to use reach.name
content = content.replace('<h2 style={{ margin: \'0 0 0.5rem 0\', fontSize: \'2rem\' }}>L-band Backscatter Temporal Profile</h2>',
'<h2 style={{ margin: \'0 0 0.5rem 0\', fontSize: \'2rem\' }}>{reach ? reach.name + " -" : ""} L-band Backscatter Temporal Profile</h2>')

# Update Section 10 sites
old_sites = '''            {[
              { site: 'Jamuna-Chilmari', event: 'Erosion', val: '1,247 ha', conf: 72, verdict: 'INCONCLUSIVE', vColor: 'var(--erosion, #E4572E)' },
              { site: 'Glacier Bay Alaska', event: 'Terminus retreat', val: '47 ha', conf: 84, verdict: 'SUPPORTED', vColor: 'var(--pass, #7FBF8E)' },
              { site: 'Park Fire NorCal', event: 'Burn scar', val: '892 ha', conf: 68, verdict: 'SUPPORTED', vColor: 'var(--pass, #7FBF8E)' },
              { site: 'Sundarbans', event: 'Mangrove loss', val: '156 ha', conf: 61, verdict: 'LIMITED', vColor: 'var(--accretion, #D9B26A)' },
            ].map((site, i) => (
              <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>'''

new_sites = '''            {[
              { id: 'jamuna', site: 'Jamuna-Chilmari', event: 'Erosion', val: '1,247 ha', conf: 72, verdict: 'INCONCLUSIVE', vColor: 'var(--erosion, #E4572E)' },
              { id: 'glacier-bay', site: 'Glacier Bay Alaska', event: 'Terminus retreat', val: '47 ha', conf: 84, verdict: 'SUPPORTED', vColor: 'var(--pass, #7FBF8E)' },
              { id: 'park-fire', site: 'Park Fire NorCal', event: 'Burn scar', val: '892 ha', conf: 68, verdict: 'SUPPORTED', vColor: 'var(--pass, #7FBF8E)' },
              { id: 'sundarbans', site: 'Sundarbans', event: 'Mangrove loss', val: '156 ha', conf: 61, verdict: 'LIMITED', vColor: 'var(--accretion, #D9B26A)' },
            ].map((site, i) => {
              const isActive = reachId === site.id;
              return (
              <div key={i} style={{ backgroundColor: isActive ? 'rgba(57,196,217,0.1)' : 'rgba(255,255,255,0.02)', border: isActive ? '1px solid var(--water)' : '1px solid rgba(255,255,255,0.05)', boxShadow: isActive ? '0 0 15px rgba(57,196,217,0.2)' : 'none', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s ease' }}>
              '''
content = content.replace(old_sites, new_sites)

# Add closing tag for the map loop
content = content.replace('</div>\n                </div>\n              </div>\n            ))}', '</div>\n                </div>\n              </div>\n              );\n            })}')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

