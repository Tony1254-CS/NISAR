import re

file_path = r"d:\nasa 2026\web\src\pages\Intelligence.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add useEffect for telemetry
telemetry_data = '''
  const allTelemetry = [
    "[14:02:01.041] INGEST: Loaded NISAR Granule NIL2GCOV_20260801_120000",
    "[14:02:01.892] PREPROCESS: Applying Lee-Sigma speckle filter (window=7x7)...",
    "[14:02:02.104] ANOMALY: High TEC Faraday rotation detected in azimuth sector 4.",
    "[14:02:02.155] CORRECT: Auto-compensating phase unwrapping using quad-pol signatures.",
    "[14:02:03.441] MASK: Fetching GLO-30 HAND data... Excluding 1,452,109 pixels > 15m elevation.",
    "[14:02:04.012] INFER: Running 4D-SAR Transformer forward pass (batch_size=32)...",
    "[14:02:06.874] DETECT: 1,247 ha water-to-land transition classified.",
    "[14:02:07.112] FILTER: Rejecting 45 ha due to temporal coherence < 0.35 (dense vegetation artifact).",
    "[14:02:08.000] COMMIT: Morphological erosion vectors pushed to Impact Database."
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < allTelemetry.length) {
        setTelemetryLines(prev => [...prev, allTelemetry[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 400); // 400ms stagger
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (telemetryFeedRef.current) {
      telemetryFeedRef.current.scrollTop = telemetryFeedRef.current.scrollHeight;
    }
  }, [telemetryLines]);
'''
content = content.replace("  useEffect(() => {\n    setMounted(true);\n  }, []);", "  useEffect(() => {\n    setMounted(true);\n  }, []);\n" + telemetry_data)

# Replace the telemetry render block
old_telemetry = '''<div className="telemetry-feed" style={{ color: 'var(--text-3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><span style={{ color: 'var(--water)' }}>[14:02:01.041]</span> INGEST: Loaded NISAR Granule NIL2GCOV_20260801_120000</div>
              <div><span style={{ color: 'var(--water)' }}>[14:02:01.892]</span> PREPROCESS: Applying Lee-Sigma speckle filter (window=7x7)...</div>
              <div><span style={{ color: 'var(--warn)' }}>[14:02:02.104]</span> ANOMALY: High TEC Faraday rotation detected in azimuth sector 4.</div>
              <div><span style={{ color: 'var(--water)' }}>[14:02:02.155]</span> CORRECT: Auto-compensating phase unwrapping using quad-pol signatures.</div>
              <div><span style={{ color: 'var(--water)' }}>[14:02:03.441]</span> MASK: Fetching GLO-30 HAND data... Excluding 1,452,109 pixels &gt; 15m elevation.</div>
              <div><span style={{ color: 'var(--water)' }}>[14:02:04.012]</span> INFER: Running 4D-SAR Transformer forward pass (batch_size=32)...</div>
              <div><span style={{ color: 'var(--water)' }}>[14:02:06.874]</span> DETECT: 1,247 ha water-to-land transition classified.</div>
              <div><span style={{ color: 'var(--fail)' }}>[14:02:07.112]</span> FILTER: Rejecting 45 ha due to temporal coherence &lt; 0.35 (dense vegetation artifact).</div>
              <div style={{ color: 'var(--pass)' }}><span style={{ color: 'var(--water)' }}>[14:02:08.000]</span> COMMIT: Morphological erosion vectors pushed to Impact Database.</div>
              <div className="typing-cursor" style={{ display: 'inline-block', width: '8px', height: '15px', background: 'var(--water)' }}></div>
            </div>'''

new_telemetry = '''<div ref={telemetryFeedRef} className="telemetry-feed" style={{ color: 'var(--text-3)', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', overflowY: 'auto' }}>
              {telemetryLines.map((line, i) => {
                const timestamp = line.match(/\[.*?\]/)?.[0] || '';
                const text = line.replace(timestamp, '');
                let color = 'var(--text-3)';
                if (text.includes('ANOMALY')) color = 'var(--warn)';
                else if (text.includes('FILTER')) color = 'var(--fail)';
                else if (text.includes('COMMIT')) color = 'var(--pass)';
                
                return (
                  <div key={i} style={{ color }}>
                    <span style={{ color: 'var(--water)' }}>{timestamp}</span>
                    {text}
                  </div>
                );
              })}
              <div className="typing-cursor" style={{ display: 'inline-block', width: '8px', height: '15px', background: 'var(--water)', animation: 'blink 1s step-end infinite' }}></div>
            </div>'''

content = content.replace(old_telemetry, new_telemetry)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
