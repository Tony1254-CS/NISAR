import { useEffect, useRef } from 'react';
import { useStore } from './store';

export function useDeepLink() {
  const store = useStore();
  const initialized = useRef(false);

  // 1. Initial read from URL
  useEffect(() => {
    if (initialized.current) return;
    
    const params = new URLSearchParams(window.location.search);
    
    const reachParam = params.get('reach');
    if (reachParam) store.setReachId(reachParam);
    
    const t0Param = params.get('t0');
    const t1Param = params.get('t1');
    if (t0Param && t1Param) {
      store.setCompare({ active: true, t0: t0Param, t1: t1Param });
    }
    
    const featureParam = params.get('feature');
    if (featureParam) {
      store.setSelectedFeatureId(featureParam);
    }
    
    initialized.current = true;
  }, [store]);

  // 2. Sync state changes to URL
  useEffect(() => {
    if (!initialized.current) return;
    
    const params = new URLSearchParams();
    
    if (store.reachId) params.set('reach', store.reachId);
    if (store.compare.active && store.compare.t0 && store.compare.t1) {
      params.set('t0', store.compare.t0);
      params.set('t1', store.compare.t1);
    }
    if (store.selectedFeatureId) {
      params.set('feature', store.selectedFeatureId);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [store.reachId, store.compare.active, store.compare.t0, store.compare.t1, store.selectedFeatureId]);
}
