import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, Check, ChevronRight, ClipboardList, Copy, Crosshair, FileJson2,
  Layers3, MapPin, Package, Pause, Play, Printer, ShieldAlert, Waves, Eye,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { DecisionMap, featureCentroid } from '../map/DecisionMap';
import { loadReachBundle, type ReachBundle } from '../data/load';
import type { ChangeFeature, QCCheck } from '../data/types';
import { useStore } from '../state/store';
import { StageHydro } from '../decision/StageHydro';
import {
  PERSONAS, PERSONA_BY_ID, CLASS_LABEL, STATUS_LABEL, rankForPersona,
  type PersonaId, type TaskStatus,
} from '../decision/personas';
import { buildSites, SITE_RADIUS_M, type InvestigationSite } from '../decision/sites';
import {
  EMPTY_RECORD, candidateMaturity, maturityHeadline, statusAfterReview,
  type AuditEntry, type BankCondition, type FieldRecord, type ReviewConclusion,
} from '../decision/lifecycle';
import '../styles/decision-desk.css';

const REACH_ID = 'jamuna-chilmari';
const QC_URL = 'https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/';
const NISAR_URL = 'https://science.nasa.gov/mission/nisar/data/';
const OSM_URL = 'https://www.openstreetmap.org/copyright';
const FFWC_URL = 'https://www.ffwc.gov.bd/';
const UNOSAT_LINE = 'Preliminary analysis — not yet validated in the field.';

/** What each QC gate blocks, in plain language — the decision-readiness column. */
const BLOCKS: Record<string, string> = {
  dswx_agreement:
    'Blocks independent corroboration (evidence rung 4). The OPERA DSWx-S1 layer in this bundle was acquired 17 Jun 2026 — it predates the NISAR pair by two months, so even once wired it could not supply same-date agreement for Aug/Sep; it is context, not corroboration.',
  rainfall_anomaly:
    'Context only. Rainfall explains extra open water near t1; it can neither confirm nor refute any single candidate.',
  null_test:
    'Blocks the false-change rate. Without a stable-land control area, nobody can say how much apparent change this method invents on land that never moved.',
  stage_match:
    'Blocks erosion language for the whole pair. The epochs are not stage-matched, so mapped class switches may be water level, not bank loss — this gate is why the desk says “transition candidate”, never “erosion”.',
  persistence:
    'Blocks evidence rung 3 and every “confirmed change” claim. A switch that re-floods on the next pass was stage emergence; only a later comparable pass can separate the two.',
  threshold_sensitivity:
    'Blocks any single headline area. With sensitivity at 185% (±1 dB), the honest product is the published range — the point estimate alone would be false precision.',
  alignment:
    'Blocks the Level-of-Detection gate (evidence rung 2). Until co-registration error is quantified, no candidate can be shown to exceed measurement uncertainty (Leonard et al. 2020).',
  ambiguous_area:
    'Blocks completeness. Area the classifier could not decide is currently reported as zero instead of carried as its own class.',
  plausibility:
    'Blocks operational use of the area figures. An order of magnitude above the CEGIS reference scale (hundreds of ha per reach) means this run is a screening artefact until the excess is explained.',
};

const GROUND_TRUTH_CHECKLIST = [
  'Stand at the site anchor coordinates; record GPS position and time before looking at the bank.',
  'Photograph the bankline facing upstream, downstream, and across the channel (note photo IDs in the observation form).',
  'Record the observed bank condition honestly: active scarp / collapse, fresh deposition, stable bank, or uncertain.',
  'Note the water state at visit time (rising / falling / slack) and any local gauge or staff reading if present.',
  'Ask one local resident what changed this season — record it as testimony, not as measurement.',
  'If the bank cannot be reached safely, record “uncertain” with the reason. An honest uncertain outranks a guessed verdict.',
];

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
function download(filename: string, text: string, type: string) {
  const href = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = href; link.download = filename; link.click();
  URL.revokeObjectURL(href);
}
const downloadJson = (filename: string, data: unknown) => download(filename, JSON.stringify(data, null, 2), 'application/json');
const QC_STYLE: Record<string, string> = { FAIL: 'fail', WARN: 'warn', INFO: 'info', PASS: 'pass', NOT_EVALUATED: 'off' };
function Stamp({ kind, children }: { kind: 'real' | 'derived' | 'estimated' | 'context'; children: string }) {
  return <span className={`dd-stamp is-${kind}`}>{children}</span>;
}
type PrintTarget = 'brief' | 'pack' | 'bulletin';

export function DecisionDesk() {
  const [bundle, setBundle] = useState<ReachBundle | null>(null);
  const [error, setError] = useState('');
  const [persona, setPersona] = useState<PersonaId>('disaster');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('20260919');
  const [showRadar, setShowRadar] = useState(true);
  const [showWater, setShowWater] = useState(false);
  const [showOpera, setShowOpera] = useState(false);
  const [swipeOn, setSwipeOn] = useState(true);
  const [swipePosition, setSwipePosition] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [thresholdDb, setThresholdDb] = useState(0);
  const [records, setRecords] = useState<Record<string, FieldRecord>>({});
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerQuery, setLedgerQuery] = useState('');
  const [expandedSite, setExpandedSite] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeOk, setNoticeOk] = useState(true);
  const [judgeStep, setJudgeStep] = useState(0); // 0 = off, 1..3 = walk steps
  const [printTarget, setPrintTarget] = useState<PrintTarget>('brief');
  // drawer form drafts
  const [obsRole, setObsRole] = useState('');
  const [obsAt, setObsAt] = useState('');
  const [obsGps, setObsGps] = useState('');
  const [obsCondition, setObsCondition] = useState<BankCondition>('uncertain');
  const [obsPhoto, setObsPhoto] = useState('');
  const [revConclusion, setRevConclusion] = useState<ReviewConclusion>('CORROBORATES');
  const [revRole, setRevRole] = useState('');
  const [revReason, setRevReason] = useState('');
  const setReachId = useStore((s) => s.setReachId);

  useEffect(() => {
    let cancelled = false;
    setReachId(REACH_ID);
    loadReachBundle(REACH_ID).then((data) => {
      if (cancelled) return;
      setBundle(data);
      const dates = data.reach.dates.filter((item) => item.status === 'ok');
      setSelectedDate(dates[dates.length - 1]?.date ?? dates[0]?.date ?? '');
      try { setRecords(JSON.parse(localStorage.getItem(`fluvisar-field:v2:${REACH_ID}`) ?? '{}')); } catch { setRecords({}); }
      try { setAudit(JSON.parse(localStorage.getItem(`fluvisar-audit:${REACH_ID}`) ?? '[]')); } catch { setAudit([]); }
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load the Jamuna investigation bundle.');
    });
    return () => { cancelled = true; };
  }, [setReachId]);

  const candidates = useMemo(() => {
    if (!bundle) return [];
    return [...(bundle.erosion?.features ?? []), ...(bundle.accretion?.features ?? [])]
      .sort((a, b) => (b.properties.area_ha ?? 0) - (a.properties.area_ha ?? 0) || String(a.properties.id).localeCompare(String(b.properties.id)));
  }, [bundle]);

  const top24 = useMemo(() => candidates.slice(0, 24), [candidates]);
  const queue = useMemo(() => rankForPersona(top24, persona), [top24, persona]);

  const sitesResult = useMemo(
    () => (bundle ? buildSites(candidates, top24, bundle.reach.bbox) : { sites: [], unassignedCount: 0, unassignedArea: 0 }),
    [bundle, candidates, top24],
  );
  const sites = sitesResult.sites;
  const sitesByArea = useMemo(() => [...sites].sort((a, b) => b.totalArea - a.totalArea), [sites]);
  const siteOfFeature = useMemo(() => {
    const map = new Map<string, InvestigationSite>();
    sites.forEach((s) => s.members.forEach((f) => map.set(String(f.properties.id), s)));
    return map;
  }, [sites]);

  const selected: ChangeFeature | null = candidates.find((f) => String(f.properties.id) === selectedFeatureId) ?? queue[0] ?? candidates[0] ?? null;
  useEffect(() => {
    if (selected && !selectedFeatureId) setSelectedFeatureId(String(selected.properties.id));
  }, [selected, selectedFeatureId]);
  const selId = selected ? String(selected.properties.id) : '';
  const selRecord: FieldRecord = records[selId] ?? EMPTY_RECORD;
  const selSite: InvestigationSite | null = (selectedSiteId ? sites.find((s) => s.id === selectedSiteId) : undefined) ?? siteOfFeature.get(selId) ?? sitesByArea[0] ?? null;

  // reset drawer drafts when the selected candidate changes
  useEffect(() => {
    setObsRole(''); setObsAt(''); setObsGps(''); setObsCondition('uncertain'); setObsPhoto('');
    setRevConclusion('CORROBORATES'); setRevRole(''); setRevReason('');
  }, [selId]);

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
  const statusOf = (f: ChangeFeature): TaskStatus => records[String(f.properties.id)]?.status ?? 'UNREVIEWED';
  const taskedCount = queue.filter((f) => statusOf(f) !== 'UNREVIEWED').length;
  const verifiedCount = candidates.filter((f) => statusOf(f) === 'VERIFIED').length;
  const erosionCount = bundle?.erosion?.features.length ?? 0;
  const accretionCount = bundle?.accretion?.features.length ?? 0;

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

  const persist = (next: Record<string, FieldRecord>, nextAudit: AuditEntry[]) => {
    setRecords(next); setAudit(nextAudit);
    localStorage.setItem(`fluvisar-field:v2:${REACH_ID}`, JSON.stringify(next));
    localStorage.setItem(`fluvisar-audit:${REACH_ID}`, JSON.stringify(nextAudit));
  };
  const patchRecord = (patch: Partial<FieldRecord>) => {
    if (!selected) return;
    const next = { ...records, [selId]: { ...selRecord, ...patch } };
    setRecords(next);
    localStorage.setItem(`fluvisar-field:v2:${REACH_ID}`, JSON.stringify(next));
  };
  const transition = (action: string, patch: Partial<FieldRecord>, detail: string) => {
    if (!selected) return;
    const entry: AuditEntry = { ts: new Date().toISOString(), featureId: selId, action, detail };
    persist({ ...records, [selId]: { ...selRecord, ...patch } }, [entry, ...audit]);
    setNoticeOk(true); setNotice(`${selId} — ${action}. Written to the audit log.`);
  };
  const fail = (msg: string) => { setNoticeOk(false); setNotice(msg); };

  const doTask = () => transition('TASKED', { status: 'TASKED' },
    [selRecord.owner && `owner: ${selRecord.owner}`, selRecord.deadline && `deadline: ${selRecord.deadline}`].filter(Boolean).join(' · ') || 'no owner/deadline set');
  const doMonitor = () => transition('MONITORING', { status: 'MONITORING' }, `awaiting next same-track pass ${formatDate(nextPass)}`);
  const doDismiss = () => {
    if (!selRecord.dismissReason.trim()) { fail('Dismiss requires a reason — write it in the drawer first.'); return; }
    transition('REJECTED (dismissed)', { status: 'REJECTED' }, `reason: ${selRecord.dismissReason}`);
  };
  const doObservation = () => {
    if (!obsRole.trim()) { fail('Record who observed (role) — an anonymous observation cannot be reviewed.'); return; }
    transition('OBSERVATION RECEIVED', {
      status: 'OBSERVATION_RECEIVED',
      observation: {
        observerRole: obsRole.trim(),
        observedAt: obsAt || new Date().toISOString(),
        gpsNote: obsGps.trim(),
        bankCondition: obsCondition,
        photoRef: obsPhoto.trim(),
      },
      review: null,
    }, `observer: ${obsRole} · bank condition: ${obsCondition}${obsPhoto ? ` · photos: ${obsPhoto}` : ''}${obsGps ? ` · GPS: ${obsGps}` : ''}`);
  };
  const doReview = () => {
    if (!revRole.trim() || !revReason.trim()) { fail('A review needs a reviewer role and a reason — the conclusion must be defensible.'); return; }
    const next = statusAfterReview(revConclusion);
    transition(`REVIEW ${revConclusion} → ${next}`, {
      status: next,
      review: { conclusion: revConclusion, reviewerRole: revRole.trim(), reason: revReason.trim(), reviewedAt: new Date().toISOString() },
    }, `reviewer: ${revRole} · ${revReason}`);
  };
  const doReopen = () => transition('REOPENED → MONITORING', { status: 'MONITORING', review: null, observation: selRecord.observation },
    'closed record reopened by analyst; prior observation retained, review cleared');

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const printSheet = (target: PrintTarget) => {
    setPrintTarget(target);
    window.setTimeout(() => window.print(), 90);
  };
  const selectSite = (site: InvestigationSite, scroll = true) => {
    setSelectedSiteId(site.id);
    setSelectedFeatureId(site.anchorId);
    if (scroll) scrollTo('desk-drawer');
  };

  const exportCasePacket = () => {
    if (!bundle || !selected) return;
    downloadJson(`fluvisar-case-${selId}.json`, {
      schema: 'fluvisar.trace-field.case.v1',
      exported_at: new Date().toISOString(),
      activation: 'CHILMARI-2026-01',
      reach_id: REACH_ID, reach_name: bundle.reach.name, river: bundle.reach.river,
      candidate: selected,
      site: selSite ? { id: selSite.id, reach_part: selSite.reachPart, anchor: selSite.anchorId } : null,
      field_record: selRecord,
      maturity: candidateMaturity(selRecord, qcChecks, formatDate(nextPass)),
      verdict: 'STAGE-CONFOUNDED PAIR (bundle run verdict: INCONCLUSIVE)',
      observation_dates: bundle.reach.dates.map((d) => ({ date: d.date, acq_utc: d.acq_utc })),
      source_granules: erosionMetric?.inputs ?? [],
      qc: qcChecks.map((c: QCCheck) => ({ id: c.id, status: c.status, explanation: c.explanation })),
      audit_for_candidate: audit.filter((a) => a.featureId === selId),
      interpretation: 'Mapped land-to-water transition candidate from a stage-confounded pair. Field-review handoff, not a verified erosion alert. A field observation is independent evidence and must not automatically change the satellite finding to verified.',
    });
    setNoticeOk(true); setNotice('Case packet exported (TRACE Field handoff format).');
  };

  const packJson = (site: InvestigationSite) => ({
    schema: 'fluvisar.decision-desk.investigation-pack.v1',
    exported_at: new Date().toISOString(),
    activation: 'CHILMARI-2026-01',
    site: { id: site.id, reach_part: site.reachPart, anchor: site.anchorId, centroid: site.centroid },
    grouping_method: `Deterministic centroid clustering: screening-list anchors in area order claim all bundle candidates within ${SITE_RADIUS_M} m (haversine); largest anchor wins ties.`,
    verdict: 'STAGE-CONFOUNDED PAIR (bundle run verdict: INCONCLUSIVE)',
    unosat_line: UNOSAT_LINE,
    stage_context: {
      source: 'bundle stage.json — proxy (imagery-derived) fraction, no gauge',
      acquisitions: bundle?.stage.acquisitions ?? [],
      pair_type: bundle?.reach.primary_pair.type ?? null,
      ffwc_context: 'FFWC Chilmari (Brahmaputra = Jamuna) — Danger Level 23.25 mMSL; FFWC forecast file dated 14 Oct 2026: observed 20.29 mMSL, falling. Bulletin postdates the pair; context only.',
    },
    readiness: qcChecks.map((c: QCCheck) => ({ id: c.id, status: c.status, blocks: BLOCKS[c.id] ?? '' })),
    ground_truth_checklist: GROUND_TRUTH_CHECKLIST,
    members: site.members.map((f) => ({
      id: String(f.properties.id), class: f.properties.class, area_ha: f.properties.area_ha,
      pixel_count: f.properties.pixel_count, centroid: f.properties.centroid,
      field_status: statusOf(f),
    })),
    provenance: provenanceText(),
  });

  function provenanceText() {
    return {
      granules: (erosionMetric?.inputs ?? []).map((i) => i.granule ?? '').filter(Boolean),
      product: 'NISAR L2 GCOV (Provisional, CRID P05023) — calibrated, validation ongoing, RFI-screened; validated reprocessing expected Q4 2026',
      thresholds_db: thresholds ? { t0: thresholds.threshold_db_t0, t1: thresholds.threshold_db_t1 } : null,
      median_filter: thresholds?.median_filter ?? null,
      mmu_px: thresholds?.mmu_px ?? null,
      hand_max_m: thresholds?.hand_max_m ?? null,
      grid: 'EPSG:32645',
      pixel_area_m2: erosionMetric?.pixel_area_m2 ?? null,
    };
  }

  const exportPackGeoJson = (site: InvestigationSite) => {
    if (!bundle) return;
    const features = [
      ...site.members,
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: site.centroid },
        properties: { site: site.id, role: 'site anchor — navigate here', anchor_candidate: site.anchorId },
      },
    ];
    downloadJson(`fluvisar-${site.id.toLowerCase()}-pack.geojson`, { type: 'FeatureCollection', name: `FluviSAR ${site.id} Investigation Pack`, features });
    setNoticeOk(true); setNotice(`${site.id} GeoJSON exported (${site.members.length} candidates + anchor point).`);
  };

  const copyCaseLink = async () => {
    if (!selected) return;
    const href = `${window.location.origin}/app?reach=${REACH_ID}&feature=${encodeURIComponent(selId)}`;
    try { await navigator.clipboard.writeText(href); setNoticeOk(true); setNotice('Investigation link copied.'); }
    catch { setNotice(href); }
  };

  const personaDef = PERSONA_BY_ID[persona];
  const personaExport = () => {
    if (persona === 'char') { scrollTo('desk-bulletin'); printSheet('bulletin'); }
    else if (persona === 'ngo') { scrollTo('desk-pack'); printSheet('pack'); }
    else { scrollTo('desk-brief'); printSheet('brief'); }
  };

  const selMaturity = candidateMaturity(selRecord, qcChecks, formatDate(nextPass));

  // Judge view: a 30-second guided walk over real page state — no demo data.
  const judgeTopSite = sitesByArea[0] ?? null;
  const judgeGo = (step: number) => {
    setJudgeStep(step);
    if (step === 1) scrollTo('desk-hero');
    if (step === 2 && judgeTopSite) {
      setSelectedSiteId(judgeTopSite.id);
      setSelectedFeatureId(judgeTopSite.anchorId);
      setExpandedSite(judgeTopSite.id);
      scrollTo('desk-sites');
    }
    if (step === 3) scrollTo('desk-pack');
  };
  const JUDGE_CAPTIONS = [
    '',
    '1 · The stage story — stage moved between the two passes, so the verdict is INCONCLUSIVE and the desk refuses the word “erosion”.',
    '2 · One investigation site — candidates grouped into a named place a field team can actually visit, with every member id preserved.',
    '3 · The artefact — a printable Investigation Pack: coordinates, stage context, maturity, ground-truth checklist. Evidence leaves as a document, not a screenshot.',
  ];

  if (error) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby error"><ShieldAlert size={30} /><h1>Investigation unavailable</h1><p>{error}</p><a href="/methods">Open methods and data sources <ChevronRight size={14} /></a></main></div>;
  if (!bundle) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby"><span className="desk-kicker">FLUVISAR / DECISION DESK</span><div className="desk-loader" /><p>Loading the Jamuna evidence bundle…</p></main></div>;
  if (!candidates.length) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby error"><ShieldAlert size={30} /><h1>No mapped candidates in this bundle</h1><p>The evidence bundle loaded, but it contains no transition features to review.</p><a href="/methods">Open methods and data sources <ChevronRight size={14} /></a></main></div>;

  return (
    <div className="desk-page" data-print={printTarget}>
      <Navbar transparent={false} />
      <main className="desk-shell">

        {/* ── §0 Activation bar + NISAR trust badge ── */}
        <div className="dd-activation" role="note">
          <span>FLUVISAR · ACTIVATION <strong>CHILMARI-2026-01</strong></span>
          <span>NISAR L-BAND GCOV HH · TRACK {bundle.reach.track.relative_orbit} FRAME {bundle.reach.track.frame}</span>
          <span>PAIR {formatDate(firstDate)} → {formatDate(lastDate)} · {pairWindow} DAYS = 2 CYCLES</span>
          <span>PRODUCT V2 · STATUS: FIELD VERIFICATION OPEN</span>
          <span>NEXT SAME-TRACK PASS: {formatDate(nextPass)} <Stamp kind="derived">DERIVED · +12 d cycle</Stamp></span>
          <span className="dd-trust">NISAR PROVISIONAL · CRID P05023 · CALIBRATED, VALIDATION ONGOING · RFI-SCREENED <em>validated reprocessing expected Q4 2026 (ASF)</em></span>
        </div>

        {/* ── §1 Hero: the stage story + verdict ── */}
        <header className={`desk-hero dd-hero ${judgeStep === 1 ? 'is-judge-focus' : ''}`} id="desk-hero">
          <div className="desk-hero-lede">
            <div className="desk-kicker"><span className="desk-kicker-rule" />FLUVISAR · DECISION DESK · JAMUNA–CHILMARI</div>
            <p className="dd-mission">WHERE SHOULD WE LOOK NEXT?</p>
            <h1>Separating the river falling from the bank failing.</h1>
            <p className="desk-deck">
              Between the two NISAR passes the Jamuna’s stage moved and its bars emerged — most apparent change in
              this pair is falling water exposing the river’s own bed, not proven bank loss. The radar mapped
              {' '}<strong>{candidates.length.toLocaleString()} transition candidates</strong>; this desk groups them into
              {' '}<strong>{sites.length} investigation sites</strong> a field team can actually visit, and refuses to call
              any of them erosion until evidence — not area — says so. <strong>None justify action on radar alone.</strong>
            </p>
            <div className="dd-hero-numbers" aria-label="Qualified headline numbers">
              <div className="dd-num">
                <strong>{sites.length}</strong><span>INVESTIGATION SITES</span>
                <small>grouped from {candidates.length.toLocaleString()} candidates <Stamp kind="derived">DERIVED · method on page</Stamp></small>
              </div>
              <div className="dd-num">
                <strong>{formatNumber(erosionMetric?.value)} ha</strong><span>LAND→WATER CANDIDATES</span>
                <small>range {formatNumber(erosionMetric?.low, 0)}–{formatNumber(erosionMetric?.high, 0)} ha at ±1 dB <Stamp kind="real">REAL · manifest</Stamp></small>
              </div>
              <div className="dd-num">
                <strong>{verifiedCount}</strong><span>CONFIRMED LOSSES</span>
                <small>a loss exists only when a reviewed field observation closes it</small>
              </div>
            </div>
            <div className="desk-verdict-actions">
              <button className="desk-btn primary" onClick={() => scrollTo('desk-sites')}>Open investigation sites <ChevronRight size={13} /></button>
              <button className="desk-btn" onClick={() => scrollTo('desk-hydro')}>Why we can’t conclude <ArrowUpRight size={13} /></button>
              <button className="desk-btn" onClick={() => judgeGo(1)}>Judge view · 30-second walk</button>
            </div>
          </div>
          <div className="desk-verdict-card" role="status">
            <div className="desk-verdict-head"><span className="desk-verdict-pulse"><i /></span>EVIDENCE VERDICT · THIS RUN</div>
            <div className="desk-verdict-word dd-verdict-word">STAGE-CONFOUNDED PAIR</div>
            <p>Bundle run verdict: {bundle.reach.verdict} · {failedChecks} check failed · {warningChecks} warned · {notEvaluated} not evaluated. Safe to task. Unsafe to conclude.</p>
            <div className="dd-allowed">
              <div><strong>ALLOWED NOW</strong><span>Task field verification of the investigation sites · compare against historic banklines · carry the OPERA DSWx layer (17 Jun 2026) as pre-pair context only</span></div>
              <div><strong>NOT ALLOWED</strong><span>Publish a candidate area as erosion fact · claim displacement or loss · trigger a response from this map alone</span></div>
              <div><strong>RESOLVES IT</strong><span>Next same-track pass ({formatDate(nextPass)}) at comparable stage, with Sentinel-1 as tie-breaker — persistence separates emergence from bank loss</span></div>
            </div>
            <div className="desk-verdict-meta"><span>{taskedCount}/24 screening candidates tasked or beyond</span><span>bundle frozen {formatDate(bundle.manifest.generated_at.slice(0, 10).replace(/-/g, ''))}</span></div>
          </div>
        </header>

        {/* ── §1b Stage panel — the confound, plotted from the bundle ── */}
        <div id="desk-hydro">
          <StageHydro stage={bundle.stage} t0Label={formatDate(firstDate)} t1Label={formatDate(lastDate)} />
        </div>

        {/* ── Persona switcher ── */}
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
              <button className="desk-btn primary" onClick={personaExport}><Printer size={13} /> {personaDef.exportLabel}</button>
              <small>{personaDef.sliceNote}</small>
            </div>
          </div>
        </section>

        {/* ── §2 Map: full-bleed, in-canvas swipe, site markers ── */}
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
              swipe={swipeOn && firstDate && lastDate ? { t0: firstDate, t1: lastDate, position: swipePosition, onPositionChange: setSwipePosition } : null}
              siteMarkers={sites.map((s) => ({ id: s.id, label: s.id.replace('SITE-', 'S'), centroid: s.centroid, active: selSite?.id === s.id }))}
              onSelectSite={(siteId) => { const s = sites.find((x) => x.id === siteId); if (s) selectSite(s); }}
            />
            <div className="desk-map-chip"><span className="desk-live-dot" />{swipeOn ? <>IN-CANVAS SWIPE · <b>t0 {formatDate(firstDate)}</b> ⟷ <b>t1 {formatDate(lastDate)}</b></> : <>NISAR PASS · <b>{formatDate(selectedDate)}</b></>}</div>
            <div className="desk-map-layers" aria-label="Map layers">
              <button className={swipeOn ? 'active' : ''} onClick={() => setSwipeOn(!swipeOn)}>⇆ Swipe t0/t1</button>
              <button className={showRadar ? 'active' : ''} onClick={() => setShowRadar(!showRadar)}><Eye size={13} /> NISAR HH</button>
              <button className={showWater ? 'active' : ''} onClick={() => setShowWater(!showWater)}><Waves size={13} /> Water mask</button>
              <button className={showOpera ? 'active' : ''} onClick={() => setShowOpera(!showOpera)}><Layers3 size={13} /> OPERA · 17 JUN 2026 (context)</button>
            </div>
            <div className="desk-map-legend">
              <span><i className="l-erosion" /> Land → water candidate</span>
              <span><i className="l-accretion" /> Water → land candidate</span>
              <span><i className="l-selected" /> Selected</span>
              <span><i className="l-site" /> Investigation site anchor</span>
              <span className="dd-map-note">Candidates drawn: top 24 per class · drag the divider inside the map to compare passes · OPERA layer predates the pair — context only</span>
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

          <div className="dd-threshold">
            <div className="dd-threshold-head">
              <span>THRESHOLD SENSITIVITY · TOUCH THE UNCERTAINTY</span>
              <Stamp kind="derived">DERIVED · reading of the manifest range, not a re-run</Stamp>
            </div>
            <label htmlFor="dd-threshold-slider">Water threshold perturbation <strong>{thresholdDb > 0 ? '+' : ''}{thresholdDb.toFixed(1)} dB</strong></label>
            <input id="dd-threshold-slider" type="range" min={-1} max={1} step={0.1} value={thresholdDb} onChange={(e) => setThresholdDb(Number(e.target.value))} />
            <div className="dd-threshold-read">
              <span>Land→water candidates at this threshold:</span>
              <strong>{formatNumber(sliderArea, 0)} ha</strong>
              <span className="dd-threshold-range">published range {formatNumber(erosionMetric?.low, 0)} ha (−1 dB) · {formatNumber(erosionMetric?.value, 0)} ha (as run) · {formatNumber(erosionMetric?.high, 0)} ha (+1 dB) — the range is the headline; it spans ~4.8×.</span>
            </div>
          </div>
        </section>

        {/* ── §3 Investigation Sites — the main surface ── */}
        <section className={`dd-sites ${judgeStep === 2 ? 'is-judge-focus' : ''}`} id="desk-sites" aria-label="Investigation sites">
          <div className="dd-section-head">
            <div>
              <div className="desk-eyebrow"><MapPin size={13} /> INVESTIGATION SITES · WHERE A TEAM CAN ACTUALLY GO</div>
              <h2>{sites.length} named places — not {candidates.length.toLocaleString()} polygons.</h2>
              <p className="dd-method">
                Grouping method (deterministic, from bundle centroids): the 24 screening anchors, in area order, each claim every
                still-unclaimed candidate within <strong>{SITE_RADIUS_M.toLocaleString()} m</strong> (haversine); the largest anchor wins ties.
                Every original candidate id stays listed inside its site — grouping organises the work, it never deletes evidence.
                {' '}{sitesResult.unassignedCount.toLocaleString()} candidates lie outside every site radius and remain in the full ledger.
                <strong> There is no composite score on this desk, by design:</strong> a mapped change earns a ranking signal only when
                its magnitude exceeds the pair’s measurement / co-registration uncertainty (Level-of-Detection logic), and that gate
                is not yet evaluated in this bundle — so orders here are labelled screening orders, never risk rankings.
              </p>
            </div>
            <div className="dd-queue-meta">
              <span><strong>{verifiedCount}</strong> candidates field-verified (reviewed)</span>
              <span><strong>{taskedCount}/24</strong> screening candidates tasked or beyond</span>
              <span>Display order: largest grouped transition area first — a screening order, not a risk ranking.</span>
            </div>
          </div>
          <div className="dd-site-list">
            {sitesByArea.map((site) => {
              const verifiedInSite = site.members.filter((f) => statusOf(f) === 'VERIFIED').length;
              const taskedInSite = site.members.filter((f) => statusOf(f) !== 'UNREVIEWED').length;
              const open = expandedSite === site.id;
              return (
                <article key={site.id} className={`dd-site ${selSite?.id === site.id ? 'selected' : ''}`}>
                  <button className="dd-site-main" onClick={() => selectSite(site)}>
                    <span className="dd-site-id">{site.id}</span>
                    <span className="dd-site-body">
                      <strong>{site.reachPart} · anchor {site.anchorId}</strong>
                      <small>
                        {site.members.length} candidates · {site.erosionCount} land→water ({formatNumber(site.erosionArea)} ha) · {site.accretionCount} water→land ({formatNumber(site.accretionArea)} ha)
                        {' '}· centroid {formatCoord(site.centroid)}
                      </small>
                    </span>
                    <span className="dd-site-area"><strong>{formatNumber(site.totalArea)} ha</strong><small>grouped candidates</small></span>
                    <span className="dd-site-state">{verifiedInSite > 0 ? `${verifiedInSite} verified` : taskedInSite > 0 ? `${taskedInSite} in workflow` : 'unreviewed'}</span>
                  </button>
                  <button className="dd-site-expand" onClick={() => setExpandedSite(open ? null : site.id)} aria-expanded={open}>
                    {open ? 'Hide members' : `Members (${site.members.length})`}
                  </button>
                  {open && (
                    <div className="dd-site-members">
                      {site.members.slice(0, 12).map((f) => {
                        const id = String(f.properties.id);
                        return (
                          <button key={id} className={`dd-member ${selectedFeatureId === id ? 'selected' : ''}`} onClick={() => { setSelectedSiteId(site.id); setSelectedFeatureId(id); scrollTo('desk-drawer'); }}>
                            <span className={`row-swatch ${f.properties.class}`} />{id} · {formatNumber(f.properties.area_ha, 2)} ha · {STATUS_LABEL[persona][statusOf(f)]}
                          </button>
                        );
                      })}
                      {site.members.length > 12 && <span className="dd-member-more">+{site.members.length - 12} more — full list in the Researcher ledger and in the site’s Investigation Pack (JSON).</span>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Screening list — the 24, honestly labelled */}
          <div className="dd-screening" id="desk-queue">
            <div className="dd-screening-head">
              <div>
                <div className="desk-eyebrow"><ClipboardList size={13} /> SCREENING LIST · THE 24 ANCHORS</div>
                <h3>Screening order — largest mapped area first.</h3>
                <p>An inspection order, not a risk ranking: area is the only per-candidate signal this bundle carries
                  (population, nearest place and CEGIS-reach fields are null for every candidate).
                  {persona === 'bwdb' && ' BWDB mode re-orders erosion first.'}{persona === 'ngo' && ' NGO mode orders the 24 as a north→south field route.'}
                  {persona === 'char' && ' বড় পরিবর্তন আগে — যাচাইয়ের জন্য।'}</p>
              </div>
              {persona === 'researcher'
                ? <button className="desk-btn slim" onClick={() => setShowLedger(!showLedger)}>{showLedger ? 'Hide full ledger' : `Full ledger (${candidates.length.toLocaleString()})`}</button>
                : <span className="dd-ledger-note">{(candidates.length - 24).toLocaleString()} further candidates sit below the screening cut — full ledger in Researcher mode.</span>}
            </div>
            <div className="dd-qgrid">
              {queue.map((feature, i) => {
                const id = String(feature.properties.id);
                const st = statusOf(feature);
                const site = siteOfFeature.get(id);
                return (
                  <button key={id} className={`dd-qcard ${selectedFeatureId === id ? 'selected' : ''}`} onClick={() => { setSelectedFeatureId(id); if (site) setSelectedSiteId(site.id); scrollTo('desk-drawer'); }}>
                    <span className="dd-qrank">#{i + 1}</span>
                    <span className={`row-swatch ${feature.properties.class}`} />
                    <span className="dd-qmain">
                      <strong>{CLASS_LABEL[persona][feature.properties.class]} · {id}</strong>
                      <small>{formatNumber(feature.properties.area_ha, 2)} ha · {feature.properties.pixel_count} px · {site ? site.id : 'no site'} · DSWx: {feature.properties.confirmed_by_dswx == null ? 'not evaluated' : feature.properties.confirmed_by_dswx ? 'agrees' : 'disagrees'}</small>
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
                        <span className="row-main"><strong>{feature.properties.class === 'erosion' ? 'Land → water' : 'Water → land'} · {id}</strong><small>{feature.properties.pixel_count} px · {siteOfFeature.get(id)?.id ?? 'no site'}</small></span>
                        <span className="row-area">{feature.properties.area_ha.toFixed(2)}<small>ha</small></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── §4 Evidence drawer ── */}
        {selected && centroidOf && (
          <section className="dd-drawer" id="desk-drawer" aria-label="Evidence drawer">
            <div className="desk-selected-head">
              <div>
                <span className="desk-eyebrow-soft">EVIDENCE DRAWER · SELECTED CANDIDATE</span>
                <h3>{CLASS_LABEL[persona][selected.properties.class]} candidate <b>{selId}</b>{selSite && <> · member of <b>{selSite.id}</b></>}</h3>
              </div>
              <span className="desk-tag is-warn">{selRecord.status === 'VERIFIED' ? 'FIELD-VERIFIED (REVIEWED)' : 'UNVERIFIED'}</span>
            </div>
            <div className="desk-factlist">
              <div><span>Mapped transition</span><strong>{selected.properties.area_ha.toFixed(2)} ha <Stamp kind="real">REAL</Stamp></strong></div>
              <div><span>Observed between</span><strong>{formatDate(selected.properties.t0)} → {formatDate(selected.properties.t1)}</strong></div>
              <div><span>Centroid</span><strong><Crosshair size={12} /> {formatCoord(centroidOf)}</strong></div>
              <div><span>Evidence maturity</span><strong>{maturityHeadline(selRecord)}</strong></div>
            </div>

            <div className="dd-dims" aria-label="Three separate dimensions — deliberately not a score">
              <div className="dd-dim">
                <strong>EVIDENCE QUALITY</strong>
                <p>Run-level only in this bundle — every candidate inherits the pair’s gates: {failedChecks} FAIL · {warningChecks} WARN · {notEvaluated} NOT EVALUATED.
                  Per-candidate DSWx confirmation: <b>{selected.properties.confirmed_by_dswx == null ? 'NOT EVALUATED (null in bundle)' : String(selected.properties.confirmed_by_dswx)}</b>.
                  Per-candidate QC does not exist in this data yet — claiming otherwise would be fabrication.</p>
              </div>
              <div className="dd-dim">
                <strong>OPERATIONAL CONTEXT</strong>
                <p>Nearest settlement (bundle field): <b>{selected.properties.nearest_place ?? 'UNAVAILABLE — null in bundle'}</b>.<br />
                  CEGIS reach membership: <b>{selected.properties.in_cegis_reach ?? 'UNAVAILABLE — null in bundle'}</b>.<br />
                  Absence of a layer is shown, never filled in.</p>
              </div>
              <div className="dd-dim">
                <strong>VERIFICATION STATUS</strong>
                <p><b>{STATUS_LABEL[persona][selRecord.status]}</b>
                  {selRecord.owner && <> · owner: {selRecord.owner}</>}
                  {selRecord.deadline && <> · deadline: {selRecord.deadline}</>}
                  {selRecord.review && <> · review: {selRecord.review.conclusion} by {selRecord.review.reviewerRole}</>}
                  <br />Status lives in this browser (localStorage) and prints into the brief and the pack.</p>
              </div>
            </div>

            <div className="dd-ladder" aria-label="FluviSAR evidence protocol">
              <strong>FLUVISAR EVIDENCE PROTOCOL <span>— our own protocol, informed by Leonard et al. (2020) and Olofsson et al. (2014); not a NISAR/USGS standard</span></strong>
              <ol>
                {selMaturity.map((rung) => (
                  <li key={rung.n} className={`rung is-${rung.state}`}>
                    <span className="rung-n">{rung.n}</span>
                    <span className="rung-body"><b>{rung.label}</b> <em>{rung.state.replace(/_/g, ' ').toUpperCase()}</em><small>{rung.note}</small></span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="dd-realkill">
              <div className="dd-realkill-col is-real">
                <strong>WHAT WOULD MAKE THIS REAL</strong>
                <ul>
                  <li>Persists in the next same-track pass ({formatDate(nextPass)}) at comparable stage</li>
                  <li>A same-date independent water product agrees the bank material is gone (the bundle’s OPERA layer is 17 Jun — too early to count)</li>
                  <li>A recorded field observation of a fresh scarp / collapsed bank, confirmed by a reviewer</li>
                </ul>
              </div>
              <div className="dd-realkill-col is-kill">
                <strong>WHAT WOULD KILL IT</strong>
                <ul>
                  <li>Re-floods next pass → it was stage emergence, not bank loss</li>
                  <li>Shift sits inside co-registration tolerance (that check is not yet evaluated)</li>
                  <li>Polygon lies on a low bar inside the HAND mask (≤ {thresholds?.hand_max_m ?? '—'} m)</li>
                </ul>
              </div>
            </div>

            <div className="dd-lifecycle">
              <strong>FIELD VERIFICATION · STATUS IS A VERB, WITH AN OWNER AND A REVIEW</strong>
              <p className="dd-lifecycle-flow">
                UNREVIEWED → TASKED → MONITORING → OBSERVATION RECEIVED → REVIEWED → VERIFIED / REJECTED / back to MONITORING.
                A field visit records an observation; only a reviewer’s recorded conclusion can verify. There is no one-click verify on this desk.
              </p>
              {(selRecord.status === 'UNREVIEWED' || selRecord.status === 'TASKED' || selRecord.status === 'MONITORING') && (
                <>
                  <div className="dd-tasking-fields">
                    <label>Owner / role<input value={selRecord.owner} onChange={(e) => patchRecord({ owner: e.target.value })} placeholder="e.g. Upazila field officer (role, not a name)" /></label>
                    <label>Deadline<input type="date" value={selRecord.deadline} onChange={(e) => patchRecord({ deadline: e.target.value })} /></label>
                    <label>Dismiss reason (required to dismiss)<input value={selRecord.dismissReason} onChange={(e) => patchRecord({ dismissReason: e.target.value })} placeholder="e.g. re-flooded on next pass — stage emergence" /></label>
                  </div>
                  <div className="dd-tasking-actions">
                    <button className="desk-btn primary" onClick={doTask}><ClipboardList size={13} /> Task field verification</button>
                    <button className="desk-btn" onClick={doMonitor}>Monitor next pass</button>
                    <button className="desk-btn" onClick={doDismiss}>Dismiss</button>
                  </div>
                  <fieldset className="dd-obs-form">
                    <legend>Record a field observation</legend>
                    <div className="dd-tasking-fields">
                      <label>Observer role (required)<input value={obsRole} onChange={(e) => setObsRole(e.target.value)} placeholder="e.g. NGO field enumerator" /></label>
                      <label>Observation time<input type="datetime-local" value={obsAt} onChange={(e) => setObsAt(e.target.value)} /></label>
                      <label>GPS / position note<input value={obsGps} onChange={(e) => setObsGps(e.target.value)} placeholder="e.g. stood at anchor point, ±5 m" /></label>
                      <label>Observed bank condition
                        <select value={obsCondition} onChange={(e) => setObsCondition(e.target.value as BankCondition)}>
                          <option value="erosion">Active erosion / fresh scarp</option>
                          <option value="deposition">Fresh deposition</option>
                          <option value="stable">Bank stable</option>
                          <option value="uncertain">Uncertain / could not reach</option>
                        </select>
                      </label>
                      <label>Photo reference<input value={obsPhoto} onChange={(e) => setObsPhoto(e.target.value)} placeholder="e.g. IMG_2041–2043 (field phone)" /></label>
                    </div>
                    <button className="desk-btn primary" onClick={doObservation}>Record observation → OBSERVATION RECEIVED</button>
                  </fieldset>
                </>
              )}
              {selRecord.status === 'OBSERVATION_RECEIVED' && selRecord.observation && (
                <fieldset className="dd-obs-form">
                  <legend>Observation on record — awaiting review</legend>
                  <p className="dd-obs-summary">
                    {selRecord.observation.observerRole} · {formatDate(selRecord.observation.observedAt)} · bank condition: <b>{selRecord.observation.bankCondition}</b>
                    {selRecord.observation.gpsNote && <> · {selRecord.observation.gpsNote}</>}
                    {selRecord.observation.photoRef && <> · photos: {selRecord.observation.photoRef}</>}
                  </p>
                  <div className="dd-tasking-fields">
                    <label>Reviewer conclusion
                      <select value={revConclusion} onChange={(e) => setRevConclusion(e.target.value as ReviewConclusion)}>
                        <option value="CORROBORATES">Corroborates the candidate</option>
                        <option value="CONTRADICTS">Contradicts the candidate</option>
                        <option value="UNRESOLVED">Unresolved — keep monitoring</option>
                      </select>
                    </label>
                    <label>Reviewer role (required)<input value={revRole} onChange={(e) => setRevRole(e.target.value)} placeholder="e.g. BWDB sub-divisional engineer" /></label>
                    <label>Reason (required)<input value={revReason} onChange={(e) => setRevReason(e.target.value)} placeholder="what in the observation decides it" /></label>
                  </div>
                  <button className="desk-btn primary" onClick={doReview}>Record review</button>
                </fieldset>
              )}
              {(selRecord.status === 'VERIFIED' || selRecord.status === 'REJECTED') && (
                <div className="dd-closed">
                  <p>
                    <b>{selRecord.status}</b>
                    {selRecord.review
                      ? <> — review {selRecord.review.conclusion} by {selRecord.review.reviewerRole}: “{selRecord.review.reason}”</>
                      : selRecord.dismissReason
                        ? <> — dismissed: “{selRecord.dismissReason}”</>
                        : ''}
                  </p>
                  <button className="desk-btn" onClick={doReopen}>Reopen to monitoring</button>
                </div>
              )}
              <div className="dd-tasking-actions">
                <button className="desk-btn" onClick={exportCasePacket}><FileJson2 size={14} /> Case packet (JSON · TRACE Field handoff)</button>
                <button className="desk-btn" onClick={copyCaseLink}><Copy size={13} /> Copy deep link</button>
              </div>
              <p className="desk-note">{UNOSAT_LINE} Records stay in this browser (localStorage, labelled local-only) and print into the brief. A field record is independent evidence — it never edits the satellite finding.</p>
            </div>
          </section>
        )}

        {/* ── §5 Decision-readiness panel ── */}
        <section className="dd-readiness" aria-label="Decision readiness">
          <div className="dd-section-head">
            <div>
              <div className="desk-eyebrow"><ShieldAlert size={13} /> DECISION READINESS · WHY WE CANNOT CONCLUDE — GATE BY GATE</div>
              <h2>Every gate, its status, and exactly what it blocks.</h2>
            </div>
            <div className="dd-queue-meta">
              <span><strong>{failedChecks}</strong> failed · <strong>{warningChecks}</strong> warned · <strong>{notEvaluated}</strong> not evaluated</span>
              <span>NOT EVALUATED means the evidence does not exist yet — it is never a pass.</span>
            </div>
          </div>
          <div className="dd-ready-table" role="table" aria-label="QC gates and consequences">
            <div className="dd-ready-row is-head" role="row">
              <span>Gate</span><span>Status</span><span>Reading</span><span>What this blocks</span>
            </div>
            {qcChecks.map((check: QCCheck) => (
              <div key={check.id} className="dd-ready-row" role="row">
                <span className="dd-ready-gate"><strong>{check.label ?? check.id}</strong><small>{check.explanation}</small></span>
                <span><span className={`qc-status s-${QC_STYLE[check.status] ?? 'off'}`}>{check.status.replace(/_/g, ' ')}</span></span>
                <span className="dd-ready-val">{check.value == null ? '—' : `${check.value}${check.unit ? ` ${check.unit}` : ''}`}</span>
                <span className="dd-ready-blocks">{BLOCKS[check.id] ?? 'Blocks any claim that depends on this gate until it is evaluated.'}</span>
              </div>
            ))}
          </div>
          <details className="dd-verdict-reasons">
            <summary>Reach verdict reasons, as recorded in the bundle</summary>
            <ul>{bundle.reach.verdict_reasons.map((r) => <li key={r.slice(0, 32)}>{r}</li>)}</ul>
          </details>
        </section>

        {/* ── §6 Investigation Pack — the leave-with artefact ── */}
        {selSite && (
          <section className={`dd-pack ${judgeStep === 3 ? 'is-judge-focus' : ''} ${printTarget === 'pack' ? 'is-print-target' : ''}`} id="desk-pack" aria-label="Investigation pack">
            <div className="dd-brief-top">
              <div>
                <div className="desk-eyebrow"><Package size={13} /> THE ARTEFACT YOU LEAVE WITH</div>
                <h2>Investigation Pack · {selSite.id}</h2>
                <p>One site, one document a field team can navigate by: coordinates, stage context, maturity, the ground-truth checklist, and the members to inspect. Print it, or take the GeoJSON into any GIS. {UNOSAT_LINE}</p>
              </div>
              <div className="dd-pack-actions">
                <button className="desk-btn primary" onClick={() => printSheet('pack')}><Printer size={14} /> Print pack</button>
                <button className="desk-btn" onClick={() => exportPackGeoJson(selSite)}><FileJson2 size={14} /> GeoJSON</button>
                <button className="desk-btn" onClick={() => { downloadJson(`fluvisar-${selSite.id.toLowerCase()}-pack.json`, packJson(selSite)); setNoticeOk(true); setNotice(`${selSite.id} pack JSON exported.`); }}><FileJson2 size={14} /> Pack JSON</button>
              </div>
            </div>
            <div className="dd-sheet">
              <div className="dd-sheet-head">FLUVISAR · INVESTIGATION PACK · ACTIVATION CHILMARI-2026-01 · {selSite.id} · {selSite.reachPart.toUpperCase()} · VERDICT: STAGE-CONFOUNDED PAIR · {UNOSAT_LINE.toUpperCase()}</div>
              <div className="dd-sheet-grid">
                <div><span>Site anchor</span><strong>{selSite.anchorId} · {formatCoord(selSite.centroid)}</strong></div>
                <div><span>Members</span><strong>{selSite.members.length} candidates ({selSite.erosionCount} land→water · {selSite.accretionCount} water→land)</strong></div>
                <div><span>Grouped area</span><strong>{formatNumber(selSite.totalArea)} ha of candidates (not verified change)</strong></div>
                <div><span>Stage context</span><strong>pair typed later/lower · stage proxy Δ +0.039 (tolerance ±0.02) · FFWC Chilmari context in brief</strong></div>
                <div><span>Evidence maturity</span><strong>site anchor: {maturityHeadline(records[selSite.anchorId] ?? EMPTY_RECORD)} · rung 3 PENDING — resolves {formatDate(nextPass)}</strong></div>
                <div><span>Readiness</span><strong>{failedChecks} FAIL · {warningChecks} WARN · {notEvaluated} NOT EVALUATED (run-level)</strong></div>
              </div>
              <table className="dd-brief-table">
                <thead><tr><th>Candidate</th><th>Class</th><th>Area (ha)</th><th>Centroid</th><th>Field status</th></tr></thead>
                <tbody>
                  {selSite.members.slice(0, 15).map((f) => (
                    <tr key={String(f.properties.id)}>
                      <td>{String(f.properties.id)}</td>
                      <td>{f.properties.class}</td>
                      <td>{f.properties.area_ha.toFixed(2)}</td>
                      <td>{formatCoord(featureCentroid(f))}</td>
                      <td>{statusOf(f)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selSite.members.length > 15 && <p className="dd-sheet-note">+{selSite.members.length - 15} further members in the Pack JSON / GeoJSON export.</p>}
              <div className="dd-checklist">
                <strong>GROUND-TRUTH CHECKLIST — WHAT TO DO AT THIS SITE</strong>
                <ol>{GROUND_TRUTH_CHECKLIST.map((item) => <li key={item.slice(0, 24)}>{item}</li>)}</ol>
              </div>
              <footer className="dd-brief-footer">
                <span>PROVENANCE · Granules: {(erosionMetric?.inputs ?? []).map((i) => i.granule ?? '').filter(Boolean).join(' · ') || 'see manifest'}</span>
                <span>Product: NISAR L2 GCOV Provisional (CRID P05023) — calibrated, validation ongoing, RFI-screened · Otsu thresholds {thresholds?.threshold_db_t0 != null ? `${thresholds.threshold_db_t0.toFixed(2)} dB → ${thresholds.threshold_db_t1?.toFixed(2)} dB` : '—'} · median filter {thresholds?.median_filter ?? '—'} · MMU {thresholds?.mmu_px ?? '—'} px · HAND ≤ {thresholds?.hand_max_m ?? '—'} m · grid EPSG:32645 · pixel {erosionMetric?.pixel_area_m2 ?? '—'} m²</span>
                <span>Context: GPM IMERG rainfall (doi 10.5067/GPM/IMERGDL/DAY/07) · OPERA DSWx-S1 (NASA/JPL, layer acquired 17 Jun 2026 — pre-pair context) · stage: bundle proxy (no gauge) · FFWC bulletin context dated 14 Oct 2026</span>
              </footer>
            </div>
          </section>
        )}

        {/* ── §7 Community Evidence Bulletin ── */}
        <section className={`dd-bulletin ${printTarget === 'bulletin' ? 'is-print-target' : ''}`} id="desk-bulletin" aria-label="Community evidence bulletin">
          <div className="dd-brief-top">
            <div>
              <div className="desk-eyebrow"><Printer size={13} /> COMMUNITY EVIDENCE BULLETIN</div>
              <h2>For the Union Parishad, Chilmari — print and pin it.</h2>
              <p>One page, Bangla first: what the satellite saw, what it does <em>not</em> prove, and what happens next. Written to be read aloud at the Parishad office — not a warning, not a forecast.</p>
            </div>
            <button className="desk-btn primary" onClick={() => printSheet('bulletin')}><Printer size={14} /> Print bulletin</button>
          </div>
          <div className="dd-sheet dd-bulletin-sheet" lang="bn">
            <div className="dd-sheet-head">ফ্লুভিসার · কমিউনিটি এভিডেন্স বুলেটিন · FLUVISAR · COMMUNITY EVIDENCE BULLETIN · প্রাপক: ইউনিয়ন পরিষদ, চিলমারী (কুড়িগ্রাম)</div>
            <h3>জামুনা নদী — চিলমারী: উপগ্রহ যা দেখেছে, আর যা এখনও প্রমাণ হয়নি</h3>
            <p className="dd-bulletin-sub">Jamuna River — Chilmari: what the satellite observed, and what it has NOT yet proven.</p>
            <div className="dd-bulletin-cols">
              <div>
                <strong>যা দেখা গেছে · What was observed</strong>
                <p>NISAR উপগ্রহ {formatDate(firstDate)} ও {formatDate(lastDate)} তারিখে এই এলাকার ছবি তুলেছে।
                  রাডারে <b>{erosionCount.toLocaleString()}টি</b> জায়গায় জমি→পানি এবং <b>{accretionCount.toLocaleString()}টি</b> জায়গায় পানি→জমি
                  ধরনের বদলের <em>সম্ভাব্য</em> চিহ্ন পাওয়া গেছে। দুটি তারিখের মধ্যে নদীর পানির স্তর বদলেছে — তাই এসব বদলের
                  বড় অংশ হতে পারে পানি নেমে যাওয়ায় চর জেগে ওঠা।</p>
                <p className="dd-bulletin-en">The NISAR satellite imaged this reach on {formatDate(firstDate)} and {formatDate(lastDate)}. Radar mapped
                  {' '}{erosionCount.toLocaleString()} possible land→water and {accretionCount.toLocaleString()} possible water→land switches.
                  The river’s water level changed between the two dates, so much of this may be falling water exposing sandbars.</p>
              </div>
              <div>
                <strong>যা জানা যায়নি · What this does NOT establish</strong>
                <p>এখনও <b>কোনো ভাঙন নিশ্চিত হয়নি</b>। কোনো বাড়ি, ফসল বা জমির ক্ষতি এই ছবি থেকে প্রমাণিত নয়।
                  <b> এটি কোনো সরিয়ে নেওয়ার নির্দেশ নয় এবং বন্যার সতর্কবার্তাও নয়।</b></p>
                <p className="dd-bulletin-en">No erosion is confirmed yet. No damage to any home, crop or plot is proven by these images.
                  This bulletin is <b>not an evacuation notice and not a flood warning</b>.</p>
              </div>
              <div>
                <strong>এরপর যা হবে · What happens next</strong>
                <p>মাঠকর্মীরা তালিকাভুক্ত {sites.length}টি জায়গা (investigation sites) যাচাই করবেন। পরের উপগ্রহ ছবি আসবে
                  {' '}{formatDate(nextPass)} — তখন বোঝা যাবে কোন বদল টিকে আছে। যাচাইয়ের পরেই কোনো সিদ্ধান্ত।</p>
                <p className="dd-bulletin-en">Field teams will check the {sites.length} listed investigation sites. The next satellite pass
                  ({formatDate(nextPass)}) will show which changes persist. Decisions come after verification — not before.</p>
              </div>
            </div>
            <p className="dd-bulletin-foot">
              সরকারি বন্যা তথ্যের জন্য: Flood Forecasting &amp; Warning Centre (FFWC) — <a href={FFWC_URL} target="_blank" rel="noreferrer">ffwc.gov.bd</a>
              {' '}· Official flood information: FFWC (BWDB). · {UNOSAT_LINE} · প্রাথমিক বিশ্লেষণ — মাঠে এখনও যাচাই হয়নি।
            </p>
          </div>
        </section>

        {/* ── §8 CEGIS positioning ── */}
        <section className="dd-cegis" aria-label="Position alongside CEGIS">
          <div className="desk-eyebrow">WORKS ALONGSIDE CEGIS · NOT INSTEAD OF IT</div>
          <h2>The annual prediction already exists. This desk fills the 12 days between.</h2>
          <p>
            CEGIS has published annual Jamuna erosion predictions since <strong>2004</strong> — multi-decadal bankline history,
            vulnerable reaches classed at 70 / 50 / 30% probability, checked retrospectively each year, and used by BWDB.
            FluviSAR does not compete with that and does not predict erosion. Its job is narrower and newer:
            <strong> 12-day, cloud-independent NISAR screening inside the season</strong>, between CEGIS cycles — grouping fresh
            candidates into visitable sites and closing the loop with field verification. Freihardt &amp; Frey (2023, NHESS)
            showed real Jamuna erosion also occurs <em>outside</em> the previous CEGIS hotspot map — exactly the gap a
            within-season triage exists to catch.
          </p>
        </section>

        {/* ── §9 Field Verification Brief (run-level, printable) ── */}
        <section className={`dd-brief ${printTarget === 'brief' ? 'is-print-target' : ''}`} id="desk-brief" aria-label="Field verification brief">
          <div className="dd-brief-top">
            <div>
              <div className="desk-eyebrow"><Printer size={13} /> THE RUN-LEVEL ARTEFACT</div>
              <h2>Field Verification Brief</h2>
              <p>One click, one printed page-set: activation header, the qualified numbers, the screening 24 with their lifecycle
                states, the Allowed / Not Allowed box, and the full audit footer. This is a verification request — <strong>not an evacuation order</strong>. {UNOSAT_LINE}</p>
            </div>
            <button className="desk-btn primary" onClick={() => printSheet('brief')}><Printer size={14} /> {personaDef.exportLabel}</button>
          </div>
          <div className="dd-sheet">
            <div className="dd-sheet-head">FLUVISAR · ACTIVATION CHILMARI-2026-01 · NISAR L-BAND GCOV HH (PROVISIONAL, CRID P05023) · PAIR {formatDate(firstDate)} → {formatDate(lastDate)} · VERDICT: STAGE-CONFOUNDED PAIR · GENERATED {new Date().toLocaleDateString('en-GB')} · MODE: {personaDef.label.toUpperCase()}</div>
            <div className="dd-sheet-grid">
              <span><strong>{sites.length}</strong> investigation sites from {candidates.length.toLocaleString()} candidates screened</span>
              <span><strong>{formatNumber(erosionMetric?.value)} ha</strong> land→water candidates (range {formatNumber(erosionMetric?.low, 0)}–{formatNumber(erosionMetric?.high, 0)} ha, ±1 dB)</span>
              <span><strong>{formatNumber(accretionMetric?.value)} ha</strong> water→land candidates</span>
              <span><strong>{verifiedCount}</strong> confirmed losses · rung 3 PENDING — resolves {formatDate(nextPass)}</span>
            </div>
            <table className="dd-brief-table">
              <thead><tr><th>#</th><th>Candidate</th><th>Site</th><th>Class</th><th>Area (ha)</th><th>Field status</th><th>Review</th><th>Owner</th><th>Deadline</th></tr></thead>
              <tbody>
                {queue.map((f, i) => {
                  const id = String(f.properties.id);
                  const r = records[id] ?? EMPTY_RECORD;
                  return (
                    <tr key={id}>
                      <td>{i + 1}</td><td>{id}</td><td>{siteOfFeature.get(id)?.id ?? '—'}</td><td>{f.properties.class}</td>
                      <td>{f.properties.area_ha.toFixed(2)}</td><td>{r.status}</td>
                      <td>{r.review ? r.review.conclusion : '—'}</td><td>{r.owner || '—'}</td><td>{r.deadline || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="dd-brief-allowed"><strong>ALLOWED:</strong> field verification only. <strong>NOT ALLOWED:</strong> response, evacuation, or loss claims on this pair alone. <strong>RESOLVES IT:</strong> next same-track pass {formatDate(nextPass)} at comparable stage + Sentinel-1 tie-breaker.</div>
            <div className="dd-brief-audit">
              <strong>AUDIT LOG ({audit.length} entr{audit.length === 1 ? 'y' : 'ies'}) — local to this browser, labelled local-only</strong>
              {audit.length === 0 ? <p>No lifecycle decisions recorded yet in this browser.</p> : (
                <ul>{audit.slice(0, 30).map((a, i) => <li key={i}>{a.ts} · {a.featureId} · {a.action} · {a.detail}</li>)}</ul>
              )}
            </div>
            <footer className="dd-brief-footer">
              <span>PROVENANCE · Granules: {(erosionMetric?.inputs ?? []).map((i) => i.granule ?? '').filter(Boolean).join(' · ') || 'see manifest'}</span>
              <span>Pipeline: Otsu thresholds {thresholds?.threshold_db_t0 != null ? `${thresholds.threshold_db_t0.toFixed(2)} dB → ${thresholds.threshold_db_t1?.toFixed(2)} dB` : '—'} · median filter {thresholds?.median_filter ?? '—'} · MMU {thresholds?.mmu_px ?? '—'} px · HAND ≤ {thresholds?.hand_max_m ?? '—'} m · grid EPSG:32645 · pixel {erosionMetric?.pixel_area_m2 ?? '—'} m²</span>
              <span>Context: GPM IMERG rainfall (doi 10.5067/GPM/IMERGDL/DAY/07) · OPERA DSWx-S1 (layer acquired 17 Jun 2026 — pre-pair context, not same-date confirmation) · stage: bundle proxy (no gauge); FFWC bulletin context 14 Oct 2026 · Methods: <a href={NISAR_URL} target="_blank" rel="noreferrer">NISAR data</a> · <a href={QC_URL} target="_blank" rel="noreferrer">OPERA DSWx</a> · <a href={OSM_URL} target="_blank" rel="noreferrer">OSM ODbL</a></span>
            </footer>
          </div>
        </section>

        {/* ── §10 What happens next ── */}
        <section className="dd-next" aria-label="What happens next">
          <div className="dd-next-step"><span>NEXT NISAR PASS · {formatDate(nextPass)}</span><strong>Re-test persistence</strong><p>Same track {bundle.reach.track.relative_orbit}, frame {bundle.reach.track.frame}. Candidates that survive a comparable stage climb the protocol; candidates that re-flood were stage emergence. Sentinel-1 (Freihardt &amp; Frey lineage) is the designed tie-breaker between NISAR cycles. <Stamp kind="derived">DERIVED · 12-day cycle</Stamp></p></div>
          <div className="dd-next-step"><span>FIELD VERIFICATION WINDOW</span><strong>Task → observe → review</strong><p>{taskedCount} of 24 screening candidates are in the workflow in this browser. An observation alone never verifies — a recorded reviewer conclusion does.</p></div>
          <div className="dd-next-step"><span>V3 PRODUCT</span><strong>Verdict revisits, per candidate</strong><p>CONFIRMED / STAGE ARTEFACT / STILL UNRESOLVED — decided candidate by candidate at rung 3+, never as one blanket number.</p></div>
        </section>

        <footer className="desk-footer">
          <span className="desk-footer-mark">FLUVISAR · EVIDENCE FIRST</span>
          <span>Decision Desk only: look → verify → issue. Records stay in this browser; print the brief or a site pack for the field handoff.</span>
          <a href="/methods">Methods &amp; provenance <ChevronRight size={13} /></a>
        </footer>

        {/* ── Judge view bar ── */}
        {judgeStep > 0 && (
          <div className="dd-judgebar" role="note">
            <span className="dd-judgebar-tag">JUDGE VIEW · 30-SECOND WALK · STEP {judgeStep}/3</span>
            <p>{JUDGE_CAPTIONS[judgeStep]}</p>
            <div className="dd-judgebar-actions">
              <button className="desk-btn slim" disabled={judgeStep <= 1} onClick={() => judgeGo(judgeStep - 1)}>Back</button>
              {judgeStep < 3
                ? <button className="desk-btn slim primary" onClick={() => judgeGo(judgeStep + 1)}>Next</button>
                : <button className="desk-btn slim primary" onClick={() => selSite && printSheet('pack')}>Print the pack</button>}
              <button className="desk-btn slim" onClick={() => setJudgeStep(0)}>Exit</button>
            </div>
          </div>
        )}

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
