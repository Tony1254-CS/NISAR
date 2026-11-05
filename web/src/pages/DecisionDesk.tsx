import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, Check, ChevronRight, ClipboardList, Copy, Crosshair,
  FileJson2, Layers3, Pause, Play, Printer, ShieldAlert, Waves, Eye,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { DecisionMap, featureCentroid } from '../map/DecisionMap';
import { loadReachBundle, type ReachBundle } from '../data/load';
import type { ChangeFeature, QCCheck } from '../data/types';
import { useStore } from '../state/store';
import { StageHydro } from '../decision/StageHydro';
import {
  PERSONAS, PERSONA_BY_ID, CLASS_LABEL, STATUS_LABEL, priorityIndex, rankForPersona,
  type PersonaId, type TaskStatus,
} from '../decision/personas';
import '../styles/decision-desk.css';

const REACH_ID = 'jamuna-chilmari';
const QC_URL = 'https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/';
const NISAR_URL = 'https://science.nasa.gov/mission/nisar/data/';
const OSM_URL = 'https://www.openstreetmap.org/copyright';

interface Tasking { status: TaskStatus; owner: string; deadline: string; reason: string }
interface AuditEntry { ts: string; featureId: string; action: string; detail: string }
const DEFAULT_TASKING: Tasking = { status: 'UNREVIEWED', owner: '', deadline: '', reason: '' };

function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  const parsed = new Date(date.length === 8 ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00Z` : date);
  return Number.isNaN(parsed.valueOf()) ? date : new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}
function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function formatCoord(point: [number, number]) {
  const [lon, lat] = point;
  return `${Math.abs(lat).toFixed(2)}°N ${Math.abs(lon).toFixed(2)}°E`;
}
function addDays(date8: string, days: number) {
  const d = new Date(`${date8.slice(0, 4)}-${date8.slice(4, 6)}-${date8.slice(6, 8)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}
function downloadJson(filename: string, data: unknown) {
  const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = href; link.download = filename; link.click();
  URL.revokeObjectURL(href);
}
const QC_STYLE: Record<string, string> = { FAIL: 'fail', WARN: 'warn', INFO: 'info', PASS: 'pass', NOT_EVALUATED: 'off' };
function Stamp({ kind, children }: { kind: 'real' | 'derived' | 'estimated' | 'context'; children: string }) {
  return <span className={`dd-stamp is-${kind}`}>{children}</span>;
}

export function DecisionDesk() {
  const [bundle, setBundle] = useState<ReachBundle | null>(null);
  const [error, setError] = useState('');
  const [persona, setPersona] = useState<PersonaId>('disaster');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('20260919');
  const [showRadar, setShowRadar] = useState(true);
  const [showWater, setShowWater] = useState(false);
  const [showOpera, setShowOpera] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [thresholdDb, setThresholdDb] = useState(0);
  const [tasking, setTasking] = useState<Record<string, Tasking>>({});
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerQuery, setLedgerQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeOk, setNoticeOk] = useState(true);
  const setReachId = useStore((s) => s.setReachId);

  useEffect(() => {
    let cancelled = false;
    setReachId(REACH_ID);
    loadReachBundle(REACH_ID).then((data) => {
      if (cancelled) return;
      setBundle(data);
      const dates = data.reach.dates.filter((item) => item.status === 'ok');
      setSelectedDate(dates[dates.length - 1]?.date ?? dates[0]?.date ?? '');
      try { setTasking(JSON.parse(localStorage.getItem(`fluvisar-tasking:${REACH_ID}`) ?? '{}')); } catch { setTasking({}); }
      try { setAudit(JSON.parse(localStorage.getItem(`fluvisar-audit:${REACH_ID}`) ?? '[]')); } catch { setAudit([]); }
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load the Jamuna investigation bundle.');
    });
    return () => { cancelled = true; };
  }, [setReachId]);

  const candidates = useMemo(() => {
    if (!bundle) return [];
    return [...(bundle.erosion?.features ?? []), ...(bundle.accretion?.features ?? [])]
      .sort((a, b) => (b.properties.area_ha ?? 0) - (a.properties.area_ha ?? 0));
  }, [bundle]);

  const maxArea = candidates[0]?.properties.area_ha ?? 0;
  const top24ByArea = useMemo(() => candidates.slice(0, 24), [candidates]);
  const queue = useMemo(() => rankForPersona(top24ByArea, persona), [top24ByArea, persona]);
  const selected: ChangeFeature | null = candidates.find((f) => String(f.properties.id) === selectedFeatureId) ?? queue[0] ?? candidates[0] ?? null;
  useEffect(() => {
    if (selected && !selectedFeatureId) setSelectedFeatureId(String(selected.properties.id));
  }, [selected, selectedFeatureId]);

  const firstDate = bundle?.reach.dates[0]?.date ?? '';
  const lastDate = bundle?.reach.dates[bundle.reach.dates.length - 1]?.date ?? '';
  const passDates = useMemo(() => bundle?.reach.dates.filter((item) => item.status === 'ok').map((item) => item.date) ?? [], [bundle]);
  useEffect(() => {
    if (!playing || passDates.length < 2) return;
    const id = setInterval(() => {
      setSelectedDate((current) => passDates[(passDates.indexOf(current) + 1) % passDates.length]);
    }, 1500);
    return () => clearInterval(id);
  }, [playing, passDates]);

  const erosionMetric = bundle?.manifest.metrics.find((m) => m.id === 'erosion_area') ?? null;
  const accretionMetric = bundle?.manifest.metrics.find((m) => m.id === 'accretion_area') ?? null;
  const thresholds = erosionMetric?.params ?? null;
  const qcChecks = bundle?.qc?.checks ?? [];
  const failedChecks = qcChecks.filter((c: QCCheck) => c.status === 'FAIL').length;
  const warningChecks = qcChecks.filter((c: QCCheck) => c.status === 'WARN').length;
  const notEvaluated = qcChecks.filter((c: QCCheck) => c.status === 'NOT_EVALUATED').length;
  const pairWindow = firstDate && lastDate
    ? Math.round((new Date(`${lastDate.slice(0, 4)}-${lastDate.slice(4, 6)}-${lastDate.slice(6, 8)}`).valueOf() - new Date(`${firstDate.slice(0, 4)}-${firstDate.slice(4, 6)}-${firstDate.slice(6, 8)}`).valueOf()) / 86400000)
    : 0;
  const nextPass = lastDate ? addDays(lastDate, 12) : '';
  const centroidOf = selected ? featureCentroid(selected) : null;
  const selId = selected ? String(selected.properties.id) : '';
  const selTask: Tasking = tasking[selId] ?? DEFAULT_TASKING;
  const taskedCount = queue.filter((f) => (tasking[String(f.properties.id)]?.status ?? 'UNREVIEWED') !== 'UNREVIEWED').length;
  const confirmedLosses = queue.filter((f) => tasking[String(f.properties.id)]?.status === 'VERIFIED').length;

  // ±1 dB slider: piecewise-linear reading of the manifest's published sensitivity
  // triple (low @ −1 dB, value @ 0, high @ +1 dB). A reading aid, NOT a re-run.
  const sliderArea = useMemo(() => {
    if (!erosionMetric || erosionMetric.low == null || erosionMetric.high == null) return erosionMetric?.value ?? 0;
    if (thresholdDb <= 0) return erosionMetric.low + (erosionMetric.value - erosionMetric.low) * (thresholdDb + 1);
    return erosionMetric.value + (erosionMetric.high - erosionMetric.value) * thresholdDb;
  }, [erosionMetric, thresholdDb]);

  const ledgerFiltered = useMemo(() => {
    const q = ledgerQuery.trim().toLowerCase();
    return q ? candidates.filter((f) => String(f.properties.id).toLowerCase().includes(q)) : candidates;
  }, [candidates, ledgerQuery]);

  const persistTasking = (next: Record<string, Tasking>, nextAudit: AuditEntry[]) => {
    setTasking(next); setAudit(nextAudit);
    localStorage.setItem(`fluvisar-tasking:${REACH_ID}`, JSON.stringify(next));
    localStorage.setItem(`fluvisar-audit:${REACH_ID}`, JSON.stringify(nextAudit));
  };
  const applyTask = (status: TaskStatus) => {
    if (!selected) return;
    if (status === 'REJECTED' && !selTask.reason.trim()) {
      setNoticeOk(false); setNotice('Dismiss requires a reason — write it in the drawer first.'); return;
    }
    const entry: AuditEntry = {
      ts: new Date().toISOString(), featureId: selId, action: status,
      detail: [selTask.owner && `owner: ${selTask.owner}`, selTask.deadline && `deadline: ${selTask.deadline}`, status === 'REJECTED' && `reason: ${selTask.reason}`].filter(Boolean).join(' · ') || 'no owner/deadline set',
    };
    persistTasking({ ...tasking, [selId]: { ...selTask, status } }, [entry, ...audit]);
    setNoticeOk(true); setNotice(`${selId} → ${status}. Written to the audit log.`);
  };
  const patchTask = (patch: Partial<Tasking>) => {
    if (!selected) return;
    const next = { ...tasking, [selId]: { ...selTask, ...patch } };
    setTasking(next);
    localStorage.setItem(`fluvisar-tasking:${REACH_ID}`, JSON.stringify(next));
  };

  const exportCasePacket = () => {
    if (!bundle || !selected) return;
    downloadJson(`fluvisar-case-${selId}.json`, {
      schema: 'fluvisar.decision-desk.case.v2',
      exported_at: new Date().toISOString(),
      activation: 'CHILMARI-2026-01',
      reach_id: REACH_ID, reach_name: bundle.reach.name, river: bundle.reach.river,
      candidate: selected, tasking: selTask,
      verdict: 'STAGE-CONFOUNDED PAIR (bundle run verdict: INCONCLUSIVE)',
      observation_dates: bundle.reach.dates.map((d) => ({ date: d.date, acq_utc: d.acq_utc })),
      source_granules: erosionMetric?.inputs ?? [],
      qc: qcChecks.map((c: QCCheck) => ({ id: c.id, status: c.status, explanation: c.explanation })),
      audit_for_candidate: audit.filter((a) => a.featureId === selId),
      interpretation: 'Mapped land-to-water transition candidate from a stage-confounded pair. Field-review handoff, not a verified erosion alert.',
    });
    setNoticeOk(true); setNotice('Case packet exported.');
  };
  const copyCaseLink = async () => {
    if (!selected) return;
    const href = `${window.location.origin}/app?reach=${REACH_ID}&feature=${encodeURIComponent(selId)}`;
    try { await navigator.clipboard.writeText(href); setNoticeOk(true); setNotice('Investigation link copied.'); }
    catch { setNotice(href); }
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const personaDef = PERSONA_BY_ID[persona];

  if (error) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby error"><ShieldAlert size={30} /><h1>Investigation unavailable</h1><p>{error}</p><a href="/methods">Open methods and data sources <ChevronRight size={14} /></a></main></div>;
  if (!bundle) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby"><span className="desk-kicker">FLUVISAR / DECISION DESK</span><div className="desk-loader" /><p>Loading the Jamuna evidence bundle…</p></main></div>;
  if (!candidates.length) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby error"><ShieldAlert size={30} /><h1>No mapped candidates in this bundle</h1><p>The evidence bundle loaded, but it contains no transition features to review.</p><a href="/methods">Open methods and data sources <ChevronRight size={14} /></a></main></div>;

  return (
    <div className="desk-page">
      <Navbar transparent={false} />
      <main className="desk-shell">

        {/* ── §0 Activation bar ── */}
        <div className="dd-activation" role="note">
          <span>FLUVISAR · ACTIVATION <strong>CHILMARI-2026-01</strong></span>
          <span>NISAR L-BAND GCOV HH · TRACK {bundle.reach.track.relative_orbit} FRAME {bundle.reach.track.frame}</span>
          <span>PAIR {formatDate(firstDate)} → {formatDate(lastDate)} · {pairWindow} DAYS = 2 CYCLES</span>
          <span>PRODUCT V1 · STATUS: FIELD VERIFICATION OPEN</span>
          <span>NEXT SAME-TRACK PASS: {formatDate(nextPass)} <Stamp kind="derived">DERIVED · +12 d cycle</Stamp></span>
        </div>

        {/* ── §1 Hero: verdict as instruction ── */}
        <header className="desk-hero dd-hero">
          <div className="desk-hero-lede">
            <div className="desk-kicker"><span className="desk-kicker-rule" />FLUVISAR · DECISION DESK · JAMUNA–CHILMARI</div>
            <h1>The river fell. The radar saw land change. We cannot yet call it erosion.</h1>
            <p className="desk-deck">
              Between the two NISAR passes the Jamuna’s stage signal shifted and its bars emerged —
              most apparent change in this pair is falling water exposing the river’s own bed, not proven
              bank loss. <strong>24 places are worth a field check. None justify action on radar alone.</strong>
            </p>
            <div className="dd-hero-numbers" aria-label="Qualified headline numbers">
              <div className="dd-num">
                <strong>24</strong><span>FIELD PRIORITIES</span>
                <small>of {candidates.length.toLocaleString()} candidates screened <Stamp kind="real">REAL · bundle</Stamp></small>
              </div>
              <div className="dd-num">
                <strong>{formatNumber(erosionMetric?.value)} ha</strong><span>EROSION CANDIDATES</span>
                <small>range {formatNumber(erosionMetric?.low, 0)}–{formatNumber(erosionMetric?.high, 0)} ha at ±1 dB <Stamp kind="real">REAL · manifest</Stamp></small>
              </div>
              <div className="dd-num">
                <strong>{confirmedLosses}</strong><span>CONFIRMED LOSSES</span>
                <small>verification pending — a loss exists only when a field check closes it</small>
              </div>
            </div>
            <div className="desk-verdict-actions">
              <button className="desk-btn primary" onClick={() => { setSelectedFeatureId(String(queue[0].properties.id)); scrollTo('desk-queue'); }}>Start triage <ChevronRight size={13} /></button>
              <button className="desk-btn" onClick={() => scrollTo('desk-hydro')}>Why we can’t conclude <ArrowUpRight size={13} /></button>
            </div>
          </div>
          <div className="desk-verdict-card" role="status">
            <div className="desk-verdict-head"><span className="desk-verdict-pulse"><i /></span>EVIDENCE VERDICT · THIS RUN</div>
            <div className="desk-verdict-word dd-verdict-word">STAGE-CONFOUNDED PAIR</div>
            <p>Bundle run verdict: {bundle.reach.verdict} · {failedChecks} check failed · {warningChecks} warned · {notEvaluated} not evaluated. Safe to task. Unsafe to conclude.</p>
            <div className="dd-allowed">
              <div><strong>✅ ALLOWED NOW</strong><span>Task field verification of the 24 priorities · compare against DSWx + historic banklines</span></div>
              <div><strong>⛔ NOT ALLOWED</strong><span>Publish an erosion area as fact · claim displacement or loss · trigger a response from this map alone</span></div>
              <div><strong>🔭 RESOLVES IT</strong><span>Next same-track pass ({formatDate(nextPass)}) at comparable stage — persistence separates emergence from bank loss</span></div>
            </div>
            <div className="desk-verdict-meta"><span>{taskedCount}/24 tasked or beyond</span><span>bundle frozen {formatDate(bundle.manifest.generated_at.slice(0, 10).replace(/-/g, ''))}</span></div>
          </div>
        </header>

        {/* ── §5 Persona switcher (pinned workspace control) ── */}
        <section className="dd-persona" aria-label="Persona switcher">
          <div className="dd-persona-tabs" role="tablist" aria-label="Choose your desk">
            {PERSONAS.map((p) => (
              <button key={p.id} role="tab" aria-selected={persona === p.id} className={persona === p.id ? 'active' : ''} onClick={() => setPersona(p.id)}>
                {p.label}{p.labelBn ? <small>{p.labelBn}</small> : null}
              </button>
            ))}
          </div>
          <div className="dd-persona-body">
            <div className="dd-persona-job"><span>YOUR JOB HERE</span><strong>{personaDef.job}</strong></div>
            <ol className="dd-persona-actions">
              {personaDef.actions.map((a) => <li key={a}>{a}</li>)}
            </ol>
            <div className="dd-persona-side">
              <button className="desk-btn primary" onClick={() => scrollTo('desk-brief')}><Printer size={13} /> {personaDef.exportLabel}</button>
              <small>{personaDef.sliceNote}</small>
            </div>
          </div>
        </section>

        {/* ── §2 Map: full-bleed, swipe, hydrograph, threshold ── */}
        <section className="dd-map-section" aria-label="NISAR map">
          <div className="desk-map-frame dd-map-frame">
            <DecisionMap
              reach={bundle.reach}
              bounds={bundle.bounds}
              dates={bundle.reach.dates.map((item) => item.date)}
              selectedDate={selectedDate}
              selectedFeatureId={selected ? String(selected.properties.id) : null}
              erosion={bundle.erosion}
              accretion={bundle.accretion}
              showRadar={showRadar}
              showWater={showWater}
              showOpera={showOpera}
              scenario={null}
              osm={null}
              topN={24}
              onSelectFeature={(id) => { setSelectedFeatureId(id); scrollTo('desk-drawer'); }}
            />
            <div className="desk-map-chip"><span className="desk-live-dot" />NISAR PASS · <b>{formatDate(selectedDate)}</b></div>
            <div className="desk-map-layers" aria-label="Map layers">
              <button className={showRadar ? 'active' : ''} onClick={() => setShowRadar(!showRadar)}><Eye size={13} /> NISAR HH</button>
              <button className={showWater ? 'active' : ''} onClick={() => setShowWater(!showWater)}><Waves size={13} /> Water mask</button>
              <button className={showOpera ? 'active' : ''} onClick={() => setShowOpera(!showOpera)}><Layers3 size={13} /> OPERA · 17 JUN</button>
            </div>
            <div className="desk-map-legend">
              <span><i className="l-erosion" /> Land → water candidate</span>
              <span><i className="l-accretion" /> Water → land candidate</span>
              <span><i className="l-selected" /> Selected</span>
              <span className="dd-map-note">Map shows top 24 per class · click a candidate to open its evidence drawer</span>
            </div>
          </div>

          <div className="desk-passes">
            <div className="desk-passes-head">
              <span className="desk-eyebrow-inline">OBSERVED PASSES · SAME RELATIVE ORBIT</span>
              {passDates.length >= 2 && (
                <button className={`desk-play ${playing ? 'on' : ''}`} onClick={() => setPlaying(!playing)} aria-label={playing ? 'Stop time series' : 'Play time series'}>
                  {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? 'Pause cycle' : 'Cycle passes'}
                </button>
              )}
            </div>
            <div className="desk-passes-grid">
              {bundle.reach.dates.map((date) => (
                <button key={date.date} className={selectedDate === date.date ? 'selected' : ''} onClick={() => setSelectedDate(date.date)}>
                  <span className="desk-pass-node">{selectedDate === date.date && <i />}</span>
                  <strong>{formatDate(date.date)}</strong>
                  <small>{date.status === 'ok' ? `L-band HH · ${date.stage_source === 'proxy' ? 'stage proxy' : 'gauge stage'} · ${date.acq_utc.slice(11, 16)} UTC` : `not used · ${date.status}`}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="dd-swipe">
            <div className="dd-swipe-head"><span>A/B SWIPE · THE TWO PASSES, SIDE BY SIDE</span><Stamp kind="real">REAL · NISAR HH quicklooks in bundle</Stamp></div>
            <div className="desk-compare" style={{ '--compare-position': `${comparePosition}%` } as React.CSSProperties}>
              <img className="cmp-after" src={`/data/v1/${REACH_ID}/img/radar_${lastDate}.png`} alt={`NISAR HH quicklook from ${formatDate(lastDate)}`} />
              <img className="cmp-before" src={`/data/v1/${REACH_ID}/img/radar_${firstDate}.png`} alt={`NISAR HH quicklook from ${formatDate(firstDate)}`} />
              <div className="cmp-divider"><span>⇆</span></div>
              <label className="sr-only" htmlFor="desk-compare">Compare NISAR dates</label>
              <input id="desk-compare" type="range" min="3" max="97" value={comparePosition} onChange={(event) => setComparePosition(Number(event.target.value))} aria-label="Swipe between the two NISAR dates" />
              <span className="cmp-date before">{formatDate(firstDate)}</span>
              <span className="cmp-date after">{formatDate(lastDate)}</span>
            </div>
          </div>

          <div id="desk-hydro">
            <StageHydro stage={bundle.stage} t0Label={formatDate(firstDate)} t1Label={formatDate(lastDate)} />
          </div>

          <div className="dd-threshold">
            <div className="dd-threshold-head">
              <span>THRESHOLD SENSITIVITY · TOUCH THE UNCERTAINTY</span>
              <Stamp kind="derived">DERIVED · reading of the manifest range, not a re-run</Stamp>
            </div>
            <label htmlFor="dd-threshold-slider">Water threshold perturbation <strong>{thresholdDb > 0 ? '+' : ''}{thresholdDb.toFixed(1)} dB</strong></label>
            <input id="dd-threshold-slider" type="range" min={-1} max={1} step={0.1} value={thresholdDb} onChange={(e) => setThresholdDb(Number(e.target.value))} />
            <div className="dd-threshold-read">
              <span>Erosion candidates at this threshold:</span>
              <strong>{formatNumber(sliderArea, 0)} ha</strong>
              <span className="dd-threshold-range">published range {formatNumber(erosionMetric?.low, 0)} ha (−1 dB) · {formatNumber(erosionMetric?.value, 0)} ha (as run) · {formatNumber(erosionMetric?.high, 0)} ha (+1 dB) — the range is the headline; it spans ~4.8×.</span>
            </div>
          </div>
        </section>

        {/* ── §3 Triage queue: 24 only ── */}
        <section className="dd-queue" id="desk-queue" aria-label="Triage queue">
          <div className="dd-section-head">
            <div>
              <div className="desk-eyebrow"><ClipboardList size={13} /> TRIAGE QUEUE · THE PRODUCT</div>
              <h2>{persona === 'char' ? 'যাচাইয়ের অগ্রাধিকার — ২৪টি জায়গা' : '24 field priorities. Nothing else is a workload.'}</h2>
              <p className="dd-pi">
                Priority Index <strong>PI = 100 × area_ha ÷ {formatNumber(maxArea, 1)} ha</strong> (largest candidate) <Stamp kind="derived">DERIVED</Stamp>
                — the bundle carries no per-candidate population, asset or persistence fields (nearest place / CEGIS reach are null for every
                candidate), so area is the only defensible ranking signal in this data. Anyone selling you a fancier score from this bundle is inventing it.
                {persona === 'bwdb' && ' BWDB mode re-ranks erosion first.'}{persona === 'ngo' && ' NGO mode orders the 24 as a north→south field route.'}
              </p>
            </div>
            <div className="dd-queue-meta">
              <span><strong>{taskedCount}/24</strong> tasked or beyond</span>
              <span><strong>{candidates.length.toLocaleString()}</strong> screened in total</span>
              {persona === 'researcher'
                ? <button className="desk-btn slim" onClick={() => setShowLedger(!showLedger)}>{showLedger ? 'Hide full ledger' : `Full ledger (${candidates.length.toLocaleString()})`}</button>
                : <span className="dd-ledger-note">{(candidates.length - 24).toLocaleString()} further candidates sit below the action threshold — full ledger in Researcher mode.</span>}
            </div>
          </div>
          <div className="dd-qgrid">
            {queue.map((feature, i) => {
              const id = String(feature.properties.id);
              const st = tasking[id]?.status ?? 'UNREVIEWED';
              return (
                <button key={id} className={`dd-qcard ${selectedFeatureId === id ? 'selected' : ''}`} onClick={() => { setSelectedFeatureId(id); scrollTo('desk-drawer'); }}>
                  <span className="dd-qrank">#{i + 1}</span>
                  <span className={`row-swatch ${feature.properties.class}`} />
                  <span className="dd-qmain">
                    <strong>{CLASS_LABEL[persona][feature.properties.class]} · {id}</strong>
                    <small>{formatNumber(feature.properties.area_ha, 2)} ha · PI {priorityIndex(feature, maxArea)} · {feature.properties.pixel_count} px · DSWx: {feature.properties.confirmed_by_dswx == null ? 'not evaluated' : feature.properties.confirmed_by_dswx ? 'agrees' : 'disagrees'} · Stage risk: HIGH</small>
                  </span>
                  <span className={`dd-status s-${st.toLowerCase()}`}>{STATUS_LABEL[persona][st]}</span>
                </button>
              );
            })}
          </div>
          {persona === 'researcher' && showLedger && (
            <div className="dd-ledger">
              <div className="desk-search"><input value={ledgerQuery} onChange={(e) => setLedgerQuery(e.target.value)} placeholder="Find candidate ID in the full ledger…" aria-label="Search full ledger" /></div>
              <p className="dd-ledger-note">Showing {Math.min(200, ledgerFiltered.length)} of {ledgerFiltered.length.toLocaleString()} (render cap 200 — the full set ships in the bundle GeoJSON).</p>
              <div className="desk-ledger">
                {ledgerFiltered.slice(0, 200).map((feature) => {
                  const id = String(feature.properties.id);
                  return (
                    <button key={id} className={`desk-row ${selectedFeatureId === id ? 'selected' : ''}`} onClick={() => setSelectedFeatureId(id)}>
                      <span className={`row-swatch ${feature.properties.class}`} />
                      <span className="row-main"><strong>{feature.properties.class === 'erosion' ? 'Land → water' : 'Water → land'} · {id}</strong><small>{feature.properties.pixel_count} px</small></span>
                      <span className="row-area">{feature.properties.area_ha.toFixed(2)}<small>ha</small></span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── §4 Evidence drawer ── */}
        {selected && centroidOf && (
          <section className="dd-drawer" id="desk-drawer" aria-label="Evidence drawer">
            <div className="desk-selected-head">
              <div>
                <span className="desk-eyebrow-soft">EVIDENCE DRAWER · SELECTED CANDIDATE</span>
                <h3>{CLASS_LABEL[persona][selected.properties.class]} candidate <b>{selId}</b></h3>
              </div>
              <span className="desk-tag is-warn">{selTask.status === 'VERIFIED' ? 'FIELD-VERIFIED' : 'UNVERIFIED'}</span>
            </div>
            <div className="desk-factlist">
              <div><span>Mapped transition</span><strong>{selected.properties.area_ha.toFixed(2)} ha <Stamp kind="real">REAL</Stamp></strong></div>
              <div><span>Observed between</span><strong>{formatDate(selected.properties.t0)} → {formatDate(selected.properties.t1)}</strong></div>
              <div><span>Centroid</span><strong><Crosshair size={12} /> {formatCoord(centroidOf)}</strong></div>
              <div><span>Priority Index</span><strong>{priorityIndex(selected, maxArea)} <Stamp kind="derived">DERIVED</Stamp></strong></div>
            </div>
            <div className="dd-realkill">
              <div className="dd-realkill-col is-real">
                <strong>WHAT WOULD MAKE THIS REAL</strong>
                <ul>
                  <li>Persists in the next same-track pass ({formatDate(nextPass)}) at comparable stage</li>
                  <li>OPERA DSWx agrees the water retreated AND bank material is gone</li>
                  <li>Field photo of a fresh scarp / collapsed bank at the centroid</li>
                </ul>
              </div>
              <div className="dd-realkill-col is-kill">
                <strong>WHAT WOULD KILL IT</strong>
                <ul>
                  <li>Re-floods next pass → it was stage emergence, not erosion</li>
                  <li>Shift sits inside misregistration tolerance (check not yet evaluated)</li>
                  <li>Polygon lies on a low bar inside the HAND mask (≤ {thresholds?.hand_max_m ?? '—'} m)</li>
                </ul>
              </div>
            </div>
            <div className="dd-exposure">
              <strong>EXPOSURE · WHAT IS AT THIS PLACE</strong>
              <div><span>Population / households</span><b>ESTIMATED — not in bundle: UNAVAILABLE</b></div>
              <div><span>Nearest settlement (bundle field)</span><b>{selected.properties.nearest_place ?? 'UNAVAILABLE — null in bundle'}</b></div>
              <div><span>CEGIS reach membership</span><b>{selected.properties.in_cegis_reach ?? 'UNAVAILABLE — null in bundle'}</b></div>
              <div><span>DSWx confirmation</span><b>{selected.properties.confirmed_by_dswx == null ? 'NOT EVALUATED — null in bundle' : String(selected.properties.confirmed_by_dswx)}</b></div>
              <p>Absence of a layer is shown, never filled in. Exposure joins (WorldPop / OSM) are future bundle work, stamped ESTIMATED when they land.</p>
            </div>
            <details className="dd-qc-details">
              <summary>Trust gates for this candidate — run-level QC inherited from the pair ({qcChecks.length} checks)</summary>
              <p className="desk-evid-note">This bundle’s QC is run-level: every candidate inherits the same gates. Per-candidate QC does not exist in this data yet — claiming otherwise would be fabrication.</p>
              {qcChecks.map((check: QCCheck) => (
                <div key={check.id} className="desk-evid-row">
                  <span className={`qc-status s-${QC_STYLE[check.status] ?? 'off'}`}>{check.status.replace(/_/g, ' ')}</span>
                  <strong>{check.label ?? check.id}</strong>
                  <small>{check.explanation}</small>
                </div>
              ))}
              <p className="desk-evid-note">Reach verdict reasons: {bundle.reach.verdict_reasons.join(' ')}</p>
            </details>
            <div className="dd-tasking">
              <strong>TASKING · STATUS IS A VERB, WITH AN OWNER</strong>
              <div className="dd-tasking-fields">
                <label>Owner / role<input value={selTask.owner} onChange={(e) => patchTask({ owner: e.target.value })} placeholder="e.g. Upazila field officer (role, not a name)" /></label>
                <label>Deadline<input type="date" value={selTask.deadline} onChange={(e) => patchTask({ deadline: e.target.value })} /></label>
                <label>Dismiss reason (required to dismiss)<input value={selTask.reason} onChange={(e) => patchTask({ reason: e.target.value })} placeholder="e.g. re-flooded on next pass — stage emergence" /></label>
              </div>
              <div className="dd-tasking-actions">
                <button className="desk-btn primary" onClick={() => applyTask('TASKED')}><ClipboardList size={13} /> Task field verification</button>
                <button className="desk-btn" onClick={() => applyTask('MONITORING')}>Monitor next pass</button>
                <button className="desk-btn" onClick={() => applyTask('VERIFIED')}>Mark field-verified</button>
                <button className="desk-btn" onClick={() => applyTask('REJECTED')}>Dismiss</button>
                <button className="desk-btn" onClick={exportCasePacket}><FileJson2 size={14} /> Case packet (JSON)</button>
                <button className="desk-btn" onClick={copyCaseLink}><Copy size={13} /> Copy deep link</button>
              </div>
              <p className="desk-note">Status, owner and deadlines stay in this browser (localStorage) and print into the brief below. A field record is independent evidence — it never auto-verifies a satellite finding.</p>
            </div>
          </section>
        )}

        {/* ── §6 Field Verification Brief (printable) ── */}
        <section className="dd-brief" id="desk-brief" aria-label="Field verification brief">
          <div className="dd-brief-top">
            <div>
              <div className="desk-eyebrow"><Printer size={13} /> THE ARTEFACT YOU LEAVE WITH</div>
              <h2>Field Verification Brief</h2>
              <p>One click, one printed page-set: activation header, the three qualified numbers, the tasked Top-24, the Allowed / Not Allowed box, and the full audit footer. This is a verification request — <strong>not an evacuation order</strong>.</p>
            </div>
            <button className="desk-btn primary" onClick={() => window.print()}><Printer size={14} /> {personaDef.exportLabel}</button>
          </div>
          <div className="dd-brief-sheet">
            <div className="dd-brief-head-mono">FLUVISAR · ACTIVATION CHILMARI-2026-01 · NISAR L-BAND GCOV HH · PAIR {formatDate(firstDate)} → {formatDate(lastDate)} · VERDICT: STAGE-CONFOUNDED PAIR · GENERATED {new Date().toLocaleDateString('en-GB')} · MODE: {personaDef.label.toUpperCase()}</div>
            <div className="dd-brief-stats">
              <span><strong>24</strong> field priorities of {candidates.length.toLocaleString()} screened</span>
              <span><strong>{formatNumber(erosionMetric?.value)} ha</strong> erosion candidates (range {formatNumber(erosionMetric?.low, 0)}–{formatNumber(erosionMetric?.high, 0)} ha, ±1 dB)</span>
              <span><strong>{formatNumber(accretionMetric?.value)} ha</strong> accretion candidates</span>
              <span><strong>{confirmedLosses}</strong> confirmed losses</span>
            </div>
            <table className="dd-brief-table">
              <thead><tr><th>#</th><th>Candidate</th><th>Class</th><th>Area (ha)</th><th>PI</th><th>Status</th><th>Owner</th><th>Deadline</th></tr></thead>
              <tbody>
                {queue.map((f, i) => {
                  const id = String(f.properties.id);
                  const t = tasking[id] ?? DEFAULT_TASKING;
                  return <tr key={id}><td>{i + 1}</td><td>{id}</td><td>{f.properties.class}</td><td>{f.properties.area_ha.toFixed(2)}</td><td>{priorityIndex(f, maxArea)}</td><td>{t.status}</td><td>{t.owner || '—'}</td><td>{t.deadline || '—'}</td></tr>;
                })}
              </tbody>
            </table>
            <div className="dd-brief-allowed"><strong>ALLOWED:</strong> field verification only. <strong>NOT ALLOWED:</strong> response, evacuation, or loss claims on this pair alone.</div>
            <div className="dd-brief-audit">
              <strong>AUDIT LOG ({audit.length} entr{audit.length === 1 ? 'y' : 'ies'})</strong>
              {audit.length === 0 ? <p>No tasking decisions recorded yet in this browser.</p> : (
                <ul>{audit.slice(0, 30).map((a, i) => <li key={i}>{a.ts} · {a.featureId} → {a.action} · {a.detail}</li>)}</ul>
              )}
            </div>
            <footer className="dd-brief-footer">
              <span>PROVENANCE · Granules: {(erosionMetric?.inputs ?? []).map((i) => i.granule ?? '').filter(Boolean).join(' · ') || 'see manifest'}</span>
              <span>Pipeline: Otsu thresholds {thresholds?.threshold_db_t0 != null ? `${thresholds.threshold_db_t0.toFixed(2)} dB → ${thresholds.threshold_db_t1?.toFixed(2)} dB` : '—'} · median filter {thresholds?.median_filter ?? '—'} · MMU {thresholds?.mmu_px ?? '—'} px · HAND ≤ {thresholds?.hand_max_m ?? '—'} m · grid EPSG:32645 · pixel {erosionMetric?.pixel_area_m2 ?? '—'} m²</span>
              <span>Context: GPM IMERG rainfall (doi 10.5067/GPM/IMERGDL/DAY/07) · OPERA DSWx-S1 suite (NASA/JPL) · stage: proxy (no gauge) · Methods: <a href={NISAR_URL} target="_blank" rel="noreferrer">NISAR data</a> · <a href={QC_URL} target="_blank" rel="noreferrer">OPERA DSWx</a> · <a href={OSM_URL} target="_blank" rel="noreferrer">OSM ODbL</a></span>
            </footer>
          </div>
        </section>

        {/* ── §7 What happens next ── */}
        <section className="dd-next" aria-label="What happens next">
          <div className="dd-next-step"><span>NEXT NISAR PASS · {formatDate(nextPass)}</span><strong>Re-test persistence</strong><p>Same track 19, frame 76. Candidates that survive a comparable stage graduate; candidates that re-flood were stage emergence. <Stamp kind="derived">DERIVED · 12-day cycle</Stamp></p></div>
          <div className="dd-next-step"><span>FIELD VERIFICATION WINDOW</span><strong>Task → visit → record</strong><p>{taskedCount} of 24 priorities currently tasked in this browser. Every outcome flips a status verb and lands in the audit log.</p></div>
          <div className="dd-next-step"><span>V2 PRODUCT</span><strong>Verdict revisits, per candidate</strong><p>CONFIRMED / STAGE ARTEFACT / STILL UNRESOLVED — decided candidate by candidate, never as one blanket number.</p></div>
        </section>

        <footer className="desk-footer">
          <span className="desk-footer-mark">FLUVISAR · EVIDENCE FIRST</span>
          <span>Decision Desk only: triage → verify → issue. Statuses stay in this browser; print the brief for the field handoff.</span>
          <a href="/methods">Methods &amp; provenance <ChevronRight size={13} /></a>
        </footer>

        {notice && (
          <div className="desk-toast" role="status">
            <i className={noticeOk ? 'ok' : 'bad'}>{noticeOk ? <Check size={13} /> : <ShieldAlert size={13} />}</i>
            {notice}
            <button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button>
          </div>
        )}
      </main>
    </div>
  );
}
