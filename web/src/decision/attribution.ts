// Change attribution + generated survey objectives — Decision Desk V5.
//
// Two capabilities the red-team judge review found missing, built only from
// what the bundle actually carries:
//
// 1. CHANGE ATTRIBUTION — for the selected candidate, a structured contest
//    between the physical explanations a two-date NISAR pair can produce
//    (bank retreat / stage-driven inundation or emergence / sediment or
//    backscatter-response change / classification-or-registration artifact).
//    Each hypothesis carries what would support it, what would kill it, and
//    a STANDING computed only from the bundle's own qc.json check statuses
//    plus the candidate's field record. No hypothesis can render as
//    confirmed on this bundle — standings are rule-derived from check
//    states (PASS / WARN / NOT_EVALUATED / INFO), never scored or weighted.
//
// 2. SURVEY OBJECTIVE — a per-site field instruction paragraph templated
//    deterministically from bundle data: site composition, anchor, stage
//    context, the severity-ordered blocking gates, and the ground-truth
//    checklist. It invents nothing — no place names (the bundle carries
//    none), no asset claims (per-candidate context fields are null), and
//    no damage language: the candidates are inconclusive by run verdict.
import type { ChangeFeature, QCCheck } from '../data/types';
import type { FieldRecord } from './lifecycle';
import type { InvestigationSite } from './sites';

export interface HypothesisRow {
  id: 'bank_retreat' | 'stage_effect' | 'sediment_or_response' | 'artifact';
  hypothesis: string;
  /** Evidence that would support this explanation. */
  support: string;
  /** Evidence that would kill this explanation. */
  kill: string;
  /** Short standing label — never a confirmation on this bundle. */
  standing: string;
  /** Why — computed from the bundle checks and the field record. */
  reason: string;
}

const qcById = (checks: QCCheck[], id: string) => checks.find((c) => c.id === id);
const fmt0 = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 });
const signed = (v: number, digits = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(digits)}`;

export interface StageFacts {
  delta: number | null;
  tolerance: number | null;
  status: string;
}

/** Stage-match facts read from the bundle's own stage_match check (value + rule). */
export function stageFacts(checks: QCCheck[]): StageFacts {
  const stage = qcById(checks, 'stage_match');
  const ruleTol = stage?.rule ? /<=\s*([\d.]+)/.exec(stage.rule) : null;
  return {
    delta: typeof stage?.value === 'number' ? stage.value : null,
    tolerance: ruleTol ? Number(ruleTol[1]) : null,
    status: stage?.status ?? 'NOT_EVALUATED',
  };
}

/** One-line stage context, e.g. "stage proxy Δ +0.039 vs the ±0.02 stage-match tolerance (stage_match: WARN)". */
export function stageContextLine(checks: QCCheck[]): string {
  const { delta, tolerance, status } = stageFacts(checks);
  if (delta == null) return `stage match is ${status} in this bundle`;
  const tol = tolerance != null ? tolerance.toFixed(2) : '0.02';
  return `stage proxy Δ ${signed(delta)} vs the ±${tol} stage-match tolerance (stage_match: ${status})`;
}

export interface AttributionContext {
  /** Formatted date the persistence rung resolves, e.g. "01 Oct 2026". */
  nextPassLabel: string;
  /** Erosion-metric sensitivity triple from the manifest (null when absent). */
  sensitivity: { low: number; value: number; high: number } | null;
}

export function candidateAttribution(
  feature: ChangeFeature,
  record: FieldRecord,
  checks: QCCheck[],
  ctx: AttributionContext,
): HypothesisRow[] {
  const isErosion = feature.properties.class === 'erosion';
  const persistence = qcById(checks, 'persistence');
  const rainfall = qcById(checks, 'rainfall_anomaly');
  const sensitivityCheck = qcById(checks, 'threshold_sensitivity');
  const alignment = qcById(checks, 'alignment');
  const nullTest = qcById(checks, 'null_test');
  const stage = stageFacts(checks);
  const stageLine = stageContextLine(checks);
  const fieldCorroborated = record.status === 'VERIFIED' && record.review?.conclusion === 'CORROBORATES';

  // ── 1 · The physical claim itself ────────────────────────────────────────
  const retreat: HypothesisRow = {
    id: 'bank_retreat',
    hypothesis: isErosion
      ? 'Bank retreat — real geomorphic change'
      : 'Real new land — deposition that persists',
    support: isErosion
      ? 'The polygon is still water at the next comparable-stage pass, AND a reviewed field observation finds a fresh scarp or collapsed bank at this location.'
      : 'The polygon is still land at the next comparable-stage pass, AND a reviewed field observation finds newly deposited material standing above the waterline.',
    kill: isErosion
      ? 'The polygon re-floods or re-emerges at the next pass, or a reviewed field observation finds the bank intact.'
      : 'The polygon is water again at the next pass, or a reviewed field observation finds only a transient bar surface at the t1 waterline.',
    standing: fieldCorroborated ? 'FIELD-CORROBORATED · RADAR CLAIM STILL UNRESOLVED' : 'UNPROVEN',
    reason: fieldCorroborated
      ? `A reviewed field observation corroborates this candidate — reviewer ${record.review?.reviewerRole}: “${record.review?.reason}”. The two-date radar claim itself is unchanged: persistence remains ${persistence?.status ?? 'NOT_EVALUATED'} until a third epoch lands (${ctx.nextPassLabel}).`
      : `Persistence is ${persistence?.status ?? 'NOT_EVALUATED'} — no third epoch yet (resolves ${ctx.nextPassLabel}), and no corroborating reviewed field observation is on record for this candidate.`,
  };

  // ── 2 · The stage explanation (class-aware: inundation vs emergence) ────
  const rainfallClause = typeof rainfall?.value === 'number'
    ? ` Rainfall in the week before t1 was ${rainfall.value}× the seasonal norm (GPM IMERG, check: ${rainfall.status}) — extra open water at t1 is expected, not exceptional.`
    : '';
  const stageRow: HypothesisRow = {
    id: 'stage_effect',
    hypothesis: isErosion
      ? 'Temporary inundation — stage effect, not bank loss'
      : 'Bar emergence — stage exposure, not new land',
    support: isErosion
      ? 'A later pass at t0-comparable stage shows the polygon as land again — the t1 water extent is explained by stage, with no bank movement required.'
      : 'A later pass at comparable stage shows the polygon submerged again, and its outline tracks bar geometry between the passes.',
    kill: isErosion
      ? 'The polygon stays water at comparable stage on the next pass, with the stage proxy back inside tolerance.'
      : 'The polygon stays land at comparable stage, and a reviewed field observation finds deposited material standing above the t1 waterline.',
    standing: stage.status !== 'PASS' ? 'CANNOT BE EXCLUDED' : 'WEAKENED',
    reason: stage.status !== 'PASS'
      ? (isErosion
        ? `Stage differed between the passes — ${stageLine}.${rainfallClause}`
        : `Stage differed between the passes — ${stageLine}. Exposed sediment is the default explanation for a water→land switch in a stage-unmatched pair until persistence says otherwise.`)
      : `The pair is stage-matched within tolerance (${stageLine}), so a pure stage explanation is weakened — though not eliminated — for this candidate.`,
  };

  // ── 3 · Sediment geometry (erosion) / backscatter response (accretion) ──
  const sedimentRow: HypothesisRow = isErosion
    ? {
      id: 'sediment_or_response',
      hypothesis: 'Channel / bar geometry — the channel moved over its own bed',
      support: 'The polygon lies on a mid-channel or point bar whose outline migrates between passes, while the outer bankline does not move.',
      kill: 'The polygon sits on the outer bank (not on a bar) and stays water at comparable stage.',
      standing: 'CANNOT BE EXCLUDED',
      reason: 'This bundle carries no bankline or bar-geometry layer, and the pair is not stage-matched — bar dynamics cannot be separated from bank change with the data on this desk.',
    }
    : {
      id: 'sediment_or_response',
      hypothesis: 'Wet-soil / vegetation response — backscatter changed, land may not have appeared',
      support: 'The change is a moisture or vegetation response: the polygon reverts without a stage change, or a field observation finds wet soil / standing crops where the map shows new land.',
      kill: 'A reviewed field observation finds dry, newly deposited land at this polygon.',
      standing: 'CANNOT BE EXCLUDED',
      reason: 'Per-candidate backscatter values are not carried in this bundle — classification inputs exist only at run level — so a response change cannot be separated from a real class change for this polygon.',
    };

  // ── 4 · The artifact explanation ─────────────────────────────────────────
  const sensitivityReason = isErosion && ctx.sensitivity
    ? `Mapped land→water area moves ${fmt0(ctx.sensitivity.low)}–${fmt0(ctx.sensitivity.high)} ha across ±1 dB (threshold sensitivity ${sensitivityCheck?.value ?? '—'}% — ${sensitivityCheck?.status ?? 'NOT_EVALUATED'})`
    : `Run-level threshold sensitivity is ${sensitivityCheck?.value ?? '—'}% (${sensitivityCheck?.status ?? 'NOT_EVALUATED'})`;
  const artifactRow: HypothesisRow = {
    id: 'artifact',
    hypothesis: 'Classification or registration artifact',
    support: 'The polygon disappears or shifts under threshold perturbation, sits on the flagged swath-edge RFI band, or falls within co-registration error of a real boundary.',
    kill: 'The polygon keeps stable geometry across the ±1 dB threshold range, lies clear of flagged bands, and exceeds the Level-of-Detection once co-registration is quantified.',
    standing: 'CANNOT BE EXCLUDED',
    reason: `${sensitivityReason}, and the two tests that would measure an artifact rate do not exist yet in this bundle: co-registration (alignment) is ${alignment?.status ?? 'NOT_EVALUATED'} and the stable-land null test is ${nullTest?.status ?? 'NOT_EVALUATED'}.`,
  };

  return [retreat, stageRow, sedimentRow, artifactRow];
}

/** Blocking gates (FAIL, then WARN, then NOT EVALUATED), pre-formatted "label (STATUS)". */
export function blockingGateList(checks: QCCheck[]): string[] {
  const rank: Record<string, number> = { FAIL: 0, WARN: 1, NOT_EVALUATED: 2 };
  return checks
    .filter((c) => c.status === 'FAIL' || c.status === 'WARN' || c.status === 'NOT_EVALUATED')
    .sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3))
    .map((c) => `${c.label ?? c.id} (${c.status.replace(/_/g, ' ')})`);
}

export interface SurveyObjectiveContext {
  blockingGates: string[];
  stageLine: string;
  nextPassLabel: string;
  checklist: string[];
}

const coordText = (point: [number, number]) => {
  const [lon, lat] = point;
  return `${Math.abs(lat).toFixed(2)}°N ${Math.abs(lon).toFixed(2)}°E`;
};

/**
 * The generated inspection objective for one investigation site — a single
 * deterministic paragraph templated from bundle data only.
 */
export function surveyObjective(site: InvestigationSite, ctx: SurveyObjectiveContext): string {
  const anchor = site.anchor;
  const anchorClass = anchor.properties.class === 'erosion' ? 'land→water' : 'water→land';
  const totalArea = site.totalArea.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const gates = ctx.blockingGates.length ? ctx.blockingGates.join(' · ') : 'no blocking gates recorded in this bundle';
  return (
    `Inspect the ${site.members.length} mapped transition candidates grouped at ${site.id} (${site.reachPart}) — ` +
    `${site.erosionCount} land→water and ${site.accretionCount} water→land, ${totalArea} ha of candidates in total — ` +
    `navigating from the site anchor ${site.anchorId} (${anchorClass}, ${anchor.properties.area_ha.toFixed(2)} ha, ${coordText(site.centroid)}). ` +
    `The pair behind these candidates is stage-confounded (${ctx.stageLine}) and the run verdict is INCONCLUSIVE, so the ` +
    `objective is verification, not damage assessment. Blocking gates to retire, in severity order: ${gates}. ` +
    `Required observations: ${ctx.checklist.join(' ')} ` +
    `The radar candidates at this site are inconclusive and must not be treated as evidence of damage. Mapped context ` +
    `(settlements, roads, embankments, population) is not carried in this bundle — record what is actually found at the ` +
    `site instead of assuming it. A candidate closes only when a recorded field observation has been reviewed; an ` +
    `observation alone never verifies. Persistence for the surviving candidates resolves at the next same-track pass (${ctx.nextPassLabel}).`
  );
}
