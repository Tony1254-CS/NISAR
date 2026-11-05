# plan.md — SAME RIVER TWICE
### NASA Space Apps Challenge 2026 · "Dancing with the SARs" · Execution specification for Claude Code

> **Status note (2026-11-05):** This file is the original planning/specification record, not a guarantee that every planned feature exists or remains scientifically defensible. Current SAR Lab, ML Intelligence, and Decision Desk behavior is documented in `docs/SAR_LAB.md`, `docs/ML_INTELLIGENCE.md`, and `docs/DECISION_DESK.md`. Those current guides and the actual bundle/code take precedence when writing demos. The Jamuna estimate remains inconclusive; intended stage matching or validation in this plan must not be narrated as completed unless verified in the current data.

> **Read Section 0 before doing anything.** This file is the single source of truth. It is a technical specification, a data-pipeline specification, a scientific-method document, a UI/UX specification and an implementation roadmap. When this file and your own instincts disagree, this file wins. When this file is silent, stop and ask the team — do not invent.

---

## 0. Ground rules

### 0.1 When this plan may be executed
This is an **independent project**, not an official NASA Space Apps Challenge submission. No external organiser's rules apply. The team chose the SAR/river-erosion problem itself; Sections 1.1–1.2 of this document **are** the problem statement — there is no external statement to wait for.
- **Execution starts immediately and runs continuously until the deadline.** No phase, and no task in `TASKS.md`, may be blocked on "waiting for an official start time" or "waiting for an external statement to be released." Those NASA-specific gates from earlier drafts of this plan are removed.
- **Deadline: a working, deployed, publicly reachable web app by 28 September 2026.** All hour budgets in Section 27 are relative sequencing, not a countdown from a fixed external H0 — compress phases as needed to hit this date. Given the short runway, build strictly in MVP order (Section 1.5 CORE MVP first); do not start SHOULD/OPTIONAL tier work until every CORE MVP acceptance criterion in Section 28 passes.
- `docs/challenge_statement.md` should simply record that this is a self-authored, independent build and point to Section 1.1–1.2 — it is not a blocking prerequisite for any other task.

### 0.2 Claude Code execution rules (mandatory)
1. Follow this plan **sequentially by phase**. Do not start a phase until the previous phase's acceptance criteria pass.
2. Do **not** redesign the architecture unless a documented blocker makes it impossible. If blocked, write the blocker to `docs/BLOCKERS.md` and apply the fallback in Section 17.
3. Never replace real data with fake data. Synthetic arrays are allowed **only inside `tests/`**. Nothing under `data/` or `web/public/data/` may be synthetic, simulated or hand-typed numbers.
4. Do not invent APIs, datasets, endpoints, HDF5 paths, library functions, or scientific methods. Where this plan says **VERIFY**, you must confirm against official docs or by inspecting the real file, and record what you found in `docs/VERIFIED.md`.
5. Do not invent numerical results. Every number shown in the UI must resolve to an entry in `manifest.json` (Section 13).
6. Do not add features not listed as MUST or SHOULD (Section 1.5). In particular: no LLM features, no chatbot, no 3D, no mobile app, no haptics, no user accounts, no database, no analytics, no live NASA API calls from the browser.
7. Do not build a generic dashboard (no card grids, no gradient heroes, no glassmorphism, no "AI-powered" labels, no fake KPIs). Follow Section 24 exactly.
8. Every visual element must have a stated purpose (Section 21 lists them). If an element has no purpose in this plan, do not add it.
9. Preserve provenance: every derived file records its inputs (granule IDs, parameters, code commit).
10. Run the tests listed for a phase before moving on. Fix failures before dependent work.
11. Keep the pipeline reproducible: `make reproduce` must regenerate every output from raw inputs.
12. Commit after each phase with message `phase-N: <summary>`. The git history is evidence of when work happened.
13. If something cannot be implemented exactly as specified, use the predefined fallback. Do not substitute a different architecture, different dataset or different method.
14. Track progress in `TASKS.md`, not in memory or in this file. See Section 0.4 for the exact loop every session must follow.

### 0.3 Glossary for developers who are not SAR specialists
| Term | Meaning in this project |
|---|---|
| SAR | Synthetic Aperture Radar. Satellite radar that images through clouds, day and night. |
| NISAR | NASA–ISRO SAR satellite (L-band, ~24 cm wavelength). Launched July 2025. |
| GCOV | NISAR Level-2 product: terrain-corrected backscatter on a map grid (UTM). Our primary input. |
| Backscatter (γ⁰, gamma-naught) | How much radar energy returns. Calm water returns very little → dark. Land/vegetation → brighter. |
| HH / HV | Polarisation channels. HH = transmit H, receive H. We use HH primarily. |
| dB | Decibels: `10·log10(linear power)`. |
| Stage | River water level at a gauge, in metres. |
| Reach | A stretch of river (~30–50 km) we analyse. |
| Char | River island / sand bar in the Jamuna. People live on many chars. |
| Erosion (in this project) | A pixel that was land at time t0 and is water at t1 **when the river is at the same or lower level**, and stays water afterwards. |
| Accretion | The mirror: water at t0 → persistent land at t1. |

### 0.4 Execution loop protocol (mandatory, every session)

`TASKS.md` is the single source of truth for progress. This plan (`plan.md`) never changes to reflect status — it is the spec. `TASKS.md` is the checklist. Do not duplicate task status anywhere else (no separate progress notes, no status comments in code).

**At the start of every session, in order:**
1. Read `TASKS.md` top to bottom.
2. Find the **first** task whose checkbox is `[ ]` and whose `Depends` are all `[x]`. That is the only task you work on this turn. There is no external timing gate to check (Section 0.1) — do not pause waiting for a date, a released statement, or anyone's permission. The only reasons to pause on a task are the real, technical blockers described in step 7 below.
3. Read the `plan.md` section(s) the task links to. Re-read them even if you recall them — do not work from memory of an earlier session.
4. Implement only that task. Do not start a second task "while you're in there." Do not refactor unrelated code. Do not expand scope beyond what the task and its linked spec section describe.
5. Run exactly the `Test` written for that task. Do not invent a looser test and do not skip it because the change "looks obviously correct."
6. **If the test passes:** check the box (`[ ]` → `[x]`), update the progress summary line at the bottom of `TASKS.md`, commit with message `phase-N.M: <summary>` (Section 0.2 rule 12), **then immediately go back to step 2 and start the next task in the same session.** Do not stop and wait to be told to continue — keep working through `TASKS.md` until you hit a real blocker (step 7) or run out of eligible tasks.
7. **If the test fails or the task is blocked by something outside your control** (missing credentials, an external API genuinely down, a `VERIFY` item that contradicts this plan in a way Section 33 doesn't resolve): do **not** check the box. Mark it `[!]` in `TASKS.md`, write the specific blocker to `docs/BLOCKERS.md` (what you tried, what failed, what you need), then **skip to the next eligible task instead of stopping the session** — a blocked task must never halt the rest of the project. Only stop the whole session if every remaining unblocked task has been exhausted.
8. Never mark a task `[x]` without having actually run its test in this session. A task that "should obviously work" is not done until its test has been run and passed.
9. Work through as many tasks as possible in one sitting — there is no "one task per session" limit. The only pacing rule is: never check off task N+1 before task N's test has actually passed.

This protocol exists because an LLM session has no memory of prior sessions — the repo state (`TASKS.md` checkboxes, committed code, `docs/BLOCKERS.md`) is the only thing that persists. Treat it as such: read it before acting, write to it before stopping.

---

## 1. The project

### 1.1 Problem
Every monsoon, the Brahmaputra–Jamuna rises, floods, recedes — and permanently takes land. Bangladesh's CEGIS reports the Jamuna, Ganges and Padma eroded ~158,000 ha between 1973 and 2025 and forecasts ~915 ha of erosion at 11 locations in 2026 (7 Jamuna reaches ≈ 460 ha) ([The Daily Star, CEGIS data](https://campaign.thedailystar.net/river-erosion/)). Monsoon clouds make optical satellites unreliable exactly when this happens. Existing SAR flood maps show *where water is on a day*; they do not separate **temporary flood** from **permanent land loss**, because they don't control for river height.

### 1.2 What we build
A web application that uses **calibrated NISAR L-band radar from the 2026 monsoon** to measure land lost to (and gained from) the Jamuna in a specific reach, by comparing the river **at the same water level before and after the monsoon peak**. Every result is cross-checked against NASA's independent Sentinel-1-based OPERA water product, subjected to a null test, and linked to the exact source granules.

**One sentence:** *"We compared the Jamuna at the same water level before and after the 2026 monsoon using NASA-ISRO's NISAR radar — so what changed isn't flood, it's land the river took."*

### 1.3 Users
| User | Need | What they do in the app |
|---|---|---|
| Hackathon judge (primary for this build) | Understand the result in seconds; verify it | Watch fly-in → scrub monsoon → "Match the water" → read number → open receipt/checks |
| Disaster/river analyst (CEGIS, BWDB, NGO) | Where was land lost this season, how much, how sure | Select reach → inspect erosion polygons → compare with forecast reaches → export GeoJSON |
| Journalist / public | See what happened to a place | Same flow as judge; read plain-language sentence |
| Researcher | Reproduce | Methods page → repo → `make reproduce` |

### 1.4 Core workflow (the product in one path)
```
Open app → auto fly-in to reach → see river radar on latest date
 → drag along river-height curve (hydrograph) to see each NISAR pass
 → press "Match the water" → two dates at equal stage lock → swipe compare
 → land-lost (ember) / land-gained (sand) layers appear → headline area with range
 → click a polygon or the number → evidence panel (granules, dates, gauge heights, method)
 → "How this could be wrong" → computed QC checks
```

### 1.5 Scope
**CORE MVP (must work end-to-end)**
- NISAR GCOV time series for ONE flagship reach (all usable PROVISIONAL dates on one track/frame, June 17 → latest).
- Per-date water classification.
- River stage for each acquisition (FFWC gauge; fallback in Section 17).
- Stage-matched (or later-lower) pair selection.
- Erosion / accretion / seasonal / ambiguous classification with persistence.
- Area with uncertainty range.
- Validation: OPERA DSWx-S1 agreement + null test + threshold sensitivity.
- Static data bundle + manifest with provenance.
- Web app: fly-in, radar map, hydrograph scrubber, "Match the water" swipe, headline number, evidence panel, QC panel, methods page.
- Deployed public URL.

**IMPORTANT SUPPORTING (SHOULD, after MVP passes)**
- CEGIS 2026 forecast reach outlines (digitised, flagged approximate).
- Cloud-free post-monsoon optical confirmation (HLS) as a toggle.
- Opposite-orbit-direction replicate.
- "Possible water under vegetation" layer (L-band) compared with DSWx-S1 class 3.
- Upstream rainfall context strip (GPM IMERG Late).
- Reach picker listing additional precomputed reaches (architecture supports N reaches; only build more if time allows).
- GeoJSON download of erosion polygons.
- Bengali place-name labels.

**OPTIONAL (only if everything above is done)**
- Second reach (e.g., Teesta).
- Printable one-page "reach report" (browser print stylesheet).

**DO NOT BUILD**
LLM/AI explanations · chatbot · 3D terrain/globe engine · mobile native app · haptics/audio · field-photo upload · user accounts/auth · database server · backend web server · real-time processing in the browser · alerts/notifications system · multi-hazard platform · ML models · MODIS NDVI · FIRMS · GSLC/GUNW/SME2 processing · any "confidence %" score not defined in Section 10.

### 1.6 Challenge fit (fill in after 28 Oct)
Phase 0 task P0.0 maps each requirement of `docs/challenge_statement.md` to a feature here. If the statement requires something not covered, document it in `docs/BLOCKERS.md` and the team decides — Claude Code does not expand scope on its own.

---

## 2. Research summary (verified facts this plan relies on)

| Fact | Source |
|---|---|
| NISAR PROVISIONAL (calibrated) products released 20 Jul 2026, available for acquisitions from 17 Jun 2026; new acquisitions added as processed | [ASF availability](https://nisar-docs.asf.alaska.edu/availability-overview/) · [Earthdata news](https://www.earthdata.nasa.gov/news/nisar-l-band-data-released-expanding-record-surface-changes) |
| BETA products (earlier) are not fully calibrated; mixing BETA with PROVISIONAL is discouraged | [ASF known issues](https://nisar-docs.asf.alaska.edu/provisional-known-issues/) |
| GCOV = RTC gamma-0 power, UTM, 10 or 20 m pixel spacing (20 MHz → 20 m, 40 MHz → 10 m), intended uses include inundation mapping; HDF5 paths `/science/LSAR/GCOV/grids/frequencyA/HHHH` etc. | [GCOV docs](https://nisar-docs.asf.alaska.edu/gcov) · [Products overview](https://nisar-docs.asf.alaska.edu/products-overview/) |
| Earthaccess short name `NISAR_L2_GCOV_PROVISIONAL_V1`; S3 credentials endpoint `https://nisar.asf.earthdatacloud.nasa.gov/s3credentials`; open with `xr.open_datatree(..., engine='h5netcdf', phony_dims='access')` | [ASF earthaccess guide](https://nisar-docs.asf.alaska.edu/earthaccess/) |
| asf_search: `asf.search(dataset='NISAR', processingLevel='GCOV')`; NISAR CMR lacks many searchable attributes → search by shortName/dataset/granule list | [ASF asf_search guide](https://nisar-docs.asf.alaska.edu/asf-search/) · [Best practices](https://docs.asf.alaska.edu/asf_search/BestPractices/) |
| Provisional known issues: residual RFI, ripples in dark areas, ~1–2% products from incomplete raw data, some diagnostic-mode frames unusable | [ASF known issues](https://nisar-docs.asf.alaska.edu/provisional-known-issues/) |
| Observation plan designed to be geographically static; check frames via the interactive apps | [Observation plan](https://nisar-docs.asf.alaska.edu/observation-plan) |
| OPERA DSWx-S1: near-global, 30 m, MGRS tiles, 6–12-day revisit, open water ≥3 ha & ≥200 m wide, forward production since Sept 2024 | [Earthdata catalog](https://www.earthdata.nasa.gov/data/catalog/pocloud-opera-l3-dswx-s1-v1-1.0) |
| DSWx-S1 WTR classes: 0 not water, 1 open water, 3 inundated vegetation, 250 HAND-masked, 251 layover/shadow, 255 fill | [DSWx-S1 Product Spec](https://d2pn8kiwq2w21t.cloudfront.net/documents/OPERA_DSWx-S1_Product_Spec_v1.0.0_D-108761_RevA_2024-08-16_.pdf) |
| ASF GLO-30 HAND: 30 m COGs in 1°×1° tiles on AWS, CC0 | [ASF STAC](https://stac.asf.alaska.edu/collections/glo-30-hand) · [AWS registry](https://registry.opendata.aws/glo-30-hand) |
| GPM IMERG: Early 4 h, Late 14 h, Final ~3.5 months latency | [GES DISC dataset page](https://data.nasa.gov/dataset/gpm-imerg-final-precipitation-l3-1-day-0-1-degree-x-0-1-degree-v07-gpm-3imergdf-at-ges-dis-13ed8) |
| GIBS WMTS template `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{Layer}/default/{Time}/{TileMatrixSet}/{z}/{y}/{x}.jpg` | [GIBS web examples](https://github.com/nasa-gibs/web-examples/blob/master/examples/leaflet/webmercator-epsg3857.js) |
| FFWC has an API (real-time + historical water levels), docs on registration | [FFWC API](https://api3.ffwc.gov.bd) |
| 2026 monsoon: Jamuna stayed below danger level; big floods were SE/NE; Padma char flooding in Sept | [Mappr FFWC tracker](https://www.mappr.co/bangladesh-monsoon-floods-2026/) |
| Comparable operational system: Copernicus GFM — Sentinel-1 ensemble flood maps with exclusion mask, likelihood and **advisory flags** layers | [GFM technical info](https://global-flood.emergency.copernicus.eu/technical-information/glofas-gfm) · [GFM PDD](https://extwiki.eodc.eu/GFM/PDD/Introduction) |

**Important correction to earlier team material:** DSWx-S1 *does* include an "inundated vegetation" class (from dual-pol ratio + wetland land cover). Therefore the app must never claim "Sentinel-1 cannot see flooded vegetation". The correct framing: *L-band penetrates crop and grass canopies more deeply than C-band; we compare NISAR's possible under-canopy water with DSWx-S1's inundated-vegetation class and show where they differ.*

### 2.1 How comparable professional systems work (UX lessons adopted)
| System | Pattern we adopt | Pattern we reject |
|---|---|---|
| Copernicus GFM | Separate layers for observed water, reference water, exclusion mask, likelihood, advisory flags → our classes + "could be wrong" list | Many parallel layers visible at once |
| NASA Worldview | Timeline at the bottom, map full-bleed, dates as first-class | Hundreds of layer choices |
| JRC Global Surface Water Explorer | Transitions (permanent → lost, new permanent) as named classes with fixed colours | — |
| Newsroom satellite explainers (Reuters/NYT graphics) | Before/after swipe, text in margin, one number per claim | Scroll-jacking long pages |
| Hydrology dashboards (FFWC) | Hydrograph with danger/warning lines | Tables of 127 stations |

---

## 3. System architecture

### 3.1 Decision
**Offline Python pipeline → versioned static data bundle → static web app on a CDN.** No backend server, no database.

Why: the product shows *precomputed, reproducible* results for one to a few reaches. A server/database adds failure points (cold starts, CORS, credentials, hosting) without adding capability. Judges click a public link; it must load instantly with zero runtime dependencies. The "API" is a set of immutable JSON/GeoJSON/PNG files with a fixed schema (Section 13). The *live* capability is the CLI pipeline that anyone can run to produce a new reach bundle.

### 3.2 Diagram
```
                         ┌──────────────────────── OFFLINE (team machine / cloud VM) ───────────────────────┐
 ASF DAAC (NISAR GCOV) ──┤                                                                                   │
 PO.DAAC (OPERA DSWx-S1)─┤  pipeline/ (Python 3.11)                                                          │
 AWS  (ASF GLO-30 HAND) ─┤   discover → fetch → validate_raw → preprocess → water → stage → pairs → change   │
 JRC GSW occurrence  ────┤   → validate_science → context (optional) → render → manifest → check_bundle      │
 FFWC API / bulletins ───┤                                                                                   │
 GES DISC (IMERG Late)*──┤  data/raw → data/interim → data/processed → data/results                         │
 LP DAAC (HLS)* ─────────┤                                                      │                            │
                         └──────────────────────────────────────────────────────┼────────────────────────────┘
                                                                                ▼
                                          web/public/data/v1/<reach_id>/  (bundle: JSON, GeoJSON, PNG)
                                                                                │  git commit
                                                                                ▼
                         ┌──────────────────────── STATIC HOSTING (Vercel / GitHub Pages) ──────────────────┐
  Browser ◄──────────────┤  web/ (Vite + React + TypeScript + MapLibre GL JS)                                │
  (judge, analyst)       │   fetch('/data/v1/reaches.json') → fetch bundle files → render map/hydrograph     │
  NASA GIBS tiles ◄──────┤   basemap/fly-in tiles fetched directly from GIBS (context only)                  │
                         └──────────────────────────────────────────────────────────────────────────────────┘
  * = SHOULD tier
```

### 3.3 Components
| Component | Why it exists | Receives | Produces | Talks to | Technology |
|---|---|---|---|---|---|
| `pipeline/discover.py` | Find exactly which granules exist for AOI/time | AOI, dates | `data/raw/<reach>/catalog.json` | ASF CMR via asf_search / earthaccess | asf_search, earthaccess |
| `pipeline/fetch.py` | Download/subset only needed layers | catalog | AOI-clipped GeoTIFFs + source metadata | ASF (HTTPS or S3) | earthaccess, h5py, xarray, rioxarray |
| `pipeline/validate_raw.py` | Reject broken/partial/wrong inputs | raw files | `validation_raw.json` | — | rasterio, numpy |
| `pipeline/preprocess.py` | Make analysis-ready dB stack | raw GeoTIFFs | `data/processed/.../hh_db_<date>.tif` | — | numpy, scipy |
| `pipeline/water.py` | Per-date water mask | dB rasters, HAND | water masks + thresholds | — | scikit-image, numpy |
| `pipeline/stage.py` | River height at each pass | FFWC data | `stage.csv` | FFWC API / manual file | requests, pandas |
| `pipeline/pairs.py` | Choose valid comparison pairs | stage.csv | `pairs.json` | — | pandas |
| `pipeline/change.py` | Erosion/accretion/seasonal/ambiguous | water stack, pairs | change raster, polygons, areas | — | numpy, rasterio.features, shapely |
| `pipeline/validate_science.py` | Cross-sensor, null test, sensitivity | change, DSWx, JRC | `qc.json`, agreement raster | PO.DAAC (DSWx) | earthaccess, rasterio |
| `pipeline/context.py` (SHOULD) | Rain, optical, CEGIS | — | context JSON/PNG | GES DISC, LP DAAC | earthaccess, xarray |
| `pipeline/render.py` | Display assets | rasters | PNGs in EPSG:3857 + bounds | — | rasterio (warp), Pillow |
| `pipeline/manifest.py` | Provenance for every number | all outputs | `manifest.json` | — | pydantic |
| `pipeline/check_bundle.py` | Refuse to ship an inconsistent bundle | bundle | pass/fail | — | jsonschema |
| `web/` | The product | bundle | UI | GIBS (tiles) | React, MapLibre, d3-scale/d3-shape |

AI/LLM components: **none**. Deployment: static host.

---

## 4. Tech stack (final — do not substitute)

### 4.1 Pipeline (Python)
| Tech | Version | Purpose | Why | Alternatives rejected |
|---|---|---|---|---|
| Python | 3.11 | Pipeline runtime | Stable wheels for geo stack | 3.13 (wheel gaps) |
| conda-forge / mamba (miniforge) | latest | Install GDAL-linked libs reliably | pip GDAL wheels break often | pure pip |
| asf_search | latest (pin at H0) | NISAR discovery with ASF-specific fields (track, frame, direction) | Official ASF client | raw CMR HTTP |
| earthaccess | ≥0.12 (pin at H0) | EDL auth, search, HTTPS/S3 open & download for NISAR, OPERA, IMERG, HLS | Official NASA client, one auth for all DAACs | per-DAAC scripts |
| h5py | ≥3.10 | Read GCOV HDF5 subsets | Direct dataset slicing | GDAL HDF5 driver (awkward) |
| xarray + h5netcdf | ≥2024.x | ASF-documented `open_datatree` path | Matches official docs | netCDF4 |
| rasterio | ≥1.3 | GeoTIFF IO, warp, polygonize, windows | Standard | GDAL CLI |
| rioxarray | ≥0.15 | CRS-aware clipping of xarray | Convenience | — |
| numpy, scipy | current | Array math, median filter | Standard | — |
| scikit-image | ≥0.22 | `threshold_otsu`, `remove_small_objects` | Well-tested implementations | hand-rolled Otsu |
| shapely ≥2, geopandas ≥0.14, pyproj | current | Geometry, simplify, area, GeoJSON | Standard | — |
| pandas | current | Stage series, tables | Standard | polars (unneeded) |
| pydantic | v2 | Manifest/schema models → JSON Schema | Enforces provenance contract | dataclasses |
| jsonschema | current | Bundle validation | — | — |
| Pillow | current | PNG writing | — | — |
| matplotlib | current | QC plots for Methods page (static PNG) | — | plotly (heavy) |
| pytest | current | Tests | — | — |
| make (GNU) | — | Reproducible entry points | Universally available | invoke/nox |

### 4.2 Web
| Tech | Version | Purpose | Why | Alternatives rejected |
|---|---|---|---|---|
| Node.js | 20 LTS | Build | LTS | — |
| Vite | 5.x | Dev server + static build | Fast, simple static output | Next.js (SSR unnecessary) |
| React | 18.x | UI composition | Team familiarity | Svelte (team unfamiliar) |
| TypeScript | 5.x | Types for bundle schema | Prevents schema drift | JS |
| MapLibre GL JS | 5.x (pin exact at H0 with `npm view maplibre-gl version`) | Map, image overlays, GeoJSON layers | Open source, WebGL, image sources | Leaflet (weaker raster/GL), Mapbox (token/licence), Cesium (3D not needed) |
| d3-scale, d3-shape, d3-array | 3.x | Hydrograph SVG (scales, line path) | Precise control, tiny | Chart.js/Recharts (look generic, harder to customise) |
| zustand | 4.x | Small global state (selected date, pair, layer toggles) | Minimal boilerplate | Redux |
| Vitest | 1.x | Unit tests | Vite-native | Jest |
| Playwright | 1.x | E2E main flow | Reliable | Cypress |
| No UI component library | — | — | Avoid generic look | shadcn/Tailwind UI kits (forbidden look) |
| Plain CSS modules + CSS custom properties | — | Styling via design tokens (Section 24) | Full control | Tailwind (allowed only if team insists; no default palette) |

### 4.3 Hosting
Vercel (static) — primary; GitHub Pages — fallback. No serverless functions.

---

## 5. Area of interest (AOI) and reach selection

### 5.1 Candidate reaches (starting AOIs — confirm at Phase 0 gate)
Chosen because they overlap CEGIS 2026 forecast districts and FFWC gauges on the Brahmaputra–Jamuna. Bounding boxes are **starting approximations** in EPSG:4326 `[min_lon, min_lat, max_lon, max_lat]`; refine to the actual NISAR frame.

| reach_id | Name | bbox (approx.) | Nearest FFWC gauges (VERIFY station IDs via FFWC) |
|---|---|---|---|
| `jamuna-chilmari` | Chilmari–Roumari (Kurigram) | `[89.60, 25.40, 89.90, 25.75]` | Chilmari, Noonkhawa |
| `jamuna-bahadurabad` | Fulchari–Dewanganj (Gaibandha/Jamalpur) | `[89.55, 25.05, 89.85, 25.40]` | Bahadurabad |
| `jamuna-kazipur` | Kazipur–Sirajganj | `[89.55, 24.25, 89.85, 24.65]` | Kazipur, Sirajganj |
| `teesta-dalia` (fallback) | Teesta lower reach | `[88.95, 25.85, 89.45, 26.20]` | Dalia, Kaunia |

### 5.2 Selection rule (deterministic)
Pick the first reach (in table order) that satisfies all:
1. ≥ 6 PROVISIONAL GCOV acquisitions on **one** relative orbit + frame + direction covering ≥ 90% of the bbox.
2. Frequency A pixel spacing 10 or 20 m, polarisation includes HH.
3. At least one gauge with values for ≥ 80% of acquisition dates (or fallback stage proxy feasible — Section 17).
4. ≥ 3 OPERA DSWx-S1 tiles within ±6 days of NISAR dates.
If none qualify → Section 17 "no usable reach".

Record the decision in `config/reaches/<reach_id>.yaml` and `docs/DECISIONS.md`.

---

## 6. Data sources (per-source specification)

Auth for all NASA sources: **Earthdata Login (EDL)** account, free — https://urs.earthdata.nasa.gov. `earthaccess.login(strategy="environment")` reads `EARTHDATA_USERNAME`/`EARTHDATA_PASSWORD`, or use `~/.netrc`. Never hard-code credentials.

### 6.1 NISAR L2 GCOV — PRIMARY
| Field | Value |
|---|---|
| Name | NISAR Provisional Geocoded Polarimetric Covariance Product (Version 1) |
| Short name | `NISAR_L2_GCOV_PROVISIONAL_V1` |
| DOI | 10.5067/NIL2GCOV-P1 |
| Provider | NASA/JPL NISAR, distributed by ASF DAAC |
| Docs | https://nisar-docs.asf.alaska.edu/gcov · product spec PDF linked there |
| Catalog | https://www.earthdata.nasa.gov/data/catalog/asf-nisar-l2-gcov-provisional-v1-1 · Vertex: https://search.asf.alaska.edu/#/?dataset=NISAR&sciProducts=GCOV |
| Why | Primary measurement of surface water on each pass |
| Authoritative | Yes (mission product) |
| License | Open, EOSDIS Data Use and Citation Guidance |
| Access | EDL required for download/stream |
| Rate limits | None documented; be polite (≤4 parallel downloads) |

**Acquisition workflow**
```
EDL login (earthaccess)
  ↓
asf_search: dataset='NISAR', processingLevel='GCOV', intersectsWith=<AOI WKT>, start='2026-06-17', end=<today>
  ↓  (filter to PROVISIONAL: shortName NISAR_L2_GCOV_PROVISIONAL_V1 / CRID >= P05023 in granule name)
Group by (relative orbit, direction, frame) → choose group per Section 5.2
  ↓
For each granule: stream via HTTPS (fsspec) or S3 (if running in AWS us-west-2), read ONLY:
   /science/LSAR/GCOV/grids/frequencyA/HHHH   (and HVHV if present)
   coordinate & projection datasets (VERIFY names)
   mask, numberOfLooks (for QC)
   identification metadata (VERIFY: zeroDopplerStartTime, orbit direction, track/frame)
  ↓
Clip to AOI window (UTM) → write GeoTIFF → save metadata JSON
  ↓
data/raw/<reach_id>/nisar/<granule_id>/{HHHH.tif, HVHV.tif, mask.tif, meta.json}
```
Reference code pattern (from ASF docs; adapt, do not paraphrase paths without verifying):
```python
import asf_search as asf, earthaccess
earthaccess.login(strategy="environment")
res = asf.search(dataset="NISAR", processingLevel="GCOV",
                 intersectsWith=aoi_wkt, start="2026-06-17", end=end_date)
# Keep PROVISIONAL only — VERIFY how shortName appears in res[i].properties
```
```python
import xarray as xr, earthaccess
fs = earthaccess.get_fsspec_https_session()
ds = xr.open_datatree(fs.open(https_url, cache_type="background", block_size=16*1024*1024),
                      engine="h5netcdf", decode_timedelta=False, phony_dims="access")
```
**VERIFY on the first granule (Phase 0, P0.2) and record in `docs/VERIFIED.md`:** exact HDF5 group names for x/y coordinates, projection/EPSG storage, fill value, time metadata field, polarisations present, pixel spacing, orbit direction field.

**File naming (raw):** keep the official granule ID as folder name, e.g.
`NISAR_L2_PR_GCOV_<CYL>_<REL>_<P>_<FRM>_<MODE>_<POLE>_<S>_<start>_<end>_<CRID>_<A>_<C>_J_<CTR>` (convention per [GCOV naming](https://nisar-docs.asf.alaska.edu/gcov)).

**Expected sizes:** full frames are large (240 km swath, many datasets). Never download full files unless streaming fails; AOI subsets of one polarisation at 20 m for a 35×40 km AOI ≈ 1750×2000 px float32 ≈ 14 MB per layer.

### 6.2 OPERA DSWx-S1 — INDEPENDENT VALIDATION
| Field | Value |
|---|---|
| Name | OPERA Dynamic Surface Water Extent from Sentinel-1 (Version 1) |
| Short name | `OPERA_L3_DSWX-S1_V1` · DOI 10.5067/OPDSWS1-L3V1 |
| Provider | NASA JPL OPERA, distributed by PO.DAAC |
| Docs | https://podaac.jpl.nasa.gov/dataset/OPERA_L3_DSWX-S1_V1 · Product spec: https://d2pn8kiwq2w21t.cloudfront.net/documents/OPERA_DSWx-S1_Product_Spec_v1.0.0_D-108761_RevA_2024-08-16_.pdf |
| Why | Independent water map, different satellite (Sentinel-1) and wavelength (C-band) |
| Access | EDL; `earthaccess.search_data(short_name="OPERA_L3_DSWX-S1_V1", bounding_box=bbox, temporal=(t0,t1))` |
| Format | GeoTIFF per layer (B01_WTR, B02_BWTR, B03_CONF, …) on MGRS 30 m tiles (UTM) |
| Needed | **WTR layer only** (VERIFY file suffix e.g. `_B01_WTR.tif`) |
| Classes | 0 not water · 1 open water · 3 inundated vegetation · 250 HAND masked · 251 layover/shadow · 255 fill |

Storage: `data/raw/<reach_id>/dswx/<granule_id>_B01_WTR.tif`

### 6.3 ASF GLO-30 HAND — terrain mask
| Field | Value |
|---|---|
| Provider | Alaska Satellite Facility; CC0 |
| Docs | https://stac.asf.alaska.edu/collections/glo-30-hand · https://glo-30-hand.s3.us-west-2.amazonaws.com/readme.html |
| Access | Public S3, no auth: list with `aws s3 ls --no-sign-request s3://glo-30-hand/` then pick 1°×1° tiles covering AOI (N24–N26, E089) — **VERIFY path/naming from readme** |
| Format | COG, 30 m, float metres |
Storage: `data/raw/common/hand/*.tif`

### 6.4 JRC Global Surface Water — occurrence (reference)
| Field | Value |
|---|---|
| Provider | EC Joint Research Centre; used as ancillary by OPERA DSWx-S1 |
| Docs/download | https://global-surface-water.appspot.com/download |
| Needed | `occurrence` 10°×10° tile covering 80–90E, 20–30N (**VERIFY exact filename on download page**) |
| Use | Define stable-land and permanent-channel zones for the null test; context only |
Storage: `data/raw/common/jrc_gsw/occurrence_*.tif`

### 6.5 FFWC river stage — scientific control
| Field | Value |
|---|---|
| Provider | Flood Forecasting and Warning Centre, Bangladesh Water Development Board |
| Docs | https://api3.ffwc.gov.bd (developer docs on registration; contact api.support@bwdb.gov.bd) · public station pages http://old.ffwc.gov.bd/ |
| Auth | API registration (token → `FFWC_API_TOKEN`) |
| Endpoints | **UNKNOWN until registration.** Do not guess endpoints. |
| Fallback A | Manual CSV `data/raw/<reach_id>/stage/stage_manual.csv` transcribed by a human from FFWC bulletins/station pages, with `source_url` and `retrieved_at` per row |
| Fallback B | Stage proxy from imagery (Section 10.4) |
CSV schema: `station_id,station_name,river,datetime_local,water_level_m_msl,danger_level_m_msl,source,source_url,retrieved_at`

### 6.6 GPM IMERG Late (SHOULD, context only)
Short name `GPM_3IMERGDL` (daily, Late, V07 — **VERIFY via earthaccess collection search**). Use: basin-mean daily rainfall over an upstream box (Assam/Meghalaya/northern Bangladesh `[89.0, 25.0, 95.5, 28.0]`), displayed as a thin strip above the hydrograph labelled "Rain upstream (context, not used in calculation)". Final run is not available for Aug–Oct 2026 by mid-Nov.

### 6.7 HLS optical (SHOULD, visual confirmation)
Short names `HLSL30` / `HLSS30` v2.0 (**VERIFY**), LP DAAC. Choose the clearest Oct–Nov 2026 scene (cloud < 10% over AOI) → true-colour PNG. Label "optical, visual confirmation only".

### 6.8 NASA GIBS (visual context, no auth)
- Fly-in basemap: `BlueMarble_ShadedRelief_Bathymetry` (static) — **VERIFY layer ID and TileMatrixSet via GetCapabilities** `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities`
- Template: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{Layer}/default/{Time}/{TileMatrixSet}/{z}/{y}/{x}.jpg`
- GIBS max zooms are low (Level8/9); above that, switch to a neutral vector basemap (Section 22.1).

### 6.9 CEGIS 2026 forecast reaches (SHOULD)
Source: CEGIS forecast as published/visualised by The Daily Star (https://campaign.thedailystar.net/river-erosion/). A human digitises approximate reach extents into `data/raw/common/cegis_2026_reaches.geojson` with properties `{name, district, predicted_ha (if published), source_url, digitised_by, approximate: true}`. If CEGIS provides a shapefile on request, use that and set `approximate: false`. **Never display a predicted number that isn't in the source.**

### 6.10 Admin boundaries & place names (SHOULD)
geoBoundaries (CC BY 4.0) Bangladesh ADM3/ADM4 — https://www.geoboundaries.org — for upazila/union labels only. Bengali names: take from the dataset if present; otherwise English only. Do not machine-translate names.

### 6.11 NASA EONET Earthquakes (SHOULD)
| Field | Value |
|---|---|
| Provider | NASA Earth Observatory Natural Event Tracker (EONET) |
| Docs | https://eonet.gsfc.nasa.gov/docs/v3 |
| Endpoint | `https://eonet.gsfc.nasa.gov/api/v3/categories/earthquakes` |
| Use | Fetch regional seismic activity (date, coordinates, magnitude) overlapping the time period of our radar acquisitions. This helps provide natural disaster context that might correlate with river morphology changes. |
| Fallback | If the API is unreachable, skip showing seismic activity (graceful degradation). |
Storage: `data/raw/common/earthquakes.json`

### 6.12 CEGIS Forecast & Geomorphological Prediction (SHOULD)
| Field | Value |
|---|---|
| Provider | CEGIS 2026 River Erosion Forecast or derived Geomorphological rules |
| Output | `prediction.geojson` (Polygons with erosion_risk, accretion_risk, ambiguity) |
| Use | Displays future predicted river bank migration and sediment buildup to create an Early Warning System layer. Hovering/clicking on these areas explains the probability and morphological rationale. |
---

## 7. Raw data structure (what we actually read)

| Dataset | Format | Size (AOI subset) | Layers used | CRS | Res | Units | NoData | Time field |
|---|---|---|---|---|---|---|---|---|
| NISAR GCOV | HDF5 → GeoTIFF subset | ~14 MB/layer | HHHH (γ⁰ power), HVHV (opt.), mask, numberOfLooks | UTM (zone 45N expected; VERIFY EPSG) | 20 m (or 10 m) | linear power | VERIFY (0/NaN) | zero-Doppler start (VERIFY) |
| DSWx-S1 | GeoTIFF | ~1–4 MB/tile | B01_WTR | UTM (MGRS) | 30 m | class | 255 | from granule name |
| HAND | COG | ~10 MB/tile | band 1 | EPSG:4326 | 1″ (~30 m) | m | VERIFY | static |
| JRC GSW | GeoTIFF | ~0.5 GB tile (crop at once) | occurrence | EPSG:4326 | 1″ | % 0–100 | 255 (VERIFY) | 1984–2021 |
| FFWC | CSV/JSON | KB | water level | point | — | m MSL | missing rows | local time (UTC+6) |

Do **not** read: off-diagonal covariance terms, frequency B, RTC gamma-to-sigma factor (we stay in γ⁰), any other GCOV layer not listed.

---

## 8. Complete data pipeline

```
[S1] DISCOVER        catalog.json (granule IDs, dates, track/frame/dir, URLs)
   ↓
[S2] FETCH           AOI-clipped GeoTIFFs + meta.json per granule
   ↓
[S3] VALIDATE RAW    validation_raw.json; failing granules moved to data/raw/<reach>/_rejected/
   ↓
[S4] PREPROCESS      common grid check → dB conversion → speckle filter → masks → analysis-ready stack
   ↓
[S5] WATER           per-date binary water (+ ambiguous) + threshold log
   ↓
[S6] STAGE           stage.csv (height at each acquisition)
   ↓
[S7] PAIRS           pairs.json (equal-stage / later-lower)
   ↓
[S8] CHANGE          change_<pair>.tif (classes), polygons.geojson, areas.json
   ↓
[S9] VALIDATE SCI    qc.json (DSWx agreement, null test, sensitivity, persistence, alignment)
   ↓
[S10] CONTEXT*       rain.json, optical PNG, cegis overlap
   ↓
[S11] RENDER         EPSG:3857 PNGs + bounds.json
   ↓
[S12] MANIFEST       manifest.json (every UI number with provenance)
   ↓
[S13] CHECK BUNDLE   schema + consistency checks → copy to web/public/data/v1/<reach_id>/
   ↓
[S14] WEB            fetch → MapLibre layers + hydrograph + evidence panel
```
Each step is a script with `--reach <reach_id>`; each writes `<step>.log.json` with inputs, parameters, git commit, start/end time.

---

## 9. Preprocessing — exactly how

| # | Operation | Do it? | Input → Output | Tool / params | Why | Failure condition |
|---|---|---|---|---|---|---|
| 1 | Radiometric calibration | **DO NOT perform** | — | — | GCOV is already calibrated γ⁰ | — |
| 2 | Terrain correction / geocoding | **DO NOT perform** | — | — | GCOV is already RTC + geocoded | — |
| 3 | AOI subset | Yes | HDF5 → GeoTIFF | h5py slicing by pixel window computed from AOI in product CRS | Avoid huge files | AOI outside grid → reject granule |
| 4 | Grid consistency check | Yes | all dates | Assert same EPSG, pixel size, and origin offset is an integer number of pixels | Same track/frame → should match | Mismatch → reproject to first date's grid with `rasterio.warp.reproject`, **nearest** resampling, log it |
| 5 | Co-registration (sub-pixel) | **DO NOT perform** | — | — | Same frame; we measure residual offset in QC instead | — |
| 6 | NoData masking | Yes | power → masked | mask where value ≤ 0, NaN, or GCOV mask indicates invalid (VERIFY mask semantics) | Avoid log(0) | NoData > 20% of AOI → reject date |
| 7 | dB conversion | Yes | linear → dB | `10*log10(p)` | Water/land separation is clearer in dB | — |
| 8 | Speckle filter | Yes, light | dB → dB | `scipy.ndimage.median_filter(size=5)` on dB, NaN-aware (fill NaN with local median first, re-mask after) | GCOV already multilooked; mild extra smoothing reduces salt-and-pepper | — |
| 9 | Refined Lee / temporal filtering | **DO NOT perform** | — | — | Adds tuning risk, blurs banklines | — |
| 10 | HAND mask | Yes | HAND → boolean on NISAR grid | warp HAND to NISAR grid (bilinear); `invalid_for_water = HAND > 15 m` | Removes impossible water on higher ground (few pixels in Bangladesh; documented rigor) | HAND tile missing → skip mask, flag `hand_mask: NOT_EVALUATED` |
| 11 | RFI screening | Yes | dB → flag | Per date compute row/column mean profiles; flag if any band of ≥ 20 consecutive rows/cols deviates > 3 dB from the date median profile | Provisional known issue | Flagged → date excluded from pairs; shown as grey tick "failed QC: interference" |
| 12 | Normalisation across dates | **DO NOT perform** | — | — | γ⁰ is calibrated; histogram matching would destroy real change | — |
| 13 | Resampling for display | Yes (render step only) | classes/dB → EPSG:3857 PNG | `rasterio.warp.reproject`, nearest for classes, bilinear for dB | MapLibre image sources assume web mercator corners | — |

Output: `data/processed/<reach>/hh_db/<YYYYMMDD>_<granule_short>.tif` (float32, dB, NaN nodata, LZW), plus `valid_<date>.tif` (uint8).

---

## 10. Scientific analysis

### 10.1 Water classification per date (S5)
**Method:** tile-based Otsu thresholding with bimodality check (standard SAR water-mapping approach; cf. split-based/hierarchical tile selection used in operational flood mapping).
```
dB image D (valid pixels only)
 → split into tiles 256×256 px
 → keep tiles with ≥ 80% valid pixels
 → for each tile: t_tile = otsu(D_tile); p = fraction(D_tile < t_tile)
     keep tile if 0.2 ≤ p ≤ 0.8  AND  Ashman's D ≥ 2
       (Ashman D = √2·|μ1−μ2| / √(σ1²+σ2²), classes split at t_tile)
 → if ≥ 5 tiles kept: T = otsu(pooled pixels of kept tiles)
   else: T = otsu(all valid pixels); flag threshold_method = "global_fallback"
 → plausibility window for L-band HH water: T must be within [-26, -12] dB
     outside → flag date "threshold_implausible", exclude from pairs
 → water = (D < T) & valid & ~hand_invalid
 → remove_small_objects(water, min_size=12 px, connectivity=2) and same on ~water (fill tiny holes)
```
Store per date: `T`, method, n_tiles, Ashman D stats → `thresholds.csv`.
Why appropriate: calm open water is a specular reflector → low γ⁰; the Jamuna and chars produce strongly bimodal histograms.
False positives: smooth dry sand, wet silt, radar shadow (rare in flat terrain), roads/tarmac. False negatives: wind-roughened water, water with emergent vegetation, narrow channels < 2–3 pixels.

### 10.2 Ambiguity classes (per date)
- `ambiguous_sand`: water by threshold AND pixel lies on a char/bar that DSWx-S1 (nearest date ±6 d) says `not water` → class "ambiguous". Excluded from headline, shown hatched.
- `possible_water_under_vegetation` (SHOULD): not water AND ΔHH = HH_t − HH_ref ≥ +3 dB where HH_ref is the per-pixel median of the three lowest-stage dates, AND HH_t ≥ −8 dB, AND outside the active river corridor (JRC occurrence < 5). Label "possible", never counted in erosion.

### 10.3 Stage at each acquisition (S6)
- Acquisition time = GCOV zero-Doppler start time converted to Asia/Dhaka (UTC+6).
- Stage = linear interpolation between the two nearest gauge readings within ±24 h at the reach's primary station. If no reading within ±24 h → stage `null` (date usable only in fallback modes).

### 10.4 Stage proxy fallback
If gauge data unavailable: `proxy_stage(t) = water fraction within a "reference floodplain box"` — a polygon drawn inside the AOI on low floodplain away from active banklines (JRC occurrence 5–60%). Monotonic with river level for a given reach. Label everywhere as "estimated from imagery (no gauge)". Pair rule uses proxy tolerance ±0.02 (fraction).

### 10.5 Pair selection (S7)
Valid dates = passed validation, not RFI-flagged, threshold plausible.
- **Equal-stage pair:** t0 < t1, |h1 − h0| ≤ 0.15 m, t0 before the season's stage maximum, t1 after it. Choose the pair with the smallest |Δh|; tie → largest time gap.
- **Later-lower pair (fallback):** h1 ≤ h0 with t0 before peak and t1 after peak; choose smallest h0 − h1 ≥ 0.
- If neither exists → no erosion result; app shows INCONCLUSIVE state (Section 21.6).
Output `pairs.json` lists primary pair and alternates.

### 10.6 Change classification (S8)
For the primary pair (t0, t1) and the set L = valid dates after t1:
```
land0 = ~water[t0] & valid[t0]
water1 = water[t1] & valid[t1]
persist_water = all(water[t] or ~valid[t] for t in L) and count(valid in L) ≥ 1   (if L empty: persist_water = water1, flag "no_persistence_check")
EROSION   = land0 & water1 & persist_water & ~ambiguous[t0] & ~ambiguous[t1]
ACCRETION = water[t0] & ~water[t1] & all(~water[t] or ~valid[t] for t in L)
SEASONAL  = land0 & water1 & ~persist_water          (temporary; shown only on request)
AMBIGUOUS = (land0 & water1) & (ambiguous[t0] | ambiguous[t1])
remove_small_objects on EROSION and ACCRETION, min_size = 12 px (0.48 ha at 20 m)
```
Class raster values: 0 none · 1 erosion · 2 accretion · 3 seasonal · 4 ambiguous · 255 nodata.

### 10.7 Area and uncertainty
- `area_ha = pixel_count × pixel_area_m2 / 10,000` (pixel area from the UTM grid; 400 m² at 20 m). **Compute from raster counts, never from simplified polygons.**
- Threshold sensitivity: rerun 10.1 + 10.6 with T−1 dB and T+1 dB for both dates → `area_low_thr`, `area_high_thr`.
- Boundary term: `b = perimeter_pixel_count × 0.5 × pixel_area` (perimeter pixels = erosion pixels with ≥1 non-erosion 4-neighbour).
- Reported range: `low = min(area_low_thr, area − b)`, `high = max(area_high_thr, area + b)`, clipped at 0.
- "Confirmed by two sensors" area = erosion pixels where DSWx-S1 (nearest to t0) = not water AND DSWx-S1 (nearest to t1) ∈ {1,3} (evaluated on 30 m grid, mapped back).

### 10.8 Polygons
`rasterio.features.shapes` on EROSION and ACCRETION → shapely → dissolve touching → `simplify(10 m, preserve_topology=True)` in UTM → reproject EPSG:4326 → GeoJSON with properties (Section 13.4). Discard polygons < 0.48 ha after simplification (area from raster count of the component, stored in properties).

### 10.9 What we never claim
Causes of erosion; number of people displaced (only quote CEGIS's own heuristic with attribution, if shown at all); "accuracy" (we have no ground truth — we report *agreement*); flood forecasts.

---

## 11. Validation

### 11.1 Data validation (S3) — per granule
| Check | Rule | On failure |
|---|---|---|
| File integrity | h5py opens; expected datasets exist | reject, log |
| Product maturity | PROVISIONAL (CRID ≥ P05023) | reject (never mix BETA) |
| Geometry group | same track/frame/direction as reach config | exclude from primary series (may be used as replicate) |
| CRS | EPSG present and UTM | reject |
| Pixel size | 10 or 20 m, identical across series | reject date if differs |
| Coverage | ≥ 90% AOI inside valid footprint | reject date |
| NoData | ≤ 20% of AOI | reject date |
| Value range | 99th percentile γ⁰ dB in [−5, 10], 1st percentile in [−35, −15] | flag "value_range" → exclude from pairs |
| Timestamp | parseable, within search window | reject |
| Partial coverage flag in name (`C` = P) | allowed only if coverage rule passes | — |
Rejected files move to `data/raw/<reach>/_rejected/` with reason in `validation_raw.json`.

Vector validation: all GeoJSON geometries `is_valid` (fix with `make_valid`), CRS EPSG:4326, coordinates within AOI.

### 11.2 Scientific validation (S9) → `qc.json`
| QC id | What | Method | Status rule |
|---|---|---|---|
| `dswx_agreement` | NISAR water vs DSWx-S1 | For each NISAR date with a DSWx tile ±6 d: reproject NISAR water to DSWx 30 m grid by `mode`; exclude DSWx 250/251/255; compute overall agreement, Cohen's κ, water IoU | PASS if κ ≥ 0.6; WARN 0.4–0.6; FAIL < 0.4 |
| `null_test` | False change on land that shouldn't change | Stable-land zone = JRC occurrence == 0 AND ≥ 3 km from any pixel with occurrence > 0 inside AOI; rate = erosion px / zone px | PASS ≤ 1%; WARN ≤ 3%; FAIL > 3% |
| `stage_match` | Pair water-level difference | |h1 − h0| | PASS ≤ 0.15 m; WARN later-lower; NOT_EVALUATED proxy mode |
| `persistence` | Erosion stays water | fraction of erosion px water in all later valid dates (by construction 100%) + number of later dates | PASS if ≥ 2 later dates; WARN 1; WARN "no later dates" |
| `threshold_sensitivity` | Robustness | (high − low)/area | PASS ≤ 30%; WARN ≤ 60%; FAIL > 60% |
| `alignment` | Residual misregistration | phase correlation (`skimage.registration.phase_cross_correlation`) of HH dB between t0 and t1 on stable-land zone | PASS < 0.5 px; WARN < 1 px; FAIL ≥ 1 px |
| `rfi` | Dates dropped for interference | count | INFO |
| `ambiguous_area` | Excluded ambiguous area | ha | INFO |
| `replicate` (SHOULD) | Opposite direction area | relative difference | PASS ≤ 30% |
Every QC entry: `{id, label, value, unit, status, rule, explanation, inputs[]}`. A check that could not run is `NOT_EVALUATED` with reason — never PASS.

**Result-level verdict** (drives headline wording):
- `SUPPORTED` if dswx_agreement, null_test, stage_match, alignment are PASS and sensitivity not FAIL.
- `INCONCLUSIVE` if any FAIL, or no valid pair.
- `LIMITED` otherwise.

### 11.3 Plausibility review (human)
Before Phase 11, a human checks: erosion concentrated on banks/char edges (not random); order of magnitude compared with CEGIS 2025–26 figures (hundreds of ha across multiple reaches, not tens of thousands); optical scene (if available) shows new bankline. Record in `docs/PLAUSIBILITY.md`. If implausible → do not ship the number; investigate thresholds/masks.

---

## 12. Storage layout

```
data/                              (git-ignored except data/demo/)
  raw/
    common/{hand,jrc_gsw,cegis_2026_reaches.geojson,boundaries}/
    <reach_id>/
      catalog.json
      nisar/<granule_id>/{HHHH.tif,HVHV.tif,mask.tif,meta.json}
      dswx/<granule_id>_B01_WTR.tif
      stage/{stage_api.json | stage_manual.csv}
      _rejected/
      validation_raw.json
  interim/<reach_id>/              (temporary; safe to delete)
  processed/<reach_id>/
      hh_db/<date>.tif  valid/<date>.tif  hand_invalid.tif
      water/<date>.tif  thresholds.csv
      stage.csv  pairs.json
  results/<reach_id>/
      change_<t0>_<t1>.tif  polygons_erosion.geojson  polygons_accretion.geojson
      areas.json  qc.json  agreement_<date>.tif  context/
web/public/data/v1/                (committed; the shipped bundle, ≤ 40 MB total)
  reaches.json
  <reach_id>/ (Section 13)
```
Naming: dates as `YYYYMMDD` (UTC acquisition date); rasters GeoTIFF LZW; nodata explicit. Persist raw + results; interim is disposable. `.gitignore` excludes `data/` (except `data/demo/README.md`). Large raw data lives on the processing machine; if a teammate needs it, share via cloud drive — never commit.

---

## 13. How data enters the application (the data contract)

### 13.1 Flow
```
results/*.tif, *.geojson, qc.json, stage.csv
   ↓ render.py      → PNG (EPSG:3857) + bounds
   ↓ manifest.py    → manifest.json (numbers + provenance)
   ↓ check_bundle.py (schema + consistency)
   ↓ copy           → web/public/data/v1/<reach_id>/
   ↓ static host
   ↓ fetch() in web/src/data/load.ts (typed by generated TS types)
   ↓ zustand store
   ↓ MapLibre image/GeoJSON sources + hydrograph + panels
```
There is no database. "Endpoints" below are static file paths (GET only).

### 13.2 Static endpoints
| Method | Path | Purpose | Output | Errors |
|---|---|---|---|---|
| GET | `/data/v1/reaches.json` | List available reaches | `Reach[]` | 404 → app error state "No data bundle" |
| GET | `/data/v1/<reach>/reach.json` | Reach metadata, AOI, dates, verdict | `ReachDetail` | 404 → reach unavailable |
| GET | `/data/v1/<reach>/manifest.json` | Every displayable number with provenance | `Manifest` | missing → app refuses to show numbers |
| GET | `/data/v1/<reach>/stage.json` | Hydrograph series + acquisition ticks | `Stage` | missing → proxy/NOT AVAILABLE state |
| GET | `/data/v1/<reach>/qc.json` | QC checks | `QC` | missing → all NOT_EVALUATED |
| GET | `/data/v1/<reach>/erosion.geojson` | Erosion polygons | FeatureCollection | missing → layer hidden |
| GET | `/data/v1/<reach>/accretion.geojson` | Accretion polygons | FeatureCollection | same |
| GET | `/data/v1/<reach>/img/radar_<YYYYMMDD>.png` | Radar greyscale per date | PNG | missing → grey tick, date disabled |
| GET | `/data/v1/<reach>/img/water_<YYYYMMDD>.png` | Water mask per date | PNG | same |
| GET | `/data/v1/<reach>/img/change_<t0>_<t1>.png` | Class raster (erosion/accretion/ambiguous) | PNG | — |
| GET | `/data/v1/<reach>/img/agreement_<YYYYMMDD>.png` | NISAR vs DSWx agreement | PNG | optional |
| GET | `/data/v1/<reach>/img/optical_<YYYYMMDD>.png` | HLS true colour (SHOULD) | PNG | optional |
| GET | `/data/v1/<reach>/bounds.json` | 4 corners (lng/lat) for all PNGs | `Bounds` | required |
| GET | `/data/v1/common/cegis_2026_reaches.geojson` | Forecast outlines (SHOULD) | FeatureCollection | optional |

### 13.3 Schemas (define as pydantic models in `pipeline/schemas.py`; export JSON Schema to `schemas/`; generate TS types to `web/src/data/types.ts` with `json-schema-to-typescript`)

`reaches.json`
```json
[{"reach_id":"jamuna-kazipur","name":"Kazipur–Sirajganj reach","river":"Jamuna",
  "bbox":[89.55,24.25,89.85,24.65],"verdict":"SUPPORTED",
  "data_frozen_at":"2026-11-14T18:40:00Z","bundle_version":"v1"}]
```
`reach.json`
```json
{"reach_id":"jamuna-kazipur","name":"Kazipur–Sirajganj reach","river":"Jamuna",
 "bbox":[89.55,24.25,89.85,24.65],"crs_analysis":"EPSG:32645",
 "track":{"relative_orbit":0,"direction":"A","frame":0},
 "dates":[{"date":"20260617","acq_utc":"2026-06-17T00:00:00Z","status":"ok|rfi|rejected|implausible","stage_m":0.0,"stage_source":"FFWC|proxy|null"}],
 "primary_pair":{"t0":"YYYYMMDD","t1":"YYYYMMDD","type":"equal_stage|later_lower","dh_m":0.0},
 "verdict":"SUPPORTED|LIMITED|INCONCLUSIVE","verdict_reasons":["..."],
 "headline_metric_id":"erosion_area"}
```
`manifest.json` (every number the UI may print)
```json
{"reach_id":"jamuna-kazipur","generated_at":"...","code_commit":"<sha>",
 "metrics":[
  {"id":"erosion_area","label":"Land lost to the river","value":0.0,"low":0.0,"high":0.0,"unit":"ha",
   "definition":"Land at t0, water at t1 and all later valid passes; river stage at t1 within 0.15 m of t0.",
   "method_ref":"methods#erosion",
   "inputs":[
     {"kind":"NISAR_GCOV","granule":"<full granule id>","acq_utc":"...","layer":"HHHH","doi":"10.5067/NIL2GCOV-P1"},
     {"kind":"FFWC_STAGE","station":"<id/name>","value_m":0.0,"time_local":"...","source_url":"..."}],
   "params":{"threshold_db_t0":0.0,"threshold_db_t1":0.0,"median_filter":5,"mmu_px":12,"hand_max_m":15},
   "pixel_area_m2":400,"pixel_count":0,
   "qc_refs":["dswx_agreement","null_test","threshold_sensitivity"]},
  {"id":"erosion_area_confirmed","label":"…confirmed by Sentinel-1 (OPERA)", "...":"..."},
  {"id":"accretion_area", "...":"..."},
  {"id":"ambiguous_area", "...":"..."}]}
```
`stage.json`
```json
{"station":{"id":"...","name":"...","river":"Jamuna","danger_level_m":0.0,"source":"FFWC"},
 "series":[{"t":"2026-06-01T06:00:00+06:00","h":0.0}],
 "acquisitions":[{"date":"YYYYMMDD","t":"...","h":0.0,"status":"ok"}],
 "mode":"gauge|proxy"}
```
`qc.json` → `{"checks":[{"id","label","value","unit","status":"PASS|WARN|FAIL|NOT_EVALUATED|INFO","rule","explanation","inputs":[]}]}`
`bounds.json` → `{"coordinates":[[lng,lat]x4 in order TL,TR,BR,BL]}` (MapLibre image-source order).

### 13.4 GeoJSON feature properties (erosion/accretion)
```json
{"type":"Feature","geometry":{...},
 "properties":{"id":"ero-0007","class":"erosion","area_ha":0.0,"pixel_count":0,
   "t0":"YYYYMMDD","t1":"YYYYMMDD","confirmed_by_dswx":true,
   "centroid":[lng,lat],"nearest_place":"<union/upazila or null>",
   "in_cegis_reach":"<name or null>"}}
```

### 13.5 Consistency checks (`check_bundle.py`, build fails if any fails)
- Sum of `erosion.geojson` `pixel_count` == manifest `erosion_area.pixel_count`.
- Every PNG referenced in reach.json exists; every date with status ok has radar + water PNG.
- Every metric has ≥1 input with a granule/source.
- No numeric literal in `web/src` (lint rule: ban numbers > 9 in JSX text except CSS/layout constants — enforced by a custom ESLint rule or grep in CI).

---

## 14. End-to-end real-data example (flagship reach)

This is the reference run Claude Code reproduces. Values in `< >` are filled from the actual run — never typed.

1. **Config** `config/reaches/jamuna-kazipur.yaml`
```yaml
reach_id: jamuna-kazipur
name: Kazipur–Sirajganj reach
bbox: [89.55, 24.25, 89.85, 24.65]
start: 2026-06-17
end: 2026-11-14
nisar_short_name: NISAR_L2_GCOV_PROVISIONAL_V1
polarisation: HHHH
track: {relative_orbit: <from discover>, direction: <A|D>, frame: <n>}
stage: {mode: gauge, station_names: [Kazipur, Sirajganj]}
params: {median_filter: 5, tile_px: 256, ashman_min: 2.0, t_window_db: [-26, -12], mmu_px: 12, hand_max_m: 15, dh_max_m: 0.15, dswx_window_days: 6}
```
2. `make discover REACH=jamuna-kazipur` → `catalog.json` with e.g. `<n>` granules; groups by orbit; picks group with most dates.
3. `make fetch` → for each granule, stream HTTPS, slice HHHH window, write `HHHH.tif` (UTM, 20 m), `meta.json` (granule id, times, orbit, CRID).
4. `make validate-raw` → e.g. `<k>` dates pass, `<r>` rejected (reason list).
5. `make preprocess` → `hh_db/<date>.tif`.
6. `make water` → `water/<date>.tif`, thresholds e.g. `<-19.x> dB` per date.
7. `make stage` → FFWC values interpolated to acquisition times; `stage.csv`.
8. `make pairs` → primary pair e.g. `<20260629>` (h `<x>` m) & `<20261015>` (h `<y>` m), Δh `<z>` m.
9. `make change` → `change_<t0>_<t1>.tif`, `polygons_erosion.geojson` (`<m>` polygons), `areas.json` (`<A>` ha, range `<L>–<H>`).
10. `make validate-science` → `qc.json` (κ `<…>`, null-test `<…>%`, alignment `<…>` px).
11. `make render` → PNGs in EPSG:3857 + `bounds.json`.
12. `make manifest && make check-bundle` → bundle copied to `web/public/data/v1/jamuna-kazipur/`.
13. `npm run dev` → app loads reach, hydrograph shows `<k>` ticks; "Match the water" selects `<t0>/<t1>`; ember polygons appear; headline shows `<A> ha (<L>–<H>)`.
14. User clicks polygon `ero-00xx` → evidence panel shows its area, t0/t1 radar crops (from the same PNGs), granule IDs, gauge readings, DSWx confirmation flag, and links to Methods anchors.

---

## 15. Reproducibility — from empty machine

```bash
# 1. environment
mamba env create -f environment.yml && conda activate srt
cd web && npm ci && cd ..
# 2-3. credentials
cp .env.example .env    # fill EARTHDATA_USERNAME / EARTHDATA_PASSWORD (+ FFWC_API_TOKEN if issued)
python -c "import earthaccess; earthaccess.login(strategy='environment')"
# 4. AOI
ls config/reaches/      # choose REACH
# 5-11. pipeline
make discover fetch validate-raw preprocess water stage pairs change validate-science REACH=jamuna-kazipur
make context REACH=jamuna-kazipur        # SHOULD tier, optional
make render manifest check-bundle REACH=jamuna-kazipur
# 12. (no database)
# 13-14. app
cd web && npm run dev                    # http://localhost:5173
# 15. verify
npm run test && npx playwright test
# all at once
make reproduce REACH=jamuna-kazipur
```
Makefile targets must exist exactly with these names.

---

## 16. Live data vs demo data

- **Live pipeline:** the CLI above, run against ASF/PO.DAAC/FFWC for any configured reach. Produces a new bundle version. Anyone with EDL credentials can add a reach by adding a YAML file.
- **Demo:** the committed bundle in `web/public/data/v1/` produced by the live pipeline during the hackathon from **real data**. The app *always* reads bundles; there is no separate code path. There is therefore no "demo mode switch" — only the bundle's `data_frozen_at` timestamp, displayed in the UI footer: "NISAR data through <last acquisition date> · processed <data_frozen_at>".
- Download early (Phase 1) and keep raw data on at least two machines.
- Never fabricate a bundle. If the pipeline fails, the app shows the INCONCLUSIVE/NOT AVAILABLE states defined in Section 21.

---

## 17. Failure and fallback strategy (deterministic)

| Failure | Detection | Fallback (do exactly this) |
|---|---|---|
| EDL credentials missing | login raises | Stop; print setup instructions; do not continue |
| ASF/CMR search down | HTTP error ×3 with backoff (5, 20, 60 s) | Retry after 10 min; meanwhile work on web with any bundle already produced; log in BLOCKERS |
| Download fails / slow (< 1 MB/s) | timing | Switch HTTPS↔S3 (S3 only if running in AWS us-west-2); reduce to HHHH only; if still failing, use Vertex manual download by a human and place files in raw/ |
| Rate limited (429) | status | exponential backoff, max 4 parallel |
| Corrupted HDF5 | open fails | re-download once; then reject |
| No reach qualifies (5.2) | gate | Relax to ≥ 4 dates; else try `teesta-dalia`; else ship "readiness" result: NISAR vs DSWx agreement only (no erosion), verdict INCONCLUSIVE, UI shows water-per-date + agreement |
| FFWC API unavailable | no token/errors | Fallback A manual CSV; else Fallback B proxy stage (10.4) |
| No equal-stage pair | pairs.py | later-lower pair; else INCONCLUSIVE with explanation |
| Threshold implausible on key date | S5 flag | drop date, re-pair |
| Processing too slow | step > 30 min | reduce AOI to 25×25 km around the most active bank; keep method identical |
| DSWx unavailable for window | search empty | `dswx_agreement: NOT_EVALUATED`; verdict cannot be SUPPORTED → LIMITED |
| HAND missing | fetch fail | skip mask, NOT_EVALUATED |
| Invalid geometry | shapely | `make_valid`, drop empties, log |
| Dependency install fails | env build | use `environment.lock.yml`; do not switch libraries |
| Bundle check fails | check_bundle | do not deploy; fix pipeline |
| Frontend cannot load bundle | fetch error | show error state with retry and file path; never show placeholder numbers |
| GIBS tiles fail | tile errors | fall back to plain neutral background colour; the data layers still work |
| Model inference fails | n/a | No models in this project |

---

## 18. "Backend" design

There is no server. The backend is the pipeline + the static contract (Section 13). Logging: each step writes `data/results/<reach>/logs/<step>.log.json`:
```json
{"step":"water","reach":"jamuna-kazipur","started":"...","ended":"...","git_commit":"...","inputs":["..."],"outputs":["..."],"params":{...},"warnings":["..."],"status":"ok|failed"}
```
Async processing: not needed; steps run sequentially; `fetch` may use a thread pool (max 4).

---

## 19. Database design

**No database.** Justification: ≤ a few reaches, immutable results, all queries are "load this reach". Storing results as files keeps provenance transparent and deployment trivial. **Do not add PostgreSQL/PostGIS/SQLite/Redis/Supabase/Firebase.** If a future version needs multi-reach search across many years, revisit — not in this hackathon.

---

## 20. Frontend structure

### 20.1 Routes
| Route | Purpose |
|---|---|
| `/` | The River — the whole product experience (defaults to flagship reach) |
| `/?reach=<id>&t0=<date>&t1=<date>&feature=<id>` | Deep link to a state (shareable) |
| `/methods` | Methods, validation, limitations, data citations, code link |
No other routes.

### 20.2 Components
```
App
├─ TopBar                 (product name, reach picker, "Methods" link, data timestamp)
├─ RiverView
│  ├─ MapStage            (MapLibre map; layers per Section 22)
│  │   ├─ FlyIn           (one-time camera sequence)
│  │   ├─ CompareSwipe    (two synced maps with clip; active only in compare mode)
│  │   └─ MapLegend       (≤ 4 items, context-dependent)
│  ├─ StoryPanel          (left column: current state sentence, headline metric, verdict)
│  │   ├─ Headline        (metric from manifest, range, receipt trigger)
│  │   ├─ VerdictBadge    (SUPPORTED / LIMITED / INCONCLUSIVE)
│  │   └─ LayerToggles    (water, change, forecast outlines, optical — max 4)
│  ├─ Hydrograph          (bottom strip: stage curve, danger line, acquisition ticks, scrub handle, rain strip)
│  │   └─ MatchWaterButton
│  ├─ EvidencePanel       (right drawer: selected metric or polygon)
│  └─ QCPanel             ("How this could be wrong")
├─ MethodsPage
└─ StateScreens           (Loading, Error, OutsideCoverage, Inconclusive)
```
### 20.3 State (zustand)
`{reachId, reach, manifest, stage, qc, selectedDate, compare:{active,t0,t1}, selectedFeatureId, layers:{water,change,forecast,optical}, panel:'none'|'evidence'|'qc', flyInDone}`
### 20.4 Data loading
`web/src/data/load.ts`: fetch reaches.json → reach bundle files in parallel → validate with generated types (zod schemas generated from JSON Schema or hand-mirrored and unit-tested against fixtures copied from the real bundle) → store. Preload radar PNGs for all ok dates after first paint (`new Image()`), show progress in Hydrograph ticks (hollow → filled when loaded).

---

## 21. Screen-by-screen specification

### 21.1 Screen: The River (`/`)
**Purpose:** answer what happened, where, when, how much, how sure, from what data.
**User:** judge/analyst/public. **Primary task:** understand land lost in this reach this season and verify it.

**Layout — desktop (≥ 1200 px)**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TopBar 44px: SAME RIVER TWICE · Jamuna ▾(reach) ·············· Methods · data │
├───────────────┬──────────────────────────────────────────────────────────────┤
│ StoryPanel    │                                                              │
│ 340px         │                  MapStage (full remaining)                   │
│ - sentence    │                                                              │
│ - headline    │                                              [legend ≤4]     │
│ - verdict     │                                                              │
│ - toggles     │                                                              │
│ - QC link     │                                                              │
├───────────────┴──────────────────────────────────────────────────────────────┤
│ Hydrograph 150px: rain strip 16px / stage curve / ticks / date labels / [Match the water] │
└──────────────────────────────────────────────────────────────────────────────┘
EvidencePanel slides over map from right, 400px, map stays interactive.
```
**Above the fold (first 5 s):** fly-in ends on reach; StoryPanel shows one sentence ("NASA-ISRO NISAR radar saw this stretch of the Jamuna <k> times between <first> and <last> 2026."), headline placeholder area reads "Press Match the water to compare the river at the same height" until compare is active. Hydrograph visible.

**Interactions**
| Action | Result |
|---|---|
| Drag handle / click tick on hydrograph | `selectedDate` = nearest ok date; map radar layer swaps; StoryPanel sentence updates: "<date>: river at <h> m (<Δ to danger> below danger level)" |
| Hover tick | tooltip: date, stage, status (ok / failed QC: reason) |
| Keyboard ←/→ | previous/next ok date |
| Press Match the water | horizontal line drawn at h(t0); t0 & t1 ticks highlighted; map enters CompareSwipe (left t0, right t1); change layer fades in (300 ms); headline shows erosion area + range; URL updated |
| Drag swipe divider | reveals t0/t1 radar; change layer stays on top in both halves |
| Hover erosion polygon | outline thickens; tooltip "<area_ha> ha · land at <t0>, water from <t1>" |
| Click polygon / headline | EvidencePanel opens for that feature/metric |
| Toggle "Water" | shows water mask of selected date (cyan) |
| Toggle "Forecast reaches" (SHOULD) | dashed outlines + label "CEGIS 2026 forecast (approximate)" |
| Toggle "Optical" (SHOULD) | HLS image replaces radar for its date only; label |
| Zoom/pan | free; beyond AOI shows OutsideCoverage hint (21.5) |
| Click "How this could be wrong" | QCPanel |
| Reach picker | loads another bundle; resets compare |

**States**
| State | Display |
|---|---|
| Loading | map neutral background; hydrograph skeleton line (static, no shimmer); text "Loading radar passes…" |
| Success | as above |
| Partial data | failed dates as hollow grey ticks with reason on hover; sentence notes "<n> passes excluded by quality checks" |
| Empty (no reach) | "No processed reach in this bundle." + link to Methods/reproduce |
| Error | "Couldn't load <file>. Retry" button; no numbers shown |
| INCONCLUSIVE | Match the water still works if a pair exists, but headline reads "Result inconclusive" with the failing check names; if no pair: button disabled-looking but clickable, shows reason |
| Stage proxy mode | hydrograph y-axis label "Estimated from imagery (no gauge)"; stage_match NOT_EVALUATED |
| Offline/frozen data | footer always shows "NISAR data through <date> · processed <timestamp>" |

**Responsive**
- Tablet (768–1199): StoryPanel becomes top overlay card 100% width, collapsible; hydrograph 130 px.
- Mobile (< 768): map 58vh; hydrograph 110 px below map; StoryPanel as bottom sheet (peek 96 px shows headline); EvidencePanel full-screen sheet; swipe divider is a draggable vertical handle (touch target 44 px).

### 21.2 Evidence panel
Sections in order: (1) What — label + value + range + unit; (2) Where — mini locator + nearest place; (3) When — t0/t1 with stage values; (4) Radar crops — t0 and t1 side by side (cropped from the same PNGs around the feature, not new data); (5) Sources — each input with dataset name, granule ID (monospace, copy button), acquisition UTC, DOI link; (6) Method — definition sentence + parameters table + link `methods#erosion`; (7) Checks — QC items referenced by `qc_refs` with status.

### 21.3 QC panel ("How this could be wrong")
List of QC items from qc.json: status glyph (text label, not colour only), label, computed value, rule, one-sentence explanation. Order: FAIL, WARN, NOT_EVALUATED, PASS, INFO.

### 21.4 Methods page
Long-form, single column (max 720 px text width): pipeline diagram (static SVG), data sources table with DOIs, algorithm steps, parameter table, QC results with the two static plots (threshold sensitivity, DSWx agreement confusion matrix), limitations, "what we don't claim", reproduction commands, credits (including AI tools used, per Space Apps reference requirements). This text is reused for the Space Apps project page.

### 21.5 Outside coverage
When map centre leaves the AOI by > 5 km: a small inline note at the top of the map "No processed radar here. Processed reaches: [Jamuna Kazipur ↗]" — clicking flies back.

### 21.6 Visual element purpose register (anything not here must not exist)
| Element | Purpose |
|---|---|
| Map | Change is geographic |
| Radar greyscale layer | Show the actual measurement |
| Water layer | Make radar interpretable for non-experts |
| Erosion/accretion layers | The result |
| Hatched ambiguous layer | Show what we excluded and why |
| Hydrograph | The control variable (river height) and the timeline |
| Acquisition ticks | When the satellite actually observed |
| Danger line on hydrograph | Context: was this a flood year at this gauge |
| Rain strip (SHOULD) | Why the river rose (upstream) |
| Match the water button | Performs the scientific control |
| Swipe | Compare equal-stage passes |
| Headline number | The answer |
| Range | Uncertainty |
| Verdict badge | Overall trust level from computed checks |
| Evidence panel | Verifiability |
| QC panel | Self-critique |
| Forecast outlines (SHOULD) | External comparison |
| Data timestamp | Freshness honesty |

---

## 22. Map UX

### 22.1 Base and layers (bottom → top)
| # | Layer | Source | Visible | Opacity | Notes |
|---|---|---|---|---|---|
| 1 | Background | solid `--map-bg` | always | 1 | fallback if tiles fail |
| 2 | GIBS Blue Marble (fly-in only, z ≤ 7) | GIBS WMTS | during fly-in, then off | 1 | context |
| 3 | Neutral vector basemap (roads/labels muted) | OpenFreeMap (`https://tiles.openfreemap.org/styles/positron` — VERIFY) or no basemap | z ≥ 8 | 0.6 | if unavailable → background only |
| 4 | Radar (selected date) | image source radar_<date>.png | default on | 1 | greyscale |
| 5 | Water (selected date) | water_<date>.png | toggle | 0.55 | cyan |
| 6 | Ambiguous | change PNG class 4 | in compare | 1 | hatched pattern |
| 7 | Accretion | accretion.geojson fill | in compare | 0.75 | sand |
| 8 | Erosion | erosion.geojson fill | in compare | 0.85 | ember |
| 9 | Polygon outlines (hover/selected) | same GeoJSON line | on hover/select | 1 | 1 px / 2 px |
| 10 | CEGIS outlines (SHOULD) | GeoJSON line | toggle | 1 | dashed |
| 11 | AOI outline | reach bbox | always | 0.5 | thin, dashed |
| 12 | Place labels (upazila/union) | geoBoundaries points | z ≥ 10 | — | small caps |

### 22.2 Colour semantics (fixed; see tokens in 24)
Radar: pure greyscale, **same stretch for all dates** (global 2nd–98th percentile of all valid dates in dB, fixed in bounds.json as `radar_stretch_db:[lo,hi]` and in the legend). Water: cyan. Erosion: ember. Accretion: sand. Ambiguous: grey hatching. Forecast: dashed off-white. Never use red/green together; never encode meaning by colour alone (hatching, dashes, labels).

### 22.3 Behaviours
- Fit-to-AOI button (icon + label "Reach") top-right.
- Fly-in: `map.flyTo` Earth (z1) → Bangladesh (z6) → reach bbox (fitBounds) over ≤ 5 s; skippable by any click; runs once per session; respects `prefers-reduced-motion` (jump directly).
- Swipe implementation: two MapLibre instances in the same container, synced on `move` events, right map clipped with CSS `clip-path: inset(0 0 0 X)`; divider handle draggable (mouse/touch/keyboard). Do not add a third map.
- Missing data: dates without PNG are unselectable; the map never shows a stale image without a visible date label (date stamp rendered bottom-left of map at all times, and on each side in swipe).
- Legend changes with mode (browse vs compare), never more than 4 entries.
- Non-expert explanation: a one-line caption under the legend in browse mode: "Radar: water looks dark, land looks bright."

---

## 23. Explainability map

| Question | Where answered |
|---|---|
| What happened? | Headline label + StoryPanel sentence |
| Where? | Map + nearest place in evidence |
| When? | Hydrograph ticks, t0/t1 dates, date stamps on map |
| How large? | Area + range (manifest) |
| How significant? | Comparison to reach area and (SHOULD) CEGIS forecast outline overlap — no invented severity score |
| How confident? | Verdict + QC list + confirmed-by-two-sensors subset |
| What evidence? | Evidence panel sources + radar crops + optical toggle |
| What data? | Granule IDs, DOIs |
| How calculated? | Definition sentence + params + Methods anchor |

---

## 24. Visual design system

**Principle:** the radar image is the visual centre; everything else is quiet instrumentation.

### 24.1 Tokens (`web/src/styles/tokens.css`)
```css
:root{
  --bg:#0E1113; --map-bg:#15191C; --panel:#12161A; --line:#2A3036; --line-strong:#3A424A;
  --text:#E6E8EA; --text-2:#A7AEB5; --text-3:#6F7880;
  --water:#39C4D9; --erosion:#E4572E; --accretion:#D9B26A; --ambiguous:#8A9299; --forecast:#E6E8EA;
  --pass:#7FBF8E; --warn:#E0B34A; --fail:#E4572E; --na:#6F7880;
  --font-text:"IBM Plex Sans", system-ui, sans-serif;
  --font-num:"IBM Plex Mono", ui-monospace, monospace;
  --r:2px; --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px; --s6:32px;
}
```
(Light theme not required. Dark chosen because radar greyscale reads best on dark, not for style.)

### 24.2 Rules
- Typography: text 14 px/1.5; labels 12 px uppercase-free, letter-spacing 0.02em; headline number 40 px mono; all numbers mono with tabular figures. Two weights only (400/500). Load IBM Plex via Google Fonts or self-host.
- Spacing: 4-px scale above. Panels are flush to edges; no floating cards with shadows.
- Borders: 1 px `--line`; radius 2 px max; **no shadows, no blur, no gradients, no glow**.
- Icons: only where they replace words the user already understands (close, copy, expand, fit). Use a single outline icon set (Lucide) at 16 px. Never decorative.
- Status: always text + glyph + colour (e.g., "PASS ✓"), never colour alone.
- Charts: hydrograph only (plus static Methods plots). Axes thin `--line`, labels `--text-3`, curve 1.5 px `--text`, danger line dashed `--fail` at 50% opacity with label, ticks 1 px × 8 px `--water`; selected tick 2 px. No chart background, no gridlines except 2–3 horizontal reference lines.
- Motion: only (a) fly-in, (b) layer fade 200–300 ms, (c) number count-up ≤ 600 ms when compare activates. Respect `prefers-reduced-motion`.
- Density: StoryPanel content fits without scrolling at 900 px height.
- Copy: sentence case, plain words; forbidden words: "AI-powered", "seamless", "revolutionary", "insights", "unlock".
- Accessibility: WCAG AA contrast for text; all controls keyboard reachable; swipe handle has `role="slider"`.

### 24.3 Forbidden patterns (reject in review)
Purple/blue gradient heroes · glassmorphism · metric-card grids · donut charts · random sparklines · emoji · "AI confidence %" · fake live indicators ("● LIVE") · landing-page hero before the app · lorem ipsum · placeholder numbers.

---

## 25. Provenance chain (enforced)
```
UI text (Headline) ← manifest.metrics[id] ← areas.json ← change_<t0>_<t1>.tif ← water/<date>.tif ← hh_db/<date>.tif ← raw granule HHHH.tif ← ASF granule <id>
```
Implementation: `Headline` renders only `manifest.metrics.find(id).value`; if missing → renders "—" and "Not available". Unit test asserts no hardcoded numbers.

---

## 26. Project file structure
```
same-river-twice/
├── plan.md                         this file
├── README.md                       what it is, how to run, credits
├── Makefile                        all pipeline + web targets
├── environment.yml / environment.lock.yml
├── .env.example
├── config/reaches/*.yaml           one per reach
├── pipeline/
│   ├── __init__.py  config.py  schemas.py  io_nisar.py  io_dswx.py  io_stage.py
│   ├── discover.py fetch.py validate_raw.py preprocess.py water.py stage.py pairs.py
│   ├── change.py validate_science.py context.py render.py manifest.py check_bundle.py
│   └── utils/{raster.py, geom.py, logging.py}
├── schemas/                        exported JSON Schemas
├── tests/                          pytest (synthetic arrays allowed here only)
│   ├── fixtures/
│   └── test_*.py
├── data/                           git-ignored (see Section 12)
├── web/
│   ├── index.html  package.json  vite.config.ts  tsconfig.json  playwright.config.ts
│   ├── public/data/v1/             shipped bundle
│   └── src/
│       ├── main.tsx  App.tsx
│       ├── data/{load.ts, types.ts, schema.ts}
│       ├── state/store.ts
│       ├── map/{MapStage.tsx, layers.ts, CompareSwipe.tsx, FlyIn.ts, MapLegend.tsx}
│       ├── hydrograph/{Hydrograph.tsx, MatchWaterButton.tsx}
│       ├── panels/{StoryPanel.tsx, Headline.tsx, VerdictBadge.tsx, LayerToggles.tsx, EvidencePanel.tsx, QCPanel.tsx}
│       ├── pages/Methods.tsx
│       ├── states/{Loading.tsx, ErrorState.tsx, OutsideCoverage.tsx, Inconclusive.tsx}
│       └── styles/{tokens.css, base.css}
└── docs/
    ├── challenge_statement.md  DECISIONS.md  VERIFIED.md  BLOCKERS.md  PLAUSIBILITY.md
    └── submission/{project_page.md, video_script.md}
```

---

## 27. Implementation order (relative sequencing — see §0.1 for how these hour-labels map to the actual 28 Sep 2026 deadline)

| Phase | Hours | Tasks | Files | Output | Acceptance |
|---|---|---|---|---|---|
| **P0 Environment & feasibility** | H0–H4 | P0.0 challenge-fit table; P0.1 env + EDL login test; P0.2 discover all candidate reaches; open one GCOV, VERIFY paths/fields; P0.3 timing test; P0.4 DSWx availability; P0.5 FFWC access decision; P0.6 reach selection | environment.yml, Makefile, config/, pipeline/discover.py, io_nisar.py, docs/VERIFIED.md, docs/DECISIONS.md | catalog.json per reach; chosen reach | Reach chosen by rule 5.2; VERIFIED.md lists real HDF5 paths; `make discover` works |
| **P1 Acquisition** | H4–H9 | fetch.py; validate_raw.py; HAND/JRC/DSWx fetch | fetch.py, validate_raw.py, io_dswx.py | raw GeoTIFFs; validation_raw.json | ≥ 6 dates pass; files open; CRS/pixel consistent |
| **P2 Preprocessing** | H8–H11 | preprocess.py incl. RFI screen, HAND warp | preprocess.py, utils/raster.py | hh_db stack | quicklook PNGs show the river correctly for 3 dates (human check) |
| **P3 Science** | H10–H18 | water.py; stage.py; pairs.py; change.py | + tests | water masks, stage.csv, pairs.json, change raster, polygons, areas.json | unit tests pass; erosion concentrated on banks (human check); areas reproducible (run twice → identical) |
| **P4 Validation** | H16–H22 | validate_science.py; plausibility review | validate_science.py, docs/PLAUSIBILITY.md | qc.json + plots | every QC has value or NOT_EVALUATED; verdict computed |
| **P5 Result generation** | H20–H24 | render.py; manifest.py; check_bundle.py; schemas export; TS types | render.py, manifest.py, schemas/, web/src/data/types.ts | bundle in web/public/data/v1 | `make check-bundle` passes |
| **P6 Frontend foundation** | H12–H24 (parallel, uses real bundle as soon as P5 first run exists; before that uses **fixtures copied from real intermediate outputs**, never invented values) | Vite app, tokens, store, loader, state screens | web/src/{main,App,data,state,styles,states} | app loads bundle | loads reaches.json; error state shows on missing file |
| **P7 Map** | H22–H30 | MapStage, layers, fly-in, legend, outside-coverage | web/src/map/* | radar + water per date | date switch < 150 ms after preload; layers in order 22.1 |
| **P8 Hydrograph & compare** | H26–H34 | Hydrograph, MatchWater, CompareSwipe | web/src/hydrograph/*, CompareSwipe.tsx | the signature interaction | selecting pair from pairs.json; swipe works mouse/touch/keyboard |
| **P9 Evidence & QC** | H30–H36 | StoryPanel, Headline, EvidencePanel, QCPanel, deep links | web/src/panels/* | explainability | every number from manifest; click polygon → evidence |
| **P10 SHOULD features** | H34–H40 | context.py (rain, optical, CEGIS); toggles | pipeline/context.py, LayerToggles | extra evidence | each one either real-data-backed or not shown |
| **P11 Error handling pass** | H38–H41 | all states in 21.1 | states/* | robust app | Playwright tests for error/empty/inconclusive pass |
| **P12 Testing** | continuous; final H40–H43 | Section 29 | tests/, web/tests | green CI | all tests pass |
| **P13 Deployment** | H42–H44 | Vercel deploy; custom domain optional | vercel.json (static) | public URL | first meaningful paint < 2.5 s on Chrome DevTools "4G" throttling; no login required |
| **P14 Demo polish & submission** | H44–H47 | Methods page final; video; project page text | docs/submission/* | submission | submitted before H47 |

Parallelism: two streams — Science (P1–P5, P10 pipeline) and Web (P6–P9). The web stream must not invent data while waiting; it uses fixtures copied from the first real intermediate outputs.

---

## 28. Acceptance criteria (measurable)

**Detection pipeline**
- ✓ `make reproduce REACH=<flagship>` completes from raw inputs in < 60 min on an 8-core, 16 GB machine.
- ✓ Two consecutive runs produce byte-identical `areas.json` and `qc.json` (excluding timestamps).
- ✓ ≥ 6 valid dates on one track/frame; rejected dates listed with reasons.
- ✓ Every water mask has a stored threshold within [−26, −12] dB or is excluded.
- ✓ Primary pair has |Δh| ≤ 0.15 m or is labelled later-lower.
- ✓ Erosion GeoJSON valid (all `is_valid`), EPSG:4326, total pixel_count equals manifest.
- ✓ qc.json contains all MVP checks with value or NOT_EVALUATED.

**App**
- ✓ Public URL loads without login; TopBar + map + hydrograph visible within 2.5 s on a 4G throttled profile.
- ✓ Fly-in ≤ 5 s, skippable, disabled under reduced motion.
- ✓ Every ok date selectable; date stamp visible on map.
- ✓ Match the water activates compare in ≤ 1 click; swipe works with mouse, touch, keyboard.
- ✓ Headline value equals manifest value exactly; range shown.
- ✓ Clicking any erosion polygon opens evidence with ≥ 1 NISAR granule ID, t0/t1, stage values.
- ✓ QC panel lists every check in qc.json with status text.
- ✓ Missing-file, empty-bundle and inconclusive states render (tested by Playwright with broken fixtures).
- ✓ No hardcoded metric numbers in `web/src` (lint/grep test).
- ✓ Lighthouse accessibility ≥ 90.

---

## 29. Testing

**Unit (pytest)** — synthetic arrays allowed:
- `test_db.py`: dB conversion, NaN handling.
- `test_threshold.py`: bimodal synthetic histogram → Otsu within 0.5 dB of generating split; unimodal → fallback flag.
- `test_change.py`: hand-built 20×20 water stacks → exact erosion/accretion/seasonal counts; persistence logic; MMU removal.
- `test_area.py`: pixel area × count; range computation.
- `test_pairs.py`: equal-stage and later-lower selection; no-pair case.
- `test_geom.py`: polygonize/simplify validity; property pixel_count sums.
- `test_manifest.py`: schema validation; every metric has inputs.
- `test_check_bundle.py`: detects mismatched counts / missing PNG.

**Integration**
- `test_pipeline_small.py`: run S4–S12 on a tiny real crop (e.g., 200×200 px cut from real processed data, stored in `tests/fixtures/real_crop/` with its provenance) → bundle passes check.
- Web: Vitest for `load.ts` against bundle fixtures copied from real output; store transitions.

**E2E (Playwright)**
1. Open `/` → wait for hydrograph ticks → assert count equals reach.json ok dates.
2. Click a tick → map date stamp matches.
3. Click Match the water → compare active; headline text equals manifest value.
4. Click first erosion polygon → evidence shows granule ID string from manifest.
5. Open QC panel → items == qc.json checks.
6. Broken bundle fixture → error state with retry.

**Scientific validation** — Section 11.2 metrics + human plausibility review (11.3). A result that passes code tests but fails plausibility is not shipped.

---

## 30. Performance
| Area | Target | How |
|---|---|---|
| Download | AOI subsets only | h5py/fsspec partial reads; ≤ 4 parallel |
| Processing | < 60 min per reach | numpy vectorised; no per-pixel Python loops |
| Bundle size | ≤ 40 MB per reach | PNG 8-bit (radar), palette PNG (classes), max 2048 px on long side; `pngquant` optional |
| GeoJSON | ≤ 2 MB | simplify 10 m; drop < 0.48 ha |
| Map | date switch < 150 ms | preload images; swap `image` source URL via `updateImage` |
| API | static CDN | cache headers `immutable` for `/data/v1/*` (versioned path) |
Tiling (XYZ) only if a PNG would exceed 4096 px — not expected for one reach. No database queries exist.

---

## 31. Deployment
- Frontend: `cd web && npm run build` → `web/dist` → Vercel project with root `web`, build `npm run build`, output `dist`. SPA rewrite for `/methods` → `/index.html`.
- Data: shipped inside `web/public/data/v1` (copied to dist).
- Backend/DB: none.
- Secrets: only used locally for the pipeline; never in the web build.
- Fallback host: GitHub Pages via `npm run build -- --base=/<repo>/`.

---

## 32. Environment variables (`.env.example`)
| Name | Purpose | Required | Example | Used by |
|---|---|---|---|---|
| `EARTHDATA_USERNAME` | EDL login | Yes (pipeline) | `jdoe` | earthaccess (all NASA data) |
| `EARTHDATA_PASSWORD` | EDL login | Yes (pipeline) | `••••` | earthaccess |
| `FFWC_API_TOKEN` | FFWC API | No | `abc123` | stage.py |
| `FFWC_API_BASE` | FFWC API base URL (from registration docs) | No | `https://api3.ffwc.gov.bd` | stage.py |
| `SRT_DATA_ROOT` | Data directory | No (default `./data`) | `/mnt/srt/data` | pipeline |
| `SRT_MAX_WORKERS` | Parallel downloads | No (default 4) | `4` | fetch.py |
| `VITE_DATA_BASE` | Bundle base path | No (default `/data/v1`) | `/data/v1` | web loader |
| `VITE_GIBS_BASE` | GIBS WMTS base | No | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best` | web map |
| `VITE_BASEMAP_STYLE` | Vector basemap style URL | No | (verified URL) | web map |
Never commit `.env`.

---

## 33. Claude Code execution rules
See Section 0.2 — those 13 rules are binding. In addition:
- At the start of each phase, re-read that phase's rows in Sections 27–28.
- Keep `docs/VERIFIED.md` updated with: official URL consulted, date, finding.
- When a `VERIFY` item disagrees with this plan, the official documentation wins; update the code and note the discrepancy in `docs/DECISIONS.md` (the method stays the same).

---

## 34. Final demo workflow (judges)

**30-second video** (`docs/submission/video_script.md`, English subtitles):
1. 0–5 s fly-in to reach. VO: "Every monsoon, Bangladesh's rivers rise — and some land never comes back."
2. 5–13 s scrub hydrograph; river swells/shrinks. "NASA-ISRO's NISAR radar sees through monsoon clouds every 12 days."
3. 13–22 s Match the water → swipe → ember → number. "At the same river height in <t0 month> and <t1 month>, this is what's gone: <A> hectares, between <L> and <H>."
4. 22–30 s evidence + QC flash, OPERA agreement. "Checked against a second NASA satellite product. Every number links to its data." URL.

**Live 2-minute demo**
```
Open URL (phone + laptop) → fly-in → name the reach
 → drag hydrograph through June–November; point at a char that floods and returns ("that's flood")
 → Match the water → swipe ("this didn't come back")
 → click headline → evidence: granule IDs, gauge heights, method
 → click a polygon near a named place → its area and dates
 → How this could be wrong → null test %, OPERA κ, excluded ambiguous area
 → (SHOULD) toggle CEGIS forecast outlines → "their forecast vs our measurement"
 → Methods page → make reproduce
```

---

## 35. Definition of done for the whole project
- A judge can open the URL, understand the result in < 30 s, and trace the headline number to NISAR granule IDs in ≤ 2 clicks.
- Every displayed number comes from real processed data via manifest.json.
- The failure modes produce honest states, not fake results.
- `make reproduce` regenerates the bundle.
- The interface looks like a scientific instrument built around the river, not a dashboard template.

> **Real data → reproducible processing → scientifically meaningful result → traceable evidence → understandable visualization → realistic user experience.**
