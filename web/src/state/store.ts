import { create } from 'zustand';
import { ReachDetail, Manifest, Stage, QC } from '../data/types';

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
  reachId: string | null;
  reach: ReachDetail | null;
  manifest: Manifest | null;
  stage: Stage | null;
  qc: QC | null;
  
  selectedDate: string | null;
  compare: CompareState;
  selectedFeatureId: string | null;
  layers: LayersState;
  panel: PanelType;
  flyInDone: boolean;
  
  // Actions
  setReachId: (id: string | null) => void;
  setSelectedDate: (date: string | null) => void;
  setCompare: (compare: Partial<CompareState>) => void;
  setPanel: (panel: PanelType) => void;
  setSelectedFeatureId: (id: string | null) => void;
  setLayers: (update: Partial<LayersState>) => void;
}

export const useStore = create<StoreState>((set) => ({
  reachId: null,
  reach: null,
  manifest: null,
  stage: null,
  qc: null,
  
  selectedDate: null,
  compare: { active: false, t0: null, t1: null },
  selectedFeatureId: null,
  layers: { water: false, accretion: true, erosion: true, ambiguous: true, forecast: false },
  panel: 'none',
  flyInDone: false,
  
  setReachId: (id) => set({ reachId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setCompare: (compare) => set((state) => ({ compare: { ...state.compare, ...compare } })),
  setPanel: (panel) => set({ panel }),
  setSelectedFeatureId: (id) => set({ selectedFeatureId: id }),
  setLayers: (update) => set((state) => ({ layers: { ...state.layers, ...update } })),
}));
