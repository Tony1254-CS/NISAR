import { Manifest, ReachDetail } from './types';

export class DataLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataLoadError";
  }
}

export async function fetchManifest(baseUrl: string): Promise<Manifest> {
  const res = await fetch(`${baseUrl}/manifest.json`);
  if (!res.ok) {
    throw new DataLoadError(`Failed to load manifest: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.metrics) {
    throw new DataLoadError("Malformed manifest: missing metrics");
  }
  return data as Manifest;
}

export async function fetchReach(baseUrl: string): Promise<ReachDetail> {
  const res = await fetch(`${baseUrl}/reach.json`);
  if (!res.ok) {
    throw new DataLoadError(`Failed to load reach: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.dates) {
    throw new DataLoadError("Malformed reach: missing dates");
  }
  return data as ReachDetail;
}
