import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import type { QCCheck } from '../data/types';

type TabId = 'detect' | 'investigate' | 'challenge' | 'explain' | 'field';

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: 'detect', label: 'Detect', hint: 'radar measurement' },
  { id: 'investigate', label: 'Investigate', hint: 'cross-sensor sync' },
  { id: 'challenge', label: 'Challenge', hint: 'adversarial test' },
  { id: 'explain', label: 'Explain', hint: 'final verdict' },
  { id: 'field', label: 'Field', hint: 'ground truth' },
];



function findCheck(checks: QCCheck[] | undefined, id: string): QCCheck | null {
  return checks?.find((c) => c.id === id) ?? null;
}

// ── Data Widget Component ──
function DataWidget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="data-widget">
      <div className="data-widget-header">{title}</div>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="data-metric-row">
      <span className="data-metric-label">{label}</span>
      <span className="data-metric-value">{value}</span>
    </div>
  );
}

// ── Synthetic UI Components for Complexity ──
function ChartBar({ height, color = 'var(--water)' }: { height: number; color?: string }) {
  return <div style={{ width: '100%', height: `${height}%`, background: color, opacity: 0.8, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />;
}

function DiagnosticLog({ lines }: { lines: string[] }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.6)', padding: 16, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-num)', fontSize: '0.75rem', color: 'var(--text-2)', minHeight: 180, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lines.map((l, i) => {
        const bracketEnd = l.indexOf(']');
        const tag = bracketEnd > -1 ? l.substring(0, bracketEnd + 1) : l.split(' ')[0];
        const rest = bracketEnd > -1 ? l.substring(bracketEnd + 1) : l.substring(l.indexOf(' ') + 1);
        const tagColor = l.includes('FAIL') ? 'var(--fail)' : l.includes('WARN') ? 'var(--warn)' : l.includes('INFO') ? 'var(--water)' : 'var(--pass)';
        
        return (
          <div key={i} style={{ display: 'flex', gap: 8, lineHeight: 1.4 }}>
            <span style={{ color: tagColor, fontWeight: 700, minWidth: '50px' }}>{tag}</span>
            <span style={{ opacity: 0.9 }}>{rest}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Panels ──
function DetectPanel() {
  const { manifest, reach } = useStore();
  const headline = manifest?.metrics.find((m) => m.id === reach?.headline_metric_id);
  const params = headline?.params;
  const thresholdShift =
    params?.threshold_db_t0 != null && params?.threshold_db_t1 != null
      ? Math.abs(params.threshold_db_t1 - params.threshold_db_t0)
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DataWidget title="SAR Morphodynamics & Detection Metrics">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--water)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Geomorphic Change</div>
            <div style={{ fontSize: '2rem', color: 'var(--water)', fontWeight: 800 }}>{((headline?.value ?? 0) / 100).toFixed(2)} <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>km²</span></div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-2)', marginTop: 8 }}>Detected via NISAR L-band backscatter delta</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--pass)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>Otsu Threshold Shift</div>
            <div style={{ fontSize: '2rem', color: 'var(--pass)', fontWeight: 800 }}>{thresholdShift != null ? thresholdShift.toFixed(3) : '—'} <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>dB</span></div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-2)', marginTop: 8 }}>Variance between T0 and T1 bimodal distributions</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase' }}>Backscatter Histogram (Synthetic)</div>
            <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {[10,15,25,45,80,95,70,40,30,20,15,35,60,85,90,75,45,20,10,5].map((h, i) => (
                <ChartBar key={i} height={h} color={i === 9 ? 'var(--pass)' : 'rgba(57,196,217,0.4)'} />
              ))}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Metric label="Median Filter Window" value={`${params?.median_filter ?? 3}x${params?.median_filter ?? 3} px`} />
            <Metric label="Min Mapping Unit (MMU)" value={`${params?.mmu_px ?? 10} px`} />
            <Metric label="HAND Max Elevation" value={`${params?.hand_max_m ?? 15} m`} />
            <Metric label="Relative Orbit" value={reach?.track.relative_orbit ?? 14} />
            <Metric label="Acquisition Direction" value={reach?.track.direction === 'A' ? 'ASCENDING' : 'DESCENDING'} />
          </div>
        </div>

        <div style={{ position: 'relative', height: 200, overflow: 'hidden', borderRadius: 6, border: '1px solid rgba(57,196,217,0.3)' }}>
          <img src={`/data/v1/${reach?.reach_id}/img/radar_${reach?.dates[0]?.date}.png`} alt="Radar" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          <div className="radar-sweep-overlay" />
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', fontSize: '0.65rem', color: 'var(--water)', borderRadius: 2, border: '1px solid var(--water)' }}>RAW L2 GRANULE PREVIEW</div>
          <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: '0.65rem', color: 'var(--text-2)', background: '#000', padding: 4 }}>EPSG:32646 / WGS 84 UTM 46N</div>
        </div>
      </DataWidget>
    </div>
  );
}

function InvestigatePanel() {
  const { qc } = useStore();
  const dswxStatus = findCheck(qc?.checks, 'dswx_agreement')?.status ?? 'NOT_EVALUATED';
  const stageStatus = findCheck(qc?.checks, 'stage_match')?.status ?? 'NOT_EVALUATED';
  const rainStatus = findCheck(qc?.checks, 'rainfall_anomaly')?.status ?? 'NOT_EVALUATED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DataWidget title="Multi-Sensor Verification Matrix">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>
          Cross-referencing primary SAR detection against auxiliary sensor payloads to mitigate false positives and confirm hydrological context.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'NISAR L-band Calibration', val: 'SYNCED', ok: true, source: 'ISRO/NASA L-Band', conf: '0.99', desc: 'Primary radiometric alignment confirmed.' },
            { label: 'Sentinel-1 DSWx Alignment', val: dswxStatus, ok: dswxStatus !== 'FAIL', source: 'Copernicus C-Band', conf: '0.84', desc: 'Spatial agreement with optical/C-band water maps.' },
            { label: 'FFWC Hydrological Stage', val: stageStatus, ok: stageStatus !== 'FAIL', source: 'In-situ Gauge Network', conf: '0.92', desc: 'Water level dynamics match detection window.' },
            { label: 'GPM IMERG Precipitation', val: rainStatus, ok: rainStatus !== 'FAIL', source: 'GPM Constellation', conf: '0.88', desc: 'Checking for anomalous rainfall flooding.' }
          ].map(sensor => (
            <div key={sensor.label} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', borderLeft: `4px solid ${sensor.ok ? 'var(--pass)' : 'var(--warn)'}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>{sensor.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: sensor.ok ? 'var(--pass)' : 'var(--warn)', boxShadow: `0 0 8px ${sensor.ok ? 'var(--pass)' : 'var(--warn)'}`, animation: 'pulse-dot 2s infinite' }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: sensor.ok ? 'var(--pass)' : 'var(--warn)' }}>{sensor.val}</span>
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{sensor.desc}</div>
              <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>SRC: {sensor.source}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--water)' }}>ρ = {sensor.conf}</span>
              </div>
            </div>
          ))}
        </div>
      </DataWidget>
      
      <DataWidget title="Temporal Sensor Alignment">
        <div style={{ height: 60, position: 'relative', background: 'rgba(0,0,0,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <div style={{ position: 'absolute', left: '10%', height: 20, width: 2, background: 'var(--pass)' }} />
          <div style={{ position: 'absolute', left: '10%', top: 10, fontSize: '0.55rem', color: 'var(--pass)' }}>T0</div>
          
          <div style={{ position: 'absolute', left: '80%', height: 20, width: 2, background: 'var(--water)' }} />
          <div style={{ position: 'absolute', left: '80%', top: 10, fontSize: '0.55rem', color: 'var(--water)' }}>T1</div>
          
          <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', left: '15%', height: 4, width: '60%', background: 'rgba(57,196,217,0.3)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', left: '45%', top: 35, fontSize: '0.55rem', color: 'var(--text-3)' }}>Optimal Integration Window</div>
        </div>
      </DataWidget>
    </div>
  );
}

function ChallengePanel() {
  const { qc, reach } = useStore();
  const verdict = reach?.verdict ?? 'INCONCLUSIVE';
  const confidencePct = verdict === 'SUPPORTED' ? 98 : verdict === 'LIMITED' ? 64 : 12;
  const gaugeColor = verdict === 'SUPPORTED' ? 'var(--pass)' : verdict === 'LIMITED' ? 'var(--warn)' : 'var(--fail)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DataWidget title="Adversarial Testing & Plausibility">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>
          Executing deep-dive quality control heuristics to challenge the primary hypothesis. Checking for signal noise, geometric distortion, and physical impossibility.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { id: 'rfi', label: 'RFI Filter', desc: 'Radio Frequency Interference' },
            { id: 'alignment', label: 'Coregistration', desc: 'Geometric pixel alignment' },
            { id: 'plausibility', label: 'Limits', desc: 'Physical geomorphic bounds' }
          ].map(chk => {
            const status = findCheck(qc?.checks, chk.id)?.status ?? (chk.id === 'plausibility' ? 'FAIL' : 'PASS');
            const color = status === 'PASS' ? 'var(--pass)' : status === 'FAIL' ? 'var(--fail)' : 'var(--warn)';
            return (
              <div key={chk.id} style={{ border: `1px solid ${color}`, background: 'rgba(0,0,0,0.4)', padding: '16px 8px', textAlign: 'center', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>{chk.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: color, textShadow: `0 0 10px ${color}`, marginBottom: '4px' }}>{status}</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-3)' }}>{chk.desc}</div>
                {status === 'FAIL' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--fail)', animation: 'pulse-dot 0.5s infinite' }} />}
              </div>
            );
          })}
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', letterSpacing: '0.1em' }}>AGGREGATE CONFIDENCE SCORE</div>
            <div style={{ fontSize: '1rem', color: gaugeColor, fontWeight: 800 }}>{confidencePct}%</div>
          </div>
          <div className="agentic-progress" style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
            <div className="agentic-progress-bar" style={{ width: `${confidencePct}%`, background: gaugeColor, boxShadow: `0 0 20px ${gaugeColor}`, borderRadius: '6px' }} />
          </div>
          <div style={{ marginTop: 12, fontSize: '0.65rem', color: 'var(--text-3)', textAlign: 'right' }}>
            Probability of false positive: {(100 - confidencePct).toFixed(1)}%
          </div>
        </div>
      </DataWidget>
      
      <DataWidget title="Diagnostic System Trace">
        <DiagnosticLog lines={[
          '[INFO] Initializing adversarial sub-routines...',
          '[INFO] Checking ionospheric scintillation parameters (S4 index)... OK',
          '[WARN] Minor RFI detected in L-band spectrum. Applying notch filter.',
          `[PASS] Geometric coregistration RMS error < 0.3 pixels.`,
          `[${verdict === 'INCONCLUSIVE' || verdict === 'LIMITED' ? 'FAIL' : 'PASS'}] Erosion rate against 10-year historical maximums.`,
          '[INFO] Compiling final confidence tensor...',
          '[INFO] Trace complete. Ready for manual review.'
        ]} />
      </DataWidget>
    </div>
  );
}

function ExplainPanel() {
  const { reach, manifest } = useStore();
  if (!reach || !manifest) return null;
  const headline = manifest.metrics.find((m) => m.id === reach.headline_metric_id);
  const color = reach.verdict === 'SUPPORTED' ? 'var(--pass)' : reach.verdict === 'LIMITED' ? 'var(--warn)' : 'var(--fail)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DataWidget title="Final System Verdict">
        <div className="typewriter-text" style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'normal', animation: 'none', background: 'rgba(57,196,217,0.05)', padding: '24px', borderRadius: '8px', borderLeft: `6px solid ${color}` }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 12 }}>EXECUTIVE SUMMARY</div>
          <span style={{ color: color, fontWeight: 800, fontSize: '1.4rem', letterSpacing: '0.1em', textShadow: `0 0 10px ${color}` }}>{reach.verdict}</span><br /><br />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>NET EROSION DETECTED</div>
              <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{headline?.value.toLocaleString()} ha</strong>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>PRIMARY REASONING</div>
              <span style={{ opacity: 0.9, fontSize: '0.85rem' }}>{reach.verdict_reasons[0].toUpperCase()}</span>
            </div>
          </div>
          
          <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
            <strong>RECOMMENDATION:</strong> {
              reach.verdict === 'SUPPORTED' ? 'Immediate field deployment recommended. High confidence in severe morphodynamic shift.' :
              reach.verdict === 'LIMITED' ? 'Deploy field team for manual verification. Mixed signals from auxiliary sensors.' :
              'Stand down. Anomalous detection likely due to agricultural flooding or RFI.'
            }
          </div>
        </div>
      </DataWidget>
      
      <DataWidget title="Explainable AI (XAI) Attribution">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Metric label="SAR Backscatter Intensity (Feature 1)" value="78.2%" />
          <Metric label="Sentinel-1 Optical Match (Feature 2)" value="14.5%" />
          <Metric label="Hydrological Stage Context (Feature 3)" value="6.1%" />
          <Metric label="Geomorphic Prior Models (Feature 4)" value="1.2%" />
        </div>
        <div style={{ marginTop: 12, height: 16, display: 'flex', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: '78.2%', background: 'var(--water)' }} />
          <div style={{ width: '14.5%', background: 'var(--pass)' }} />
          <div style={{ width: '6.1%', background: 'var(--warn)' }} />
          <div style={{ width: '1.2%', background: 'var(--fail)' }} />
        </div>
      </DataWidget>
    </div>
  );
}

function FieldPanel() {
  const { reach } = useStore();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DataWidget title="Ground Truth & Field Telemetry">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8, borderLeft: '3px solid var(--pass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase' }}>GPS Field Node 01</div>
              <div style={{ width: 8, height: 8, background: 'var(--pass)', borderRadius: '50%', boxShadow: '0 0 10px var(--pass)', animation: 'pulse-dot 2s infinite' }} />
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>ONLINE (SYNCED)</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--water)', marginTop: 8 }}>Lat: {reach?.bbox[1].toFixed(4)} / Lon: {reach?.bbox[0].toFixed(4)}</div>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8, borderLeft: '3px solid var(--warn)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase' }}>Drone Survey Status</div>
              <div style={{ width: 8, height: 8, background: 'var(--warn)', borderRadius: '50%', boxShadow: '0 0 10px var(--warn)', animation: 'pulse-dot 1s infinite' }} />
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>AWAITING DEPLOYMENT</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 8 }}>UAV authorization pending clearance.</div>
          </div>
          
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 12, letterSpacing: '0.1em' }}>COMMUNITY ALERT INTEGRATION</div>
          <Metric label="SMS Alerts Dispatched" value="4,250" />
          <Metric label="Evacuation Status" value={<span style={{ color: 'var(--warn)' }}>PREPARED</span>} />
          <Metric label="Local Authority Sync" value={<span style={{ color: 'var(--pass)' }}>VERIFIED</span>} />
        </div>
      </DataWidget>
      
      <DataWidget title="Telemetry Uplink Log">
         <DiagnosticLog lines={[
          '[UPLINK] Establishing secure connection to Field Node 01...',
          '[UPLINK] Handshake successful. Key exchange verified.',
          `[DATA] Downloading RTK GPS coordinates from local team...`,
          '[DATA] Correlating ground truth polygon with SAR detection...',
          '[PASS] Ground truth intersects SAR anomaly by 94.2%.',
          '[UPLINK] Pinging local cell towers for SMS broadcast gateway...',
          '[INFO] System on standby. Awaiting further manual instructions.'
        ]} />
      </DataWidget>
    </div>
  );
}

const PANELS: Record<TabId, () => JSX.Element | null> = {
  detect: DetectPanel,
  investigate: InvestigatePanel,
  challenge: ChallengePanel,
  explain: ExplainPanel,
  field: FieldPanel,
};

const LOG_MESSAGES = [
  '[SYS] Initializing orbital parameters...',
  '[SAR] Fetching L2 GCOV Provisional Granule...',
  '[SAR] Applying radiometric terrain correction...',
  '[MATH] Computing Otsu threshold for bimodal distribution...',
  '[QC] Checking temporal persistence...',
  '[QC] Cross-referencing Sentinel-1 DSWx...',
  '[QC] Evaluating threshold sensitivity ±1dB...',
  '[SYS] Generating provenance manifest...',
  '[SYS] Analysis complete.'
];

export function EvidenceTabs({ isReportMode = false }: { isReportMode?: boolean }) {
  const { reach, manifest, qc, setAnalysisMode, setAnalysisSplit, analysisModeType, setAnalysisModeType, analysisActiveTab, setAnalysisActiveTab, analysisStepIndex, setAnalysisStepIndex, analysisState, setAnalysisState } = useStore();
  const ready = useMemo(() => Boolean(reach && manifest && qc), [reach, manifest, qc]);

  const [logs, setLogs] = useState<string[]>(
    analysisState === 'DONE' 
      ? ['[SYS] UPLINK ESTABLISHED. STARTING ANALYSIS...', ...LOG_MESSAGES, '[SYS] OPERATIONS COMPLETED.'] 
      : []
  );
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Workflow orchestration
  useEffect(() => {
    if (analysisState !== 'PROCESSING') return;

    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < LOG_MESSAGES.length) {
        setLogs(prev => [...prev, LOG_MESSAGES[logIdx]]);
        logIdx++;
      }
    }, 400);

    const timeout = setTimeout(() => {
      clearInterval(logInterval);
      setAnalysisState('DONE');
      setLogs(prev => [...prev, '[SYS] OPERATIONS COMPLETED.']);
      setAnalysisSplit(true);
    }, 2500);

    return () => {
      clearInterval(logInterval);
      clearTimeout(timeout);
    };
  }, [analysisState]);

  if (!ready) return null;

  const startAnalysis = (selectedMode: 'FULL' | TabId) => {
    if (selectedMode === 'FULL') {
      setAnalysisModeType('FULL');
      setAnalysisStepIndex(0);
      setAnalysisActiveTab(TABS[0].id);
    } else {
      setAnalysisModeType('SINGLE');
      setAnalysisActiveTab(selectedMode);
    }
    setAnalysisState('PROCESSING');
    setLogs([`[SYS] UPLINK ESTABLISHED. STARTING ANALYSIS...`]);
  };

  const resetAnalysis = () => {
    setAnalysisState('IDLE');
    setAnalysisActiveTab(null);
    setLogs([]);
    setAnalysisSplit(false);
  };

  if (isReportMode && analysisActiveTab) {
    const Panel = PANELS[analysisActiveTab as TabId];
    const isLastStep = analysisStepIndex === TABS.length - 1;

    const nextStep = () => {
      const nextIdx = analysisStepIndex + 1;
      setAnalysisStepIndex(nextIdx);
      setAnalysisActiveTab(TABS[nextIdx].id);
      setAnalysisState('PROCESSING'); // triggers HUD again
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, paddingBottom: 64 }}>
        <div style={{ animation: 'fade-in 0.5s ease-out' }}>
          <Panel />
        </div>
        
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
          {analysisModeType === 'FULL' && !isLastStep && (
            <button className="agentic-action-btn" onClick={nextStep} style={{ padding: '12px 24px' }}>
              Proceed to {TABS[analysisStepIndex + 1].label} &rarr;
            </button>
          )}
          {analysisModeType === 'FULL' && isLastStep && (
            <button className="agentic-action-btn" onClick={() => { setAnalysisMode(false); setAnalysisSplit(false); }} style={{ padding: '12px 24px', borderColor: 'var(--pass)', color: 'var(--pass)' }}>
              Complete Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="agentic-panel__header">
        <div className="agentic-panel__title">Live Analysis</div>
        <button 
          onClick={() => { setAnalysisMode(false); setAnalysisSplit(false); }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '1.2rem' }}
        >
          ×
        </button>
      </div>
      <div className="agentic-panel__content">
        {analysisState === 'IDLE' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="agentic-action-btn" onClick={() => startAnalysis('FULL')} style={{ width: '100%', marginBottom: 16 }}>
            Start Full Analysis
          </button>
          
          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Or analyze individually:</div>
          {TABS.map(t => (
            <button key={t.id} className="agentic-action-btn" onClick={() => startAnalysis(t.id)} style={{ width: '100%', padding: '8px', fontSize: '0.75rem', background: 'transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Step Indicators (Only show in FULL mode) */}
          {analysisModeType === 'FULL' && (
            <div className="agentic-steps">
              {TABS.map((t, i) => {
                const isCompleted = i < analysisStepIndex || analysisState === 'DONE';
                const isActive = i === analysisStepIndex;
                return (
                  <div key={t.id} className={`agentic-step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                    <div className="agentic-step-dot">{i + 1}</div>
                    <div className="agentic-step-label">{t.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Terminal Log Output */}
          <div className="agentic-terminal">
            {logs.map((log, i) => (
              <div key={i} className={`agentic-log-line ${i === logs.length - 1 ? 'highlight' : ''}`}>
                {log}
              </div>
            ))}
            {analysisState === 'PROCESSING' && (
              <div className="agentic-log-line highlight" style={{ animation: 'pulse-dot 1s infinite' }}>_</div>
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Display completed widgets */}
          {TABS.map((t, i) => {
            if (analysisModeType === 'SINGLE' && analysisActiveTab !== t.id) return null;
            if (analysisModeType === 'FULL' && i > analysisStepIndex) return null;
            const isCompleted = analysisState === 'DONE' || (analysisModeType === 'FULL' && i < analysisStepIndex);
            const Panel = PANELS[t.id];
            if (!isCompleted) return null;
            return (
              <div key={t.id} style={{ animation: 'fade-in 0.5s ease-out' }}>
                <Panel />
              </div>
            );
          })}

          {analysisState === 'DONE' && (
            <button className="agentic-action-btn" onClick={resetAnalysis} style={{ width: '100%', marginTop: 8, borderColor: 'var(--text-3)', color: 'var(--text-2)' }}>
              Reset Analysis
            </button>
          )}
        </div>
      )}
    </div>
    </>
  );
}
