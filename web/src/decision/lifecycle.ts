// Field-verification lifecycle + FluviSAR evidence protocol.
//
// LIFECYCLE (replaces V1's one-click "Mark field-verified", which let a satellite
// candidate become "verified" with no ground evidence at all):
//
//   UNREVIEWED → TASKED → MONITORING → OBSERVATION_RECEIVED → reviewed →
//     conclusion CORROBORATES → VERIFIED
//     conclusion CONTRADICTS  → REJECTED
//     conclusion UNRESOLVED   → back to MONITORING
//   DISMISS (reason required) → REJECTED, from any pre-observation state.
//
// An observation is evidence ABOUT the candidate; it never edits the satellite
// record. Only a recorded reviewer conclusion can close a candidate — the UNOSAT
// pattern ("preliminary analysis — not yet validated in the field") made executable.
// All state is local to this browser (localStorage) and is labelled as such in the UI.
import type { QCCheck } from '../data/types';
import type { TaskStatus } from './personas';

export type { TaskStatus };

export type BankCondition = 'erosion' | 'deposition' | 'stable' | 'uncertain';
export type ReviewConclusion = 'CORROBORATES' | 'CONTRADICTS' | 'UNRESOLVED';

export interface FieldObservation {
  observerRole: string;
  observedAt: string; // ISO datetime from the form
  gpsNote: string;
  bankCondition: BankCondition;
  photoRef: string;
}

export interface FieldReview {
  conclusion: ReviewConclusion;
  reviewerRole: string;
  reason: string;
  reviewedAt: string; // ISO timestamp set when the review is recorded
}

export interface FieldRecord {
  status: TaskStatus;
  owner: string;
  deadline: string;
  dismissReason: string;
  observation: FieldObservation | null;
  review: FieldReview | null;
}

export const EMPTY_RECORD: FieldRecord = {
  status: 'UNREVIEWED',
  owner: '',
  deadline: '',
  dismissReason: '',
  observation: null,
  review: null,
};

export interface AuditEntry {
  ts: string;
  featureId: string;
  action: string;
  detail: string;
}

/** Status a candidate lands in after a review conclusion is recorded. */
export function statusAfterReview(conclusion: ReviewConclusion): TaskStatus {
  if (conclusion === 'CORROBORATES') return 'VERIFIED';
  if (conclusion === 'CONTRADICTS') return 'REJECTED';
  return 'MONITORING';
}

// ── FluviSAR evidence protocol (the "maturity ladder") ────────────────────────
// FluviSAR's OWN protocol, informed by published change-detection practice —
// Leonard et al. (2020): a measurement is only significant if the change exceeds
// the co-registration / digitisation uncertainty (Level-of-Detection logic);
// Olofsson et al. (2014): mapped area is not true area without independent
// reference data. It is NOT a NISAR or USGS standard and is labelled as such in
// the UI. Rung states are computed only from bundle QC + the field record.

export type RungState = 'reached' | 'blocked' | 'pending' | 'not_evaluated' | 'locked';

export interface MaturityRung {
  n: number;
  label: string;
  state: RungState;
  note: string;
}

export function candidateMaturity(
  record: FieldRecord,
  qcChecks: QCCheck[],
  nextPassLabel: string,
): MaturityRung[] {
  const qc = (id: string) => qcChecks.find((c) => c.id === id);
  const plausibility = qc('plausibility');
  const alignment = qc('alignment');
  const persistence = qc('persistence');
  const dswx = qc('dswx_agreement');
  const verified = record.status === 'VERIFIED';

  return [
    {
      n: 1,
      label: 'Transition candidate',
      state: 'reached',
      note: 'Mapped land↔water class switch between the two NISAR passes. A candidate is a question, not a finding.',
    },
    {
      n: 2,
      label: 'QC eligible — RFI screened + Level-of-Detection gate',
      state: 'blocked',
      note:
        `Run-level gates do not clear this rung for any candidate in this run: plausibility is ${plausibility?.status ?? 'NOT_EVALUATED'} ` +
        `(mapped area is an order of magnitude above the CEGIS reference scale), and the co-registration / ` +
        `Level-of-Detection check is ${alignment?.status ?? 'NOT_EVALUATED'} in this bundle — so no candidate's change ` +
        `has yet been shown to exceed measurement uncertainty. RFI screening is WARN (swath-edge band, both dates).`,
    },
    {
      n: 3,
      label: 'Temporally persistent',
      state: persistence && persistence.status === 'PASS' ? 'reached' : 'pending',
      note: `PENDING — persistence is ${persistence?.status ?? 'NOT_EVALUATED'} (no later acquisition in this run). ` +
        `Resolves at the next same-track NISAR pass (${nextPassLabel}) at comparable stage, with Sentinel-1 as the designed tie-breaker (Freihardt & Frey 2023 lineage).`,
    },
    {
      n: 4,
      label: 'Independently corroborated',
      state: dswx && dswx.status === 'PASS' ? 'reached' : 'not_evaluated',
      note: `NOT EVALUATED — DSWx agreement is ${dswx?.status ?? 'NOT_EVALUATED'} in this bundle, and the OPERA DSWx-S1 ` +
        `layer in the bundle was acquired 17 Jun 2026 — it predates the NISAR pair, so it is context, not same-date corroboration.`,
    },
    {
      n: 5,
      label: 'Field verified',
      state: verified ? 'reached' : 'locked',
      note: verified
        ? 'Reached: a recorded field observation was reviewed and the reviewer concluded it corroborates the candidate.'
        : 'Locked until a field observation is recorded AND a reviewer concludes it corroborates. A visit alone never verifies.',
    },
  ];
}

/** Highest rung a candidate has demonstrably reached (for compact display). */
export function maturityHeadline(record: FieldRecord): string {
  return record.status === 'VERIFIED' ? 'Rung 5 of 5 · field verified' : 'Rung 1 of 5 · transition candidate';
}
