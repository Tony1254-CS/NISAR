import { create } from 'zustand';
import { ReachDetail, Manifest, Stage, QC } from '../data/types';

interface CompareState {
  active: boolean;
  t0: string | null;
  t1: string | null;
}

interface LayersState {
  water: boolean;
  change: boolean;
  forecast: boolean;
  optical: boolean;
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
  layers: { water: false, change: false, forecast: false, optical: false },
  panel: 'none',
  flyInDone: false,
  
  setReachId: (id) => set({ reachId: id }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setCompare: (compare) => set((state) => ({ compare: { ...state.compare, ...compare } })),
  setPanel: (panel) => set({ panel }),
}));
