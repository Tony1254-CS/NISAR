# Decision Desk: Jamuna candidate triage and evidence handoff

This guide documents the current `/impact` Decision Desk implementation. It is a map-first analyst/planner workspace for reviewing the Jamuna–Chilmari evidence bundle. It is not an alerting service and does not turn candidate polygons into verified erosion. The term “decision” describes a human review workflow: the system organizes evidence and exposes limitations so a person can decide what to inspect next.

## Users and intended work

- **Researcher / analyst:** inspect candidate geometry, acquisition dates, thresholds, granule provenance, and quality checks; select a patch for review.
- **Resource manager / planner:** sort and filter the candidate queue, compare the radar context, draw a hypothetical corridor, and identify mapped infrastructure features that may warrant follow-up.
- **Public communicator:** switch to a concise explanation that preserves the inconclusive verdict and does not imply a hazard forecast.
- **Field team:** receive an exported JSON case packet that can be opened in the separate TRACE Field app. The export is a handoff file; no automatic synchronization or verification occurs.

The experience progresses from overview, to map and ranked queue, to a selected feature's evidence and action handoff, to impact scenario, QC verdict, and provenance.

## Data loaded and what the headline counts mean

The current page loads one reach, `jamuna-chilmari`, using the static bundle loader. It combines the bundle's `erosion.geojson` and `accretion.geojson` feature collections and sorts all candidates by `area_ha` descending. At the current bundle revision, the design headline reports 4,571 features (3,173 erosion and 1,398 accretion); these are polygon candidates in the bundle, not 4,571 validated events or separate affected communities. Counts should be read dynamically from the loaded bundle if it changes.

The page reads reach metadata, bounds, dates, manifest metrics and parameters, QC checks, candidate GeoJSON, radar/water quicklook PNGs, and a packaged OPERA DSWx-S1 context image. Rainfall context is taken from the bundle's manifest. The current OPERA image predates the NISAR pair and is contextual only, not an independent same-date validation. The map also uses an Esri satellite basemap for geographic context.

## Map and layer controls

The map uses MapLibre with a satellite basemap. Its image overlays use the bounds recorded in the reach bundle. Controls can show or hide the selected-date NISAR radar image, the selected-date water-mask image, and the OPERA DSWx-S1 context raster. A date control selects among available acquisitions; the pass animation cycles those dates to show the packaged observations. It is a local browse animation, not live satellite telemetry or a forecast.

Candidate erosion and accretion are styled separately. The map intentionally draws the largest **15 per class by area** by default so the initial view remains legible. This display cap does not delete, modify, or re-rank the source collections. The queue itself can be searched and filtered. Selecting a candidate from map or list outlines it on the map and updates the evidence pane. The image has a native aspect ratio close to the source raster footprint; the adjacent case readout carries its context without distorting the map. The map resizes through a `ResizeObserver` when its container changes size.

Do not describe the satellite basemap as NISAR. The NISAR layer is the project radar quicklook; the OPERA layer is an older contextual water product; the basemap is Esri imagery. Display imagery is not a calibrated analysis raster.

## Candidate ledger and sorting

The ledger supports class filtering (all, erosion, accretion), minimum area filtering, text search by feature ID, and pagination/visible-row expansion. Candidates are sorted by `area_ha` in descending order. Rank is area rank in this combined list; no extra erosion multiplier or opaque “risk score” is applied. The current header can display counts and a selected top-case queue; the 24 area-ranked cases are a review presentation subset, not the only features in the bundle. Review statuses (for example, unreviewed/retain/reject states shown in the UI) are stored in this browser's `localStorage` under a reach-specific key. They are local analyst notes, not shared team decisions, durable records, or changes to scientific evidence.

Area-size distribution and counts summarize the mapped feature geometries. Patch area alone does not indicate likelihood, severity, exposed population, or cause.

## Selected candidate: evidence tabs

### Provenance

The selected-feature panel presents candidate class/ID, area, spatial coordinates/centroid, source dates, and relevant feature attributes. The surrounding provenance section lists source NISAR granule identifiers and analysis parameters from the manifest, including pair thresholds, median filter, minimum mapping unit, HAND limit, pixel area/grid context, and rainfall context. These describe how the bundle was generated; a granule ID is traceability, not validation.

### Trust gates

The evidence-integrity section displays QC records from the bundle, including status, value/unit where available, explanation, and rule. Verdict reasons come from the reach record. `NOT_EVALUATED` is missing assessment evidence, not a pass. A warning is not a measured failure. A fail should be narrated according to its named rule, not reduced to a generic confidence score. Current checks include threshold sensitivity, persistence, independent-water agreement, stage context/matching, swath-edge/RFI screening, and plausibility. The page does not compute one aggregate probability from these checks.

The current run is **INCONCLUSIVE**. The candidate area is threshold-derived, sensitivity is high, persistence and independent water reference agreement are not evaluated, and the plausibility check raises a concern. Do not say one check is the sole reason if the displayed verdict record lists multiple reasons.

### Field actions and export

The case handoff exports a JSON file with schema identifier `fluvisar.trace-field.case.v1`, export time, reach and candidate identity/geometry, local review status, current verdict, observation dates, source granules, QC IDs/status/explanations, and a clear interpretation that the feature is a mapped candidate requiring field review. The payload instructs that a field observation is independent evidence and must not automatically change the satellite finding to verified.

This does not upload data or call the TRACE Field application. The user downloads the packet and may separately import/inspect it there. Do not describe it as a live two-way integration, ledger service, blockchain, or synchronized case-management system.

The copied case link points to the main app's `/app` route with reach and feature query parameters. It is a navigation shortcut, not an authenticated share token or external record.

## Radar → reality: hypothetical impact scenario

The context view can compare source-date radar quicklooks with a swipe control, or display water/change context where available. It helps relate a selected candidate to the paired scenes; it does not recompute the classification.

The scenario view draws a user-defined rectangular corridor near the selected candidate centroid. Controls set along-bank length (100–2,000 m), retreat depth (20–800 m), and orientation (0–180°). Scenario area is simply `length × depth ÷ 10,000` in hectares. It is a geometry calculator for an explicitly hypothetical envelope; those dimensions are not observed retreat measurements and the result is not an erosion forecast.

On request, the page sends a bounding query to the public OpenStreetMap Overpass API for building and road ways. The UI reports mapped building ways and road ways touching the envelope and can show those features. The query is optional and network-dependent. OSM coverage may be incomplete, a “way” is a mapped object rather than a household or person, and intersection is not proof of exposure, damage, or risk. Attribute the data to OpenStreetMap contributors under ODbL. Never convert these counts into people at risk or affected homes.

## Audience brief

The analyst, planner, and public tabs choose different fixed text for the same current evidence and next useful step. They do not alter calculations, verdict, or QC. This is a copy adaptation, not an AI-generated answer or an audience-specific risk model. The phrasing should continue to state that candidate change is not confirmed erosion until required checks close.

## What is intentionally not surfaced as decision evidence

Prior bundle assets include risk-like and forecast-like layers with repeated/template values across unrelated study areas and no adequate case-specific method/provenance for decision use. The current Decision Desk does not present those as forecasts or risk layers. Their presence as static files elsewhere in the repository does not make them scientifically supported. The Desk's headline, ranking, map, and audience brief must not imply forecast capability.

## Current data interpretation

The configured Jamuna pair is 2026-08-26 to 2026-09-19 (24 days). At the documented bundle revision, the manifest reports 3,622.64 ha of land-to-water transition candidates (sensitivity range 1,759.0–8,476.6 ha) and 2,504.72 ha of water-to-land candidates. These are reported candidate areas, not independently verified erosion/accretion measurements. The pair metadata describes a stage criterion, but the QC record explicitly says only two acquisitions were available and the peak-bounded pairing rule could not be applied; stage-match status is WARN at a 0.0391 proxy-fraction difference. Later-pass persistence and OPERA DSWx-S1 agreement are NOT_EVALUATED; threshold sensitivity is WARN at 185.4%; the order-of-magnitude plausibility gate is FAIL at 3,622.6 ha; RFI screening is WARN for a flagged swath-edge band in both dates; alignment and the stable-land null test are NOT_EVALUATED. GPM IMERG rainfall context is 64.48 mm during the seven days before T1 versus a 37.44 mm baseline (1.72×), and is explicitly informational, not causal evidence. The full result remains **INCONCLUSIVE**. These figures are tied to the current bundle and should be checked again before recording. See [plausibility review](PLAUSIBILITY.md) for the documented interpretation.

## Suggested demo sequence

1. Frame the page as a review desk for candidates, not an automated warning.
2. Show the satellite-context map with NISAR and candidate overlays; explain that only the top 15 per class are drawn by default.
3. Select one candidate and show its source dates/parameters and named QC evidence.
4. Open the hypothetical corridor and, if network conditions permit, load OSM features. Say explicitly that mapped roads/buildings are not people at risk.
5. Show audience copy or the case-packet export as a handoff to TRACE Field; explain the file-based/manual boundary.
6. End on the INCONCLUSIVE verdict and what evidence is still needed.

## Implementation map and recent changes

- `web/src/pages/DecisionDesk.tsx`: bundle loading, controls, queue, scenario, QC, audience text, and JSON export.
- `web/src/map/DecisionMap.tsx`: MapLibre layers, candidate top-N filtering, selection, and resize behavior.
- `web/src/styles/decision-desk.css`: map-first layout and visual system.
- Nov 5, 2026: introduced the map-first triage workspace, operational filters, selected-candidate evidence lab, audience brief, OSM context query, and TRACE Field case-packet export. Follow-up refinements made the map/raster composition proportional, showed a selected-case readout beside it, removed unsupported repeated risk/forecast overlays, removed arbitrary 1.5× erosion weighting, changed the queue to transparent area sorting, made the over-50-ha count dynamic, and defaulted the map to the top 15 candidates per class. A bundle-loading guard now prevents an initial-render reference error.

  The main workspace includes: (1) a full-bleed geographic map with NISAR HH, date-specific water mask, contextual OPERA DSWx-S1, erosion/accretion outlines, selected feature, and optional scenario/OSM overlays; (2) an observed-pass selector/cycle; (3) a searchable, class-filtered, minimum-area candidate ledger with expandable rows; (4) selected-feature **Provenance / Trust / Actions** tabs; (5) a radar comparison view; (6) a hypothetical impact envelope with optional Overpass query; (7) the reach-level verdict/QC scorecard; (8) analyst/planner/public text; and (9) source granule, parameter, and rainfall provenance. This inventory describes the current React page, while details above explain what every element means and does not mean.

## Neighboring docs

- [ML Intelligence guide](ML_INTELLIGENCE.md) for synthetic model diagnostics and the separate Jamuna evidence workbench.
- [SAR Lab guide](SAR_LAB.md) for the educational radar controls and their limits.
- [Methods](submission/methods.md) for the project analysis workflow and evidence status.
