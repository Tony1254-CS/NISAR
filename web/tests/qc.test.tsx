import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QCPanel } from '../src/panels/QCPanel';
import { useStore } from '../src/state/store';
import { QCCheck } from '../src/data/types';

vi.mock('../src/state/store', () => ({
  useStore: vi.fn()
}));

describe('QCPanel', () => {
  it('renders checks in the correct order', () => {
    const checks: QCCheck[] = [
      { id: 'c1', status: 'INFO' },
      { id: 'c2', status: 'FAIL' },
      { id: 'c3', status: 'PASS' },
      { id: 'c4', status: 'NOT_EVALUATED' },
      { id: 'c5', status: 'WARN' }
    ];

    (useStore as any).mockReturnValue({
      qc: { checks }
    });

    const html = renderToString(<QCPanel />);
    
    // We can parse the positions in the string to check order
    const posFail = html.indexOf('FAIL');
    const posWarn = html.indexOf('WARN');
    const posNA = html.indexOf('N/A');
    const posPass = html.indexOf('PASS');
    const posInfo = html.indexOf('INFO');

    expect(posFail).toBeLessThan(posWarn);
    expect(posWarn).toBeLessThan(posNA);
    expect(posNA).toBeLessThan(posPass);
    expect(posPass).toBeLessThan(posInfo);
    
    // Total count of rendered items matches
    const renderedIds = ['c1', 'c2', 'c3', 'c4', 'c5'].every(id => html.includes(id));
    expect(renderedIds).toBe(true);
  });
});
