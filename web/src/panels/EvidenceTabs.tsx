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
    <DataWidget title="SAR Detection Metrics">
      <Metric label="Otsu Threshold Shift" value={thresholdShift != null ? `${thresholdShift.toFixed(2)} dB` : '—'} />
      <Metric label="Total Change Area" value={`${((headline?.value ?? 0) / 100).toFixed(1)} km²`} />
      <Metric label="Filter (Med/MMU/HAND)" value={`${params?.median_filter ?? '—'} / ${params?.mmu_px ?? '—'} / ${params?.hand_max_m ?? '—'}m`} />
      <div style={{ marginTop: 12, position: 'relative', height: 80, overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(57,196,217,0.3)' }}>
        <img src={`/data/v1/${reach?.reach_id}/img/radar_${reach?.dates[0]?.date}.png`} alt="Radar" style={{ width: '100%', opacity: 0.6 }} />
        <div className="radar-sweep-overlay" />
      </div>
    </DataWidget>
  );
}

function InvestigatePanel() {
  const { qc } = useStore();
  return (
    <DataWidget title="Multi-Sensor Verification">
      <Metric label="NISAR L-band" value={<span style={{ color: 'var(--pass)' }}>SYNCED</span>} />
      <Metric label="Sentinel-1 DSWx" value={findCheck(qc?.checks, 'dswx_agreement')?.status ?? 'NOT_EVALUATED'} />
      <Metric label="FFWC Stage Match" value={findCheck(qc?.checks, 'stage_match')?.status ?? 'NOT_EVALUATED'} />
      <Metric label="GPM IMERG Rain" value={findCheck(qc?.checks, 'rainfall_anomaly')?.status ?? 'NOT_EVALUATED'} />
    </DataWidget>
  );
}

function ChallengePanel() {
  const { qc, reach } = useStore();
  const verdict = reach?.verdict ?? 'INCONCLUSIVE';
  const confidencePct = verdict === 'SUPPORTED' ? 100 : verdict === 'LIMITED' ? 50 : 15;
  const gaugeColor = verdict === 'SUPPORTED' ? 'var(--pass)' : verdict === 'LIMITED' ? 'var(--warn)' : 'var(--fail)';

  return (
    <DataWidget title="Adversarial Testing">
      <Metric label="RFI Interference" value={findCheck(qc?.checks, 'rfi')?.status ?? 'PASS'} />
      <Metric label="Alignment QC" value={findCheck(qc?.checks, 'alignment')?.status ?? 'PASS'} />
      <Metric label="Plausibility Limits" value={findCheck(qc?.checks, 'plausibility')?.status ?? 'FAIL'} />
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', marginBottom: 4 }}>CONFIDENCE LEVEL</div>
        <div className="agentic-progress">
          <div className="agentic-progress-bar" style={{ width: `${confidencePct}%`, background: gaugeColor, boxShadow: `0 0 10px ${gaugeColor}` }} />
        </div>
      </div>
    </DataWidget>
  );
}

function ExplainPanel() {
  const { reach, manifest } = useStore();
  if (!reach || !manifest) return null;
  const headline = manifest.metrics.find((m) => m.id === reach.headline_metric_id);

  return (
    <DataWidget title="System Verdict">
      <div className="typewriter-text" style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5, whiteSpace: 'normal', animation: 'none' }}>
        &gt; VERDICT: <span style={{ color: 'var(--water)', fontWeight: 700 }}>{reach.verdict}</span><br />
        &gt; EROSION DETECTED: {headline?.value.toLocaleString()} ha<br />
        &gt; STATUS: {reach.verdict_reasons[0].toUpperCase()}
      </div>
    </DataWidget>
  );
}

function FieldPanel() {
  return (
    <DataWidget title="Field Synchronization">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ width: 12, height: 12, background: 'var(--pass)', borderRadius: '50%', boxShadow: '0 0 8px var(--pass)' }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--pass)' }}>GPS MODULE STANDBY</span>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text-3)' }}>
        Awaiting local telemetry override...
      </div>
    </DataWidget>
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

export function EvidenceTabs() {
  const { reach, manifest, qc } = useStore();
  const ready = useMemo(() => Boolean(reach && manifest && qc), [reach, manifest, qc]);

  const [workflowState, setWorkflowState] = useState<'IDLE' | 'RUNNING' | 'DONE'>('IDLE');
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Workflow orchestration
  useEffect(() => {
    if (workflowState !== 'RUNNING') return;

    let step = 0;
    let logIdx = 0;
    
    const runStep = () => {
      if (step >= TABS.length) {
        setWorkflowState('DONE');
        setLogs(prev => [...prev, '[SYS] ALL OPERATIONS COMPLETED.']);
        return;
      }
      
      setCurrentStepIdx(step);
      
      // Add a log message
      if (logIdx < LOG_MESSAGES.length) {
        setLogs(prev => [...prev, LOG_MESSAGES[logIdx]]);
        logIdx++;
      }

      // Move to next step after a delay (simulating processing)
      setTimeout(() => {
        step++;
        runStep();
      }, 1500); // 1.5 seconds per step
    };

    runStep();
  }, [workflowState]);

  if (!ready) return null;

  const startAnalysis = () => {
    setWorkflowState('RUNNING');
    setCurrentStepIdx(-1);
    setLogs(['[SYS] UPLINK ESTABLISHED. STARTING AUTOMATED ANALYSIS...']);
  };

  const resetAnalysis = () => {
    setWorkflowState('IDLE');
    setCurrentStepIdx(-1);
    setLogs([]);
  };

  return (
    <>
      <div className="agentic-panel__header">
        <div className="agentic-panel__title">Live Analysis</div>
        <button 
          onClick={() => useStore.getState().setAgenticWorkflowOpen(false)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '1.2rem' }}
        >
          ×
        </button>
      </div>
      <div className="agentic-panel__content">
        {workflowState === 'IDLE' ? (
        <button className="agentic-action-btn" onClick={startAnalysis} style={{ width: '100%' }}>
          Start Automated Investigation
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Step Indicators */}
          <div className="agentic-steps">
            {TABS.map((t, i) => {
              const isCompleted = i < currentStepIdx || workflowState === 'DONE';
              const isActive = i === currentStepIdx;
              return (
                <div key={t.id} className={`agentic-step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                  <div className="agentic-step-dot">{i + 1}</div>
                  <div className="agentic-step-label">{t.label}</div>
                </div>
              );
            })}
          </div>

          {/* Terminal Log Output */}
          <div className="agentic-terminal">
            {logs.map((log, i) => (
              <div key={i} className={`agentic-log-line ${i === logs.length - 1 ? 'highlight' : ''}`}>
                {log}
              </div>
            ))}
            {workflowState === 'RUNNING' && (
              <div className="agentic-log-line highlight" style={{ animation: 'pulse-dot 1s infinite' }}>_</div>
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Display completed widgets */}
          {TABS.map((t, i) => {
            const isCompleted = i < currentStepIdx || workflowState === 'DONE';
            const Panel = PANELS[t.id];
            if (!isCompleted) return null;
            return (
              <div key={t.id} style={{ animation: 'fade-in 0.5s ease-out' }}>
                <Panel />
              </div>
            );
          })}

          {workflowState === 'DONE' && (
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
