import { describe, it, expect, vi } from 'vitest';
import { fetchManifest, fetchReach, DataLoadError } from '../src/data/load';
import fs from 'fs';
import path from 'path';

describe('Data Loading', () => {
  it('loads valid manifest', async () => {
    const manifestPath = path.join(__dirname, 'fixtures', 'manifest.json');
    const content = fs.readFileSync(manifestPath, 'utf8');
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => JSON.parse(content)
    });
    
    const manifest = await fetchManifest('/dummy');
    expect(manifest.reach_id).toBe('dummy');
    expect(manifest.metrics.length).toBeGreaterThan(0);
  });
  
  it('throws typed error on malformed manifest', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reach_id: 'bad' }) // missing metrics
    });
    
    await expect(fetchManifest('/dummy')).rejects.toThrow(DataLoadError);
    await expect(fetchManifest('/dummy')).rejects.toThrow(/missing metrics/);
  });
});
