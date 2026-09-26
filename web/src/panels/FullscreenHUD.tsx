import { useEffect, useState } from 'react';

const HUD_CONFIGS: Record<string, { title: string, sub: string, status: string[], ringColor: string }> = {
  detect: {
    title: 'SAR MORPHODYNAMIC DETECTION',
    sub: 'EXECUTING PRIMARY CHANGE DETECTION ALGORITHM',
    status: ['ACCESSING NISAR L2 GRANULE', 'APPLYING RADIOMETRIC CORRECTION', 'RUNNING OTSU THRESHOLDING', 'EXTRACTING CHANGE AREA'],
    ringColor: 'var(--water)'
  },
  investigate: {
    title: 'MULTI-SENSOR VERIFICATION',
    sub: 'CROSS-REFERENCING AUXILIARY DATA SOURCES',
    status: ['SYNCING SENTINEL-1 OPTICAL DATA', 'DOWNLOADING GPM PRECIPITATION MAP', 'CORRELATING FFWC HYDROLOGICAL STAGE', 'VERIFYING SPATIAL AGREEMENT'],
    ringColor: 'var(--pass)'
  },
  challenge: {
    title: 'ADVERSARIAL QUALITY CONTROL',
    sub: 'RUNNING HEURISTICS & PLAUSIBILITY LIMITS',
    status: ['ANALYZING NOISE PROFILE (S4 SCINTILLATION)', 'CHECKING RFI NOTCH FILTERS', 'VALIDATING GEOMETRIC COREGISTRATION', 'TESTING AGAINST PHYSICAL BOUNDS'],
    ringColor: 'var(--warn)'
  },
  explain: {
    title: 'EXPLAINABLE AI CONSENSUS',
    sub: 'AGGREGATING METRICS & DETERMINING VERDICT',
    status: ['COMPILING DECISION TENSOR', 'CALCULATING FEATURE IMPORTANCE', 'EVALUATING HISTORICAL BASELINES', 'GENERATING FINAL EXECUTIVE REPORT'],
    ringColor: 'var(--water)'
  },
  field: {
    title: 'FIELD TELEMETRY UPLINK',
    sub: 'AWAITING GROUND TRUTH DATA',
    status: ['Pinging GPS Module 01...', 'Pinging GPS Module 02...', 'Establishing secure connection...', 'Waiting for manual override.'],
    ringColor: 'var(--pass)'
  }
};

export function FullscreenHUD({ tab }: { tab: string | null }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += 5 + Math.random() * 5;
      if (p >= 100) p = 99; // Hold at 99% until unmounted
      setProgress(p);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const config = HUD_CONFIGS[tab ?? 'detect'] || HUD_CONFIGS.detect;

  const currentStatusIndex = Math.min(Math.floor((progress / 100) * 4), 3);

  return (
    <div className="fullscreen-hud">
      <div className="hud-background" />
      <div className="hud-grid" />
      
      <div className="hud-content">
        <div className="hud-title" style={{ color: config.ringColor, textShadow: `0 0 20px ${config.ringColor}, 0 0 40px ${config.ringColor}` }}>
          {config.title} <br />
          <span style={{ fontSize: '1rem', color: 'var(--text-2)', textShadow: 'none' }}>{config.sub}</span>
        </div>
        
        <div className="hud-center-ring">
          <div className="hud-ring-outer" style={{ borderColor: config.ringColor, boxShadow: `0 0 30px ${config.ringColor}55` }} />
          <div className="hud-ring-inner" style={{ transform: `scale(${0.5 + (progress / 200)})`, borderTopColor: config.ringColor, borderBottomColor: config.ringColor }} />
          <div className="hud-percentage" style={{ textShadow: `0 0 20px ${config.ringColor}` }}>{Math.floor(progress)}%</div>
          <div className="hud-status" style={{ color: 'var(--text)' }}>
            {config.status[currentStatusIndex]}
          </div>
        </div>

        <div className="hud-terminal">
          {Array.from({ length: Math.floor(progress / 5) }).map((_, i) => (
            <div key={i} className="hud-terminal-line">
              [{new Date().toISOString().split('T')[1].substring(0, 12)}] - PROCESS_{i} ... OK
            </div>
          ))}
          <div className="hud-terminal-cursor">_</div>
        </div>
      </div>
    </div>
  );
}
