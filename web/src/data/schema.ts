import type {
  ReachListItem,
  ReachDetail,
  Manifest,
  Stage,
  QC,
  Bounds,
  ChangeFeatureCollection,
} from './types';

// Hand-written runtime validators mirroring schemas/*.json (Section 13.3).
// Kept in sync with the generated types in types.ts and unit-tested against
// the fixtures in web/tests/fixtures (copied from real pipeline output).

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isReachListItem(v: unknown): v is ReachListItem {
  return (
    isObject(v) &&
    typeof v.reach_id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.river === 'string' &&
    Array.isArray(v.bbox) &&
    typeof v.verdict === 'string' &&
    typeof v.data_frozen_at === 'string' &&
    typeof v.bundle_version === 'string'
  );
}

export function isReaches(v: unknown): v is ReachListItem[] {
  return Array.isArray(v) && v.every(isReachListItem);
}

export function isReachDetail(v: unknown): v is ReachDetail {
  return (
    isObject(v) &&
    typeof v.reach_id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.river === 'string' &&
    Array.isArray(v.bbox) &&
    Array.isArray(v.dates) &&
    (v.primary_pair === null || v.primary_pair === undefined || isObject(v.primary_pair)) &&
    typeof v.verdict === 'string' &&
    typeof v.headline_metric_id === 'string'
  );
}

export function isManifest(v: unknown): v is Manifest {
  return (
    isObject(v) &&
    typeof v.reach_id === 'string' &&
    Array.isArray(v.metrics) &&
    v.metrics.every(
      (m) =>
        isObject(m) &&
        typeof m.id === 'string' &&
        typeof m.label === 'string' &&
        typeof m.value === 'number' &&
        typeof m.unit === 'string'
    )
  );
}

export function isStage(v: unknown): v is Stage {
  return (
    isObject(v) &&
    isObject(v.station) &&
    Array.isArray(v.series) &&
    Array.isArray(v.acquisitions) &&
    (v.mode === 'gauge' || v.mode === 'proxy')
  );
}

export function isQC(v: unknown): v is QC {
  return (
    isObject(v) &&
    Array.isArray(v.checks) &&
    v.checks.every(
      (c) =>
        isObject(c) &&
        typeof c.id === 'string' &&
        ['PASS', 'WARN', 'FAIL', 'NOT_EVALUATED', 'INFO'].includes(c.status as string)
    )
  );
}

export function isBounds(v: unknown): v is Bounds {
  return (
    isObject(v) &&
    Array.isArray(v.coordinates) &&
    v.coordinates.length > 0 &&
    Array.isArray(v.coordinates[0])
  );
}

export function isFeatureCollection(v: unknown): v is ChangeFeatureCollection {
  return isObject(v) && v.type === 'FeatureCollection' && Array.isArray(v.features);
}
