// Decision Desk persona switcher — replaces the static "Same Evidence · Three Reads".
// Each persona reconfigures the triage queue ranking, the labels, and the export.
// Rankings use ONLY fields present in the bundle candidate properties
// (id, class, area_ha, pixel_count, centroid, confirmed_by_dswx). The bundle carries
// no population, nearest-place or CEGIS-reach values per candidate (all null), so no
// persona ranking may claim exposure weighting — see the Priority Index note in the UI.
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
      'Task verification for the top priorities with an owner and a deadline tied to the next NISAR pass.',
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
      'Work the erosion-first queue — accretion candidates are demoted in this mode.',
      'Compare each candidate against its run-level trust gates in the evidence drawer.',
      'Mark candidates Monitor or Dismiss with a reason — every call is written to the audit log.',
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
      'Inspect per-candidate provenance and the full run-level QC gates in the evidence drawer.',
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
      'দুটি তারিখের রাডার ছবি পাশাপাশি টেনে তুলনা করুন (সোয়াইপ)।',
      'মাঠ যাচাইয়ের জন্য জায়গা ঠিক করুন — যাচাই ছাড়া কোনো সিদ্ধান্ত নয়।',
    ],
    exportLabel: 'Household Move Checklist (print brief)',
    sliceNote: 'Radar saw the water change. We are not sure yet the land is gone. A field check comes first — no jargon, no dB.',
  },
  {
    id: 'ngo',
    label: 'NGO Field Coordinator',
    job: 'Decide where to send field teams this week and how to document change credibly.',
    actions: [
      'Take the queue as a north-to-south route — priorities are ordered by latitude in this mode.',
      'Open each candidate checklist in the drawer: photo points, GPS bankline, status.',
      'Record verification outcomes — Verified / Rejected flips re-rank everyone else’s queue.',
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
      'Swipe between the two NISAR passes and watch bars emerge and water edges move.',
      'Try the threshold slider: change the rule by ±1 dB and the “answer” changes almost five-fold.',
    ],
    exportLabel: 'Generate Classroom Story Brief',
    sliceNote: 'Simplified view. The uncertainty itself is the lesson — no raw exports in this mode.',
  },
];

export const PERSONA_BY_ID: Record<PersonaId, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.id, p]),
) as Record<PersonaId, Persona>;

/** Priority Index (DERIVED). The bundle has no per-candidate exposure or persistence
 *  fields, so the only defensible ranking signal present is mapped area.
 *  PI = 100 × area_ha ÷ largest candidate area_ha. Formula is printed beside the queue. */
export function priorityIndex(feature: ChangeFeature, maxArea: number): number {
  if (!maxArea) return 0;
  return Math.round((feature.properties.area_ha / maxArea) * 1000) / 10;
}

const byArea = (a: ChangeFeature, b: ChangeFeature) => b.properties.area_ha - a.properties.area_ha;

/** Persona re-ranking of the 24 priorities, using bundle fields only. */
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
      // Route order: north → south by centroid latitude, so a field team can walk the queue.
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

export type TaskStatus = 'UNREVIEWED' | 'TASKED' | 'MONITORING' | 'VERIFIED' | 'REJECTED';

export const STATUS_LABEL: Record<PersonaId, Record<TaskStatus, string>> = {
  disaster: { UNREVIEWED: 'UNREVIEWED', TASKED: 'TASKED', MONITORING: 'MONITOR', VERIFIED: 'VERIFIED', REJECTED: 'REJECTED' },
  bwdb: { UNREVIEWED: 'UNREVIEWED', TASKED: 'TASKED', MONITORING: 'MONITOR', VERIFIED: 'VERIFIED', REJECTED: 'REJECTED' },
  researcher: { UNREVIEWED: 'UNREVIEWED', TASKED: 'TASKED', MONITORING: 'MONITOR', VERIFIED: 'VERIFIED', REJECTED: 'REJECTED' },
  char: { UNREVIEWED: 'অপর্যালোচিত', TASKED: 'যাচাইয়ের দায়িত্ব দেওয়া হয়েছে', MONITORING: 'পরের পাসে আবার দেখা হবে', VERIFIED: 'মাঠে যাচাই হয়েছে', REJECTED: 'বাতিল' },
  ngo: { UNREVIEWED: 'UNREVIEWED', TASKED: 'TASKED', MONITORING: 'MONITOR', VERIFIED: 'VERIFIED', REJECTED: 'REJECTED' },
  educator: { UNREVIEWED: 'Not checked yet', TASKED: 'Check assigned', MONITORING: 'Watch next pass', VERIFIED: 'Checked in the field', REJECTED: 'Not real change' },
};
