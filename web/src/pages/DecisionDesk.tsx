import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowUpRight, CalendarClock, Camera, Check, ChevronLeft, ChevronRight, ClipboardList,
  Compass, Copy, Crosshair, FileJson2, Layers3, LayoutGrid, MapPin, Package,
  Pause, Play, Printer, Radio, Send, ShieldAlert, ShieldCheck, Waves, Eye,
  Sparkles, Table2, UserCheck, X,
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
import {
  candidateAttribution, surveyObjective, blockingGateList, stageContextLine,
} from '../decision/attribution';
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
function Stamp({ kind, children, title }: { kind: 'real' | 'derived' | 'estimated' | 'context'; children: string; title?: string }) {
  return <span className={`dd-stamp is-${kind}`} title={title}>{children}</span>;
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
  // V3 workspace chrome: left-rail tabs, inspector tabs, site search, verdict popover
  const [leftTab, setLeftTab] = useState<'sites' | 'screening'>('sites');
  const [rightTab, setRightTab] = useState<'evidence' | 'field' | 'pack' | 'bulletin'>('evidence');
  const [siteQuery, setSiteQuery] = useState('');
  const [verdictOpen, setVerdictOpen] = useState(false);
  const [scienceModalOpen, setScienceModalOpen] = useState(false);
  const [scienceModalTab, setScienceModalTab] = useState<'telemetry' | 'qc' | 'ethics'>('telemetry');
  // Investigation Sites table, pagination & modal states
  const [siteViewMode, setSiteViewMode] = useState<'table' | 'grid'>('table');
  const [sitePage, setSitePage] = useState(1);
  const [siteModalSite, setSiteModalSite] = useState<InvestigationSite | null>(null);
  const [siteStatusFilter, setSiteStatusFilter] = useState<'all' | 'unreviewed' | 'workflow' | 'verified'>('all');
  const [siteSortBy, setSiteSortBy] = useState<'area' | 'id' | 'members'>('area');
  const [siteSortDir, setSiteSortDir] = useState<'asc' | 'desc'>('desc');
  const [copiedGps, setCopiedGps] = useState(false);
  // V4 page chrome: one focused view at a time (previous-web pattern)
  const [view, setView] = useState<'overview' | 'map' | 'sites' | 'evidence' | 'field' | 'bulletin'>('overview');
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

  // auto-dismiss toast notice after 3.2s
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(t);
  }, [notice]);

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

  // Investigation Sites filtering, sorting and 10-per-page pagination
  const filteredSites = useMemo(() => {
    let list = sitesByArea.filter((s) => {
      const q = siteQuery.trim().toLowerCase();
      const matchesQ = !q || s.id.toLowerCase().includes(q) || s.reachPart.toLowerCase().includes(q) || s.anchorId.toLowerCase().includes(q);
      if (!matchesQ) return false;

      const verifiedInSite = s.members.filter((f) => statusOf(f) === 'VERIFIED').length;
      const taskedInSite = s.members.filter((f) => statusOf(f) !== 'UNREVIEWED').length;

      if (siteStatusFilter === 'verified') return verifiedInSite > 0;
      if (siteStatusFilter === 'workflow') return taskedInSite > 0 && verifiedInSite === 0;
      if (siteStatusFilter === 'unreviewed') return taskedInSite === 0;
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (siteSortBy === 'area') cmp = a.totalArea - b.totalArea;
      else if (siteSortBy === 'id') cmp = a.id.localeCompare(b.id);
      else if (siteSortBy === 'members') cmp = a.members.length - b.members.length;
      return siteSortDir === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [sitesByArea, siteQuery, siteStatusFilter, siteSortBy, siteSortDir, records]);

  const SITES_PER_PAGE = 10;
  const totalSitePages = Math.max(1, Math.ceil(filteredSites.length / SITES_PER_PAGE));
  const pagedSites = useMemo(() => {
    const start = (sitePage - 1) * SITES_PER_PAGE;
    return filteredSites.slice(start, start + SITES_PER_PAGE);
  }, [filteredSites, sitePage]);

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
  const selectSite = (site: InvestigationSite, focusInspector = true) => {
    setSelectedSiteId(site.id);
    setSelectedFeatureId(site.anchorId);
    if (focusInspector) { setRightTab('evidence'); setView('evidence'); }
  };
  const focusCandidate = (id: string, siteId?: string | null) => {
    setSelectedFeatureId(id);
    if (siteId) setSelectedSiteId(siteId);
    setRightTab('evidence');
    setView('evidence');
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

  // V5 — change attribution + generated survey objective (decision/attribution.ts).
  // Standings and objectives are computed from the bundle's own QC checks and the
  // field records at render time; nothing is scored, weighted or hard-coded twice.
  const sensitivityTriple = erosionMetric && erosionMetric.low != null && erosionMetric.high != null
    ? { low: erosionMetric.low, value: erosionMetric.value, high: erosionMetric.high }
    : null;
  const pixelAreaM2 = erosionMetric?.pixel_area_m2 ?? accretionMetric?.pixel_area_m2 ?? 400;
  const attributionFor = (feature: ChangeFeature, record: FieldRecord) => candidateAttribution(feature, record, qcChecks, {
    nextPassLabel: formatDate(nextPass),
    sensitivity: sensitivityTriple,
  });
  const selAttribution = selected ? attributionFor(selected, selRecord) : [];
  const selPxHa = selected ? (selected.properties.pixel_count * pixelAreaM2) / 10000 : 0;
  const objectiveFor = (site: InvestigationSite): string => surveyObjective(site, {
    blockingGates: blockingGateList(qcChecks),
    stageLine: stageContextLine(qcChecks),
    nextPassLabel: formatDate(nextPass),
    checklist: GROUND_TRUTH_CHECKLIST,
  });

  const packJson = (site: InvestigationSite) => ({
    schema: 'fluvisar.decision-desk.investigation-pack.v2',
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
    survey_objective: objectiveFor(site),
    members: site.members.map((f) => ({
      id: String(f.properties.id), class: f.properties.class, area_ha: f.properties.area_ha,
      pixel_count: f.properties.pixel_count, centroid: f.properties.centroid,
      field_status: statusOf(f),
    })),
    attribution: attributionFor(site.anchor, records[site.anchorId] ?? EMPTY_RECORD)
      .map((r) => ({ hypothesis: r.hypothesis, support: r.support, kill: r.kill, standing: r.standing, reason: r.reason })),
    audit: audit.filter((a) => site.members.some((f) => String(f.properties.id) === a.featureId)),
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
    if (persona === 'char') { setView('bulletin'); printSheet('bulletin'); }
    else if (persona === 'ngo') { setView('field'); setRightTab('pack'); printSheet('pack'); }
    else { setView('field'); setRightTab('pack'); printSheet('brief'); }
  };

  const selMaturity = candidateMaturity(selRecord, qcChecks, formatDate(nextPass));

  // Guided Walkthrough: 60-second guided walk over real page state — no demo data.
  const judgeTopSite = sitesByArea[0] ?? null;
  const tourGo = (step: number) => {
    setJudgeStep(step);
    if (step === 1) { setVerdictOpen(true); setView('overview'); scrollTo('desk-hero'); }
    if (step === 2 && judgeTopSite) {
      setSelectedSiteId(judgeTopSite.id);
      setSelectedFeatureId(judgeTopSite.anchorId);
      setExpandedSite(judgeTopSite.id);
      setLeftTab('sites');
      setRightTab('evidence');
      setView('sites');
    }
    if (step === 3) { setView('field'); setRightTab('pack'); }
  };
  const TOUR_STEPS = [
    {
      badge: 'Step 1 of 3 · Science Integrity',
      title: '1 · Radar Observation & Scientific Verdict',
      text: 'Between Aug 26 and Sep 19 (24 days), NISAR L-band SAR mapped water transitions over Jamuna. Because river stage fell between passes (exposing sandbars), FluviSAR scientifically marks this pair as INCONCLUSIVE—guarding against false erosion alerts.',
    },
    {
      badge: 'Step 2 of 3 · Candidate Triage',
      title: '2 · Spatial Prioritization & Sites',
      text: '4,571 raw transition polygons are filtered and synthesized into 24 actionable investigation sites. Field teams and disaster managers receive clustered GPS anchors with area rankings rather than raw pixel noise.',
    },
    {
      badge: 'Step 3 of 3 · Ground-Truth Action',
      title: '3 · Actionable Field Verification Pack',
      text: 'Satellite radar is a screening tool, not a final verdict. FluviSAR generates printable Investigation Packs and standard TRACE Field JSON handoffs for on-the-ground boat and UAV verification teams.',
    },
  ];

  if (error) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby error"><ShieldAlert size={30} /><h1>Investigation unavailable</h1><p>{error}</p><a href="/methods">Open methods and data sources <ChevronRight size={14} /></a></main></div>;
  if (!bundle) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby"><span className="desk-kicker">FLUVISAR / DECISION DESK</span><div className="desk-loader" /><p>Loading the Jamuna evidence bundle…</p></main></div>;
  if (!candidates.length) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby error"><ShieldAlert size={30} /><h1>No mapped candidates in this bundle</h1><p>The evidence bundle loaded, but it contains no transition features to review.</p><a href="/methods">Open methods and data sources <ChevronRight size={14} /></a></main></div>;

  return (
    <div className="desk-page" data-print={printTarget}>
      <Navbar transparent />
      <main className="dd4-shell">

        {/* ════ 1 · Cinematic hero ════ */}
        <section className={`dd4-hero ${judgeStep === 1 ? 'is-judge-focus' : ''}`} id="desk-hero" data-theme="dark">
          <div className="dd4-hero-radar" aria-hidden="true" />
          <div className="dd4-hero-glow" aria-hidden="true" />
          <div className="dd4-hero-scrim" aria-hidden="true" />
          <div className="dd4-hero-content">
            <div className="dd4-eyebrow">
              <span className="dd4-eyebrow-dot" />
              FLUVISAR · DECISION DESK · CHILMARI-2026-01
            </div>
            <p className="dd4-mission">Where should we look next?</p>
            <h1 className="dd4-headline">
              <span className="dd4-headline-main">Separating The River Falling</span><br />
              <span className="dd4-headline-accent">From The Bank Failing.</span>
            </h1>
            <p className="dd4-deck">
              Between the two NISAR passes the Jamuna’s stage moved and its bars emerged — most apparent change in
              this pair is falling water exposing the river’s own bed, not proven bank loss. The radar mapped
              {' '}<strong>{candidates.length.toLocaleString()} transition candidates</strong>; this desk groups them into
              {' '}<strong>{sites.length} investigation sites</strong> a field team can actually visit, and refuses to call
              any of them erosion until evidence — not area — says so. <strong>None justify action on radar alone.</strong>
            </p>
            <div className="dd4-hero-actions">
              <button className="dd4-cta-primary" onClick={() => { setView('map'); scrollTo('desk-switcher'); }}>
                <Layers3 size={17} /> Open the map
              </button>
              <button className="dd4-cta-tour" onClick={() => tourGo(1)} aria-label="Start interactive 60 second tour">
                <span className="dd4-tour-pulse-ring"><Play size={12} fill="currentColor" /></span>
                <span>Quick Tour (60s)</span>
              </button>
              <button className="dd4-cta-science" onClick={() => setScienceModalOpen(true)} aria-label="Open scientific telemetry modal">
                <Sparkles size={15} />
                <span>Deep-Dive Science ↗</span>
              </button>
            </div>

            {/* Progressive Disclosure: High-level Mission Status & Science Summary */}
            <div className="dd4-summary-card">
              <div className="dd4-summary-head">
                <div className="dd4-summary-status">
                  <span className="desk-verdict-pulse"><i /></span>
                  <span className="dd4-summary-status-tag">EVIDENCE INTEGRITY VERDICT: <strong>{bundle.reach.verdict}</strong></span>
                </div>
                <button
                  className="dd4-summary-expand-btn"
                  onClick={() => setScienceModalOpen(true)}
                  type="button"
                >
                  Inspect Full Telemetry &amp; QC Specs <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="dd4-summary-grid">
                <div className="dd4-summary-col">
                  <span className="dd4-sc-badge is-pass">● SENSOR READY</span>
                  <strong>NISAR SAR Acquisition</strong>
                  <p>24cm L-Band HH active radar. Cloud &amp; forest canopy penetration across Jamuna reach.</p>
                </div>
                <div className="dd4-summary-col">
                  <span className="dd4-sc-badge is-warn">▲ INCONCLUSIVE</span>
                  <strong>Stage Mismatch Gate</strong>
                  <p>River stage proxy fell between Aug 26 &amp; Sep 19. Sandbar emergence mimics bank erosion.</p>
                </div>
                <div className="dd4-summary-col">
                  <span className="dd4-sc-badge is-action">◆ ACTION</span>
                  <strong>24 Ground-Truth Sites</strong>
                  <p>Synthesized GPS investigation anchors ready for local boat and UAV verification.</p>
                </div>
              </div>
            </div>
            <div className="dd4-hero-meta">
              <button className={`dd4-verdict-chip ${verdictOpen ? 'open' : ''}`} onClick={() => setVerdictOpen(!verdictOpen)} aria-expanded={verdictOpen} aria-haspopup="true">
                <span className="desk-verdict-pulse"><i /></span>
                <span><strong>STAGE-CONFOUNDED PAIR</strong> — do not issue as erosion</span>
                <ChevronRight size={13} className="dd4-chip-caret" />
              </button>
              <span className="dd4-hero-verdict-line">Bundle run verdict: {bundle.reach.verdict} · {failedChecks} check failed · {warningChecks} warned · {notEvaluated} not evaluated. Safe to task. Unsafe to conclude.</span>

              {verdictOpen && (
                <div className="dd4-verdict-pop" role="dialog" aria-label="Evidence verdict — this run">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div className="desk-verdict-head"><span className="desk-verdict-pulse"><i /></span>EVIDENCE VERDICT · THIS RUN</div>
                    <button
                      type="button"
                      onClick={() => setVerdictOpen(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      aria-label="Close verdict details"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="dd-verdict-word">STAGE-CONFOUNDED PAIR</div>
                  <div className="dd-allowed">
                    <div><strong>ALLOWED NOW</strong><span>Task field verification of the investigation sites · compare against historic banklines · carry the OPERA DSWx layer (17 Jun 2026) as pre-pair context only</span></div>
                    <div><strong>NOT ALLOWED</strong><span>Publish a candidate area as erosion fact · claim displacement or loss · trigger a response from this map alone</span></div>
                    <div><strong>RESOLVES IT</strong><span>Next same-track pass ({formatDate(nextPass)}) at comparable stage, with Sentinel-1 as tie-breaker — persistence separates emergence from bank loss</span></div>
                  </div>
                  <div className="dd4-pop-foot">
                    <div className="desk-verdict-meta"><span>{taskedCount}/24 screening candidates tasked or beyond</span><span>bundle frozen {formatDate(bundle.manifest.generated_at.slice(0, 10).replace(/-/g, ''))}</span></div>
                    <button className="desk-btn slim" onClick={() => { setVerdictOpen(false); setView('overview'); window.setTimeout(() => scrollTo('desk-hydro'), 60); }}>Why we can’t conclude <ArrowUpRight size={13} /></button>
                  </div>
                </div>
              )}
            </div>
            <div className="dd4-hero-numbers" aria-label="Qualified headline numbers">
              <div className="dd-num">
                <strong>24</strong><span>FIELD PRIORITIES</span>
                <small>of {candidates.length.toLocaleString()} candidates screened — grouped into {sites.length} investigation sites <Stamp kind="derived">DERIVED · method on page</Stamp></small>
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
            <div className="dd4-hero-stage" aria-label="Stage at the two passes">
              <span className="dd4-hs-label">STAGE PROXY · THE TWO PASSES</span>
              <span className="dd4-hs-val">t0 {formatDate(firstDate)} · <strong>{(bundle.stage.series[0]?.h ?? 0).toFixed(3)}</strong></span>
              <span className="dd4-hs-arrow">→</span>
              <span className="dd4-hs-val">t1 {formatDate(lastDate)} · <strong>{(bundle.stage.series[bundle.stage.series.length - 1]?.h ?? 0).toFixed(3)}</strong></span>
              <span className="dd4-hs-delta">Δ {(((bundle.stage.series[bundle.stage.series.length - 1]?.h ?? 0) - (bundle.stage.series[0]?.h ?? 0)) >= 0 ? '+' : '') + ((bundle.stage.series[bundle.stage.series.length - 1]?.h ?? 0) - (bundle.stage.series[0]?.h ?? 0)).toFixed(3)} — outside the ±0.02 stage-match tolerance</span>
              <span className="dd4-hs-next">NEXT PASS {formatDate(nextPass)} · THE PERSISTENCE TEST</span>
            </div>
          </div>
          <div className="dd4-hero-caption">
            <span>NISAR L-BAND GCOV HH · TRACK {bundle.reach.track.relative_orbit} FRAME {bundle.reach.track.frame} · PAIR {formatDate(firstDate)} → {formatDate(lastDate)} · {pairWindow} DAYS = 2 CYCLES · PRODUCT V2 · FIELD VERIFICATION OPEN</span>
            <span className="dd4-hero-trust">NISAR PROVISIONAL · CRID P05023 · CALIBRATED, VALIDATION ONGOING · RFI-SCREENED <em>validated reprocessing expected Q4 2026 (ASF)</em></span>
          </div>
        </section>

        {/* ════ 2 · Sticky glass view switcher ════ */}
        <nav className="dd4-switcher" id="desk-switcher" aria-label="Decision Desk views">
          <div className="dd4-pills" role="tablist" aria-label="Choose a view">
            {([
              ['overview', 'Overview'], ['map', 'Map'], ['sites', 'Sites'], ['evidence', 'Evidence'], ['field', 'Field'], ['bulletin', 'Bulletin'],
            ] as const).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={view === id} className={`dd4-pill ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>{label}</button>
            ))}
          </div>

          <div className="dd4-switcher-right">
            <button
              className="dd4-switcher-tour-btn"
              onClick={() => tourGo(1)}
              title="Launch 60-second guided walkthrough"
              type="button"
            >
              <Play size={11} fill="currentColor" />
              <span>Quick Tour (60s)</span>
            </button>
            <button
              className="dd4-switcher-science-btn"
              onClick={() => setScienceModalOpen(true)}
              title="Open full scientific telemetry & QC gates"
              type="button"
            >
              <Sparkles size={11} />
              <span>Science Specs ↗</span>
            </button>
            <span className="dd4-switcher-note">{sites.length} SITES · {candidates.length.toLocaleString()} CANDIDATES</span>
          </div>
        </nav>

        {/* ════ 3 · Overview view ════ */}
        {view === 'overview' && (
          <section className="dd4-view dd4-view-overview" aria-label="Overview">
            <div className="dd4-persona-row">
              <div className="dd4-persona-top">
                <div className="dd4-ps-header">
                  <span className="dd4-ps-label">OPERATIONAL ROLE / PERSPECTIVE</span>
                  <span className="dd4-ps-role-tag">Active Mode: <strong>{personaDef.label}</strong></span>
                </div>
                <div className="dd4-seg" role="tablist" aria-label="Choose your desk">
                  {PERSONAS.map((p) => (
                    <button key={p.id} role="tab" aria-selected={persona === p.id} className={persona === p.id ? 'active' : ''} onClick={() => setPersona(p.id)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dd4-persona-detail">
                <div className="dd4-persona-copy">
                  <span className="dd4-ps-label">YOUR MISSION PROFILE</span>
                  <strong>{personaDef.job}</strong>
                  <span className="dd4-ps-actions">{personaDef.actions.join('  ·  ')}</span>
                </div>
                <div className="dd4-persona-actions">
                  <button className="desk-btn primary" onClick={personaExport}><Printer size={13} /> {personaDef.exportLabel}</button>
                  <small className="dd4-ps-note">{personaDef.sliceNote}</small>
                </div>
              </div>
            </div>

            <div className="dd4-panel dd4-stage-panel" id="desk-hydro">
              <div className="section-label">The stage story</div>
              <h2 className="dd4-view-title">The water moved. That is the whole problem.</h2>
              <StageHydro stage={bundle.stage} t0Label={formatDate(firstDate)} t1Label={formatDate(lastDate)} />
            </div>

            <div className="dd4-allowed-grid" aria-label="What this run allows">
              <div className="dd4-allow-card is-allowed">
                <span className="dd4-allow-tag">ALLOWED NOW</span>
                <p>Task field verification of the investigation sites · compare against historic banklines · carry the OPERA DSWx layer (17 Jun 2026) as pre-pair context only</p>
              </div>
              <div className="dd4-allow-card is-not">
                <span className="dd4-allow-tag">NOT ALLOWED</span>
                <p>Publish a candidate area as erosion fact · claim displacement or loss · trigger a response from this map alone</p>
              </div>
              <div className="dd4-allow-card is-resolves">
                <span className="dd4-allow-tag">RESOLVES IT</span>
                <p>Next same-track pass ({formatDate(nextPass)}) at comparable stage, with Sentinel-1 as tie-breaker — persistence separates emergence from bank loss</p>
              </div>
            </div>

            <div className="dd4-next-panel">
              <div className="section-label">What happens next</div>
              <div className="dd4-next-flow">
                <div className="dd4-next-step">
                  <span className="dd4-next-num">STEP 01</span>
                  <span className="dd4-next-title">Re-test persistence · {formatDate(nextPass)}</span>
                  <span className="dd4-next-meta">NEXT NISAR PASS</span>
                  <p>Same track {bundle.reach.track.relative_orbit}, frame {bundle.reach.track.frame}. Candidates that survive a comparable stage climb the protocol; candidates that re-flood were stage emergence. Sentinel-1 (Freihardt &amp; Frey lineage) is the designed tie-breaker between NISAR cycles. <Stamp kind="derived">DERIVED · 12-day cycle</Stamp></p>
                </div>
                <div className="dd4-next-step">
                  <span className="dd4-next-num">STEP 02</span>
                  <span className="dd4-next-title">Task → observe → review</span>
                  <span className="dd4-next-meta">FIELD VERIFICATION WINDOW</span>
                  <p>{taskedCount} of 24 screening candidates are in the workflow in this browser. An observation alone never verifies — a recorded reviewer conclusion does.</p>
                </div>
                <div className="dd4-next-step">
                  <span className="dd4-next-num">STEP 03</span>
                  <span className="dd4-next-title">Verdict revisits, per candidate</span>
                  <span className="dd4-next-meta">V3 PRODUCT</span>
                  <p>CONFIRMED / STAGE ARTEFACT / STILL UNRESOLVED — decided candidate by candidate at rung 3+, never as one blanket number.</p>
                </div>
              </div>
            </div>

            <div className="dd4-cegis-strip" aria-label="Position alongside CEGIS">
              <div className="desk-eyebrow">WORKS ALONGSIDE CEGIS · NOT INSTEAD OF IT</div>
              <h3>The annual prediction already exists. This desk fills the 12 days between.</h3>
              <p>
                CEGIS has published annual Jamuna erosion predictions since <strong>2004</strong> — multi-decadal bankline history,
                vulnerable reaches classed at 70 / 50 / 30% probability, checked retrospectively each year, and used by BWDB.
                FluviSAR does not compete with that and does not predict erosion. Its job is narrower and newer:
                <strong> 12-day, cloud-independent NISAR screening inside the season</strong>, between CEGIS cycles — grouping fresh
                candidates into visitable sites and closing the loop with field verification. Freihardt &amp; Frey (2023, NHESS)
                showed real Jamuna erosion also occurs <em>outside</em> the previous CEGIS hotspot map — exactly the gap a
                within-season triage exists to catch.
              </p>
            </div>
          </section>
        )}

        {/* ════ 4 · Map view ════ */}
        {view === 'map' && (
          <section className="dd4-view dd4-view-map" aria-label="NISAR map">
            <div className="desk-map-frame dd4-map-frame">
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
                onSelectFeature={(id) => focusCandidate(id, siteOfFeature.get(id)?.id)}
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
              <div className="dd4-threshold">
                <div className="dd4-threshold-head">
                  <span>THRESHOLD SENSITIVITY</span>
                  <Stamp kind="derived" title="Reading of the manifest range, not a re-run">DERIVED · MANIFEST</Stamp>
                </div>
                <label htmlFor="dd-threshold-slider">Water threshold perturbation <strong>{thresholdDb > 0 ? '+' : ''}{thresholdDb.toFixed(1)} dB</strong></label>
                <input id="dd-threshold-slider" type="range" min={-1} max={1} step={0.1} value={thresholdDb} onChange={(e) => setThresholdDb(Number(e.target.value))} />
                <div className="dd-threshold-read">
                  <span>Land→water candidates at this threshold:</span>
                  <strong>{formatNumber(sliderArea, 0)} ha</strong>
                  <span className="dd-threshold-range">published range {formatNumber(erosionMetric?.low, 0)} ha (−1 dB) · {formatNumber(erosionMetric?.value, 0)} ha (as run) · {formatNumber(erosionMetric?.high, 0)} ha (+1 dB) — the range is the headline; it spans ~4.8×.</span>
                </div>
              </div>
              <div className="dd4-passes" aria-label="Observed passes">
                <span className="dd4-passes-label" title="Observed passes · same relative orbit">PASSES</span>
                {bundle.reach.dates.map((date) => (
                  <button key={date.date} className={selectedDate === date.date ? 'selected' : ''} onClick={() => setSelectedDate(date.date)} title={date.status === 'ok' ? `L-band HH · ${date.stage_source === 'proxy' ? 'stage proxy' : 'gauge stage'} · ${date.acq_utc.slice(11, 16)} UTC` : `not used · ${date.status}`}>
                    <strong>{formatDate(date.date)}</strong>
                    <small>{date.status === 'ok' ? `HH · ${date.stage_source === 'proxy' ? 'proxy' : 'gauge'} · ${date.acq_utc.slice(11, 16)} UTC` : `not used · ${date.status}`}</small>
                  </button>
                ))}
                {passDates.length >= 2 && (
                  <button className={`desk-play ${playing ? 'on' : ''}`} onClick={() => setPlaying(!playing)} aria-label={playing ? 'Stop time series' : 'Play time series'}>
                    {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? 'Pause' : 'Cycle'}
                  </button>
                )}
              </div>
            </div>
            <div className="desk-map-legend dd4-legend">
              <span><i className="l-erosion" /> Land → water candidate</span>
              <span><i className="l-accretion" /> Water → land candidate</span>
              <span><i className="l-selected" /> Selected</span>
              <span><i className="l-site" /> Investigation site anchor</span>
              <span className="dd-map-note">Candidates drawn: top 24 per class · drag the divider inside the map to compare passes · OPERA layer predates the pair — context only</span>
            </div>
          </section>
        )}

        {/* ════ 5 · Sites view ════ */}
        {view === 'sites' && (
          <section className={`dd4-view dd4-view-sites ${judgeStep === 2 ? 'is-judge-focus' : ''}`} id="desk-sites" aria-label="Investigation sites">
            <div className="dd4-view-head">
              <div>
                <div className="section-label">Investigation sites</div>
                <h2 className="dd4-view-title">Named places a team can actually go.</h2>
                <p className="dd4-view-lede">{candidates.length.toLocaleString()} candidates, grouped deterministically from bundle centroids into {sites.length} visitable sites. Every original candidate id stays listed inside its site — grouping organises the work, it never deletes evidence.</p>
              </div>
              <div className="dd4-seg" role="tablist" aria-label="Sites or screening list">
                <button role="tab" aria-selected={leftTab === 'sites'} className={leftTab === 'sites' ? 'active' : ''} onClick={() => setLeftTab('sites')}><MapPin size={12} /> Sites · {sites.length}</button>
                <button role="tab" aria-selected={leftTab === 'screening'} className={leftTab === 'screening' ? 'active' : ''} onClick={() => setLeftTab('screening')}><ClipboardList size={12} /> Screening · 24</button>
              </div>
            </div>

            {leftTab === 'sites' && (
              <>
                <div className="dd4-sites-toolbar">
                  <div className="dd4-sites-filters">
                    <div className="desk-search dd4-search-inline">
                      <input
                        value={siteQuery}
                        onChange={(e) => { setSiteQuery(e.target.value); setSitePage(1); }}
                        placeholder="Search sites — ID, reach, anchor, GPS…"
                        aria-label="Filter investigation sites"
                      />
                    </div>
                    <div className="dd4-status-filter-pills" role="radiogroup" aria-label="Status filter">
                      {(['all', 'unreviewed', 'workflow', 'verified'] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          className={`dd4-filter-pill ${siteStatusFilter === filter ? 'active' : ''}`}
                          onClick={() => { setSiteStatusFilter(filter); setSitePage(1); }}
                        >
                          {filter === 'all' && `All (${sites.length})`}
                          {filter === 'unreviewed' && `Unreviewed (${sites.filter(s => s.members.every(f => statusOf(f) === 'UNREVIEWED')).length})`}
                          {filter === 'workflow' && `In Workflow (${sites.filter(s => s.members.some(f => statusOf(f) !== 'UNREVIEWED') && s.members.every(f => statusOf(f) !== 'VERIFIED')).length})`}
                          {filter === 'verified' && `Verified (${sites.filter(s => s.members.some(f => statusOf(f) === 'VERIFIED')).length})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="dd4-sites-view-toggle">
                    <button
                      type="button"
                      className={`dd4-toggle-btn ${siteViewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setSiteViewMode('table')}
                      title="Switch to Table View"
                    >
                      <Table2 size={13} />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      className={`dd4-toggle-btn ${siteViewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setSiteViewMode('grid')}
                      title="Switch to Card Grid View"
                    >
                      <LayoutGrid size={13} />
                      <span>Grid</span>
                    </button>
                  </div>
                </div>

                {siteViewMode === 'table' ? (
                  <div className="dd4-table-wrapper">
                    <table className="dd4-sites-table" aria-label="Investigation Sites Table">
                      <thead>
                        <tr>
                          <th onClick={() => { setSiteSortBy('id'); setSiteSortDir(siteSortDir === 'asc' ? 'desc' : 'asc'); }} className="sortable">
                            Site ID {siteSortBy === 'id' && (siteSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th>River Reach</th>
                          <th onClick={() => { setSiteSortBy('area'); setSiteSortDir(siteSortDir === 'asc' ? 'desc' : 'asc'); }} className="sortable">
                            Grouped Area {siteSortBy === 'area' && (siteSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => { setSiteSortBy('members'); setSiteSortDir(siteSortDir === 'asc' ? 'desc' : 'asc'); }} className="sortable">
                            Polygons {siteSortBy === 'members' && (siteSortDir === 'asc' ? '↑' : '↓')}
                          </th>
                          <th>Field Anchor &amp; GPS</th>
                          <th>Verification Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedSites.map((site) => {
                          const verifiedInSite = site.members.filter((f) => statusOf(f) === 'VERIFIED').length;
                          const taskedInSite = site.members.filter((f) => statusOf(f) !== 'UNREVIEWED').length;
                          const statusLabel = verifiedInSite > 0 ? `${verifiedInSite} VERIFIED` : taskedInSite > 0 ? 'IN WORKFLOW' : 'UNREVIEWED';
                          const statusClass = verifiedInSite > 0 ? 'is-pass' : taskedInSite > 0 ? 'is-warn' : 'is-off';

                          return (
                            <tr
                              key={site.id}
                              onClick={() => setSiteModalSite(site)}
                              className="dd4-table-row"
                              title="Click row to open site details popup"
                            >
                              <td>
                                <div className="dd4-t-site-id">
                                  <span className="dd4-t-dot" />
                                  <strong>{site.id}</strong>
                                </div>
                              </td>
                              <td>
                                <span className="dd4-t-reach">{site.reachPart}</span>
                              </td>
                              <td>
                                <span className="dd4-t-area">{formatNumber(site.totalArea)} <small>ha</small></span>
                              </td>
                              <td>
                                <div className="dd4-t-members">
                                  <span>{site.members.length} polygons</span>
                                  <small>{site.erosionCount} L→W · {site.accretionCount} W→L</small>
                                </div>
                              </td>
                              <td>
                                <div className="dd4-t-anchor">
                                  <span>{formatCoord(site.centroid)}</span>
                                  <small>Anchor {site.anchorId}</small>
                                </div>
                              </td>
                              <td>
                                <span className={`dd4-t-badge ${statusClass}`}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className="dd4-t-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSiteModalSite(site);
                                  }}
                                >
                                  <span>Details</span> <ArrowUpRight size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="dd4-site-grid">
                    {pagedSites.map((site, i) => {
                      const verifiedInSite = site.members.filter((f) => statusOf(f) === 'VERIFIED').length;
                      const taskedInSite = site.members.filter((f) => statusOf(f) !== 'UNREVIEWED').length;
                      const anchorStatus = statusOf(site.members.find((f) => String(f.properties.id) === site.anchorId) ?? site.members[0]);
                      const stripColor = verifiedInSite > 0 ? 'var(--pass)' : taskedInSite > 0 ? 'var(--water)' : 'var(--na)';
                      const open = expandedSite === site.id;
                      return (
                        <article key={site.id} className={`dd4-site-card ${selSite?.id === site.id ? 'selected' : ''}`} style={{ ['--i' as string]: i }}>
                          <span className="dd4-site-strip" style={{ background: stripColor }} aria-hidden="true" />
                          <button className="dd4-site-main" onClick={() => setSiteModalSite(site)}>
                            <span className="dd4-site-top">
                              <strong className="dd4-site-id">{site.id}</strong>
                              <span className="dd4-site-verdict" style={{ color: stripColor, borderColor: `${stripColor}66`, background: `${stripColor}14` }}>{verifiedInSite > 0 ? `${verifiedInSite} VERIFIED` : taskedInSite > 0 ? 'IN WORKFLOW' : 'UNREVIEWED'}</span>
                            </span>
                            <span className="dd4-site-reach">{site.reachPart}</span>
                            <span className="dd4-site-area">{formatNumber(site.totalArea)} <small>ha grouped</small></span>
                            <span className="dd4-site-meta">{site.members.length} candidates · {site.erosionCount} land→water · {site.accretionCount} water→land</span>
                            <span className="dd4-site-meta">anchor {site.anchorId} · {formatCoord(site.centroid)}</span>
                            <span className="dd4-site-maturity">{maturityHeadline(records[site.anchorId] ?? EMPTY_RECORD)} · anchor status: {STATUS_LABEL[persona][anchorStatus]}</span>
                            <span className="dd4-site-cta">Inspect Details <ArrowUpRight size={13} /></span>
                          </button>
                          <button className="dd4-site-expand" onClick={() => setExpandedSite(open ? null : site.id)} aria-expanded={open}>
                            {open ? 'Hide members' : `Members (${site.members.length})`}
                          </button>
                          {open && (
                            <div className="dd-site-members">
                              {site.members.slice(0, 12).map((f) => {
                                const id = String(f.properties.id);
                                return (
                                  <button key={id} className={`dd-member ${selectedFeatureId === id ? 'selected' : ''}`} onClick={() => { setSelectedSiteId(site.id); focusCandidate(id, site.id); }}>
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
                )}

                {filteredSites.length === 0 && (
                  <p className="dd4-empty">No investigation site matches your filter.</p>
                )}

                {/* Pagination Controls */}
                <div className="dd4-pagination">
                  <span className="dd4-page-info">
                    Showing <strong>{filteredSites.length === 0 ? 0 : (sitePage - 1) * SITES_PER_PAGE + 1}</strong>–<strong>{Math.min(sitePage * SITES_PER_PAGE, filteredSites.length)}</strong> of <strong>{filteredSites.length}</strong> sites
                  </span>

                  <div className="dd4-page-controls">
                    <button
                      type="button"
                      className="dd4-page-btn"
                      disabled={sitePage <= 1}
                      onClick={() => setSitePage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>

                    {Array.from({ length: totalSitePages }, (_, idx) => idx + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        className={`dd4-page-num ${sitePage === pg ? 'active' : ''}`}
                        onClick={() => setSitePage(pg)}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="dd4-page-btn"
                      disabled={sitePage >= totalSitePages}
                      onClick={() => setSitePage((p) => Math.min(totalSitePages, p + 1))}
                      aria-label="Next page"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="dd4-sites-foot">
                  <span><strong>{verifiedCount}</strong> candidates field-verified (reviewed)</span>
                  <span><strong>{taskedCount}/24</strong> screening candidates tasked or beyond</span>
                  <details className="dd4-method">
                    <summary>Grouping method · why there is no score</summary>
                    <p className="dd-method">
                      Grouping method (deterministic, from bundle centroids): the 24 screening anchors, in area order, each claim every
                      still-unclaimed candidate within <strong>{SITE_RADIUS_M.toLocaleString()} m</strong> (haversine); the largest anchor wins ties.
                      Every original candidate id stays listed inside its site — grouping organises the work, it never deletes evidence.
                      {' '}{sitesResult.unassignedCount.toLocaleString()} candidates lie outside every site radius and remain in the full ledger.
                      <strong> There is no composite score on this desk, by design:</strong> a mapped change earns a ranking signal only when
                      its magnitude exceeds the pair’s measurement / co-registration uncertainty (Level-of-Detection logic), and that gate
                      is not yet evaluated in this bundle — so orders here are labelled screening orders, never risk rankings.
                      Display order: largest grouped transition area first — a screening order, not a risk ranking.
                    </p>
                  </details>
                </div>
              </>
            )}

            {leftTab === 'screening' && (
              <div className="dd4-screening" id="desk-queue">
                <div className="dd4-screening-head">
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
                <div className="dd4-qgrid">
                  {queue.map((feature, i) => {
                    const id = String(feature.properties.id);
                    const st = statusOf(feature);
                    const site = siteOfFeature.get(id);
                    return (
                      <button key={id} className={`dd-qcard ${selectedFeatureId === id ? 'selected' : ''}`} onClick={() => focusCandidate(id, site?.id)}>
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
                          <button key={id} className={`desk-row ${selectedFeatureId === id ? 'selected' : ''}`} onClick={() => focusCandidate(id, siteOfFeature.get(id)?.id)}>
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
            )}
          </section>
        )}

        {/* ════ 6 · Evidence view ════ */}
        {view === 'evidence' && (
          <section className="dd4-view dd4-view-evidence" id="desk-drawer" aria-label="Evidence for the selected candidate">
            {selSite && selected && (
              <div className="dd4-case-head">
                <div className="dd4-case-site">
                  <span className="desk-eyebrow-soft">INVESTIGATION SITE</span>
                  <strong>{selSite.id} · {selSite.reachPart}</strong>
                  <small>{selSite.members.length} candidates · {formatNumber(selSite.totalArea)} ha grouped · anchor {selSite.anchorId} · centroid {formatCoord(selSite.centroid)}</small>
                </div>
                <div className="dd4-case-cand">
                  <span className={`row-swatch ${selected.properties.class}`} />
                  <span className="dd4-case-cand-main">
                    <strong>{selId}</strong>
                    <small>{CLASS_LABEL[persona][selected.properties.class]} · {selected.properties.area_ha.toFixed(2)} ha · member of {selSite.id}</small>
                  </span>
                  <span className="desk-tag is-warn">{selRecord.status === 'VERIFIED' ? 'FIELD-VERIFIED (REVIEWED)' : 'UNVERIFIED'}</span>
                </div>
              </div>
            )}

            <div className="dd4-evidence-grid">
              <div className="dd4-evidence-col">
                {selected && centroidOf && (
                  <>
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

                    <div className="dd-attr" aria-label="Change attribution — competing explanations">
                      <div className="dd-attr-head">
                        <strong>WHY THIS CANDIDATE EXISTS · COMPETING EXPLANATIONS</strong>
                        <p>Unresolved physical interpretation — no hypothesis is confirmed by a two-date bundle. Each standing below is computed from this run’s QC checks and this candidate’s field record; nothing is scored or weighted.</p>
                      </div>
                      <div className="dd-attr-strip" aria-label="How this candidate was produced — run level">
                        <div>
                          <span>CLASS RULE</span>
                          <strong>{selected.properties.class === 'erosion'
                            ? 'Land → water: classified water at t1, not water at t0'
                            : 'Water → land: classified land at t1, water at t0'}</strong>
                        </div>
                        <div>
                          <span>CLASSIFICATION INPUTS · RUN LEVEL</span>
                          <strong>Otsu thresholds {thresholds?.threshold_db_t0 != null ? `${thresholds.threshold_db_t0.toFixed(2)} dB (t0) → ${thresholds.threshold_db_t1?.toFixed(2)} dB (t1)` : '—'} · median filter {thresholds?.median_filter ?? '—'} · MMU {thresholds?.mmu_px ?? '—'} px · HAND ≤ {thresholds?.hand_max_m ?? '—'} m</strong>
                        </div>
                        <div>
                          <span>PAIR</span>
                          <strong>{formatDate(selected.properties.t0)} → {formatDate(selected.properties.t1)} · NISAR GCOV HH — single polarisation</strong>
                        </div>
                        <div>
                          <span>PIXEL CROSS-CHECK</span>
                          <strong>{selected.properties.pixel_count} px × {pixelAreaM2} m² = {selPxHa.toFixed(2)} ha vs mapped {selected.properties.area_ha.toFixed(2)} ha — {Math.abs(selPxHa - selected.properties.area_ha) <= 0.05 ? 'agrees' : `differs by ${Math.abs(selPxHa - selected.properties.area_ha).toFixed(2)} ha; the mapped area_ha is the figure of record`}</strong>
                        </div>
                        <p className="dd-attr-note">Per-candidate backscatter values are not carried in this bundle — classification inputs are shown at run level.</p>
                      </div>
                      <div className="dd-attr-rows">
                        {selAttribution.map((row) => (
                          <div key={row.id} className="dd-attr-row">
                            <div className="dd-attr-hyp">
                              <strong>{row.hypothesis}</strong>
                              <span className="dd-attr-standing">{row.standing}</span>
                            </div>
                            <p className="dd-attr-reason">{row.reason}</p>
                            <div className="dd-attr-sk">
                              <p><b>WHAT WOULD SUPPORT IT</b>{row.support}</p>
                              <p><b>WHAT WOULD KILL IT</b>{row.kill}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="dd4-evidence-col">
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

                <div className="dd-readiness" aria-label="Decision readiness">
                  <div className="dd4-readiness-head">
                    <span className="desk-eyebrow"><ShieldAlert size={13} /> DECISION READINESS · WHY WE CANNOT CONCLUDE — GATE BY GATE</span>
                    <strong className="dd4-readiness-title">Every gate, its status, and exactly what it blocks.</strong>
                    <span className="dd4-readiness-meta"><strong>{failedChecks}</strong> failed · <strong>{warningChecks}</strong> warned · <strong>{notEvaluated}</strong> not evaluated</span>
                    <span className="dd4-readiness-meta">NOT EVALUATED means the evidence does not exist yet — it is never a pass.</span>
                  </div>
                  <div className="dd-ready-table" role="table" aria-label="QC gates and consequences">
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
                </div>
              </div>
            </div>

            <div className="dd4-prov">
              <span className="desk-eyebrow-soft">PROVENANCE · THIS RUN</span>
              <p>Granules: {(erosionMetric?.inputs ?? []).map((i) => i.granule ?? '').filter(Boolean).join(' · ') || 'see manifest'}</p>
              <p>Product: NISAR L2 GCOV Provisional (CRID P05023) — calibrated, validation ongoing, RFI-screened · Otsu thresholds {thresholds?.threshold_db_t0 != null ? `${thresholds.threshold_db_t0.toFixed(2)} dB → ${thresholds.threshold_db_t1?.toFixed(2)} dB` : '—'} · median filter {thresholds?.median_filter ?? '—'} · MMU {thresholds?.mmu_px ?? '—'} px · HAND ≤ {thresholds?.hand_max_m ?? '—'} m · grid EPSG:32645 · pixel {erosionMetric?.pixel_area_m2 ?? '—'} m²</p>
              <p>Context: GPM IMERG rainfall (doi 10.5067/GPM/IMERGDL/DAY/07) · OPERA DSWx-S1 (NASA/JPL, layer acquired 17 Jun 2026 — pre-pair context) · stage: bundle proxy (no gauge) · FFWC bulletin context dated 14 Oct 2026 · <a href="/methods">Methods &amp; provenance <ChevronRight size={11} /></a></p>
            </div>
          </section>
        )}

        {/* ════ 7 · Field view ════ */}
        {view === 'field' && (
          <section className={`dd4-view dd4-view-field ${judgeStep === 3 ? 'is-judge-focus' : ''}`} aria-label="Field verification">
            <div className="dd4-view-head">
              <div>
                <div className="section-label">Field verification</div>
                <h2 className="dd4-view-title">Status is a verb — with an owner and a review.</h2>
                <p className="dd4-view-lede">
                  {selected ? <>{selId} · {selSite ? `${selSite.id} · ` : ''}current status: <strong>{STATUS_LABEL[persona][selRecord.status]}</strong>. </> : null}
                  A field visit records an observation; only a reviewer’s recorded conclusion can verify. There is no one-click verify on this desk.
                </p>
              </div>
              <div className="dd4-seg" role="tablist" aria-label="Field workflow or artefacts">
                <button role="tab" aria-selected={rightTab !== 'pack'} className={rightTab !== 'pack' ? 'active' : ''} onClick={() => setRightTab('field')}>Field workflow</button>
                <button role="tab" aria-selected={rightTab === 'pack'} className={rightTab === 'pack' ? 'active' : ''} onClick={() => setRightTab('pack')}>Pack &amp; brief</button>
              </div>
            </div>

            {selSite && (
              <div className="dd4-objective" aria-label={`Survey objective for ${selSite.id}`}>
                <div className="dd4-objective-head">
                  <span className="desk-eyebrow"><Crosshair size={13} /> SURVEY OBJECTIVE · {selSite.id} · GENERATED FROM BUNDLE DATA</span>
                  <Stamp kind="derived">DERIVED · templated from site + QC state — not a damage assessment</Stamp>
                </div>
                <p>{objectiveFor(selSite)}</p>
              </div>
            )}

            {rightTab !== 'pack' && selected && (
              <>
                <ol className="dd4-stepper" aria-label="Field verification lifecycle">
                  {(['UNREVIEWED', 'TASKED', 'MONITORING', 'OBSERVATION_RECEIVED', 'REVIEWED'] as const).map((stepLabel, i) => {
                    const order = ['UNREVIEWED', 'TASKED', 'MONITORING', 'OBSERVATION_RECEIVED', 'VERIFIED'];
                    const current = selRecord.status === 'REJECTED' ? 4 : Math.max(order.indexOf(selRecord.status), 0);
                    const state = i < current ? 'done' : i === current ? 'current' : 'todo';
                    return (
                      <li key={stepLabel} className={`dd4-step is-${state}`}>
                        <span className="dd4-step-n">{i + 1}</span>
                        <span className="dd4-step-label">{stepLabel.replace(/_/g, ' ')}</span>
                        {i === 4 && selRecord.status === 'VERIFIED' && <span className="dd4-step-out is-verified">VERIFIED</span>}
                        {i === 4 && selRecord.status === 'REJECTED' && <span className="dd4-step-out is-rejected">REJECTED</span>}
                        {i === 4 && selRecord.status !== 'VERIFIED' && selRecord.status !== 'REJECTED' && <span className="dd4-step-out">VERIFIED / REJECTED</span>}
                      </li>
                    );
                  })}
                </ol>

                <div className="dd4-panel dd4-field-panel">
                  <div className="dd-lifecycle">
                    <strong className="dd-lifecycle-title"><ClipboardList size={15} /> FIELD VERIFICATION · {selId}</strong>
                    <div className="dd-lifecycle-flow">
                      <code>UNREVIEWED → TASKED → MONITORING → OBSERVATION RECEIVED → REVIEWED → VERIFIED / REJECTED / back to MONITORING</code>
                      <span>A field visit records an observation; only a reviewer’s recorded conclusion can verify. There is no one-click verify on this desk.</span>
                    </div>
                    {(selRecord.status === 'UNREVIEWED' || selRecord.status === 'TASKED' || selRecord.status === 'MONITORING') && (
                      <>
                        <div className="dd-obs-card dd-tasking-card">
                          <div className="dd-obs-header">
                            <div className="dd-obs-header-left">
                              <span className="dd-obs-badge dd-tasking-badge">
                                <ClipboardList size={12} /> PHASE 1 · LIFECYCLE TASKING &amp; DISPATCH
                              </span>
                              <h4 className="dd-obs-title">Task Verification or Triage</h4>
                              <p className="dd-obs-subtitle">
                                Assign field enumerator roles, schedule verification deadlines, or triage candidate <strong>{selId}</strong> for next satellite pass.
                              </p>
                            </div>
                            <span className="dd-obs-target-pill">Status: {selRecord.status}</span>
                          </div>

                          <div className="dd-obs-grid">
                            <div className="dd-field-group">
                              <label className="dd-field-label">
                                <span className="dd-fl-left">
                                  <UserCheck size={14} className="dd-field-icon" /> Task Owner / Institutional Role
                                </span>
                              </label>
                              <div className="dd-input-wrap">
                                <input
                                  type="text"
                                  className="dd-field-input"
                                  value={selRecord.owner}
                                  onChange={(e) => patchRecord({ owner: e.target.value })}
                                  placeholder="e.g. Upazila field officer / BWDB sub-divisional surveyor"
                                />
                              </div>
                            </div>

                            <div className="dd-field-group">
                              <label className="dd-field-label">
                                <span className="dd-fl-left">
                                  <CalendarClock size={15} strokeWidth={2.2} className="dd-field-icon" /> Verification Deadline
                                </span>
                              </label>
                              <div className="dd-input-wrap">
                                <input
                                  type="date"
                                  className="dd-field-input dd-date-input"
                                  value={selRecord.deadline}
                                  onChange={(e) => patchRecord({ deadline: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="dd-field-group dd-field-full">
                              <label className="dd-field-label">
                                <span className="dd-fl-left">
                                  <AlertCircle size={14} className="dd-field-icon" /> Dismiss Reason (Required to Dismiss)
                                </span>
                              </label>
                              <div className="dd-input-wrap">
                                <input
                                  type="text"
                                  className="dd-field-input"
                                  value={selRecord.dismissReason}
                                  onChange={(e) => patchRecord({ dismissReason: e.target.value })}
                                  placeholder="e.g. Re-flooded on next pass — stage emergence (resolves candidate)"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="dd-tasking-footer">
                            <button className="desk-btn primary" onClick={doTask}>
                              <ClipboardList size={14} /> Task Field Verification
                            </button>
                            <button className="desk-btn secondary" onClick={doMonitor}>
                              <Eye size={14} /> Monitor Next Pass
                            </button>
                            <button className="desk-btn ghost" onClick={doDismiss}>
                              <X size={14} /> Dismiss Candidate
                            </button>
                          </div>
                        </div>

                        <div className="dd-obs-card">
                          <div className="dd-obs-header">
                            <div className="dd-obs-header-left">
                              <span className="dd-obs-badge">
                                <Radio size={12} className="dd-pulse-icon" /> PHASE 2 · GROUND-TRUTH FIELD OBSERVATION
                              </span>
                              <h4 className="dd-obs-title">Record a Field Observation</h4>
                              <p className="dd-obs-subtitle">
                                Input verified physical bank condition notes &amp; photos to close candidate <strong>{selId}</strong>.
                              </p>
                            </div>
                            <span className="dd-obs-target-pill">Target Candidate: {selId}</span>
                          </div>

                          <div className="dd-obs-grid">
                            <div className="dd-field-group">
                              <label className="dd-field-label">
                                <span className="dd-fl-left">
                                  <UserCheck size={14} className="dd-field-icon" /> Observer Role
                                </span>
                                <span className="dd-field-req">Required</span>
                              </label>
                              <div className="dd-input-wrap">
                                <input
                                  type="text"
                                  className="dd-field-input"
                                  value={obsRole}
                                  onChange={(e) => setObsRole(e.target.value)}
                                  placeholder="e.g. NGO field enumerator / BWDB engineer"
                                />
                              </div>
                            </div>

                            <div className="dd-field-group">
                              <label className="dd-field-label">
                                <span className="dd-fl-left">
                                  <CalendarClock size={15} strokeWidth={2.2} className="dd-field-icon" /> Observation Time
                                </span>
                              </label>
                              <div className="dd-input-wrap">
                                <input
                                  type="datetime-local"
                                  className="dd-field-input dd-date-input"
                                  value={obsAt}
                                  onChange={(e) => setObsAt(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="dd-field-group">
                              <label className="dd-field-label">
                                <span className="dd-fl-left">
                                  <MapPin size={14} className="dd-field-icon" /> GPS / Position Note
                                </span>
                              </label>
                              <div className="dd-input-wrap">
                                <input
                                  type="text"
                                  className="dd-field-input"
                                  value={obsGps}
                                  onChange={(e) => setObsGps(e.target.value)}
                                  placeholder="e.g. Stood at anchor point, ±5 m"
                                />
                              </div>
                            </div>

                            <div className="dd-field-group">
                              <label className="dd-field-label">
                                <span className="dd-fl-left">
                                  <Compass size={14} className="dd-field-icon" /> Observed Bank Condition
                                </span>
                              </label>
                              <div className="dd-input-wrap dd-select-wrap">
                                <select
                                  className="dd-field-select"
                                  value={obsCondition}
                                  onChange={(e) => setObsCondition(e.target.value as BankCondition)}
                                >
                                  <option value="erosion">Active erosion / fresh scarp</option>
                                  <option value="deposition">Fresh deposition</option>
                                  <option value="stable">Bank stable</option>
                                  <option value="uncertain">Uncertain / could not reach</option>
                                </select>
                              </div>
                            </div>

                            <div className="dd-field-group dd-field-full">
                              <label className="dd-field-label">
                                <span className="dd-fl-left">
                                  <Camera size={14} className="dd-field-icon" /> Photo Reference / Survey Tag
                                </span>
                              </label>
                              <div className="dd-input-wrap">
                                <input
                                  type="text"
                                  className="dd-field-input"
                                  value={obsPhoto}
                                  onChange={(e) => setObsPhoto(e.target.value)}
                                  placeholder="e.g. IMG_2041–2043 (field phone survey brief)"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="dd-obs-footer">
                            <button
                              type="button"
                              className="dd-obs-submit-btn"
                              onClick={doObservation}
                            >
                              <Send size={15} />
                              <span>Record Observation</span>
                              <span className="dd-btn-tag">→ OBSERVATION RECEIVED</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                    {selRecord.status === 'OBSERVATION_RECEIVED' && selRecord.observation && (
                      <div className="dd-obs-card is-review">
                        <div className="dd-obs-header">
                          <div className="dd-obs-header-left">
                            <span className="dd-obs-badge is-review">
                              <ShieldCheck size={12} /> OBSERVATION ON RECORD
                            </span>
                            <h4 className="dd-obs-title">Observation Awaiting Review</h4>
                            <p className="dd-obs-subtitle">
                              Recorded by <strong>{selRecord.observation.observerRole}</strong> at {formatDate(selRecord.observation.observedAt)}.
                            </p>
                          </div>
                          <span className="dd-obs-target-pill is-review">Condition: {selRecord.observation.bankCondition.toUpperCase()}</span>
                        </div>

                        <div className="dd-obs-summary-box">
                          <div className="dd-obs-summary-item">
                            <span>Observer:</span>
                            <strong>{selRecord.observation.observerRole}</strong>
                          </div>
                          <div className="dd-obs-summary-item">
                            <span>Condition:</span>
                            <strong className={`status-${selRecord.observation.bankCondition}`}>{selRecord.observation.bankCondition}</strong>
                          </div>
                          {selRecord.observation.gpsNote && (
                            <div className="dd-obs-summary-item">
                              <span>GPS Note:</span>
                              <strong>{selRecord.observation.gpsNote}</strong>
                            </div>
                          )}
                          {selRecord.observation.photoRef && (
                            <div className="dd-obs-summary-item">
                              <span>Photos:</span>
                              <strong>{selRecord.observation.photoRef}</strong>
                            </div>
                          )}
                        </div>

                        <div className="dd-obs-grid">
                          <div className="dd-field-group">
                            <label className="dd-field-label">
                              <span className="dd-fl-left">Reviewer Conclusion</span>
                            </label>
                            <div className="dd-input-wrap dd-select-wrap">
                              <select
                                className="dd-field-select"
                                value={revConclusion}
                                onChange={(e) => setRevConclusion(e.target.value as ReviewConclusion)}
                              >
                                <option value="CORROBORATES">Corroborates the candidate</option>
                                <option value="CONTRADICTS">Contradicts the candidate</option>
                                <option value="UNRESOLVED">Unresolved — keep monitoring</option>
                              </select>
                            </div>
                          </div>
                          <div className="dd-field-group">
                            <label className="dd-field-label">
                              <span className="dd-fl-left">Reviewer Role</span>
                              <span className="dd-field-req">Required</span>
                            </label>
                            <input
                              type="text"
                              className="dd-field-input"
                              value={revRole}
                              onChange={(e) => setRevRole(e.target.value)}
                              placeholder="e.g. BWDB sub-divisional engineer"
                            />
                          </div>
                          <div className="dd-field-group dd-field-full">
                            <label className="dd-field-label">
                              <span className="dd-fl-left">Reason / Decision Basis</span>
                              <span className="dd-field-req">Required</span>
                            </label>
                            <input
                              type="text"
                              className="dd-field-input"
                              value={revReason}
                              onChange={(e) => setRevReason(e.target.value)}
                              placeholder="What in the field observation decides this conclusion?"
                            />
                          </div>
                        </div>

                        <div className="dd-obs-footer">
                          <button
                            type="button"
                            className="dd-obs-submit-btn"
                            onClick={doReview}
                          >
                            <Check size={15} />
                            <span>Confirm &amp; Record Review</span>
                          </button>
                        </div>
                      </div>
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

                  <div className="dd4-audit">
                    <strong className="dd4-audit-header">
                      <ShieldAlert size={13} />
                      AUDIT LOG ({audit.length} entr{audit.length === 1 ? 'y' : 'ies'}) — local to this browser, labelled local-only
                    </strong>
                    {audit.length === 0 ? <p className="dd4-audit-empty">No lifecycle decisions recorded yet in this browser.</p> : (
                      <ul className="dd4-audit-list">
                        {audit.slice(0, 30).map((a, i) => (
                          <li key={i} className="dd4-audit-item">
                            <span className="dd4-audit-ts">{a.ts}</span>
                            <span className="dd4-audit-id">{a.featureId}</span>
                            <span className="dd4-audit-action">{a.action}</span>
                            <span className="dd4-audit-detail">{a.detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="dd4-field-actions">
                  <button className="dd4-cta-primary" onClick={() => { setRightTab('pack'); printSheet('pack'); }}><Printer size={15} /> Print Investigation Pack{selSite ? ` · ${selSite.id}` : ''}</button>
                  <button className="dd4-cta-ghost" onClick={() => { setRightTab('pack'); printSheet('brief'); }}><Printer size={15} /> Print Field Verification Brief</button>
                </div>
              </>
            )}

            {rightTab === 'pack' && (
              <div className="dd4-artefacts">
                {selSite && (
                  <section className={`dd-pack ${printTarget === 'pack' ? 'is-print-target' : ''}`} id="desk-pack" aria-label="Investigation pack">
                    <div className="dd-brief-top">
                      <div>
                        <div className="desk-eyebrow"><Package size={13} /> THE ARTEFACT YOU LEAVE WITH</div>
                        <h3>Investigation Pack · {selSite.id}</h3>
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
                      <div className="dd-sheet-objective">
                        <strong>SURVEY OBJECTIVE — GENERATED FROM BUNDLE DATA · NOT A DAMAGE ASSESSMENT</strong>
                        <p>{objectiveFor(selSite)}</p>
                      </div>
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

                <section className={`dd-brief ${printTarget === 'brief' ? 'is-print-target' : ''}`} id="desk-brief" aria-label="Field verification brief">
                  <div className="dd-brief-top">
                    <div>
                      <div className="desk-eyebrow"><Printer size={13} /> THE RUN-LEVEL ARTEFACT</div>
                      <h3>Field Verification Brief</h3>
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
              </div>
            )}
          </section>
        )}

        {/* ════ 8 · Bulletin view ════ */}
        {view === 'bulletin' && (
          <section className="dd4-view dd4-view-bulletin" aria-label="Community evidence bulletin">
            <section className={`dd-bulletin ${printTarget === 'bulletin' ? 'is-print-target' : ''}`} id="desk-bulletin" aria-label="Community evidence bulletin">
              <div className="dd-brief-top">
                <div>
                  <div className="desk-eyebrow"><Printer size={13} /> COMMUNITY EVIDENCE BULLETIN</div>
                  <h3>For the Union Parishad, Chilmari — print and pin it.</h3>
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
          </section>
        )}

        {/* ════ 9 · Footer ════ */}
        <footer className="dd4-footer">
          <span className="dd4-footer-mark">FLUVISAR · EVIDENCE FIRST</span>
          <span>Decision Desk only: look → verify → issue. Records stay in this browser; print the brief or a site pack for the field handoff.</span>
          <a href="/methods">Methods &amp; provenance <ChevronRight size={13} /></a>
        </footer>

        {/* ── Platform Tour HUD ── */}
        {judgeStep > 0 && (
          <div className="dd4-tour-hud" role="dialog" aria-label="Platform Tour">
            <div className="dd4-tour-hud-header">
              <div className="dd4-tour-hud-badge">
                <span className="dd4-tour-pulse-dot" />
                <span>PLATFORM WALKTHROUGH · {TOUR_STEPS[judgeStep - 1]?.badge}</span>
              </div>
              <div className="dd4-tour-hud-progress">
                {[1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`dd4-tour-step-bar ${s === judgeStep ? 'active' : s < judgeStep ? 'done' : ''}`}
                    onClick={() => tourGo(s)}
                    title={`Go to step ${s}`}
                  />
                ))}
              </div>
              <button className="dd4-tour-hud-close" onClick={() => setJudgeStep(0)} aria-label="Close tour">
                <X size={15} />
              </button>
            </div>

            <div className="dd4-tour-hud-body">
              <h4 className="dd4-tour-hud-title">{TOUR_STEPS[judgeStep - 1]?.title}</h4>
              <p className="dd4-tour-hud-text">{TOUR_STEPS[judgeStep - 1]?.text}</p>
            </div>

            <div className="dd4-tour-hud-actions">
              <button
                className="desk-btn secondary"
                disabled={judgeStep <= 1}
                onClick={() => tourGo(judgeStep - 1)}
              >
                Previous
              </button>
              {judgeStep < 3 ? (
                <button
                  className="desk-btn primary"
                  onClick={() => tourGo(judgeStep + 1)}
                >
                  Next Step <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  className="desk-btn primary"
                  onClick={() => {
                    setView('field');
                    setRightTab('pack');
                    if (selSite) printSheet('pack');
                  }}
                >
                  Print Field Pack <Printer size={14} />
                </button>
              )}
              <button className="desk-btn ghost" onClick={() => setJudgeStep(0)}>
                <X size={13} /> Exit Tour
              </button>
            </div>
          </div>
        )}

        {/* ── Deep-Dive Science Modal ── */}
        {scienceModalOpen && (
          <div
            className="dd4-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setScienceModalOpen(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Scientific Telemetry and QC Gates"
          >
            <div className="dd4-modal">
              <div className="dd4-modal-header">
                <div>
                  <div className="dd4-modal-kicker">SCIENTIFIC DOSSIER &amp; SENSOR TELEMETRY</div>
                  <h3 className="dd4-modal-title">NISAR L-Band SAR Technical Integrity Audit</h3>
                </div>
                <button
                  className="dd4-modal-close"
                  onClick={() => setScienceModalOpen(false)}
                  aria-label="Close modal"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="dd4-modal-tabs">
                <button
                  className={`dd4-modal-tab ${scienceModalTab === 'telemetry' ? 'active' : ''}`}
                  onClick={() => setScienceModalTab('telemetry')}
                >
                  🛰️ Sensor &amp; Orbit Telemetry
                </button>
                <button
                  className={`dd4-modal-tab ${scienceModalTab === 'qc' ? 'active' : ''}`}
                  onClick={() => setScienceModalTab('qc')}
                >
                  🛡️ Quality Control (QC) Gates ({qcChecks.length})
                </button>
                <button
                  className={`dd4-modal-tab ${scienceModalTab === 'ethics' ? 'active' : ''}`}
                  onClick={() => setScienceModalTab('ethics')}
                >
                  📜 Operational Protocols &amp; Boundaries
                </button>
              </div>

              <div className="dd4-modal-body">
                {scienceModalTab === 'telemetry' && (
                  <>
                    <div className="dd4-modal-grid-2">
                      <div className="dd4-modal-card">
                        <div className="dd4-modal-card-label">Sensor &amp; Payload</div>
                        <div className="dd4-modal-card-value">NISAR L-band SAR (1.25 GHz / 24 cm)</div>
                        <div className="dd4-modal-card-desc">Active microwave sensing penetrates persistent monsoon clouds and canopy cover to detect water boundaries.</div>
                      </div>
                      <div className="dd4-modal-card">
                        <div className="dd4-modal-card-label">Product Level &amp; CRID</div>
                        <div className="dd4-modal-card-value">L3 GCOV · CRID P05023</div>
                        <div className="dd4-modal-card-desc">Geocoded Polarimetric Covariance Matrix. Provisional calibrated release with ongoing calibration validation.</div>
                      </div>
                      <div className="dd4-modal-card">
                        <div className="dd4-modal-card-label">Track &amp; Spatial Footprint</div>
                        <div className="dd4-modal-card-value">Track {bundle.reach.track.relative_orbit} · Frame {bundle.reach.track.frame} · 30m Grid</div>
                        <div className="dd4-modal-card-desc">Jamuna–Chilmari Reach AOI clipped to river corridor with Height Above Nearest Drainage (HAND) mask applied.</div>
                      </div>
                      <div className="dd4-modal-card">
                        <div className="dd4-modal-card-label">Acquisition Pair &amp; Delta</div>
                        <div className="dd4-modal-card-value">{formatDate(firstDate)} → {formatDate(lastDate)} ({pairWindow} Days)</div>
                        <div className="dd4-modal-card-desc">Exact 2 orbital cycles (12-day repeat). Stage difference: proxy Δ0.039 between passes.</div>
                      </div>
                      <div className="dd4-modal-card">
                        <div className="dd4-modal-card-label">Context Layer (OPERA DSWx-S1)</div>
                        <div className="dd4-modal-card-value">17 Jun 2026 Sentinel-1 Dynamic Water</div>
                        <div className="dd4-modal-card-desc">Predates NISAR pair by 2 months; provides independent hydrographic reference context without false same-date claims.</div>
                      </div>
                      <div className="dd4-modal-card">
                        <div className="dd4-modal-card-label">Precipitation Context (GPM IMERG)</div>
                        <div className="dd4-modal-card-value">{((bundle.manifest.parameters as Record<string, unknown>)?.rainfall_pre_t1_mm as string | number | undefined) ?? '64.48'} mm (1.72× baseline)</div>
                        <div className="dd4-modal-card-desc">7-day antecedent rainfall prior to T1. Informational context explaining local water logging.</div>
                      </div>
                    </div>
                  </>
                )}

                {scienceModalTab === 'qc' && (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--dd-text-2)', marginBottom: '4px' }}>
                      Each check guards against false certainty. <strong>A single failed or unverified gate prevents automated erosion declarations.</strong>
                    </div>
                    {qcChecks.map((qc) => {
                      const style = QC_STYLE[qc.status] || 'off';
                      const blockReason = BLOCKS[qc.id] || qc.explanation;
                      return (
                        <div key={qc.id} className="dd4-modal-qc-row">
                          <div>
                            <div className="dd4-modal-qc-name">{qc.id}</div>
                            {qc.value !== null && qc.value !== undefined && (
                              <div style={{ fontSize: '10.5px', color: 'var(--dd-water)', fontFamily: 'var(--font-num, monospace)', marginTop: '2px' }}>
                                {qc.value} {qc.unit ?? ''}
                              </div>
                            )}
                          </div>
                          <span className={`dd4-modal-qc-badge is-${style}`}>
                            {qc.status}
                          </span>
                          <div className="dd4-modal-qc-desc">
                            <strong>{qc.rule}:</strong> {blockReason}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {scienceModalTab === 'ethics' && (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="dd4-modal-card" style={{ borderLeft: '3px solid #7fbf8e' }}>
                      <div className="dd4-modal-card-label" style={{ color: '#7fbf8e' }}>ALLOWED OPERATIONAL USE</div>
                      <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '13px', color: 'var(--dd-text)', lineHeight: '1.6' }}>
                        <li>Tasking field verification teams and UAV operators to specific GPS cluster coordinates.</li>
                        <li>Comparing mapped candidates against historic bankline records and CEGIS reference data.</li>
                        <li>Using candidate surface area solely for spatial ranking and triage prior to next pass.</li>
                        <li>Exporting standardized TRACE Field JSON case packets for field teams.</li>
                      </ul>
                    </div>

                    <div className="dd4-modal-card" style={{ borderLeft: '3px solid #e4572e' }}>
                      <div className="dd4-modal-card-label" style={{ color: '#e4572e' }}>STRICTLY PROHIBITED (UNSAFE TO CONCLUDE)</div>
                      <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '13px', color: 'var(--dd-text)', lineHeight: '1.6' }}>
                        <li>Publishing mapped candidate polygon area as verified land loss or confirmed erosion fact.</li>
                        <li>Issuing automated public evacuation alerts or claiming verified displacement from radar alone.</li>
                        <li>Treating OpenStreetMap ways as census counts of affected households.</li>
                        <li>Using point estimates without publishing the ±1 dB sensitivity range (1,759–8,476 ha).</li>
                      </ul>
                    </div>

                    <div className="dd4-modal-card" style={{ borderLeft: '3px solid #e0b34a' }}>
                      <div className="dd4-modal-card-label" style={{ color: '#e0b34a' }}>VERIFICATION RESOLUTION PATHWAY</div>
                      <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--dd-text-2)', lineHeight: '1.6' }}>
                        The next same-track pass on <strong>{formatDate(nextPass)}</strong> at a comparable river stage, combined with Sentinel-1 tie-breakers and local ground truth, will resolve whether candidates persist as permanent bank loss or return to emergent sandbars.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="dd4-modal-footer">
                <button
                  className="btn-manifest"
                  onClick={() => downloadJson(`jamuna_${bundle.reach.id}_manifest.json`, bundle.manifest)}
                >
                  <FileJson2 size={16} /> Download Science Manifest (JSON)
                </button>
                <button
                  className="btn-close-modal"
                  onClick={() => setScienceModalOpen(false)}
                >
                  <X size={15} /> Close Window
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Investigation Site Dossier Modal ── */}
        {siteModalSite && (
          <div
            className="dd4-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSiteModalSite(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-label={`Investigation Site Dossier ${siteModalSite.id}`}
          >
            <div className="dd4-modal dd4-site-modal">
              <div className="dd4-modal-header">
                <div>
                  <div className="dd4-modal-kicker">INVESTIGATION SITE DOSSIER · JAMUNA REACH</div>
                  <h3 className="dd4-modal-title">
                    {siteModalSite.id} · <span style={{ color: 'var(--dd-water)', textTransform: 'uppercase' }}>{siteModalSite.reachPart}</span>
                  </h3>
                </div>
                <button
                  className="dd4-modal-close"
                  onClick={() => setSiteModalSite(null)}
                  aria-label="Close site dossier"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="dd4-modal-body">
                {/* 4 Key Stat Cards */}
                <div className="dd4-site-modal-stats">
                  <div className="dd4-sm-card">
                    <span className="dd4-sm-label">TOTAL GROUPED AREA</span>
                    <strong className="dd4-sm-val">{formatNumber(siteModalSite.totalArea)} <small>ha</small></strong>
                    <span className="dd4-sm-sub">
                      {siteModalSite.erosionCount} Land→Water · {siteModalSite.accretionCount} Water→Land
                    </span>
                  </div>

                  <div className="dd4-sm-card">
                    <span className="dd4-sm-label">FIELD ANCHOR POLYGON</span>
                    <strong className="dd4-sm-val">{siteModalSite.anchorId}</strong>
                    <span className="dd4-sm-sub">
                      Status: {STATUS_LABEL[persona][statusOf(siteModalSite.members.find((f) => String(f.properties.id) === siteModalSite.anchorId) ?? siteModalSite.members[0])]}
                    </span>
                  </div>

                  <div className="dd4-sm-card">
                    <span className="dd4-sm-label">GPS INVESTIGATION TARGET</span>
                    <strong className="dd4-sm-val">{formatCoord(siteModalSite.centroid)}</strong>
                    <button
                      type="button"
                      className={`dd4-sm-copy-btn ${copiedGps ? 'copied' : ''}`}
                      onClick={() => {
                        const coords = `${siteModalSite.centroid[1].toFixed(5)}, ${siteModalSite.centroid[0].toFixed(5)}`;
                        navigator.clipboard?.writeText(coords);
                        setCopiedGps(true);
                        setNotice(`GPS target copied: ${coords}`);
                        setNoticeOk(true);
                        window.setTimeout(() => setCopiedGps(false), 2000);
                      }}
                      title="Copy GPS latitude, longitude"
                    >
                      {copiedGps ? (
                        <>
                          <Check size={12} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> Copy Coordinates
                        </>
                      )}
                    </button>
                  </div>

                  <div className="dd4-sm-card">
                    <span className="dd4-sm-label">CLUSTER RADIUS</span>
                    <strong className="dd4-sm-val">2,000 m</strong>
                    <span className="dd4-sm-sub">~1 Boat Landing + Walk</span>
                  </div>
                </div>

                {/* Transition Polarity Distribution Bar */}
                <div className="dd4-sm-breakdown">
                  <div className="dd4-sm-bhead">
                    <span>TRANSITION POLARITY RATIO</span>
                    <span>{siteModalSite.members.length} Member Polygons Grouped</span>
                  </div>
                  <div className="dd4-sm-bar">
                    <div
                      className="dd4-sm-bar-erosion"
                      style={{ width: `${Math.max(5, (siteModalSite.erosionArea / Math.max(0.1, siteModalSite.totalArea)) * 100)}%` }}
                      title={`Land to Water: ${formatNumber(siteModalSite.erosionArea)} ha`}
                    />
                    <div
                      className="dd4-sm-bar-accretion"
                      style={{ width: `${Math.max(5, (siteModalSite.accretionArea / Math.max(0.1, siteModalSite.totalArea)) * 100)}%` }}
                      title={`Water to Land: ${formatNumber(siteModalSite.accretionArea)} ha`}
                    />
                  </div>
                  <div className="dd4-sm-blegend">
                    <span className="is-erosion">● Land→Water: <strong>{formatNumber(siteModalSite.erosionArea)} ha</strong> ({siteModalSite.erosionCount} polygons)</span>
                    <span className="is-accretion">● Water→Land: <strong>{formatNumber(siteModalSite.accretionArea)} ha</strong> ({siteModalSite.accretionCount} polygons)</span>
                  </div>
                </div>

                {/* Member Candidates List */}
                <div className="dd4-sm-members-section">
                  <div className="dd4-sm-mhead">
                    <h4>MEMBER CANDIDATES IN THIS SITE ({siteModalSite.members.length})</h4>
                    <span className="dd4-sm-mnote">Click any candidate to inspect radar evidence</span>
                  </div>
                  <div className="dd4-sm-members-grid">
                    {siteModalSite.members.map((f) => {
                      const id = String(f.properties.id);
                      const isAnchor = id === siteModalSite.anchorId;
                      return (
                        <div
                          key={id}
                          className="dd4-sm-member-row"
                          onClick={() => {
                            const targetSite = siteModalSite;
                            setSiteModalSite(null);
                            setSelectedSiteId(targetSite.id);
                            focusCandidate(id, targetSite.id);
                          }}
                        >
                          <div className="dd4-sm-m-left">
                            <span className={`row-swatch ${f.properties.class}`} />
                            <strong className="dd4-sm-m-id">{id}</strong>
                            {isAnchor && <span className="dd4-sm-anchor-badge">ANCHOR</span>}
                          </div>
                          <span className="dd4-sm-m-area">{formatNumber(f.properties.area_ha, 2)} ha</span>
                          <span className="dd4-sm-m-status">{STATUS_LABEL[persona][statusOf(f)]}</span>
                          <span className="dd4-sm-m-inspect">Inspect →</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="dd4-modal-footer">
                <button
                  className="desk-btn secondary"
                  onClick={() => {
                    setSelectedSiteId(siteModalSite.id);
                    setRightTab('pack');
                    setView('field');
                    setSiteModalSite(null);
                  }}
                >
                  <FileJson2 size={14} /> View Field Pack
                </button>
                <button
                  className="btn-manifest"
                  onClick={() => {
                    const target = siteModalSite;
                    setSiteModalSite(null);
                    selectSite(target, true);
                  }}
                >
                  <Layers3 size={15} /> Open In Evidence &amp; Map
                </button>
              </div>
            </div>
          </div>
        )}

        {notice && (
          <div className={`desk-toast ${noticeOk ? 'is-ok' : 'is-bad'}`} role="status">
            <span className="desk-toast-icon">
              {noticeOk ? <Check size={14} strokeWidth={2.5} /> : <ShieldAlert size={14} strokeWidth={2.5} />}
            </span>
            <span className="desk-toast-msg">{notice}</span>
            <button
              type="button"
              className="desk-toast-close"
              onClick={() => setNotice('')}
              aria-label="Dismiss notice"
            >
              <X size={13} strokeWidth={2.2} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
