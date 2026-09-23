import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Loading } from '../src/states/Loading';
import { ErrorState } from '../src/states/ErrorState';
import { OutsideCoverage } from '../src/states/OutsideCoverage';
import { Inconclusive } from '../src/states/Inconclusive';

describe('State Screens', () => {
  it('renders Loading', () => {
    const html = renderToString(<Loading />);
    expect(html).toContain('Loading radar passes...');
  });

  it('renders ErrorState', () => {
    const html = renderToString(<ErrorState filename="manifest.json" onRetry={() => {}} />);
    expect(html).toContain('manifest.json');
    expect(html).toContain('Retry');
  });

  it('renders OutsideCoverage', () => {
    const html = renderToString(<OutsideCoverage onFlyBack={() => {}} />);
    expect(html).toContain('No processed radar here');
    expect(html).toContain('Jamuna Kazipur');
  });

  it('renders Inconclusive with pair', () => {
    const html = renderToString(<Inconclusive hasPair={true} failingChecks={['null_test']} />);
    expect(html).toMatch(/Result inconclusive:.*null_test/);
  });

  it('renders Inconclusive without pair', () => {
    const html = renderToString(<Inconclusive hasPair={false} noPairReason="No pair" />);
    expect(html).toMatch(/Match the water:.*No pair/);
  });
});
