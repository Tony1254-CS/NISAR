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
            inputs: [
              { granule: 'NISAR_L2_GCOV_ABC123' }
            ]
          }
        ]
      },
      setSelectedFeatureId: vi.fn()
    });

    const html = renderToString(<EvidencePanel />);
    expect(html).toContain('NISAR_L2_GCOV_ABC123');
    expect(html).toContain('ero-123');
  });
});
