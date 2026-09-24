import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { EvidencePanel } from '../src/panels/EvidencePanel';
import { useStore } from '../src/state/store';

vi.mock('../src/state/store', () => ({
  useStore: vi.fn()
}));

describe('EvidencePanel', () => {
  it('renders a real granule ID string from manifest', () => {
    (useStore as any).mockReturnValue({
      selectedFeatureId: 'ero-123',
      manifest: {
        metrics: [
          {
            id: 'erosion_area',
            label: 'Land lost to the river',
            value: 42,
            unit: 'ha',
            inputs: [
              { kind: 'NISAR_GCOV', granule: 'NISAR_L2_GCOV_ABC123' }
            ]
          }
        ]
      },
      reach: { headline_metric_id: 'erosion_area' },
      stage: null,
      qc: null,
      erosion: null,
      accretion: null,
      setSelectedFeatureId: vi.fn()
    });

    const html = renderToString(<EvidencePanel />);
    expect(html).toContain('NISAR_L2_GCOV_ABC123');
    expect(html).toContain('ero-123');
  });
});
