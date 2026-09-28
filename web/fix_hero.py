import sys

with open('web/src/pages/Landing.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# We use regex to carefully replace the hero text
pattern1 = r'NASA NISAR &middot; L-BAND SAR &middot; JAMUNA RIVER, BANGLADESH'
text = re.sub(pattern1, 'NASA SPACE APPS 2026 &middot; DANCING WITH THE SARS &middot; GLOBAL CHANGE DETECTION', text)

pattern2 = r'Prove the river moved.'
text = re.sub(pattern2, 'Decode the Earth&rsquo;s rhythm.', text)

pattern3 = r'Don&rsquo;t just claim it.'
text = re.sub(pattern3, 'Don&rsquo;t just watch it change.', text)

pattern4 = r'Same River Twice compares real NISAR satellite radar of the same stretch of the\s*Jamuna on two dates — and shows exactly where land turned to water \(<span style={{ color: \'#E4572E\', fontWeight: 500 }}>erosion</span>\) and water turned\s*to land \(<span style={{ color: \'#D9B26A\', fontWeight: 500 }}>accretion</span>\), with the evidence chain to back every claim.'
new_p = 'Same River Twice is a cloud-native intelligence platform that leverages NISAR L-band radar to quantify global surface changes. From <span style={{ color: \'#E4572E\', fontWeight: 500 }}>river erosion</span> and glacial retreat to <span style={{ color: \'#D9B26A\', fontWeight: 500 }}>wildfire scars</span>, our ML engine uncovers the physics of a transforming planet&mdash;with the evidence chain to back every claim.'
text = re.sub(pattern4, new_p, text, flags=re.MULTILINE | re.DOTALL)

with open('web/src/pages/Landing.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("done")
