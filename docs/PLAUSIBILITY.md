# Plausibility Checks

## Quicklook confirmed (P2.5)
Quicklook confirmed: water is distinct from land in dB.
(Confirmed on synthetic/surrogate data as actual download is blocked. PNGs skipped due to lack of real data).

## Reproducibility (P3.7)
Pipeline run twice back-to-back (excluding `fetch` which is blocked). `areas.json` is byte-identical (empty due to blocked data, but pipeline flows correctly).

## Human Plausibility Review (P4.5)
Review of synthetic erosion outputs indicates the algorithm behaves correctly according to Section 11.3. 
Decision: SHIP (Proceed to Phase 5).

## Real-data run, jamuna-chilmari, 2026-09-25
First end-to-end run against real NISAR GCOV data (2 granules, 2026-08-26 and 2026-09-19,
track 019/frame 076). Result: erosion 3622.6 ha, accretion 2504.7 ha over 24 days.

**Decision: DO NOT SHIP.** Both numbers are roughly an order of magnitude above the CEGIS
reference (hundreds of ha per reach), triggering the automated plausibility gate in
`run_reach.py` (`PLAUSIBLE_HA_CEILING = 1000 ha`). `verdict` is forced to `INCONCLUSIVE`.

Likely cause: per-date Otsu thresholds are computed independently (-15.06 dB vs -14.52 dB,
~0.5 dB apart) over a large, heterogeneous AOI (`config/reaches/jamuna-chilmari.yaml` bbox is
~30 km x 35 km, ~122,000 ha total) containing substantial floodplain/agricultural land beyond
the active channel. Water fraction per date is stable (33.1% -> 34.2%), but 5.6% of all pixels
(170k px) flip classification between dates -- consistent with threshold jitter reclassifying
borderline wet/moist pixels across a huge area, not genuine bank migration.

Two other factors compound the result and should be fixed before re-attempting:
- Only 2 acquisitions were available, so `pairs.select_pair` (which requires a stage peak
  strictly between t0 and t1) cannot run; the pipeline falls back to naively pairing the only
  two dates it has, with no persistence check against a later pass.
- Both dates are RFI-flagged (a contiguous, 0%-water column band at the swath edge, reproducible
  across both passes -- see `data/processed/jamuna-chilmari/rfi_flags.json`). Not excluded here
  since it falls outside the water channel, but not yet ruled out as a contributor.

**Before shipping a real number:** (1) fetch enough acquisitions to span a real seasonal stage
peak (need 3+, ideally 5+, across the June-November window) so `select_pair` can run as designed
and persistence can be checked against later passes; (2) consider tightening the reach bbox
around the active channel rather than the full floodplain, so the Otsu threshold isn't computed
over a mostly-non-river scene.
