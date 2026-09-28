import sys
import re

with open('web/src/pages/Landing.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# First replace the river SVG
old_svg = r'<svg className="river-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">.*?<\/svg>'
new_svg = """<svg className="river-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
            {/* Global SAR Grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(57, 196, 217, 0.05)" strokeWidth="1"/>
            </pattern>
            <rect width="1000" height="600" fill="url(#grid)" />
            
            {/* Orbital Paths */}
            <ellipse cx="500" cy="300" rx="600" ry="200" fill="none" stroke="rgba(57,196,217,0.2)" strokeWidth="1" transform="rotate(-15 500 300)" strokeDasharray="10 15" />
            <ellipse cx="500" cy="300" rx="400" ry="150" fill="none" stroke="rgba(57,196,217,0.15)" strokeWidth="1" transform="rotate(20 500 300)" />
            
            {/* Hazard Nodes */}
            <circle cx="200" cy="200" r="4" fill="#E4572E" className="pulse-glow" />
            <text x="215" y="205" fill="#E4572E" fontSize="11" letterSpacing="1">GLACIAL RETREAT</text>
            
            <circle cx="800" cy="150" r="4" fill="#D9B26A" className="pulse-glow" />
            <text x="815" y="155" fill="#D9B26A" fontSize="11" letterSpacing="1">WILDFIRE SCARS</text>
            
            <circle cx="700" cy="450" r="4" fill="#39C4D9" className="pulse-glow" />
            <text x="715" y="455" fill="#39C4D9" fontSize="11" letterSpacing="1">MANGROVE LOSS</text>
            
            <circle cx="350" cy="400" r="4" fill="#E4572E" className="pulse-glow" />
            <text x="365" y="405" fill="#E4572E" fontSize="11" letterSpacing="1">RIVER EROSION</text>
            
            {/* Connecting telemetry lines */}
            <path d="M 200 200 L 500 300 L 800 150" fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
            <path d="M 700 450 L 500 300 L 350 400" fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
          </svg>"""

text = re.sub(old_svg, new_svg, text, flags=re.DOTALL)

# Now remove the morph dots since they represent random river points
morph_dots = r'<div className="morph-dot.*?/>\n\s*'
text = re.sub(morph_dots, '', text)

with open('web/src/pages/Landing.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
