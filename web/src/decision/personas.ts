// Decision Desk persona switcher — replaces the static "Same Evidence · Three Reads".
// Each persona reconfigures the screening-list order, the labels, and the export.
// Rankings use ONLY fields present in the bundle candidate properties
// (id, class, area_ha, pixel_count, centroid, confirmed_by_dswx). The bundle carries
// no population, nearest-place or CEGIS-reach values per candidate (all null), so no
// persona ranking may claim exposure weighting.
//
// THERE IS NO COMPOSITE SCORE IN THIS PRODUCT. V1's "Priority Index" was literally
// area ÷ largest area × 100 — a single measured quantity wearing a score's clothing —
// and V2 deletes it. A mapped change only earns a ranking signal when its magnitude
// exceeds the pair's measurement / co-registration uncertainty (Level-of-Detection
// logic, Leonard et al. 2020); until that gate is evaluated, area order is presented
// as exactly what it is: a screening order, not a risk ranking.
import type { ChangeFeature } from '../data/types';

export type PersonaId = 'disaster' | 'bwdb' | 'researcher' | 'char' | 'ngo' | 'educator';

export interface Persona {
  id: PersonaId;
  label: string;
  labelBn?: string;
  job: string;
  actions: [string, string, string];
  exportLabel: string;
  sliceNote: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'disaster',
    label: 'Disaster Officer',
    job: 'Decide whether to warn, prepare shelters, or pre-position relief — and what must be field-verified first.',
    actions: [
      'Read the Allowed / Not Allowed verdict before acting on any candidate.',
      'Task verification for the investigation sites with an owner and a deadline tied to the next NISAR pass.',
      'Issue the printable Field Verification Brief — it states on its face that it is not an evacuation order.',
    ],
    exportLabel: 'Generate Field Verification Brief',
    sliceNote: 'Union-level aggregation and household estimates are not in this bundle — shown as UNAVAILABLE, never invented.',
  },
  {
    id: 'bwdb',
    label: 'BWDB Manager',
    job: 'Decide where scarce bank-protection money and geobags go this season.',
    actions: [
      'Work the erosion-first screening list — accretion candidates are demoted in this mode.',
      'Compare each candidate against its run-level trust gates and maturity rung in the evidence drawer.',
      'Record observations and review conclusions — every transition is written to the audit log.',
    ],
    exportLabel: 'Generate Bank Protection Assessment Brief',
    sliceNote: 'Embankment/road proximity and protection status are not in this bundle — shown as UNAVAILABLE, never invented.',
  },
  {
    id: 'researcher',
    label: 'Researcher',
    job: 'Decide whether this pair supports any land-change claim at all, and what analysis would.',
    actions: [
      'Drag the ±1 dB threshold slider and watch the erosion area swing across the published sensitivity range.',
      'Inspect the decision-readiness panel: every QC gate, its status, and what it blocks.',
      'Open the full 4,571-candidate ledger — it lives in this mode only.',
    ],
    exportLabel: 'Generate Methods + Provenance Brief',
    sliceNote: 'Full ledger, un-collapsed QC, and granule-level provenance are exposed in this mode.',
  },
  {
    id: 'char',
    label: 'Union / Char Leader',
    labelBn: 'ইউনিয়ন / চর নেতা',
    job: 'Decide which places near the bank should be checked first, and what to prepare to move.',
    actions: [
      'নদীর পাড়ের সবচেয়ে বড় পরিবর্তনগুলো বড় অক্ষরে দেখুন — কোনো কারিগরি শব্দ ছাড়া।',
      'দুটি তারিখের রাডার ছবি মানচিত্রের ভেতরেই টেনে তুলনা করুন (সোয়াইপ)।',
      'Community Evidence Bulletin ছাপুন — Union Parishad-এর জন্য, যাচাই ছাড়া কোনো সিদ্ধান্ত নয়।',
    ],
    exportLabel: 'Print Community Evidence Bulletin',
    sliceNote: 'Radar saw the water change. We are not sure yet the land is gone. A field check comes first — no jargon, no dB.',
  },
  {
    id: 'ngo',
    label: 'NGO Field Coordinator',
    job: 'Decide where to send field teams this week and how to document change credibly.',
    actions: [
      'Take the screening list as a north-to-south route — priorities are ordered by latitude in this mode.',
      'Download the Investigation Pack per site: coordinates, checklist, maturity state.',
      'Record field observations; a reviewer conclusion — not the visit itself — is what verifies.',
    ],
    exportLabel: 'Generate Field Verification Pack',
    sliceNote: 'Route order is computed from candidate centroids in the bundle (DERIVED). Access notes are not in the bundle.',
  },
  {
    id: 'educator',
    label: 'Educator / Public',
    job: 'Understand how radar sees a river change — and why scientists sometimes must say “not yet.”',
    actions: [
      'Follow the three beats: the river changed stage → the radar saw classes switch → why we wait.',
      'Swipe between the two NISAR passes inside the map and watch bars emerge and water edges move.',
      'Try the threshold slider: change the rule by ±1 dB and the “answer” changes almost five-fold.',
    ],
    exportLabel: 'Generate Classroom Story Brief',
    sliceNote: 'Simplified view. The uncertainty itself is the lesson — no raw exports in this mode.',
  },
];

export const PERSONA_BY_ID: Record<PersonaId, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
) as Record<PersonaId, Persona>;

const byArea = (a: ChangeFeature, b: ChangeFeature) => b.properties.area_ha - a.properties.area_ha;

/** Persona re-ordering of the 24-candidate screening list, using bundle fields only.
 *  This is a presentation order for inspection, never a risk ranking. */
export function rankForPersona(features: ChangeFeature[], persona: PersonaId): ChangeFeature[] {
  const list = [...features];
  switch (persona) {
    case 'bwdb':
      // Erosion first (protection money follows land→water), then area.
      return list.sort((a, b) => {
        if (a.properties.class !== b.properties.class) return a.properties.class === 'erosion' ? -1 : 1;
        return byArea(a, b);
      });
    case 'ngo':
      // Route order: north → south by centroid latitude, so a field team can walk the list.
      return list.sort((a, b) => (b.properties.centroid?.[1] ?? 0) - (a.properties.centroid?.[1] ?? 0));
    default:
      return list.sort(byArea);
  }
}

export const CLASS_LABEL: Record<PersonaId, Record<string, string>> = {
  disaster: { erosion: 'Land → water', accretion: 'Water → land' },
  bwdb: { erosion: 'Land → water', accretion: 'Water → land' },
  researcher: { erosion: 'Land → water', accretion: 'Water → land' },
  char: { erosion: 'জমি → পানি (ভাঙন প্রার্থী)', accretion: 'পানি → জমি (নতুন চর প্রার্থী)' },
  ngo: { erosion: 'Land → water', accretion: 'Water → land' },
  educator: { erosion: 'Land became water (candidate)', accretion: 'Water became land (candidate)' },
};

/** Field-verification lifecycle states (see decision/lifecycle.ts for the machine). */
export type TaskStatus =
  | 'UNREVIEWED'
  | 'TASKED'
  | 'MONITORING'
  | 'OBSERVATION_RECEIVED'
  | 'VERIFIED'
  | 'REJECTED';

const STATUS_EN: Record<TaskStatus, string> = {
  UNREVIEWED: 'UNREVIEWED',
  TASKED: 'TASKED',
  MONITORING: 'MONITORING',
  OBSERVATION_RECEIVED: 'OBSERVATION RECEIVED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};

export const STATUS_LABEL: Record<PersonaId, Record<TaskStatus, string>> = {
  disaster: STATUS_EN,
  bwdb: STATUS_EN,
  researcher: STATUS_EN,
  char: {
    UNREVIEWED: 'অপর্যালোচিত',
    TASKED: 'যাচাইয়ের দায়িত্ব দেওয়া হয়েছে',
    MONITORING: 'পরের পাসে আবার দেখা হবে',
    OBSERVATION_RECEIVED: 'মাঠের পর্যবেক্ষণ এসেছে',
    VERIFIED: 'পর্যালোচনায় সত্যায়িত',
    REJECTED: 'পর্যালোচনায় বাতিল',
  },
  ngo: STATUS_EN,
  educator: {
    UNREVIEWED: 'Not checked yet',
    TASKED: 'Check assigned',
    MONITORING: 'Watch next pass',
    OBSERVATION_RECEIVED: 'Field note received',
    VERIFIED: 'Verified after review',
    REJECTED: 'Not real change',
  },
};
