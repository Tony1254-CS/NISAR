import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Hydrograph } from '../src/hydrograph/Hydrograph';
import { useStore } from '../src/state/store';
import fs from 'fs';
import path from 'path';

describe('Hydrograph', () => {
  it('renders acquisition ticks based on stage data', () => {
    const stagePath = path.join(__dirname, 'fixtures', 'stage.json');
    const stage = JSON.parse(fs.readFileSync(stagePath, 'utf8'));
    
    useStore.setState({ stage });
    
    const html = renderToString(<Hydrograph width={800} height={150} />);
    
    // There are 2 'ok' acquisitions in the fixture
    const okCount = stage.acquisitions.filter((a: any) => a.status === 'ok').length;
    expect(okCount).toBe(2);
    
    // We render a <rect> for each tick, so we expect two rects inside the SVG
    const rectCount = (html.match(/<rect/g) || []).length;
    expect(rectCount).toBe(2); // one for each tick
    
    // Danger line should be there
    expect(html).toContain('Danger Level');
  });
});
