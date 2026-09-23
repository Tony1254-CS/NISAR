import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Headline } from '../src/panels/Headline';
import { useStore } from '../src/state/store';
import fs from 'fs';
import path from 'path';

vi.mock('../src/state/store', () => ({
  useStore: vi.fn()
}));

describe('Headline', () => {
  it('renders metric value verbatim from manifest', () => {
    (useStore as any).mockReturnValue({
      reach: { headline_metric_id: 'm1' },
      manifest: {
        metrics: [{ id: 'm1', value: 123.456, label: 'Erosion', unit: 'ha' }]
      }
    });

    const html = renderToString(<Headline />);
    expect(html).toContain('123.456');
    expect(html).toContain('Erosion');
    expect(html).toContain('ha');
    
    // Check that we didn't hardcode a value
    const sourceCode = fs.readFileSync(path.join(__dirname, '../src/panels/Headline.tsx'), 'utf8');
    expect(sourceCode).not.toContain('123.456');
  });
});
