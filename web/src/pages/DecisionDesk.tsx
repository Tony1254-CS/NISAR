import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp,
  ClipboardList, Compass, Copy, ExternalLink, Eye, FileJson2, Layers3,
  MapPinned, Radar, Search, ShieldAlert, Sparkles, Target, Waves,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { DecisionMap, featureCentroid } from '../map/DecisionMap';
import { loadReachBundle, type ReachBundle } from '../data/load';
import type { ChangeFeature, QCCheck } from '../data/types';
import { useStore } from '../state/store';
import '../styles/decision-desk.css';

const REACH_ID = 'jamuna-chilmari';
const QC_URL = 'https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/';
const NISAR_URL = 'https://science.nasa.gov/mission/nisar/data/';
const OSM_URL = 'https://www.openstreetmap.org/copyright';
type DeskView = 'ledger' | 'context' | 'scenario';
type Audience = 'analyst' | 'planner' | 'public';
type ReviewState = 'Unreviewed' | 'Field review queued' | 'Observation received' | 'Closed';

const VIEW_COPY: Record<Audience, { label: string; title: string; body: string }> = {
  analyst: {
    label: 'Researcher',
    title: 'Candidate transitions need more evidence.',
    body: 'This two-date HH comparison is sensitive to the classification threshold. Stage matching, persistence, and independent water-product agreement are not established for this result.',
  },
  planner: {
    label: 'Resource manager',
    title: 'Use this map to prioritize review, not trigger a response.',
    body: 'The ledger keeps each mapped candidate, its evidence gaps, and local follow-up status together. No evacuation, damage, or erosion warning is inferred from this scene.',
  },
  public: {
    label: 'Community',
    title: 'The satellite found places worth checking.',
    body: 'Radar images from two days show areas where the land and water classes changed. The evidence is not strong enough to say those places were permanently lost to the river.',
  },
};

function formatDate(date: string | null | undefined) {
  if (!date) return '—';
  const parsed = new Date(date.length === 8 ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00Z` : date);
  return Number.isNaN(parsed.valueOf()) ? date : new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed);
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

function candidateLabel(feature: ChangeFeature) {
  const kind = feature.properties.class === 'erosion' ? 'Land-to-water candidate' : 'Water-to-land candidate';
  return `${kind} · ${feature.properties.id}`;
}

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
    if (selected && !selectedFeatureId) setSelectedFeatureId(String(selected.properties.id));
  }, [selected, selectedFeatureId]);
  const firstDate = bundle?.reach.dates[0]?.date ?? '';
  const lastDate = bundle?.reach.dates[bundle.reach.dates.length - 1]?.date ?? '';
  const scenario = selected ? makeScenario(featureCentroid(selected), lengthM, depthM, bearing) : null;
  const areaHa = lengthM * depthM / 10000;
  const selectedReview = selected ? review[String(selected.properties.id)] ?? 'Unreviewed' : 'Unreviewed';
  const latestMetric = bundle?.manifest.metrics.find((metric) => metric.id === 'erosion_area');
  const qcChecks = bundle?.qc?.checks ?? [];
  const failedChecks = qcChecks.filter((check: QCCheck) => check.status === 'FAIL').length;
  const warningChecks = qcChecks.filter((check: QCCheck) => check.status === 'WARN').length;
  const notEvaluated = qcChecks.filter((check: QCCheck) => check.status === 'NOT_EVALUATED').length;
  const maxArea = candidates.slice(0, 5).reduce((sum, feature) => sum + feature.properties.area_ha, 0);
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
    const query = `[out:json][timeout:25];(way[building](${south},${west},${north},${east});way[highway](${south},${west},${north},${east}););out geom;`;
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: query }),
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
    setNotice('Case packet exported for TRACE Field handoff.');
  };

  const copyCaseLink = async () => {
    if (!selected) return;
    const href = `${window.location.origin}/app?reach=${REACH_ID}&feature=${encodeURIComponent(String(selected.properties.id))}`;
    try {
      await navigator.clipboard.writeText(href);
      setNotice('Investigation link copied.');
    } catch {
      setNotice(href);
    }
  };

  if (error) return <div className="decision-page"><Navbar /><main className="decision-error"><ShieldAlert /><h1>Investigation unavailable</h1><p>{error}</p><a href="/methods">Open methods and data sources</a></main></div>;
  if (!bundle) return <div className="decision-page"><Navbar /><main className="decision-loading"><span className="decision-kicker">FLUVISAR / DECISION DESK</span><div className="decision-loader" /><p>Loading the Jamuna evidence bundle…</p></main></div>;
  if (!candidates.length) return <div className="decision-page"><Navbar /><main className="decision-error"><Target /><h1>No mapped candidates in this bundle</h1><p>The evidence bundle loaded, but it contains no transition features to review. Check the reach bundle and analysis window before creating a scenario.</p><a href="/methods">Open methods and data sources</a></main></div>;

  const viewButtons: Array<{ id: DeskView; label: string; icon: React.ReactNode }> = [
    { id: 'ledger', label: 'Review ledger', icon: <ClipboardList size={16} /> },
    { id: 'context', label: 'Radar to reality', icon: <Radar size={16} /> },
    { id: 'scenario', label: 'Impact scenario', icon: <Target size={16} /> },
  ];
  const candidateMetric = latestMetric?.value;
  const sensitivity = qcChecks.find((check: QCCheck) => check.id === 'threshold_sensitivity');
  const dswxCheck = qcChecks.find((check: QCCheck) => check.id === 'dswx_agreement');

  return (
    <div className="decision-page">
      <Navbar transparent={false} />
      <main className="decision-shell">
        <header className="decision-header">
          <div>
            <div className="decision-kicker"><span className="decision-kicker-line" /> FLUVISAR / JAMUNA INVESTIGATION</div>
            <h1>From river signal to a decision worth trusting.</h1>
            <p className="decision-deck">A field-review desk for researchers, planners, and the communities who live beside the river.</p>
          </div>
          <div className="decision-header-status">
            <span className="decision-status-mark" />
            <div><strong>INCONCLUSIVE</strong><small>Review required · no alert issued</small></div>
          </div>
        </header>

        <section className="decision-case-strip" aria-label="Investigation summary">
          <div className="decision-case-place"><MapPinned size={18} /><div><strong>{bundle.reach.name}</strong><small>{bundle.reach.river} River · Bangladesh · Orbit {bundle.reach.track.relative_orbit} / frame {bundle.reach.track.frame}</small></div></div>
          <div className="decision-case-fact"><span>OBSERVATIONS</span><strong>{bundle.reach.dates.length} dates</strong><small>{formatDate(firstDate)} → {formatDate(lastDate)}</small></div>
          <div className="decision-case-fact"><span>QC TO REVIEW</span><strong>{failedChecks} fail · {warningChecks} warn</strong><small>{notEvaluated} checks not evaluated</small></div>
          <a className="decision-source-link" href={NISAR_URL} target="_blank" rel="noreferrer">NISAR source <ExternalLink size={14} /></a>
        </section>

        <section className="decision-layout">
          <div className="decision-map-column">
            <div className="decision-map-frame">
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
              <div className="decision-map-title"><span className="decision-map-live" /> ACTIVE CASE LAYERS <span>· {formatDate(selectedDate)}</span></div>
              <div className="decision-map-controls" aria-label="Map layers">
                <button className={showRadar ? 'active' : ''} onClick={() => setShowRadar(!showRadar)}><Eye size={14} /> NISAR HH</button>
                <button className={showWater ? 'active' : ''} onClick={() => setShowWater(!showWater)}><Waves size={14} /> Water mask</button>
                <button className={showOpera ? 'active' : ''} onClick={() => setShowOpera(!showOpera)}><Layers3 size={14} /> OPERA · 17 Jun</button>
              </div>
              <div className="decision-map-legend"><span><i className="legend-land-water" /> Land → water candidate</span><span><i className="legend-water-land" /> Water → land candidate</span>{activeView === 'scenario' && <span><i className="legend-scenario" /> Hypothetical envelope</span>}</div>
            </div>
            <div className="decision-date-track">
              <div className="decision-date-track-title"><span>OBSERVED PASSES</span><span>same relative orbit · actual dates only</span></div>
              <div className="decision-date-buttons">
                {bundle.reach.dates.map((date, index) => (
                  <button key={date.date} className={selectedDate === date.date ? 'selected' : ''} onClick={() => setSelectedDate(date.date)}>
                    <span className="decision-date-node" />
                    <strong>{formatDate(date.date)}</strong>
                    <small>{date.status === 'ok' ? `NISAR L-band · ${date.stage_source === 'proxy' ? 'stage proxy' : 'observed stage'}` : `Not used · ${date.status}`}</small>
                    {index < bundle.reach.dates.length - 1 && <span className="decision-date-connector" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="decision-rail">
            <div className="decision-rail-nav" role="tablist" aria-label="Decision desk views">
              {viewButtons.map((view) => <button key={view.id} role="tab" aria-selected={activeView === view.id} className={activeView === view.id ? 'active' : ''} onClick={() => setActiveView(view.id)}>{view.icon}<span>{view.label}</span></button>)}
            </div>

            {activeView === 'ledger' && selected && (
              <div className="decision-rail-content">
                <div className="decision-section-eyebrow"><ClipboardList size={14} /> FIELD REVIEW QUEUE</div>
                <h2>Candidate ledger</h2>
                <p className="decision-section-copy">Ranked by mapped candidate area. This is a review queue, not a hazard ranking.</p>
                <div className="decision-ledger-summary"><div><strong>{candidates.length.toLocaleString()}</strong><span>mapped candidates</span></div><div><strong>{maxArea.toFixed(1)} ha</strong><span>largest five combined</span></div></div>
                <div className="decision-ledger-list">
                  {candidates.slice(0, 24).map((feature) => {
                    const id = String(feature.properties.id);
                    const isSelected = selectedFeatureId === id;
                    return <button key={id} className={`decision-candidate ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedFeatureId(id)}>
                      <span className={`candidate-swatch ${feature.properties.class}`} />
                      <span className="candidate-main"><strong>{candidateLabel(feature)}</strong><small>{formatDate(feature.properties.t0)} → {formatDate(feature.properties.t1)} · {review[id] ?? 'Unreviewed'}</small></span>
                      <span className="candidate-area">{feature.properties.area_ha.toFixed(2)}<small>ha</small></span>
                    </button>;
                  })}
                </div>
                <div className="decision-selected-card">
                  <div className="decision-selected-top"><div><span className="decision-section-eyebrow">SELECTED EVIDENCE</span><h3>{selected.properties.id}</h3></div><span className="candidate-unverified">UNVERIFIED</span></div>
                  <div className="decision-data-pair"><span>Mapped transition</span><strong>{selected.properties.area_ha.toFixed(2)} ha</strong></div>
                  <div className="decision-data-pair"><span>Review status</span><select value={selectedReview} onChange={(event) => updateReview(String(selected.properties.id), event.target.value as ReviewState)} aria-label="Review status"><option>Unreviewed</option><option>Field review queued</option><option>Observation received</option><option>Closed</option></select></div>
                  <p className="decision-local-note"><CircleHelp size={14} /> Status is saved in this browser only; it is not synced to TRACE Field.</p>
                  <div className="decision-action-row"><button className="decision-button primary" onClick={exportCasePacket}><FileJson2 size={15} /> Export TRACE packet</button><button className="decision-button quiet" onClick={copyCaseLink} aria-label="Copy investigation link"><Copy size={15} /></button></div>
                </div>
              </div>
            )}

            {activeView === 'context' && (
              <div className="decision-rail-content">
                <div className="decision-section-eyebrow"><Radar size={14} /> OBSERVATION CONTEXT</div>
                <h2>Radar to reality</h2>
                <p className="decision-section-copy">Compare the two real HH quicklooks. The map below also includes a separately dated Sentinel‑1 water layer.</p>
                <div className="decision-compare-images" style={{ '--compare-position': `${comparePosition}%` } as React.CSSProperties}>
                  <img className="compare-image-after" src={`${`/data/v1/${REACH_ID}`}/img/radar_${lastDate}.png`} alt={`NISAR HH quicklook from ${formatDate(lastDate)}`} />
                  <img className="compare-image-before" src={`${`/data/v1/${REACH_ID}`}/img/radar_${firstDate}.png`} alt={`NISAR HH quicklook from ${formatDate(firstDate)}`} />
                  <div className="compare-divider"><span>⇆</span></div>
                  <label className="sr-only" htmlFor="decision-compare">Compare NISAR dates</label>
                  <input id="decision-compare" type="range" min="3" max="97" value={comparePosition} onChange={(event) => setComparePosition(Number(event.target.value))} aria-label="Swipe between the two NISAR dates" />
                  <span className="compare-date before">{formatDate(firstDate)}</span><span className="compare-date after">{formatDate(lastDate)}</span>
                </div>
                <div className="decision-context-callout"><span className="context-icon"><Layers3 size={16} /></span><div><strong>Independent context · OPERA DSWx-S1</strong><p>Sentinel‑1 C-band water extent from 17 Jun 2026. It predates the NISAR pair and is shown as seasonal context, not same-date validation.</p><a href={QC_URL} target="_blank" rel="noreferrer">Product details <ArrowUpRight size={13} /></a></div></div>
                <div className="decision-observation-facts"><div><span>PAIR WINDOW</span><strong>{Math.round((new Date(`${lastDate.slice(0,4)}-${lastDate.slice(4,6)}-${lastDate.slice(6,8)}`).valueOf() - new Date(`${firstDate.slice(0,4)}-${firstDate.slice(4,6)}-${firstDate.slice(6,8)}`).valueOf()) / 86400000)} days</strong></div><div><span>POLARIZATION</span><strong>HH only</strong></div><div><span>STAGE RECORD</span><strong>{bundle.stage.mode === 'proxy' ? 'Proxy values' : 'Gauge values'}</strong></div></div>
                <p className="decision-science-note">Backscatter quicklooks reveal signal patterns; they do not uniquely identify water or permanent bank loss. The configured comparison remains inconclusive.</p>
              </div>
            )}

            {activeView === 'scenario' && selected && scenario && (
              <div className="decision-rail-content">
                <div className="decision-section-eyebrow"><Compass size={14} /> SCREENING SCENARIO</div>
                <h2>What could merit a field look?</h2>
                <p className="decision-section-copy">Shape a hypothetical rectangular corridor around the selected candidate. This is a planning scenario, not an erosion forecast.</p>
                <label className="decision-slider-label"><span>Along-bank length</span><strong>{lengthM} m</strong></label>
                <input className="decision-range" type="range" min="100" max="2000" step="50" value={lengthM} onChange={(event) => setLengthM(Number(event.target.value))} aria-label="Hypothetical along-bank length in metres" />
                <label className="decision-slider-label"><span>Hypothetical retreat depth</span><strong>{depthM} m</strong></label>
                <input className="decision-range" type="range" min="20" max="800" step="10" value={depthM} onChange={(event) => setDepthM(Number(event.target.value))} aria-label="Hypothetical retreat depth in metres" />
                <label className="decision-slider-label"><span>Envelope orientation</span><strong>{bearing}°</strong></label>
                <input className="decision-range" type="range" min="0" max="180" step="5" value={bearing} onChange={(event) => setBearing(Number(event.target.value))} aria-label="Hypothetical corridor orientation in degrees" />
                <div className="scenario-area-card"><span>SCENARIO AREA · LENGTH × DEPTH</span><strong>{areaHa.toFixed(2)} <small>ha</small></strong><div className="scenario-formula">{lengthM.toLocaleString()} m × {depthM.toLocaleString()} m ÷ 10,000</div></div>
                <div className="scenario-assets">
                  <div className="scenario-assets-heading"><div><strong>Mapped assets in envelope</strong><small>OpenStreetMap · queried on demand</small></div><button className="decision-button quiet" onClick={loadOpenMapContext} disabled={osmState === 'loading'}><Search size={14} /> {osmState === 'loading' ? 'Searching…' : osmState === 'ready' ? 'Refresh' : 'Load assets'}</button></div>
                  {osmState === 'ready' ? <div className="scenario-asset-grid"><div><strong>{osmBuildings}</strong><span>mapped building ways</span></div><div><strong>{osmRoads}</strong><span>mapped road ways touched</span></div></div> : <p className={`scenario-asset-note ${osmState === 'error' ? 'error' : ''}`}>{osmState === 'error' ? osmError : 'Query a small area around this candidate to see mapped buildings and roads inside the scenario envelope.'}</p>}
                  <div className="osm-credit">© OpenStreetMap contributors · <a href={OSM_URL} target="_blank" rel="noreferrer">ODbL attribution</a></div>
                </div>
                <div className="scenario-caveat"><ShieldAlert size={16} /><p>Counts describe mapped features intersecting this user-drawn envelope. OSM coverage is incomplete; these are not people at risk, damaged homes, or a forecast.</p></div>
              </div>
            )}
          </aside>
        </section>

        <section className="decision-brief">
          <div className="decision-brief-top"><div><div className="decision-section-eyebrow"><Sparkles size={14} /> SAME EVIDENCE · THREE READS</div><h2>Make the finding useful to the person reading it.</h2></div><div className="decision-audience-switch" role="tablist" aria-label="Choose audience"><button className={audience === 'analyst' ? 'active' : ''} onClick={() => setAudience('analyst')}>Researcher</button><button className={audience === 'planner' ? 'active' : ''} onClick={() => setAudience('planner')}>Planner</button><button className={audience === 'public' ? 'active' : ''} onClick={() => setAudience('public')}>Community</button></div></div>
          <div className="decision-brief-copy"><div className="brief-audience-mark"><BookOpen size={18} /><span>{VIEW_COPY[audience].label.toUpperCase()}</span></div><div><h3>{VIEW_COPY[audience].title}</h3><p>{VIEW_COPY[audience].body}</p></div><div className="brief-next-step"><span>NEXT USEFUL STEP</span><strong>{bundle.stage.mode === 'proxy' ? 'Add observed gauge levels and another same-track pass.' : 'Review the disputed patches with independent field evidence.'}</strong></div></div>
          <div className="decision-brief-foot"><span><ShieldAlert size={14} /> Candidate change is not confirmed erosion.</span><span>Area in manifest: {candidateMetric?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? '—'} ha · threshold sensitivity: {sensitivity?.value ?? 'not available'} {sensitivity?.unit ?? ''} · OPERA check: {dswxCheck?.status ?? 'not evaluated'}</span></div>
        </section>

        <footer className="decision-footer"><span>FLUVISAR · EVIDENCE FIRST</span><span>Local review statuses stay in this browser. Export a case packet to hand off to TRACE Field.</span><a href="/methods">Methods & provenance <ChevronRight size={13} /></a></footer>
        {notice && <div className="decision-toast" role="status"><Check size={15} /> {notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}
      </main>
    </div>
  );
}
