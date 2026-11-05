// Investigation Sites — the Decision Desk's unit of work, replacing the raw
// 4,571-polygon dump as the main surface (the Copernicus EMS "Area of Interest"
// pattern: named places a human team can actually visit, not pixel fragments).
//
// GROUPING METHOD (deterministic, documented, reproducible from the bundle alone):
//   1. Anchors = the 24-candidate screening list: all bundle candidates sorted by
//      mapped area, descending; ties broken by candidate id, ascending.
//   2. Anchors are processed in that order. An anchor that already falls inside an
//      earlier site's radius does not start a new site.
//   3. A new site claims every still-unclaimed candidate whose bundle centroid lies
//      within SITE_RADIUS_M of the anchor centroid (haversine). Claims are resolved
//      largest-anchor-first, so membership never depends on render or load order.
//   4. Sites are numbered SITE-01… in anchor order and carry their full member list;
//      every original candidate id stays reachable (traceability is never broken).
// Candidates outside every anchor radius are counted, not hidden: they remain in the
// Researcher ledger. The radius is a working-distance choice for field teams
// (a site ≈ one boat landing + one walk), printed wherever sites are described.
import type { ChangeFeature } from '../data/types';

export const SITE_RADIUS_M = 2000;

export interface InvestigationSite {
  /** SITE-01 … in anchor (screening) order. */
  id: string;
  /** Neutral reach descriptor from the anchor's latitude tercile inside the reach bbox. */
  reachPart: 'northern reach' | 'central reach' | 'southern reach';
  anchor: ChangeFeature;
  anchorId: string;
  centroid: [number, number];
  /** All member candidates, sorted by mapped area desc (ties: id asc). */
  members: ChangeFeature[];
  erosionCount: number;
  accretionCount: number;
  erosionArea: number;
  accretionArea: number;
  totalArea: number;
}

const EARTH_R_M = 6371000;

export function haversineM(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_M * Math.asin(Math.sqrt(s));
}

export function centroidOf(feature: ChangeFeature): [number, number] {
  const c = feature.properties.centroid;
  if (Array.isArray(c) && c.length >= 2) return [c[0], c[1]];
  return [0, 0];
}

const byAreaThenId = (a: ChangeFeature, b: ChangeFeature) =>
  b.properties.area_ha - a.properties.area_ha || String(a.properties.id).localeCompare(String(b.properties.id));

export interface SitesResult {
  sites: InvestigationSite[];
  /** Candidates not claimed by any site (still in the full ledger). */
  unassignedCount: number;
  unassignedArea: number;
}

export function buildSites(
  candidates: ChangeFeature[],
  anchors: ChangeFeature[],
  bbox: number[],
  radiusM: number = SITE_RADIUS_M,
): SitesResult {
  const claimed = new Map<string, number>(); // candidateId -> site index
  const raw: { anchor: ChangeFeature; members: ChangeFeature[] }[] = [];

  const sortedAnchors = [...anchors].sort(byAreaThenId);
  for (const anchor of sortedAnchors) {
    const anchorId = String(anchor.properties.id);
    if (claimed.has(anchorId)) continue; // inside an earlier, larger site's radius
    const centre = centroidOf(anchor);
    const members = candidates
      .filter((f) => !claimed.has(String(f.properties.id)))
      .map((f) => ({ f, d: haversineM(centre, centroidOf(f)) }))
      .filter(({ d }) => d <= radiusM)
      .sort((x, y) => x.d - y.d || byAreaThenId(x.f, y.f))
      .map(({ f }) => f);
    if (!members.length) continue;
    const idx = raw.length;
    members.forEach((f) => claimed.set(String(f.properties.id), idx));
    raw.push({ anchor, members });
  }

  const latMin = bbox[1];
  const latMax = bbox[3];
  const sites: InvestigationSite[] = raw.map((site, i) => {
    const members = [...site.members].sort(byAreaThenId);
    const erosion = members.filter((f) => f.properties.class === 'erosion');
    const accretion = members.filter((f) => f.properties.class === 'accretion');
    const sum = (list: ChangeFeature[]) => list.reduce((s, f) => s + f.properties.area_ha, 0);
    const centroid = centroidOf(site.anchor);
    const tercile = (centroid[1] - latMin) / Math.max(latMax - latMin, 1e-9);
    return {
      id: `SITE-${String(i + 1).padStart(2, '0')}`,
      reachPart: tercile >= 2 / 3 ? 'northern reach' : tercile >= 1 / 3 ? 'central reach' : 'southern reach',
      anchor: site.anchor,
      anchorId: String(site.anchor.properties.id),
      centroid,
      members,
      erosionCount: erosion.length,
      accretionCount: accretion.length,
      erosionArea: sum(erosion),
      accretionArea: sum(accretion),
      totalArea: sum(members),
    };
  });

  const unassigned = candidates.filter((f) => !claimed.has(String(f.properties.id)));
  return {
    sites,
    unassignedCount: unassigned.length,
    unassignedArea: unassigned.reduce((s, f) => s + f.properties.area_ha, 0),
  };
}
