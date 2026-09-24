import { Manifest, ReachDetail, ReachListItem, Stage, QC, Bounds, ChangeFeatureCollection } from './types';
import {
  isReaches,
  isReachDetail,
  isManifest,
  isStage,
  isQC,
  isBounds,
  isFeatureCollection,
} from './schema';

export class DataLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataLoadError';
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new DataLoadError(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchReaches(dataBase = '/data/v1'): Promise<ReachListItem[]> {
  const data = await fetchJson(`${dataBase}/reaches.json`);
  if (!isReaches(data)) {
    throw new DataLoadError('Malformed reaches.json: does not match Reach[] schema');
  }
  return data;
}

export async function fetchManifest(baseUrl: string): Promise<Manifest> {
  const data = await fetchJson(`${baseUrl}/manifest.json`);
  if (!isManifest(data)) {
    throw new DataLoadError('Malformed manifest: missing metrics');
  }
  return data;
}

export async function fetchReach(baseUrl: string): Promise<ReachDetail> {
  const data = await fetchJson(`${baseUrl}/reach.json`);
  if (!isReachDetail(data)) {
    throw new DataLoadError('Malformed reach: missing dates');
  }
  return data;
}

export async function fetchStage(baseUrl: string): Promise<Stage> {
  const data = await fetchJson(`${baseUrl}/stage.json`);
  if (!isStage(data)) {
    throw new DataLoadError('Malformed stage.json');
  }
  return data;
}

export async function fetchQC(baseUrl: string): Promise<QC | null> {
  try {
    const data = await fetchJson(`${baseUrl}/qc.json`);
    if (!isQC(data)) {
      throw new DataLoadError('Malformed qc.json');
    }
    return data;
  } catch {
    // Missing qc.json -> all checks NOT_EVALUATED (Section 13.2)
    return null;
  }
}

export async function fetchBounds(baseUrl: string): Promise<Bounds> {
  const data = await fetchJson(`${baseUrl}/bounds.json`);
  if (!isBounds(data)) {
    throw new DataLoadError('Malformed bounds.json');
  }
  return data;
}

export async function fetchChangeGeoJSON(url: string): Promise<ChangeFeatureCollection | null> {
  try {
    const data = await fetchJson(url);
    if (!isFeatureCollection(data)) {
      throw new DataLoadError(`Malformed FeatureCollection at ${url}`);
    }
    return data;
  } catch {
    // Missing layer file -> layer hidden (Section 13.2)
    return null;
  }
}

export interface ReachBundle {
  reach: ReachDetail;
  manifest: Manifest;
  stage: Stage;
  qc: QC | null;
  bounds: Bounds;
  erosion: ChangeFeatureCollection | null;
  accretion: ChangeFeatureCollection | null;
}

export async function loadReachBundle(reachId: string, dataBase = '/data/v1'): Promise<ReachBundle> {
  const baseUrl = `${dataBase}/${reachId}`;
  const [reach, manifest, stage, bounds, qc, erosion, accretion] = await Promise.all([
    fetchReach(baseUrl),
    fetchManifest(baseUrl),
    fetchStage(baseUrl),
    fetchBounds(baseUrl),
    fetchQC(baseUrl),
    fetchChangeGeoJSON(`${baseUrl}/erosion.geojson`),
    fetchChangeGeoJSON(`${baseUrl}/accretion.geojson`),
  ]);
  return { reach, manifest, stage, qc, bounds, erosion, accretion };
}
