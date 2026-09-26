import { create } from 'zustand';
import { ReachDetail, Manifest, Stage, QC, Bounds, ChangeFeatureCollection } from '../data/types';
import type { ReachBundle } from '../data/load';

interface CompareState {
  active: boolean;
  t0: string | null;
  t1: string | null;
}

interface LayersState {
  water: boolean;
  accretion: boolean;
  erosion: boolean;
  ambiguous: boolean;
  forecast: boolean;
}

type PanelType = 'none' | 'evidence' | 'qc';

interface StoreState {
  agenticWorkflowOpen: boolean;
  reachId: string | null;
  reach: ReachDetail | null;
  manifest: Manifest | null;
  stage: Stage | null;
  qc: QC | null;
  bounds: Bounds | null;
  erosion: ChangeFeatureCollection | null;
  accretion: ChangeFeatureCollection | null;

  selectedDate: string | null;
  compare: CompareState;
  selectedFeatureId: string | null;
  layers: LayersState;
  panel: PanelType;
  flyInDone: boolean;
  
  
  // Actions
  setAgenticWorkflowOpen: (open: boolean) => void;
  setReachId: (id: string | null) => void;
  setSelectedDate: (date: string | null) => void;
  setCompare: (compare: Partial<CompareState>) => void;
  setPanel: (panel: PanelType) => void;
  setSelectedFeatureId: (id: string | null) => void;
  setLayers: (update: Partial<LayersState>) => void;
  loadBundle: (reachId: string, bundle: ReachBundle) => void;
  clearBundle: () => void;
}

export const useStore = create<StoreState>((set) => ({
  agenticWorkflowOpen: false,
  reachId: null,
  reach: null,
  manifest: null,
  stage: null,
  qc: null,
  bounds: null,
  erosion: null,
  accretion: null,

  selectedDate: null,
  compare: { active: false, t0: null, t1: null },
  selectedFeatureId: null,
  layers: { water: false, accretion: true, erosion: true, ambiguous: true, forecast: false },
  panel: 'none',
  flyInDone: false,
  
  setAgenticWorkflowOpen: (open) => set({ agenticWorkflowOpen: open }),
  setReachId: (id) => set({ reachId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setCompare: (compare) => set((state) => ({ compare: { ...state.compare, ...compare } })),
  setPanel: (panel) => set({ panel }),
  setSelectedFeatureId: (id) => set({ selectedFeatureId: id }),
  setLayers: (update) => set((state) => ({ layers: { ...state.layers, ...update } })),
  loadBundle: (reachId, bundle) =>
    set((state) => {
      const okDates = bundle.reach.dates.filter((d) => d.status === 'ok');
      const latest = okDates.length > 0 ? okDates[okDates.length - 1].date : null;
      return {
        reachId,
        reach: bundle.reach,
        manifest: bundle.manifest,
        stage: bundle.stage,
        qc: bundle.qc,
        bounds: bundle.bounds,
        erosion: bundle.erosion,
        accretion: bundle.accretion,
        selectedDate: state.selectedDate ?? latest,
      };
    }),
  clearBundle: () =>
    set({
      reach: null,
      manifest: null,
      stage: null,
      qc: null,
      bounds: null,
      erosion: null,
      accretion: null,
      selectedDate: null,
    }),
}));
