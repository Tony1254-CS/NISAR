const fs = require('fs');

// Fix Impact.tsx
let impact = fs.readFileSync('d:/nasa 2026/web/src/pages/Impact.tsx', 'utf8');
impact = impact.replace("import { useState, useEffect, useRef } from 'react';", "import { useState, useEffect } from 'react';");
impact = impact.replace("function useCounter(end, duration = 2000, start = 0) {", "function useCounter(end: number, duration = 2000, start = 0) {");
impact = impact.replace("let startTime = null;", "let startTime: number | null = null;");
impact = impact.replace("const animate = (time) => {", "const animate = (time: number) => {");
impact = impact.replace("const [isMounted, setIsMounted] = useState(false);", "");
impact = impact.replace("useEffect(() => setIsMounted(true), []);", "");
fs.writeFileSync('d:/nasa 2026/web/src/pages/Impact.tsx', impact);

// Fix Intelligence.tsx
let intel = fs.readFileSync('d:/nasa 2026/web/src/pages/Intelligence.tsx', 'utf8');
intel = intel.replace("import { useState, useEffect } from 'react';", "import { useState } from 'react';");
fs.writeFileSync('d:/nasa 2026/web/src/pages/Intelligence.tsx', intel);

console.log('TS errors fixed');
