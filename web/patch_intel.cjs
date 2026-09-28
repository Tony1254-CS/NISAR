const fs = require('fs');

let text = fs.readFileSync('d:/nasa 2026/web/src/pages/Intelligence.tsx', 'utf8');

// Replace the main page background #07090A with var(--bg)
text = text.replace(/backgroundColor:\s*['"]#07090A['"]/g, "backgroundColor: 'var(--bg)'");
text = text.replace(/background:\s*['"]#07090A['"]/g, "background: 'var(--bg)'");

fs.writeFileSync('d:/nasa 2026/web/src/pages/Intelligence.tsx', text);
console.log('patched intel');
