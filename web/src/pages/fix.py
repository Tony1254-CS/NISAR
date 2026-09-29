# -*- coding: utf-8 -*-
import re

file_path = r"d:\nasa 2026\web\src\pages\Intelligence.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Revert Section 3 mistake
bad_block = '''              </div>
              );
            })}
          </div>
        </section>

                  {/* Section 4:'''

good_block = '''              </div>
            ))}
          </div>
        </section>

                  {/* Section 4:'''

content = content.replace(bad_block, good_block)

# Fix Section 10 which I failed to close properly earlier
old_end = '''              <div key={i} style={{ backgroundColor: isActive ? 'rgba(57,196,217,0.1)' : 'rgba(255,255,255,0.02)', border: isActive ? '1px solid var(--water)' : '1px solid rgba(255,255,255,0.05)', boxShadow: isActive ? '0 0 15px rgba(57,196,217,0.2)' : 'none', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s ease' }}>
              
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>{site.site}</h3>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>{site.event} detected: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{site.val}</span></div>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: gba(, 0.1), color: site.vColor }}>
                    {site.verdict}
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-3)' }}>Detection Confidence</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{site.conf}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: mounted ? ${site.conf}% : '0%', backgroundColor: site.vColor, transition: 'width 1.5s ease-out' }} />
                  </div>
                </div>
              </div>
            ))}'''

new_end = old_end.replace('))}',');\n            })}')
content = content.replace(old_end, new_end)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
