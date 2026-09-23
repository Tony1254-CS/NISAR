import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MatchWaterButton } from '../src/hydrograph/MatchWaterButton';
import { useStore } from '../src/state/store';

vi.mock('../src/state/store', () => ({
  useStore: vi.fn()
}));

describe('MatchWaterButton', () => {
  it('renders correctly', () => {
    (useStore as any).mockReturnValue({
      reach: {
        primary_pair: { t0: '20260601', t1: '20260613', type: 'equal_stage' }
      },
      compare: { active: false },
      setCompare: vi.fn()
    });

    const html = renderToString(<MatchWaterButton />);
    expect(html).toContain('Match the water');
  });
});
