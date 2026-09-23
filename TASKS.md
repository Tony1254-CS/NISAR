# TASKS.md — SAME RIVER TWICE execution checklist

> This file is the **only** place that tracks progress. `plan.md` is the spec (never re-explained here — every task links to the section that defines it). Any LLM session starts by reading this file, not by re-reading all of `plan.md` from scratch.
>
> **Protocol for every session:** see `plan.md` §0.4 "Execution loop protocol". Summary: read this file top to bottom → find the first task with `[ ]` whose `Depends` are all `[x]` → do only that task → run its `Test` → check it off **only if the test passes** → commit `phase-N.M: <summary>` → move to the next task. If a test fails or something is ambiguous, stop, write to `docs/BLOCKERS.md`, and leave the box unchecked.

## Hard gate — read before touching anything below

Per `plan.md` §0.1: no phase-specific work (P0 onward) may start before the hackathon officially begins — **Sat 14 Nov 2026, 09:00 local time**. The official challenge statement is not released until **28 Oct 2026**. Tasks `P0.4`/`P0.5` are explicitly blocked on that release. Repo scaffolding / tooling setup (`P0.1`–`P0.3`) is meta-work, not challenge work, and may be done ahead of time if the team chooses — but do not fetch real NISAR/challenge data or write challenge-specific code before H0.

Status legend: `[ ]` todo · `[x]` done · `[~]` in progress · `[!]` blocked (reason in `docs/BLOCKERS.md`)

---

## Phase 0 — Environment & feasibility (plan.md §27 row P0)

- [x] **P0.1** Repo scaffold — create the exact directory tree in `plan.md` §26 (empty dirs get `.gitkeep`), `git init`, initial commit.
  - Test: `git status` shows a clean repo; tree matches §26 top two levels.
  - Depends: none

- [ ] **P0.2** `environment.yml` + install pipeline deps (§4.1) via mamba; `.env.example` per §32.
  - Test: `python -c "import asf_search, earthaccess, h5py, xarray, rasterio, rioxarray, shapely, geopandas, pydantic, jsonschema; print('OK')"` prints `OK`.
  - Depends: P0.1

- [ ] **P0.3** EDL login smoke test (human fills real `.env` with their own Earthdata Login first).
  - Test: `python -c "import earthaccess; earthaccess.login(strategy='environment'); print('OK')"` prints `OK`, no exception.
  - Depends: P0.2

- [!] **P0.4** Human pastes the official 2026 challenge statement into `docs/challenge_statement.md`. **Not possible before 28 Oct 2026 — leave blocked until then.**
  - Test: file exists and is non-empty.
  - Depends: P0.3 (timing only; not a build dependency)

- [ ] **P0.5** Challenge-fit table (§1.6, P0.0) — map every requirement in `challenge_statement.md` to a feature in this plan; anything uncovered goes to `docs/BLOCKERS.md` for the team to decide (Claude/Gemini does not expand scope itself).
  - Test: `docs/DECISIONS.md` has a "challenge fit" section with one row per requirement.
  - Depends: P0.4

- [ ] **P0.6** `pipeline/discover.py` (§6.1 workflow, §3.3) — asf_search query for GCOV PROVISIONAL, run for all 4 candidate reaches in §5.1.
  - Test: `make discover REACH=<each candidate>` produces `data/raw/<reach>/catalog.json` with ≥1 granule for at least one candidate.
  - Depends: P0.5

- [ ] **P0.7** Open one real GCOV granule; VERIFY every item listed in §6.1's VERIFY paragraph (HDF5 group names, EPSG storage, fill value, time field, polarisations, pixel spacing, orbit direction field); record findings in `docs/VERIFIED.md`.
  - Test: `docs/VERIFIED.md` has one dated entry per VERIFY item, each citing the actual value found (not the plan's placeholder).
  - Depends: P0.6

- [ ] **P0.8** Timing test — measure discover + single-granule fetch wall-clock time; extrapolate full-series P1 duration.
  - Test: `docs/DECISIONS.md` has a timing estimate entry; if projected P1 time > available hours, fallback in §17 "Processing too slow" is pre-selected.
  - Depends: P0.7

- [ ] **P0.9** DSWx-S1 availability check for each candidate reach/date window (§5.2 rule 4).
  - Test: `docs/DECISIONS.md` lists DSWx-S1 tile count found per candidate reach.
  - Depends: P0.6

- [ ] **P0.10** FFWC access decision — attempt API registration; else pick Fallback A (manual CSV) or B (proxy) per §6.5.
  - Test: `docs/DECISIONS.md` states which stage mode was chosen and why.
  - Depends: none (can run parallel to P0.6–P0.9)

- [ ] **P0.11** Apply the deterministic reach-selection rule §5.2 using the data gathered in P0.6–P0.10; write `config/reaches/<reach_id>.yaml` (template in §14 step 1) and log the decision in `docs/DECISIONS.md`.
  - Test: exactly one `config/reaches/*.yaml` exists (plus fallback candidates optionally kept for reference); it satisfies all 4 rules in §5.2 or documents why the fallback in §17 "No reach qualifies" applies.
  - Depends: P0.7, P0.8, P0.9, P0.10

---

## Phase 1 — Acquisition (§27 row P1)

- [ ] **P1.1** `pipeline/io_nisar.py` — stream (HTTPS/S3), AOI-clip, write GeoTIFF + `meta.json` per granule (§6.1 workflow diagram).
  - Test: running on the granule from P0.7 produces `HHHH.tif` openable by `rasterio.open`, correct CRS/shape, plus valid `meta.json`.
  - Depends: P0.11

- [ ] **P1.2** `pipeline/fetch.py` — orchestrate P1.1 across the full chosen-reach catalog, thread pool ≤4 (§18 async note).
  - Test: `make fetch REACH=<chosen>` populates `data/raw/<reach>/nisar/<granule_id>/` for every catalogued granule; no more than 4 concurrent connections (check via a print/log count).
  - Depends: P1.1

- [ ] **P1.3** `pipeline/validate_raw.py` — implement every check row in §11.1's table.
  - Test: `pytest tests/test_validate_raw.py` (write against 1–2 real + 1 deliberately-corrupted fixture) passes; running on real data produces `validation_raw.json` with ≥6 dates passing (§28 acceptance).
  - Depends: P1.2

- [ ] **P1.4** `pipeline/io_dswx.py` + fetch OPERA DSWx-S1 tiles for ±6-day windows around each NISAR date (§6.2).
  - Test: at least one `_B01_WTR.tif` exists per date that has any tile within the window; file opens and its class values are a subset of `{0,1,3,250,251,255}`.
  - Depends: P0.11

- [ ] **P1.5** Fetch ASF GLO-30 HAND tiles covering the AOI via public S3, no auth (§6.3).
  - Test: `data/raw/common/hand/*.tif` covers the full AOI bbox with no gaps (mosaic bounds check).
  - Depends: P0.11

- [ ] **P1.6** Fetch JRC GSW `occurrence` tile covering 80–90E, 20–30N (§6.4).
  - Test: file opens, values in [0,100] or documented nodata.
  - Depends: P0.11

- [ ] **P1.7** Stage data acquisition — FFWC API pull, or manual CSV transcription with `source_url`/`retrieved_at` per row (§6.5 schema).
  - Test: `pytest tests/test_stage_schema.py` validates the CSV/JSON against the schema in §6.5; covers ≥80% of acquisition dates per §5.2 rule 3, or `docs/DECISIONS.md` documents proxy fallback.
  - Depends: P0.10, P1.2 (need acquisition dates to check coverage)

---

## Phase 2 — Preprocessing (§27 row P2)

- [ ] **P2.1** `pipeline/utils/raster.py` — grid consistency check + nearest-resampling reprojection when needed (§9 row 4).
  - Test: `pytest tests/test_grid_consistency.py` on synthetic mismatched-origin fixture; on real data, log confirms all dates share one grid (or reprojection logged).
  - Depends: P1.3

- [ ] **P2.2** `pipeline/preprocess.py` — nodata masking, dB conversion, speckle median filter (§9 rows 6–8).
  - Test: `pytest tests/test_db.py` passes; output `hh_db/<date>.tif` is float32, dB range plausible (roughly −35 to +10 dB), NaN only where masked.
  - Depends: P2.1

- [ ] **P2.3** HAND mask warp + apply, `hand_invalid.tif` (§9 row 10).
  - Test: HAND-masked pixel count is small relative to AOI (documented in log); missing-HAND path sets `hand_mask: NOT_EVALUATED` per §17.
  - Depends: P1.5, P2.2

- [ ] **P2.4** RFI screening flag (§9 row 11).
  - Test: `pytest tests/test_rfi.py` on a synthetic striped fixture flags it; on real data, flagged dates (if any) are excluded from pairs later and logged.
  - Depends: P2.2

- [ ] **P2.5** Human quicklook check — render 3 real dates as PNG, visually confirm the river reads correctly (dark=water).
  - Test: `docs/PLAUSIBILITY.md` gets an early entry noting this passed, with the 3 PNGs referenced.
  - Depends: P2.2, P2.3, P2.4

---

## Phase 3 — Science (§27 row P3)

- [ ] **P3.1** `pipeline/water.py` — tile-based Otsu classification (§10.1 algorithm exactly).
  - Test: `pytest tests/test_threshold.py` — synthetic bimodal histogram → Otsu within 0.5 dB of the generating split; synthetic unimodal → `global_fallback` flag triggers.
  - Depends: P2.5

- [ ] **P3.2** Ambiguity classes `ambiguous_sand` and (SHOULD) `possible_water_under_vegetation` (§10.2).
  - Test: unit test with a hand-built pixel where DSWx disagrees with the threshold classification correctly flags `ambiguous`.
  - Depends: P3.1, P1.4

- [ ] **P3.3** `pipeline/stage.py` — interpolate gauge stage to acquisition times, or proxy fallback (§10.3–10.4).
  - Test: `pytest tests/test_stage_interp.py`; real `stage.csv` has one row per valid acquisition, `null` where no reading within ±24h.
  - Depends: P1.7, P1.3

- [ ] **P3.4** `pipeline/pairs.py` — equal-stage / later-lower selection (§10.5).
  - Test: `pytest tests/test_pairs.py` covers equal-stage found, later-lower fallback, and no-pair cases exactly as specified.
  - Depends: P3.3

- [ ] **P3.5** `pipeline/change.py` — erosion/accretion/seasonal/ambiguous classification with persistence (§10.6).
  - Test: `pytest tests/test_change.py` — hand-built 20×20 water stacks give exact expected class counts; MMU removal (12 px) verified.
  - Depends: P3.2, P3.4

- [ ] **P3.6** Area + uncertainty range + polygonization (§10.7–10.8).
  - Test: `pytest tests/test_area.py` and `test_geom.py` pass; `polygons_erosion.geojson` all `is_valid`, `pixel_count` sums match raster count exactly.
  - Depends: P3.5

- [ ] **P3.7** Run `make discover fetch validate-raw preprocess water stage pairs change REACH=<chosen>` twice back-to-back.
  - Test: `areas.json` byte-identical both runs (excluding timestamps) — reproducibility acceptance criterion (§28).
  - Depends: P3.6

---

## Phase 4 — Validation (§27 row P4)

- [ ] **P4.1** `pipeline/validate_science.py` — `dswx_agreement` check (§11.2 table).
  - Test: `qc.json` entry has status PASS/WARN/FAIL per the stated κ thresholds, never silently skipped when DSWx data exists.
  - Depends: P3.6, P1.4

- [ ] **P4.2** `null_test` check.
  - Test: computed on the JRC-defined stable-land zone; rate reported as a percentage with correct PASS/WARN/FAIL banding.
  - Depends: P3.6, P1.6

- [ ] **P4.3** Remaining checks: `stage_match`, `persistence`, `threshold_sensitivity`, `alignment`, `rfi`, `ambiguous_area`, (SHOULD) `replicate`.
  - Test: every check in §11.2's table appears in `qc.json` with a value or `NOT_EVALUATED` — never silently missing.
  - Depends: P4.1, P4.2

- [ ] **P4.4** Compute the result-level verdict (`SUPPORTED`/`LIMITED`/`INCONCLUSIVE`) per §11.2's rule.
  - Test: `pytest tests/test_verdict.py` on synthetic QC combinations matches the documented rule exactly.
  - Depends: P4.3

- [ ] **P4.5** Human plausibility review (§11.3) — erosion on banks not random; order of magnitude vs CEGIS 2025–26 figures; optical cross-check if available.
  - Test: `docs/PLAUSIBILITY.md` has a completed review with a ship/no-ship decision. If no-ship, loop back to P3.1 with adjusted params (logged in `docs/DECISIONS.md`), do not proceed to P5.
  - Depends: P4.4

---

## Phase 5 — Result generation (§27 row P5)

- [ ] **P5.1** `pipeline/schemas.py` — pydantic models for every schema in §13.3–13.4; export JSON Schema to `schemas/`.
  - Test: `pytest tests/test_manifest.py` schema-validation subset passes on a hand-built fixture.
  - Depends: P4.5

- [ ] **P5.2** `pipeline/render.py` — EPSG:3857 PNGs + `bounds.json`, fixed global radar stretch (§22.2, §9 row 13).
  - Test: every `ok`-status date has a `radar_<date>.png` and `water_<date>.png`; `bounds.json` present, 4 corners.
  - Depends: P4.5

- [ ] **P5.3** `pipeline/manifest.py` — build `manifest.json` per §13.3, every metric with `inputs[]`.
  - Test: `pytest tests/test_manifest.py` — every metric has ≥1 input with a granule/source; matches the JSON schema from P5.1.
  - Depends: P5.1, P4.5

- [ ] **P5.4** `pipeline/check_bundle.py` — consistency checks from §13.5.
  - Test: `pytest tests/test_check_bundle.py` — deliberately-broken fixture (mismatched pixel_count, missing PNG) is caught; real bundle passes clean.
  - Depends: P5.2, P5.3

- [ ] **P5.5** Generate `web/src/data/types.ts` from exported JSON Schema (`json-schema-to-typescript`).
  - Test: `tsc --noEmit` in `web/` succeeds against a fixture import of the generated types.
  - Depends: P5.1

- [ ] **P5.6** First full real bundle run → `make render manifest check-bundle REACH=<chosen>` → copy to `web/public/data/v1/<reach_id>/`.
  - Test: `make check-bundle` exits 0; bundle size ≤ 40 MB (§30).
  - Depends: P5.4, P5.5

---

## Phase 6 — Frontend foundation (§27 row P6 — may start in parallel once fixtures exist)

- [ ] **P6.1** Vite + React + TS scaffold (`web/`), `package.json`, `tsconfig.json`, `playwright.config.ts`, exact deps from §4.2 (no substitutions).
  - Test: `npm run dev` serves a blank app at `localhost:5173`.
  - Depends: P0.1 (can start immediately, doesn't need real data)

- [ ] **P6.2** `styles/tokens.css` + `base.css` exactly per §24.1 (no extra colours/tokens).
  - Test: visual check — no colour outside the token list appears anywhere in dev tools computed styles.
  - Depends: P6.1

- [ ] **P6.3** Fixtures copied from first real intermediate outputs (or, if P5 hasn't run yet, from `tests/fixtures/real_crop/`) into `web/tests/fixtures` — never invented values (§27 P6 note).
  - Test: fixture files are byte-copies of real pipeline output with a `PROVENANCE.md` noting their source run.
  - Depends: P1.3 (earliest real output) or P5.6 (final)

- [ ] **P6.4** `data/load.ts` + `data/schema.ts` — fetch bundle, validate against generated types.
  - Test: Vitest `load.test.ts` against P6.3 fixtures — valid bundle loads, malformed bundle throws a typed error.
  - Depends: P6.3, P5.5

- [ ] **P6.5** `state/store.ts` (zustand) — exact shape from §20.3.
  - Test: Vitest covers each state transition (`selectedDate`, `compare.active`, `panel`).
  - Depends: P6.4

- [ ] **P6.6** `states/{Loading,ErrorState,OutsideCoverage,Inconclusive}.tsx`.
  - Test: Storybook-less manual render check (or Vitest snapshot) for each of the 4 states using fixtures.
  - Depends: P6.5

---

## Phase 7 — Map (§27 row P7)

- [ ] **P7.1** `map/MapStage.tsx` + `layers.ts` — layer stack exactly in §22.1 order.
  - Test: dev-tools layer inspector shows the 12 layers in the specified z-order; missing GIBS/basemap falls back to solid background, not a broken tile grid.
  - Depends: P6.5, P5.6

- [ ] **P7.2** `map/FlyIn.ts`.
  - Test: fly-in completes in ≤5 s, is click-skippable, and jumps directly (no animation) when `prefers-reduced-motion` is set.
  - Depends: P7.1

- [ ] **P7.3** `map/MapLegend.tsx` (≤4 items, mode-dependent).
  - Test: legend never exceeds 4 entries in either browse or compare mode.
  - Depends: P7.1

- [ ] **P7.4** Outside-coverage behaviour (§21.5).
  - Test: panning >5 km outside AOI shows the inline note; clicking it flies back.
  - Depends: P7.2

---

## Phase 8 — Hydrograph & compare (§27 row P8 — the signature interaction)

- [ ] **P8.1** `hydrograph/Hydrograph.tsx` — stage curve, danger line, acquisition ticks, rain strip slot.
  - Test: tick count equals `reach.json` ok-date count (E2E assertion reused later in P12).
  - Depends: P6.5, P5.6

- [ ] **P8.2** `hydrograph/MatchWaterButton.tsx` — reads `pairs.json`, activates compare.
  - Test: clicking it selects the exact `t0`/`t1` from `pairs.json`'s primary pair; horizontal stage-match line renders at the right height.
  - Depends: P8.1

- [ ] **P8.3** `map/CompareSwipe.tsx` — dual MapLibre instances synced on `move`, CSS `clip-path` divider, mouse/touch/keyboard draggable.
  - Test: Playwright drags the divider with mouse, touch emulation, and arrow keys; both halves stay visually in sync.
  - Depends: P7.1, P8.2

---

## Phase 9 — Evidence & QC (§27 row P9)

- [ ] **P9.1** `panels/{StoryPanel,Headline,VerdictBadge,LayerToggles}.tsx`.
  - Test: `Headline` value renders `manifest.metrics.find(id).value` verbatim — unit test asserts no literal number is hardcoded in the component (§25 provenance chain).
  - Depends: P8.2, P5.6

- [ ] **P9.2** `panels/EvidencePanel.tsx` — all 7 sections from §21.2, in order.
  - Test: clicking a polygon opens a panel containing a real granule ID string sourced from `manifest.json`.
  - Depends: P9.1

- [ ] **P9.3** `panels/QCPanel.tsx` — ordered FAIL, WARN, NOT_EVALUATED, PASS, INFO (§21.3).
  - Test: panel item count and order match `qc.json` exactly.
  - Depends: P4.3 (data), P9.1

- [ ] **P9.4** Deep-link URL state (`/?reach=&t0=&t1=&feature=`, §20.1).
  - Test: loading the URL with query params reproduces the exact same compare/selection state on fresh page load.
  - Depends: P9.2

---

## Phase 10 — SHOULD features (§27 row P10, only after MVP acceptance criteria in §28 pass)

- [ ] **P10.1** `pipeline/context.py` — IMERG rain strip, HLS optical scene, CEGIS overlap (§6.6–6.7, §6.9).
  - Test: each sub-output either has a real-data file behind it or the corresponding UI toggle stays hidden (§27 P10 rule).
  - Depends: P5.6

- [ ] **P10.2** Frontend toggles for optical/forecast-outline/rain-strip layers.
  - Test: toggles only appear when P10.1 produced real data for that layer.
  - Depends: P10.1, P9.1

---

## Phase 11 — Error handling pass (§27 row P11)

- [ ] **P11.1** Implement every row of §21.1's States table across the app (Loading, Success, Partial data, Empty, Error, INCONCLUSIVE, Stage proxy mode, Offline/frozen).
  - Test: manual pass through each state with crafted fixtures.
  - Depends: P9.4, P6.6

- [ ] **P11.2** Playwright tests for error/empty/inconclusive states using broken fixtures.
  - Test: `npx playwright test` green for these specs.
  - Depends: P11.1

---

## Phase 12 — Testing (§27 row P12, continuous + final pass)

- [ ] **P12.1** Full pytest suite green (§29 unit list: `test_db`, `test_threshold`, `test_change`, `test_area`, `test_pairs`, `test_geom`, `test_manifest`, `test_check_bundle`, plus the ones added per-phase above).
  - Test: `pytest` exit code 0, no skipped tests without documented reason.
  - Depends: all P1–P5 tasks

- [ ] **P12.2** Integration test `test_pipeline_small.py` on a real 200×200 px crop fixture.
  - Test: passes, bundle-check clean.
  - Depends: P5.4

- [ ] **P12.3** Full Playwright E2E suite (§29 E2E steps 1–6).
  - Test: all 6 scenarios pass against the real deployed-equivalent bundle.
  - Depends: P11.2, P9.4

- [ ] **P12.4** Lint rule: no numeric literal >9 in JSX text (§13.5 last bullet).
  - Test: CI grep/ESLint rule passes on `web/src`.
  - Depends: P9.1

---

## Phase 13 — Deployment (§27 row P13)

- [ ] **P13.1** Vercel project (root `web`, build `npm run build`, output `dist`), SPA rewrite for `/methods`.
  - Test: public URL loads without login.
  - Depends: P12.1, P12.2, P12.3

- [ ] **P13.2** Performance acceptance (§28 App criteria): first meaningful paint <2.5 s on 4G throttle, Lighthouse accessibility ≥90.
  - Test: Chrome DevTools throttled Lighthouse run recorded in `docs/DECISIONS.md`.
  - Depends: P13.1

---

## Phase 14 — Demo polish & submission (§27 row P14)

- [ ] **P14.1** `pages/Methods.tsx` final content (pipeline diagram, sources table, params, QC plots, limitations, reproduction commands, credits).
  - Test: every claim on the page traces to a section of `plan.md` or `manifest.json`.
  - Depends: P13.2

- [ ] **P14.2** `docs/submission/video_script.md` + recorded 30 s video (§34).
  - Test: video timing matches the 4-beat script; numbers spoken match `manifest.json` exactly.
  - Depends: P13.2

- [ ] **P14.3** `docs/submission/project_page.md`.
  - Test: reuses Methods-page text per §21.4; no new unverified claims introduced.
  - Depends: P14.1

- [ ] **P14.4** Final checklist against §35 "Definition of done".
  - Test: every bullet in §35 individually verified true; submitted before H47.
  - Depends: P14.1, P14.2, P14.3

---

## Progress summary (update this line whenever a box flips)

`Completed: 1 / 63 tasks · Phase in progress: Phase 0 · Next task: P0.2`
