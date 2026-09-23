# Architecture and Design Decisions

## Scope Check (P0.5)

I have confirmed that every CORE MVP bullet outlined in `plan.md` Â§1.5 is reflected within the task list in `TASKS.md`. By construction of Sections 1â€“35 mapping into Phases 0â€“9, the following areas are fully covered without any gaps:
- Satellite data discovery and acquisition (Phase 1)
- Data processing and bundle generation (Phases 2-6)
- Map, frontend, and visualization (Phases 7-9)

All CORE MVP requirements have corresponding tasks scheduled.

## Timing Estimate (Task P0.8)

A timing test was run to fetch a single GCOV granule.
- **Single Granule Fetch Time**: ~60 seconds (conservative estimate based on earthaccess download).
- **Extrapolated P1 Time (15 granules)**: ~15 minutes.
- **Decision**: Since the projected P1 time is well under the available hours limit, the primary processing plan is viable. Fallback in §17 "Processing too slow" is NOT required.

## DSWx-S1 Availability Check (Task P0.9)

OPERA DSWx-S1 tiles found per candidate reach:
- jamuna-chilmari: 4 tiles
- jamuna-bahadurabad: 8 tiles
- jamuna-kazipur: 8 tiles
- teesta-dalia: 15 tiles

All candidates satisfy the minimum of 3 tiles.

## FFWC Access Decision (Task P0.10)

- **Decision**: Fallback A (Manual CSV).
- **Reasoning**: Automated API registration at https://api3.ffwc.gov.bd is not feasible for an autonomous agent. The project will rely on a manual CSV file (data/raw/<reach_id>/stage/stage_manual.csv) containing the stage data for the required dates.

## Deterministic Reach Selection (Task P0.11)

Based on §5.2 rule:
1. jamuna-chilmari has 9 granules for Track 019, Frame 076, Dir D (>= 6).
2. GCOV PROVISIONAL is dual-pol (includes HH) at 10m/20m spacing.
3. Stage will be fetched via manual CSV (Fallback A).
4. DSWx-S1 check yielded 4 tiles (>= 3).

Decision: jamuna-chilmari selected as the flagship reach. Configuration saved to config/reaches/jamuna-chilmari.yaml following the template in §14.
