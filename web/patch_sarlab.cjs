const fs = require('fs');

let text = fs.readFileSync('d:/nasa 2026/web/src/pages/SARLab.tsx', 'utf8');

// 1. Replace background color #07090A with var(--bg)
text = text.replace(/background:\s*['"]#07090A['"]/g, "background: 'var(--bg)'");

// 2. Replace hardcoded greys with token colors
text = text.replace(/color:\s*['"]#aaa['"]/g, "color: 'var(--text-2)'");
text = text.replace(/color:\s*['"]#888['"]/g, "color: 'var(--text-3)'");
text = text.replace(/color:\s*['"]#555['"]/g, "color: 'var(--text-3)'");

text = text.replace(/color:\s*['"]#e2e8f0['"]/g, "color: 'var(--text)'");
text = text.replace(/color:\s*['"]#94a3b8['"]/g, "color: 'var(--text-2)'");
text = text.replace(/color:\s*['"]#64748b['"]/g, "color: 'var(--text-3)'");

// 3. Fix #ff5a5a to var(--fail) or var(--erosion)
text = text.replace(/#ff5a5a/g, 'var(--erosion)');

// 4. Ensure font family is standard
text = text.replace(/fontFamily:\s*['"]system-ui,\s*sans-serif['"]/g, "fontFamily: 'var(--font-text)'");

// 5. Add elegant animations to the glass panels
text = text.replace(/className=['"]glass-panel['"]/g, 'className="glass-panel hover-lift"');

fs.writeFileSync('d:/nasa 2026/web/src/pages/SARLab.tsx', text);
console.log('SARLab.tsx updated');
