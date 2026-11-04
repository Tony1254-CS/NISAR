import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, ClipboardList,
  Copy, Crosshair, ExternalLink, Eye, FileJson2, GitCompareArrows,
  Layers3, Pause, Play, Search, ShieldAlert, SlidersHorizontal,
  Sparkles, Target, TrendingDown, Waves, Workflow,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { DecisionMap, featureCentroid } from '../map/DecisionMap';
import { loadReachBundle, type ReachBundle } from '../data/load';
import type { QCCheck } from '../data/types';
import { useStore } from '../state/store';
import '../styles/decision-desk.css';

const REACH_ID = 'jamuna-chilmari';
const QC_URL = 'https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/';
const NISAR_URL = 'https://science.nasa.gov/mission/nisar/data/';
const OSM_URL = 'https://www.openstreetmap.org/copyright';
type DeskView = 'ledger' | 'context' | 'scenario';
type Audience = 'analyst' | 'planner' | 'public';
type ReviewState = 'Unreviewed' | 'Field review queued' | 'Observation received' | 'Closed';
type ClassFilter = 'all' | 'erosion' | 'accretion';

const VIEW_COPY: Record<Audience, { label: string; title: string; body: string; step: string }> = {
  analyst: {
    label: 'Researcher',
    title: 'Candidate transitions need more evidence before either number is trusted.',
    body: 'This two-date HH comparison is threshold-sensitive: a ±1 dB perturbation moves the erosion estimate from roughly 1,769 ha to 8,477 ha. Stage matching, persistence, and independent water-product agreement are not yet established, and the mapped totals sit an order of magnitude above CEGIS reference rates for this reach.',
    step: 'Add observed gauge levels, a peak-bounded pair, and a third same-track pass before comparing against CEGIS district statistics.',
  },
  planner: {
    label: 'Resource manager',
    title: 'Prioritize review with this map — do not trigger a response with it.',
    body: 'Every mapped polygon is an unverified candidate. The ledger keeps each one, its evidence gaps, and local follow-up status together, so field checks can be queued where mapped change, settlements, and previous closures intersect.',
    step: 'Queue the 24 largest erosion candidates for field review; keep evacuation and damage decisions offline until verification exists.',
  },
  public: {
    label: 'Community',
    title: 'The satellite found places worth checking — not losses that are official.',
    body: 'Radar images from two dates in August and September show where the land and water classes seem to switch. The evidence is not strong enough yet to say those places were permanently lost to the river, so nothing here is a warning.',
    step: 'Community observations, photos, and local knowledge are real evidence: share them with your local office to help close the open cases.',
  },
};

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

function makeScenario(center: [number, number], lengthM: number, depthM: number, bearing: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const angle = bearing * Math.PI / 180;
  const along = [Math.sin(angle), Math.cos(angle)];
  const across = [Math.cos(angle), -Math.sin(angle)];
  const toPoint = (u: number, v: number): [number, number] => {
    const east = along[0] * u + across[0] * v;
    const north = along[1] * u + across[1] * v;
    const lat = center[1] + north / 110540;
    const lon = center[0] + east / (111320 * Math.cos(center[1] * Math.PI / 180));
    return [lon, lat];
  };
  const halfLength = lengthM / 2;
  const halfDepth = depthM / 2;
  return {
    type: 'Feature',
    properties: { kind: 'scenario screening envelope', length_m: lengthM, retreat_m: depthM, bearing_deg: bearing },
    geometry: { type: 'Polygon', coordinates: [[
      toPoint(-halfLength, -halfDepth), toPoint(halfLength, -halfDepth),
      toPoint(halfLength, halfDepth), toPoint(-halfLength, halfDepth),
      toPoint(-halfLength, -halfDepth),
    ]] },
  };
}

function pointInRing(point: [number, number], ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const cross = ((yi > point[1]) !== (yj > point[1])) && (point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || 1e-12) + xi);
    if (cross) inside = !inside;
  }
  return inside;
}

function orient(a: number[], b: number[], c: number[]) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function segmentsTouch(a: number[], b: number[], c: number[], d: number[]) {
  const onSegment = (p: number[], q: number[], r: number[]) =>
    q[0] <= Math.max(p[0], r[0]) + 1e-10 && q[0] >= Math.min(p[0], r[0]) - 1e-10 &&
    q[1] <= Math.max(p[1], r[1]) + 1e-10 && q[1] >= Math.min(p[1], r[1]) - 1e-10;
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) return true;
  return (Math.abs(o1) < 1e-10 && onSegment(a, c, b)) ||
    (Math.abs(o2) < 1e-10 && onSegment(a, d, b)) ||
    (Math.abs(o3) < 1e-10 && onSegment(c, a, d)) ||
    (Math.abs(o4) < 1e-10 && onSegment(c, b, d));
}

function featureTouchesEnvelope(feature: GeoJSON.Feature, envelope: GeoJSON.Feature<GeoJSON.Polygon>) {
  const outer = envelope.geometry.coordinates[0];
  const geometry = feature.geometry;
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as number[][][];
    if (rings[0].some((point) => pointInRing([point[0], point[1]], outer))) return true;
    if (outer.some((point) => pointInRing([point[0], point[1]], rings[0]))) return true;
    return rings[0].some((point, index) => {
      const next = rings[0][(index + 1) % rings[0].length];
      return outer.some((edge, edgeIndex) => segmentsTouch(point, next, edge, outer[(edgeIndex + 1) % outer.length]));
    });
  }
  if (geometry.type === 'LineString') {
    const points = geometry.coordinates as number[][];
    if (points.some((point) => pointInRing([point[0], point[1]], outer))) return true;
    return points.some((point, index) => index > 0 && outer.some((edge, edgeIndex) => segmentsTouch(points[index - 1], point, edge, outer[(edgeIndex + 1) % outer.length])));
  }
  return false;
}

function downloadJson(filename: string, data: unknown) {
  const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

const QC_STYLE: Record<string, string> = {
  FAIL: 'fail', WARN: 'warn', INFO: 'info', PASS: 'pass', NOT_EVALUATED: 'off',
};

export function DecisionDesk() {
  const [bundle, setBundle] = useState<ReachBundle | null>(null);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<DeskView>('ledger');
  const [audience, setAudience] = useState<Audience>('planner');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('20260919');
  const [showRadar, setShowRadar] = useState(true);
  const [showWater, setShowWater] = useState(false);
  const [showOpera, setShowOpera] = useState(false);
  const [comparePosition, setComparePosition] = useState(50);
  const [lengthM, setLengthM] = useState(500);
  const [depthM, setDepthM] = useState(120);
  const [bearing, setBearing] = useState(80);
  const [osm, setOsm] = useState<GeoJSON.FeatureCollection | null>(null);
  const [osmState, setOsmState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [osmError, setOsmError] = useState('');
  const [review, setReview] = useState<Record<string, ReviewState>>({});
  const [notice, setNotice] = useState('');
  const [noticeOk, setNoticeOk] = useState(true);
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');
  const [query, setQuery] = useState('');
  const [playing, setPlaying] = useState(false);
  const setReachId = useStore((s) => s.setReachId);

  useEffect(() => {
    let cancelled = false;
    setReachId(REACH_ID);
    loadReachBundle(REACH_ID).then((data) => {
      if (cancelled) return;
      setBundle(data);
      const dates = data.reach.dates.filter((item) => item.status === 'ok');
      setSelectedDate(dates[dates.length - 1]?.date ?? dates[0]?.date ?? '');
      const storageKey = `fluvisar-review:${REACH_ID}`;
      try { setReview(JSON.parse(localStorage.getItem(storageKey) ?? '{}')); } catch { setReview({}); }
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
  const selected = candidates.find((feature) => String(feature.properties.id) === selectedFeatureId) ?? candidates[0] ?? null;
  useEffect(() => {
    if (selected && selectedFeatureId && selectedFeatureId !== String(selected.properties.id) && !candidates.some((feature) => String(feature.properties.id) === selectedFeatureId)) {
      setSelectedFeatureId(String(selected.properties.id));
    }
  }, [selected, selectedFeatureId, candidates]);
  useEffect(() => {
    if (selected && !selectedFeatureId) setSelectedFeatureId(String(selected.properties.id));
  }, [selected, selectedFeatureId]);
  const firstDate = bundle?.reach.dates[0]?.date ?? '';
  const lastDate = bundle?.reach.dates[bundle.reach.dates.length - 1]?.date ?? '';
  const passDates = useMemo(
    () => bundle?.reach.dates.filter((item) => item.status === 'ok').map((item) => item.date) ?? [],
    [bundle],
  );
  useEffect(() => {
    if (!playing || passDates.length < 2) return;
    const id = setInterval(() => {
      setSelectedDate((current) => {
        const index = passDates.indexOf(current);
        return passDates[(index + 1) % passDates.length];
      });
    }, 1500);
    return () => clearInterval(id);
  }, [playing, passDates]);
  const scenario = selected ? makeScenario(featureCentroid(selected), lengthM, depthM, bearing) : null;
  const areaHa = lengthM * depthM / 10000;
  const selectedReview = selected ? review[String(selected.properties.id)] ?? 'Unreviewed' : 'Unreviewed';
  const latestMetric = bundle?.manifest.metrics.find((metric) => metric.id === 'erosion_area');
  const accretionMetric = bundle?.manifest.metrics.find((metric) => metric.id === 'accretion_area');
  const qcChecks = bundle?.qc?.checks ?? [];
  const failedChecks = qcChecks.filter((check: QCCheck) => check.status === 'FAIL').length;
  const warningChecks = qcChecks.filter((check: QCCheck) => check.status === 'WARN').length;
  const notEvaluated = qcChecks.filter((check: QCCheck) => check.status === 'NOT_EVALUATED').length;
  const priorityFeatures = candidates.slice(0, 24);
  const reviewedCount = priorityFeatures.filter((feature) => (review[String(feature.properties.id)] ?? 'Unreviewed') !== 'Unreviewed').length;
  const filteredLists = useMemo(() => {
    const text = query.trim().toLowerCase();
    return candidates.filter((feature) => {
      if (classFilter !== 'all' && feature.properties.class !== classFilter) return false;
      if (text && !String(feature.properties.id).toLowerCase().includes(text)) return false;
      return true;
    });
  }, [candidates, classFilter, query]);
  const osmBuildings = osm?.features.filter((feature) => Boolean(feature.properties?.building) && scenario && featureTouchesEnvelope(feature, scenario)).length ?? 0;
  const osmRoads = osm?.features.filter((feature) => Boolean(feature.properties?.highway) && scenario && featureTouchesEnvelope(feature, scenario)).length ?? 0;

  const updateReview = (id: string, value: ReviewState) => {
    const next = { ...review, [id]: value };
    setReview(next);
    localStorage.setItem(`fluvisar-review:${REACH_ID}`, JSON.stringify(next));
  };

  const loadOpenMapContext = async () => {
    if (!scenario) return;
    setOsmState('loading');
    setOsmError('');
    const ring = scenario.geometry.coordinates[0];
    const lons = ring.map((point) => point[0]);
    const lats = ring.map((point) => point[1]);
    const west = Math.min(...lons), east = Math.max(...lons), south = Math.min(...lats), north = Math.max(...lats);
    const queryText = `[out:json][timeout:25];(way[building](${south},${west},${north},${east});way[highway](${south},${west},${north},${east}););out geom;`;
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: queryText }),
      });
      if (!response.ok) throw new Error(`OpenStreetMap query returned ${response.status}.`);
      const payload = await response.json() as { elements?: Array<{ id: number; type: string; tags?: Record<string, string>; geometry?: Array<{ lon: number; lat: number }> }> };
      const features: GeoJSON.Feature[] = [];
      for (const element of payload.elements ?? []) {
        if (element.type !== 'way' || !element.tags || !element.geometry?.length) continue;
        const coordinates = element.geometry.map((point) => [point.lon, point.lat]);
        if (element.tags.building && coordinates.length >= 4 && coordinates[0][0] === coordinates[coordinates.length - 1][0] && coordinates[0][1] === coordinates[coordinates.length - 1][1]) {
          features.push({ type: 'Feature', id: element.id, properties: { ...element.tags, osm_id: element.id }, geometry: { type: 'Polygon', coordinates: [coordinates] } });
        } else if (element.tags.highway && coordinates.length >= 2) {
          features.push({ type: 'Feature', id: element.id, properties: { ...element.tags, osm_id: element.id }, geometry: { type: 'LineString', coordinates } });
        }
      }
      setOsm({ type: 'FeatureCollection', features });
      setOsmState('ready');
    } catch (reason) {
      setOsmState('error');
      setOsmError(reason instanceof Error ? reason.message : 'Could not load mapped OpenStreetMap features.');
    }
  };

  const exportCasePacket = () => {
    if (!bundle || !selected) return;
    downloadJson(`fluvisar-trace-case-${selected.properties.id}.json`, {
      schema: 'fluvisar.trace-field.case.v1',
      exported_at: new Date().toISOString(),
      case: {
        id: `${REACH_ID}:${selected.properties.id}`,
        reach_id: REACH_ID,
        reach_name: bundle.reach.name,
        river: bundle.reach.river,
        candidate: selected,
        review_status: selectedReview,
        verdict: bundle.reach.verdict,
        observation_dates: bundle.reach.dates.map((date) => ({ date: date.date, acq_utc: date.acq_utc })),
        source_granules: latestMetric?.inputs ?? [],
        qc: qcChecks.map((check: QCCheck) => ({ id: check.id, status: check.status, explanation: check.explanation })),
        interpretation: 'Mapped land-to-water transition candidate. Current analysis is inconclusive; this is a field-review handoff, not a verified erosion alert.',
      },
      trace_field_note: 'A field record is independent evidence for human review. It must not automatically change the satellite finding to verified.',
    });
    setNoticeOk(true);
    setNotice('TRACE Field case packet exported.');
  };

  const copyCaseLink = async () => {
    if (!selected) return;
    const href = `${window.location.origin}/app?reach=${REACH_ID}&feature=${encodeURIComponent(String(selected.properties.id))}`;
    try {
      await navigator.clipboard.writeText(href);
      setNoticeOk(true);
      setNotice('Investigation link copied.');
    } catch {
      setNotice(href);
    }
  };

  if (error) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby error"><ShieldAlert size={30} /><h1>Investigation unavailable</h1><p>{error}</p><a href="/methods">Open methods and data sources <ChevronRight size={14} /></a></main></div>;
  if (!bundle) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby"><span className="desk-kicker">FLUVISAR / DECISION DESK</span><div className="desk-loader" /><p>Loading the Jamuna evidence bundle…</p></main></div>;
  if (!candidates.length) return <div className="desk-page"><Navbar transparent={false} /><main className="desk-standby error"><Target size={30} /><h1>No mapped candidates in this bundle</h1><p>The evidence bundle loaded, but it contains no transition features to review. Check the reach bundle and analysis window before creating a scenario.</p><a href="/methods">Open methods and data sources <ChevronRight size={14} /></a></main></div>;

  const viewButtons: Array<{ id: DeskView; label: string; icon: React.ReactNode }> = [
    { id: 'ledger', label: 'Review ledger', icon: <ClipboardList size={15} /> },
    { id: 'context', label: 'Radar → reality', icon: <GitCompareArrows size={15} /> },
    { id: 'scenario', label: 'Impact scenario', icon: <Target size={15} /> },
  ];
  const erosionMetric = latestMetric;
  const stagePair = bundle.reach.primary_pair;
  const thresholds = erosionMetric?.params ?? null;
  const centroidOf = selected ? featureCentroid(selected) : null;
  const scenarioRing = scenario ? scenario.geometry.coordinates[0] : null;
  const pairWindow = firstDate && lastDate
    ? Math.round((new Date(`${lastDate.slice(0, 4)}-${lastDate.slice(4, 6)}-${lastDate.slice(6, 8)}`).valueOf() - new Date(`${firstDate.slice(0, 4)}-${firstDate.slice(4, 6)}-${firstDate.slice(6, 8)}`).valueOf()) / 86400000)
    : 0;

  return (
    <div className="desk-page">
      <Navbar transparent={false} />
      <main className="desk-shell">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <header className="desk-hero">
          <div className="desk-hero-lede">
            <div className="desk-kicker"><span className="desk-kicker-rule" />FLUVISAR · DECISION DESK · JAMUNA</div>
            <h1>Translated the river&rsquo;s radar shift into a desk&nbsp;—&nbsp;not a headline.</h1>
            <p className="desk-deck">
              Investigators, resource managers, and riverside communities all need something different from the same observation: a queue to work, a verdict that means what it says,
              and places worth checking. This is that desk for the Chilmari–Roumari reach.
            </p>
          </div>
          <div className="desk-verdict-card" role="status">
            <div className="desk-verdict-head"><span className="desk-verdict-pulse"><i /></span>VERDICT OF THIS RUN</div>
            <div className="desk-verdict-word">{bundle.reach.verdict}</div>
            <p>No alert is issued from this scene. {failedChecks} check failed, {warningChecks} warned, {notEvaluated} were not evaluated — review before any use.</p>
            <div className="desk-verdict-meta"><span>Reach {bundle.reach.track.relative_orbit}{bundle.reach.track.direction} · frame {bundle.reach.track.frame}</span><span>{formatDate(firstDate)} → {formatDate(lastDate)}</span></div>
          </div>
        </header>

        {/* ── Metric band ──────────────────────────────────────────── */}
        <section className="desk-metrics" aria-label="Headline metrics">
          <article className="desk-metric is-erosion">
            <div className="desk-metric-label">MAPPED EROSION CANDIDATES</div>
            <div className="desk-metric-value">{formatNumber(erosionMetric?.value)} <small>ha</small></div>
            <p>Land to water, {formatDate(firstDate)} → {formatDate(lastDate)}.</p>
            {erosionMetric?.low != null && erosionMetric?.high != null && (
              <div className="desk-range">
                <i style={{ left: `${Math.max(2, Math.min(98, ((erosionMetric.value - erosionMetric.low) / (erosionMetric.high - erosionMetric.low)) * 100))}%` }} />
                <span className="lo">{formatNumber(erosionMetric.low, 0)}</span>
                <span className="hi">{formatNumber(erosionMetric.high, 0)}</span>
              </div>
            )}
            {erosionMetric?.low != null && erosionMetric?.high != null && <small className="desk-range-note">±1 dB uncertainty band, ha</small>}
          </article>
          <article className="desk-metric is-accretion">
            <div className="desk-metric-label">MAPPED ACCRETION CANDIDATES</div>
            <div className="desk-metric-value">{formatNumber(accretionMetric?.value)} <small>ha</small></div>
            <p>Water to land over the same pair.</p>
            <div className="desk-metric-foot"><span>{accretionMetric?.pixel_count != null ? formatNumber(accretionMetric.pixel_count, 0) : '—'} px · 400 m² each</span><span>same two granules</span></div>
          </article>
          <article className="desk-metric is-net">
            <div className="desk-metric-label">NET CANDIDATE SIGNAL</div>
            <div className="desk-metric-value is-negative"><TrendingDown size={22} />−{formatNumber((erosionMetric?.value ?? 0) - (accretionMetric?.value ?? 0))} <small>ha</small></div>
            <p>Candidate-only arithmetic — not a confirmed loss figure.</p>
            <div className="desk-metric-foot"><span>parity rate: 1.4 : 1</span><span>still under review</span></div>
          </article>
          <article className="desk-metric is-queue">
            <div className="desk-metric-label">FIELD REVIEW QUEUE</div>
            <div className="desk-metric-value">{candidates.length.toLocaleString()} <small>features</small></div>
            <p>{reviewedCount} of 24 priority candidates already triaged in this browser.</p>
            <div className="desk-metric-bar"><i style={{ width: `${(reviewedCount / 24) * 100}%` }} /></div>
            <div className="desk-metric-foot"><span>QC scorecard: {failedChecks} fail · {warningChecks} warn</span><span>{notEvaluated} not evaluated</span></div>
          </article>
        </section>

        {/* ── Workspace: map + rail ────────────────────────────────── */}
        <section className="desk-layout">
          <div className="desk-map-col">
            <div className="desk-map-frame">
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
                scenario={activeView === 'scenario' ? scenario : null}
                osm={activeView === 'scenario' ? osm : null}
              />
              <div className="desk-map-chip"><span className="desk-live-dot" />LAYER STACK · <b>{formatDate(selectedDate)}</b></div>
              <div className="desk-map-layers" aria-label="Map layers">
                <button className={showRadar ? 'active' : ''} onClick={() => setShowRadar(!showRadar)}><Eye size={13} /> NISAR HH</button>
                <button className={showWater ? 'active' : ''} onClick={() => setShowWater(!showWater)}><Waves size={13} /> Water mask</button>
                <button className={showOpera ? 'active' : ''} onClick={() => setShowOpera(!showOpera)}><Layers3 size={13} /> OPERA DSWx</button>
              </div>
              <div className="desk-map-legend">
                <span><i className="l-erosion" /> Land → water candidate</span>
                <span><i className="l-accretion" /> Water → land candidate</span>
                <span><i className="l-selected" /> Selected</span>
                {activeView === 'scenario' && <span><i className="l-scenario" /> Envelope</span>}
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
                {bundle.reach.dates.map((date, index) => (
                  <button key={date.date} className={selectedDate === date.date ? 'selected' : ''} onClick={() => setSelectedDate(date.date)}>
                    <span className="desk-pass-node">{selectedDate === date.date && <i />}</span>
                    <strong>{formatDate(date.date)}</strong>
                    <small>{date.status === 'ok' ? `L-band HH · ${date.stage_source === 'proxy' ? 'stage proxy' : 'gauge stage'} · ${date.acq_utc.slice(11, 16)} UTC` : `not used · ${date.status}`}</small>
                    {index < bundle.reach.dates.length - 1 && <span className="desk-pass-link" />}
                  </button>
                ))}
              </div>
              <div className="desk-passes-note">Pair rule {stagePair.type === 'later_lower' ? 'later/lower' : 'equal stage'} · Δstage {formatNumber(stagePair.dh_m, 3)} proxy · {pairWindow} days apart. Play cycles the map imagery between real passes.</div>
            </div>
          </div>

          <aside className="desk-rail">
            <div className="desk-rail-nav" role="tablist" aria-label="Decision desk views">
              {viewButtons.map((view) => (
                <button key={view.id} role="tab" aria-selected={activeView === view.id} className={activeView === view.id ? 'active' : ''} onClick={() => setActiveView(view.id)}>{view.icon}<span>{view.label}</span></button>
              ))}
            </div>

            {/* ── LEDGER ── */}
            {activeView === 'ledger' && (
              <div className="desk-rail-body" key="ledger">
                <div className="desk-eyebrow"><ClipboardList size={13} /> FIELD REVIEW QUEUE</div>
                <h2>Candidate ledger</h2>
                <p className="desk-copy">
                  {filteredLists.length} transition{filteredLists.length === 1 ? '' : 's'} shown, ranked by mapped area. A candidate lineup — not a hazard ranking.
                </p>
                <div className="desk-chips">
                  <span className="chip is-erosion"><strong>{(bundle.erosion?.features.length ?? 0).toLocaleString()}</strong>erosion</span>
                  <span className="chip is-accretion"><strong>{(bundle.accretion?.features.length ?? 0).toLocaleString()}</strong>accretion</span>
                  <span className="chip is-review"><strong>{reviewedCount}/24</strong>triaged</span>
                </div>
                <div className="desk-filter">
                  <div className="desk-search"><Search size={13} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find candidate ID…" aria-label="Search candidates" /></div>
                  <div className="desk-seg" role="group" aria-label="Filter by class">
                    {(['all', 'erosion', 'accretion'] as ClassFilter[]).map((key) => (
                      <button key={key} className={classFilter === key ? 'active' : ''} onClick={() => setClassFilter(key)}>{key === 'all' ? 'All' : key === 'erosion' ? 'Erosion' : 'Accretion'}</button>
                    ))}
                  </div>
                </div>

                <div className="desk-ledger">
                  {filteredLists.length === 0 && <div className="desk-empty">No matching candidates. <button onClick={() => { setQuery(''); setClassFilter('all'); }}>Reset filters</button></div>}
                  {filteredLists.slice(0, 40).map((feature) => {
                    const id = String(feature.properties.id);
                    const isSelected = selectedFeatureId === id;
                    return (
                      <button key={id} className={`desk-row ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedFeatureId(id)}>
                        <span className="row-rank">#{candidates.indexOf(feature) + 1}</span>
                        <span className={`row-swatch ${feature.properties.class}`} />
                        <span className="row-main">
                          <strong>{feature.properties.class === 'erosion' ? 'Land → water' : 'Water → land'} · {feature.properties.id}</strong>
                          <small>{formatDate(feature.properties.t0)} → {formatDate(feature.properties.t1)}</small>
                        </span>
                        <span className="row-status">{review[id] ?? 'Unreviewed'}</span>
                        <span className="row-area">{feature.properties.area_ha.toFixed(2)}<small>ha</small></span>
                      </button>
                    );
                  })}
                </div>
                {filteredLists.length > 40 && <div className="desk-ledger-foot">Showing the 40 largest of {filteredLists.length} matches — refine the search or filter to narrow the queue.</div>}

                {selected && centroidOf && (
                  <div className="desk-card desk-selected">
                    <div className="desk-selected-head">
                      <div>
                        <span className="desk-eyebrow-soft">SELECTED EVIDENCE</span>
                        <h3>{selected.properties.class === 'erosion' ? 'Land → water candidate' : 'Water → land candidate'} <b>{selected.properties.id}</b></h3>
                      </div>
                      <span className="desk-tag is-warn">UNVERIFIED</span>
                    </div>
                    <div className="desk-factlist">
                      <div><span>Mapped transition</span><strong>{selected.properties.area_ha.toFixed(2)} ha</strong></div>
                      <div><span>Observed between</span><strong>{formatDate(selected.properties.t0)} → {formatDate(selected.properties.t1)}</strong></div>
                      <div><span>Centroid</span><strong><Crosshair size={12} /> {formatCoord(centroidOf)}</strong></div>
                      <div><span>Review status</span>
                        <select value={selectedReview} onChange={(event) => updateReview(String(selected.properties.id), event.target.value as ReviewState)} aria-label="Review status">
                          <option>Unreviewed</option>
                          <option>Field review queued</option>
                          <option>Observation received</option>
                          <option>Closed</option>
                        </select>
                      </div>
                    </div>
                    <p className="desk-note"><CircleHelp size={13} /> Status stays in this browser; it is not synced to TRACE Field.</p>
                    <div className="desk-actions">
                      <button className="desk-btn primary" onClick={exportCasePacket}><FileJson2 size={14} /> Export case packet</button>
                      <button className="desk-btn" onClick={copyCaseLink} aria-label="Copy investigation link"><Copy size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── RADAR TO REALITY ── */}
            {activeView === 'context' && (
              <div className="desk-rail-body" key="context">
                <div className="desk-eyebrow"><GitCompareArrows size={13} /> OBSERVATION CONTEXT</div>
                <h2>Radar to reality</h2>
                <p className="desk-copy">Two real L-band HH quicklooks, {pairWindow} days apart. Drag the divider — quicklooks show signal patterns, they do not identify water on their own.</p>
                <div className="desk-compare" style={{ '--compare-position': `${comparePosition}%` } as React.CSSProperties}>
                  <img className="cmp-after" src={`${`/data/v1/${REACH_ID}`}/img/radar_${lastDate}.png`} alt={`NISAR HH quicklook from ${formatDate(lastDate)}`} />
                  <img className="cmp-before" src={`${`/data/v1/${REACH_ID}`}/img/radar_${firstDate}.png`} alt={`NISAR HH quicklook from ${formatDate(firstDate)}`} />
                  <div className="cmp-divider"><span>⇆</span></div>
                  <label className="sr-only" htmlFor="desk-compare">Compare NISAR dates</label>
                  <input id="desk-compare" type="range" min="3" max="97" value={comparePosition} onChange={(event) => setComparePosition(Number(event.target.value))} aria-label="Swipe between the two NISAR dates" />
                  <span className="cmp-date before">{formatDate(firstDate)}</span>
                  <span className="cmp-date after">{formatDate(lastDate)}</span>
                </div>
                <div className="desk-facts">
                  <div><span>PAIR WINDOW</span><strong>{formatDate(firstDate)} → {formatDate(lastDate)}</strong></div>
                  <div><span>POLARIZATION</span><strong>HH only</strong></div>
                  <div><span>THRESHOLDS</span><strong>{thresholds?.threshold_db_t0 != null ? `${thresholds.threshold_db_t0.toFixed(2)} / ${thresholds.threshold_db_t1?.toFixed(2)} dB` : 'Otsu per pass'}</strong></div>
                  <div><span>STAGE RECORD</span><strong>{bundle.stage.mode === 'proxy' ? 'Proxy levels' : 'Gauge levels'}</strong></div>
                </div>
                <div className="desk-callout">
                  <span className="callout-ico"><Layers3 size={15} /></span>
                  <div>
                    <strong>Independent context · OPERA DSWx-S1</strong>
                    <p>Sentinel‑1 C-band water extent from 17 Jun 2026 — predates the NISAR pair and is seasonal context only, not same-date validation.</p>
                    <a href={QC_URL} target="_blank" rel="noreferrer">Product details <ArrowUpRight size={12} /></a>
                  </div>
                </div>
                <p className="desk-note is-block"><ShieldAlert size={13} /> Backscatter splits at the configured threshold are inputs to a review, not conclusions. The run&rsquo;s verdict stays INCONCLUSIVE until the open checks close.</p>
              </div>
            )}

            {/* ── SCENARIO ── */}
            {activeView === 'scenario' && selected && scenario && (
              <div className="desk-rail-body" key="scenario">
                <div className="desk-eyebrow"><SlidersHorizontal size={13} /> SCREENING SCENARIO</div>
                <h2>What could merit a field look?</h2>
                <p className="desk-copy">Shape a hypothetical corridor around the selected candidate. {scenarioRing && <span>Mapped at {formatCoord([scenarioRing[0][0], scenarioRing[0][1]])}–{formatCoord(featureCentroid(selected))} corner.</span>} This is planning geometry, not an erosion forecast.</p>
                <label className="desk-slider"><span>Along-bank length</span><strong>{lengthM.toLocaleString()} m</strong></label>
                <input className="desk-range-input" type="range" min="100" max="2000" step="50" value={lengthM} onChange={(event) => setLengthM(Number(event.target.value))} aria-label="Hypothetical along-bank length in metres" />
                <label className="desk-slider"><span>Hypothetical retreat depth</span><strong>{depthM.toLocaleString()} m</strong></label>
                <input className="desk-range-input" type="range" min="20" max="800" step="10" value={depthM} onChange={(event) => setDepthM(Number(event.target.value))} aria-label="Hypothetical retreat depth in metres" />
                <label className="desk-slider"><span>Corridor orientation</span><strong>{bearing}°</strong></label>
                <input className="desk-range-input" type="range" min="0" max="180" step="5" value={bearing} onChange={(event) => setBearing(Number(event.target.value))} aria-label="Hypothetical corridor orientation in degrees" />
                <div className="desk-area">
                  <span>SCENARIO AREA · LENGTH × DEPTH</span>
                  <strong>{areaHa.toFixed(2)} <small>ha</small></strong>
                  <div className="desk-area-formula">{lengthM.toLocaleString()} m × {depthM.toLocaleString()} m ÷ 10,000 — drawn by you, computed honestly.</div>
                </div>
                <div className="desk-assets">
                  <div className="desk-assets-head">
                    <div><strong>Exposure inside the corridor</strong><small>OpenStreetMap · queried on demand</small></div>
                    <button className="desk-btn slim" onClick={loadOpenMapContext} disabled={osmState === 'loading'}><Search size={13} /> {osmState === 'loading' ? 'Searching…' : osmState === 'ready' ? 'Refresh' : 'Load assets'}</button>
                  </div>
                  {osmState === 'ready' ? (
                    <div className="desk-assets-grid">
                      <div><strong>{osmBuildings}</strong><span>mapped building ways</span></div>
                      <div><strong>{osmRoads}</strong><span>road ways touched</span></div>
                    </div>
                  ) : <p className={`desk-assets-note ${osmState === 'error' ? 'error' : ''}`}>{osmState === 'error' ? osmError : 'Query a small area around this candidate to list mapped buildings and roads inside the corridor.'}</p>}
                  <div className="desk-osm-credit">© OpenStreetMap contributors · <a href={OSM_URL} target="_blank" rel="noreferrer">ODbL attribution</a></div>
                </div>
                <p className="desk-caveat"><ShieldAlert size={14} /> Counts describe mapped features intersecting this user-drawn envelope. OSM coverage is incomplete — these are not people at risk, damaged homes, or a forecast.</p>
              </div>
            )}
          </aside>
        </section>

        {/* ── Verdict + QC ─────────────────────────────────────────── */}
        <section className="desk-verdict-section">
          <div className="desk-section-head">
            <div className="desk-eyebrow"><Workflow size={13} /> EVIDENCE INTEGRITY</div>
            <h2>Why this run stays {bundle.reach.verdict}</h2>
            <p>The desk doesn&rsquo;t ship a confident number when its own gates say not to. Each item below either blocks, shades, or awaits evidence.</p>
          </div>
          <div className="desk-verdict-layout">
            <div className="desk-reasons">
              <div className="desk-eyebrow-soft">VERDICT REASONS · REACH RECORD</div>
              <ol>
                {bundle.reach.verdict_reasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ol>
            </div>
            <div className="desk-qc">
              <div className="desk-eyebrow-soft">QC SCORECARD · {qcChecks.length} CHECKS</div>
              <div className="desk-qc-grid">
                {qcChecks.map((check: QCCheck) => (
                  <div key={check.id} className={`desk-qc-chip chip-${QC_STYLE[check.status] ?? 'off'}`}>
                    <div className="qc-top">
                      <span className={`qc-status s-${QC_STYLE[check.status] ?? 'off'}`}>{check.status.replace(/_/g, ' ')}</span>
                      <span className="qc-read">{check.value != null ? `${formatNumber(check.value, check.value < 10 ? 2 : 1)}${check.unit ? ` ${check.unit}` : ''}` : 'not measured'}</span>
                    </div>
                    <strong>{check.label ?? check.id}</strong>
                    <p>{check.explanation}</p>
                    {check.rule && <small>Rule: {check.rule}</small>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Audience brief ───────────────────────────────────────── */}
        <section className="desk-brief">
          <div className="desk-brief-head">
            <div>
              <div className="desk-eyebrow"><Sparkles size={13} /> SAME EVIDENCE · THREE READS</div>
              <h2>One finding, the version each reader actually needs.</h2>
            </div>
            <div className="desk-audience" role="tablist" aria-label="Choose audience">
              {(['analyst', 'planner', 'public'] as Audience[]).map((key) => (
                <button key={key} className={audience === key ? 'active' : ''} onClick={() => setAudience(key)}>{VIEW_COPY[key].label}</button>
              ))}
            </div>
          </div>
          <div className="desk-brief-body">
            <div className="brief-mark"><BookOpen size={17} /><span>{VIEW_COPY[audience].label.toUpperCase()}</span></div>
            <div className="brief-copy"><h3>{VIEW_COPY[audience].title}</h3><p>{VIEW_COPY[audience].body}</p></div>
            <div className="brief-next"><span>NEXT USEFUL STEP</span><strong>{VIEW_COPY[audience].step}</strong></div>
          </div>
          <div className="desk-brief-foot">
            <span className="foot-flag"><ShieldAlert size={13} /> Candidate change is not confirmed erosion until named checks close.</span>
            <span>Pipeline out: {erosionMetric?.label ?? 'erosion area'} {formatNumber(erosionMetric?.value)}{erosionMetric?.unit ? ` ${erosionMetric.unit}` : ''}{erosionMetric?.low != null && erosionMetric?.high != null ? ` (low ${formatNumber(erosionMetric.low, 0)} – high ${formatNumber(erosionMetric.high, 0)})` : ''}</span>
            <span>Sensitivity {(() => { const s = qcChecks.find((check: QCCheck) => check.id === 'threshold_sensitivity'); return s?.value != null ? `${formatNumber(s.value, 1)}% on a 30% gate` : 'n/a'; })()} · persistence {(qcChecks.find((p: QCCheck) => p.id === 'persistence')?.status ?? 'n/a').replace(/_/g, ' ').toLowerCase()}</span>
          </div>
        </section>

        {/* ── Provenance ───────────────────────────────────────────── */}
        <section className="desk-provenance">
          <div className="desk-eyebrow-soft">PROVENANCE · WHAT PRODUCED EVERYTHING ABOVE</div>
          <div className="desk-prov-grid">
            <div>
              <span className="prov-k">NISAR GCOV GRANULES</span>
              <ul className="prov-list mono">
                {(erosionMetric?.inputs ?? []).filter((input) => input.kind === 'NISAR_GCOV').map((input) => (
                  <li key={input.granule}>{input.granule}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="prov-k">PIPELINE PARAMETERS</span>
              <ul className="prov-list">
                <li>Otsu water threshold t0 <b>{thresholds?.threshold_db_t0 != null ? `${thresholds.threshold_db_t0.toFixed(2)} dB` : '—'}</b>, t1 <b>{thresholds?.threshold_db_t1 != null ? `${thresholds.threshold_db_t1.toFixed(2)} dB` : '—'}</b></li>
                <li>Median filter <b>{thresholds?.median_filter ?? '—'}×{thresholds?.median_filter ?? '—'}</b> · MMU <b>{thresholds?.mmu_px ?? '—'} px</b> · HAND mask <b>≤ {thresholds?.hand_max_m ?? '—'} m</b></li>
                <li>Analysis grid <b>EPSG:32645</b> · pixel <b>{erosionMetric?.pixel_area_m2 ?? '—'} m²</b> · frozen <b>{formatDate(bundle.manifest.generated_at.slice(0, 10).replace(/-/g, ''))}</b></li>
                <li>Rainfall context <b>GPM IMERG-D (doi 10.5067/GPM/IMERGDL/DAY/07)</b> — 64.5 mm in the week before t1 vs 37.4 mm norm (1.72 ×)</li>
              </ul>
            </div>
            <div>
              <span className="prov-k">SOURCE &amp; METHODS</span>
              <ul className="prov-list">
                <li><a href={NISAR_URL} target="_blank" rel="noreferrer">NISAR mission data access <ExternalLink size={11} /></a></li>
                <li><a href={QC_URL} target="_blank" rel="noreferrer">OPERA DSWx-S1 product suite <ExternalLink size={11} /></a></li>
                <li><a href={OSM_URL} target="_blank" rel="noreferrer">OpenStreetMap, ODbL <ExternalLink size={11} /></a></li>
                <li><a href="/methods">Methods, thresholds, and caveats in full <ChevronRight size={11} /></a></li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="desk-footer">
          <span className="desk-footer-mark">FLUVISAR · EVIDENCE FIRST</span>
          <span>Review statuses stay in this browser. Export a case packet for a field handoff.</span>
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
