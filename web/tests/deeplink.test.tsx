import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDeepLink } from '../src/state/useDeepLink';
import { useStore } from '../src/state/store';

describe('useDeepLink', () => {
  beforeEach(() => {
    // Reset window.location
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/?reach=jamuna-1&t0=20260601&t1=20260613&feature=ero-1'),
      writable: true
    });
    
    // Reset store
    useStore.setState({
      reachId: null,
      compare: { active: false, t0: null, t1: null },
      selectedFeatureId: null
    });
  });

  it('reads state from URL params on mount', () => {
    renderHook(() => useDeepLink());
    
    const state = useStore.getState();
    expect(state.reachId).toBe('jamuna-1');
    expect(state.compare.active).toBe(true);
    expect(state.compare.t0).toBe('20260601');
    expect(state.compare.t1).toBe('20260613');
    expect(state.selectedFeatureId).toBe('ero-1');
  });
});
