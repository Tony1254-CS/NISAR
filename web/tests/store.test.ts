import { describe, it, expect } from 'vitest';
import { useStore } from '../src/state/store';

describe('Store', () => {
  it('has exact shape from §20.3', () => {
    const state = useStore.getState();
    
    // Check keys
    expect(state).toHaveProperty('reachId');
    expect(state).toHaveProperty('reach');
    expect(state).toHaveProperty('manifest');
    expect(state).toHaveProperty('stage');
    expect(state).toHaveProperty('qc');
    expect(state).toHaveProperty('selectedDate');
    expect(state).toHaveProperty('compare');
    expect(state).toHaveProperty('selectedFeatureId');
    expect(state).toHaveProperty('layers');
    expect(state).toHaveProperty('panel');
    expect(state).toHaveProperty('flyInDone');
    
    // Check initial values
    expect(state.compare).toEqual({ active: false, t0: null, t1: null });
    expect(state.panel).toBe('none');
  });
  
  it('handles state transitions', () => {
    useStore.getState().setSelectedDate('20260601');
    expect(useStore.getState().selectedDate).toBe('20260601');
    
    useStore.getState().setCompare({ active: true, t0: '20260601', t1: '20260613' });
    expect(useStore.getState().compare.active).toBe(true);
    expect(useStore.getState().compare.t0).toBe('20260601');
    
    useStore.getState().setPanel('qc');
    expect(useStore.getState().panel).toBe('qc');
  });
});
