# SAME RIVER TWICE — The Complete Project Guide

> **Current implementation note (2026-11-05):** This long guide was written for an earlier product state and contains descriptions of planned or obsolete features. For current documentation of the three recently updated areas, use [SAR Lab](docs/SAR_LAB.md), [ML Intelligence](docs/ML_INTELLIGENCE.md), and [Decision Desk](docs/DECISION_DESK.md). The current Jamuna case is inconclusive; treat this file's older “satellite-verified,” stage-match, forecast, sign-in, evidence drawer, multi-site, and AI claims as historical unless verified against current code and data. Project overview: [README.md](README.md).

> **Measuring what the monsoon takes — not where it floods, but what it permanently erodes.**

This guide explains **everything** about SAME RIVER TWICE in plain English — what it is, why it matters, how the science works, how the code is organized, and what every folder and file does. If you've never worked with satellite data before, start at the top and read straight through. If you're a developer or a judge, jump to the section you need from the table of contents.

---

## Table of Contents

1. [What is SAME RIVER TWICE?](#1-what-is-same-river-twice)
2. [The Problem We Solve](#2-the-problem-we-solve)
3. [Page-by-Page Tour](#3-page-by-page-tour)
4. [How to Use It (Non-Technical)](#4-how-to-use-it-non-technical)
5. [Feature Catalogue](#5-feature-catalogue)
6. [The Science, Explained](#6-the-science-explained)
7. [The Tech Stack, Explained](#7-the-tech-stack-explained)
8. [Architecture at a Glance](#8-architecture-at-a-glance)
9. [Two Real Data-Flow Examples](#9-two-real-data-flow-examples)
10. [Folder-by-Folder, File-by-File](#10-folder-by-folder-file-by-file)
11. [The Data Bundle Contract](#11-the-data-bundle-contract)
12. [The Pipeline](#12-the-pipeline)
13. [Quality Control & Verification](#13-quality-control--verification)
14. [External Data Sources](#14-external-data-sources)
15. [The AI Chat Engine](#15-the-ai-chat-engine)
16. [Design System](#16-design-system)
17. [Security & Privacy](#17-security--privacy)
18. [Running & Deploying](#18-running--deploying)
19. [Glossary for Non-Coders](#19-glossary-for-non-coders)
20. [FAQ & Troubleshooting](#20-faq--troubleshooting)

---

## 1. What is SAME RIVER TWICE?

SAME RIVER TWICE is a **satellite-verified river erosion intelligence system** built for the NASA Space Apps Challenge 2026, challenge theme *"Dancing with the SARs"*.

Every monsoon, the Brahmaputra–Jamuna rises, floods the floodplain, then recedes. Sometimes the land comes back. Sometimes it doesn't — the river has permanently consumed it. Bangladesh's CEGIS reports that the Jamuna, Ganges, and Padma rivers eroded roughly **158,000 hectares** between 1973 and 2025. People lose homes, farmland, and livelihoods with little warning.

The problem: monsoon clouds make optical satellites (cameras in space) unreliable exactly when erosion happens. Existing flood maps show *where water is on a given day* — but they can't tell you whether that water is temporary flooding or permanent land loss.

**Our solution:** We use **NASA-ISRO's NISAR L-band radar** (which sees through clouds, day and night) and compare the river at the **same water level** before and after the monsoon peak. By controlling for river height, what changes isn't flood — it's land the river permanently took.

**One sentence:** *"We compared the Jamuna at the same water level before and after the 2026 monsoon using NASA-ISRO's NISAR radar — so what changed isn't flood, it's land the river took."*

---

## 2. The Problem We Solve

### Why existing tools fall short

| Existing Approach | Limitation |
|---|---|
| Optical satellite imagery (Landsat, Sentinel-2) | Blocked by monsoon clouds — invisible when erosion happens |
| SAR flood maps (Copernicus GFM, OPERA DSWx) | Show water extent on a *single day*, not permanent change |
| Manual surveys | Expensive, slow, dangerous during monsoon |
| Historical aerial photos | Low revisit, not available in real-time |

### What makes our approach different

1. **Radar sees through clouds**: NISAR's L-band radar works day, night, rain, and cloud cover.
2. **Stage-matching eliminates flood**: By comparing images at matched river gauge heights, we isolate real erosion.
3. **Cross-validation against independent data**: Every result is checked against NASA's OPERA DSWx-S1 (built from different satellites and algorithms).
4. **Full provenance**: Every number in the app traces to a specific satellite granule ID, gauge reading, and processing parameter.

### Who this is for

| User | Need | What they do in the app |
|---|---|---|
| **Hackathon judge** | Understand the result in seconds; verify it's real | Watch fly-in → drag hydrograph → "Match the Water" → read erosion area → open evidence trail |
| **Disaster analyst (CEGIS, BWDB)** | Where was land lost, how much, how confident | Select reach → inspect polygons → compare with forecast → export data |
| **Journalist / public** | See what happened to a community | Same as judge; read plain-language headline |
| **Researcher** | Reproduce the result | Methods page → clone repo → `make reproduce` |

---

## 3. Page-by-Page Tour

Every page has its own URL. The navbar at the top provides navigation.

| URL | Page | What It Does |
|---|---|---|
| `/` | **Landing** | Public-facing page explaining the science: SAR concepts, the 12-step pipeline, evidence trail stages, data sources, and a hero call-to-action. |
| `/app` | **Main App** | The full investigation interface: interactive radar map, hydrograph, erosion overlays, evidence panel, QC panel, telemetry, and the AI chat sidebar. |
| `/methods` | **Methods** | Scientific methodology, reproducibility instructions, pipeline code walkthrough, and data provenance. |
| `/cases` | **Cases** | Real case studies showing erosion detection on the Jamuna with specific before/after examples. |
| `/about` | **About** | Team information, project motivation, NASA Space Apps context, and acknowledgements. |
| `/auth` | **Auth** | Simple authentication gate for the investigation interface. |

---

## 4. How to Use It (Non-Technical)

**First 30 seconds:**

1. Open the app and click **Launch Investigation** on the landing page (takes you to `/app`).
2. The map auto-flies to the Chilmari–Roumari reach on the Jamuna River in northern Bangladesh.
3. You see NISAR radar imagery overlaid on the map — the river is dark (water reflects radar away), land is bright.
4. The bottom bar shows a **hydrograph** — a timeline of the river's water level with dots marking each NISAR satellite pass.

**Core investigation flow:**

1. **Drag the hydrograph** — click different dates to see how the river looked at each NISAR pass. Notice the river expanding during monsoon.
2. **Click "Match the Water"** — this locks two dates where the river gauge reads the same height. A vertical swipe handle appears.
3. **Swipe left/right** — compare the river before and after at matched water levels. Where land became water = erosion.
4. **Toggle layers** — the navbar has buttons for Erosion (red), Accretion (yellow), Water, Earthquake, and Forecast overlays.
5. **Click a polygon** — an evidence panel opens showing the area in hectares, source granules, gauge heights, and confidence assessment.
6. **Open the AI Chat** — click the chat bubble in the bottom-right corner. Ask "How much land was lost?" or "Is this data reliable?"

**Power features:**

- **Evidence Trail** — click "Analysis" in the navbar for the 5-stage verification workflow (Detect → Investigate → Challenge → Explain → Field).
- **Forecast** — click "Forecast" to see AI-predicted erosion risk zones with an animated legend.
- **Earthquake** — click "Earthquake" to see seismic events near the reach.
- **Inspect Mode** — toggle to click any data element and see its raw source.
- **Chat History** — click the history icon (↺) in the chat panel header to load sample conversations.

---

## 5. Feature Catalogue

### Investigation Features
-  **Interactive Radar Map** — MapLibre GL JS with per-date NISAR imagery, erosion/accretion GeoJSON overlays, and animated layers.
-  **Hydrograph** — D3-powered river stage timeline with danger level line, date selection, and NISAR pass markers.
-  **Match the Water** — one-click stage matching to compare the river at equal gauge heights.
-  **Before/After Swipe** — split-screen comparison with draggable vertical divider.
-  **Erosion & Accretion Overlays** — GeoJSON polygons with hover tooltips showing area, dates, and DSWx confirmation status.
-  **Earthquake Epicenters** — pulsing animated circles with click popups showing magnitude, depth, and time.
-  **Erosion Forecast** — prediction zones with fill-opacity animation for erosion, accretion, and ambiguity risk areas.

### Evidence & Verification
-  **5-Stage Evidence Trail** — Detect (how), Investigate (cross-check), Challenge (try to break), Explain (summarize), Field (ground truth).
-  **QC Panel** — threshold sensitivity, DSWx agreement, RFI screening, temporal persistence, stage match quality.
-  **Telemetry Panel** — real-time data metrics for the loaded reach (area, confidence, date ranges).
-  **Verdict Badge** — SUPPORTED / LIMITED / INCONCLUSIVE based on QC checks.
-  **Inspect Mode** — click-anywhere to see raw provenance of any data element.

### Intelligence
-  **River Intelligence AI Chat** — side-panel chat with context-aware responses, source citations, and map actions.
-  **Auto-Suggestions** — randomized follow-up question chips that adapt based on conversation context.
-  **Chat History** — load sample investigation conversations.

### Presentation
-  **Cinematic Description** — auto-generated narrative overlay describing what the user sees on the map.
-  **Fullscreen HUD** — cinematic processing overlay during analysis operations.
-  **Report Mode** — split-screen layout for evidence tabs as a printable report.
-  **Methods Page** — complete scientific methodology with code references and data citations.

---

## 6. The Science, Explained

### SAR Radar Basics

**What is SAR?** Synthetic Aperture Radar is a radar system mounted on a satellite. Unlike a camera, it sends its own microwave pulse and listens for the echo. This means:
-  It works through clouds (microwaves pass through water vapor).
-  It works at night (it brings its own "flashlight").
-  It works during monsoon — exactly when river erosion happens.

**How does NISAR work?** NISAR (NASA-ISRO SAR) transmits at L-band (~24 cm wavelength). This long wavelength penetrates vegetation canopy and interacts with the ground surface. Key properties:
- **Water** reflects radar like a mirror — the pulse bounces away, very little returns → dark pixels (low backscatter).
- **Land/vegetation** scatters radar back to the sensor → bright pixels (high backscatter).
- The contrast between dark (water) and bright (land) is our detection signal.

### Stage-Matching: The Key Insight

The river rises and falls with the monsoon. A pixel that's underwater in August might just be flooded — it could dry out by November. To distinguish **temporary flood** from **permanent erosion**, we need to compare the river at the **same water level** at two different times.

```
Time t₀ (June, pre-monsoon):     River stage = 12.5 m    Pixel X = LAND 
Time t₁ (October, post-monsoon): River stage = 12.5 m    Pixel X = WATER 

→ At the same water level, land became water = EROSION
```

If we just compared June vs. August (when the river is at 15 m), we'd see water everywhere — but that's just flood, not erosion. Stage-matching eliminates this confusion.

### The Classification System

| Class | Definition | Certainty |
|---|---|---|
| **Erosion** | Pixel was land at t₀, water at t₁, when the river is at the same or lower level. Change persists across multiple passes. | High — stage-controlled |
| **Accretion** | Pixel was water at t₀, land at t₁. New sediment deposit or char formation. | High — stage-controlled |
| **Seasonal** | Pixel changed but at higher water level — likely temporary flood. | Low — excluded from results |
| **Ambiguous** | Changed but failed persistence check, DSWx disagreement, or RFI flag. | Unknown — flagged |

### Validation Approach

Every erosion claim is cross-validated:

1. **OPERA DSWx-S1 agreement**: Does NASA's independent Sentinel-1 water product also see water at those locations?
2. **Threshold sensitivity**: Is the result stable if we shift the water detection threshold by ±1 dB?
3. **RFI screening**: Was the radar signal corrupted by radio frequency interference?
4. **Temporal persistence**: Does the change persist across multiple satellite passes?
5. **Null test**: Do we see zero change in areas known to be stable?
6. **Order of magnitude**: Is the erosion area plausible compared to CEGIS historical rates?

---

## 7. The Tech Stack, Explained

Each entry has three parts: **What it is**, **Why we use it**, **Where you see it**.

### React 18
- **What:** JavaScript library for building user interfaces with reusable components.
- **Why:** Industry standard with a massive ecosystem; component model maps naturally to our panel-based UI.
- **Where:** Every `.tsx` file in `web/src/`.

### TypeScript
- **What:** Typed superset of JavaScript that catches errors at compile time.
- **Why:** The data bundle has a strict schema (Section 11). TypeScript ensures the frontend code matches it exactly. Zero "undefined is not a function" in production.
- **Where:** Every file in `web/src/`. The full type system is defined in `web/src/data/types.ts`.

### Vite 5
- **What:** Build tool that compiles TypeScript/JSX and bundles assets.
- **Why:** Sub-second hot reload during development; efficient production bundles.
- **Where:** `web/vite.config.ts`.

### MapLibre GL JS 5
- **What:** Open-source GPU-accelerated map rendering library (fork of Mapbox GL JS).
- **Why:** We render GeoJSON overlays, raster tiles, and animations — MapLibre does this on the GPU in real-time without a backend tile server. No API key needed.
- **Where:** `web/src/map/MapStage.tsx`, `web/src/map/bundleLayers.ts`.

### D3.js (d3-scale, d3-shape, d3-array)
- **What:** Low-level data visualization library.
- **Why:** The hydrograph (river stage timeline) needs precise axis control, custom interactions, and SVG rendering. D3 gives us full control without overhead.
- **Where:** `web/src/hydrograph/Hydrograph.tsx`.

### Zustand 4
- **What:** Tiny, hook-based state management library for React.
- **Why:** Multiple components need to share state (selected date, active layers, compare mode, analysis state, chat open). Zustand does this in ~100 lines without Redux boilerplate.
- **Where:** `web/src/state/store.ts`. Every component reads from `useStore()`.

### Vanilla CSS with Design Tokens
- **What:** Hand-written CSS using CSS custom properties (variables) for colors, spacing, typography.
- **Why:** No framework overhead. Every pixel is intentional. The dark, data-dense aesthetic can't be achieved with generic utility classes. Performance is maximized.
- **Where:** `web/src/styles/tokens.css` (variables), `web/src/styles/base.css` (reset), plus module-specific CSS files.

### Python 3.11 (Pipeline)
- **What:** The language the offline data pipeline is written in.
- **Why:** The satellite data ecosystem (earthaccess, rasterio, xarray, GDAL) is Python-native. Trying to do this in JavaScript would mean rewriting half the geospatial stack.
- **Where:** Everything in `pipeline/` and `src/pipeline/`.

### earthaccess + asf_search
- **What:** NASA libraries for finding and downloading satellite data.
- **Why:** earthaccess handles Earthdata Login authentication and S3 credential management. asf_search queries the Alaska Satellite Facility catalog for NISAR granules.
- **Where:** `pipeline/discover.py`, `pipeline/fetch.py`.

### rasterio + rioxarray + xarray
- **What:** Libraries for reading, writing, and processing geospatial raster data (GeoTIFFs, HDF5).
- **Why:** NISAR GCOV products are HDF5 files. We need to open them, clip to our AOI, reproject, and write GeoTIFFs. This stack is the standard.
- **Where:** `pipeline/fetch.py`, `pipeline/preprocess.py`, `pipeline/io_nisar.py`.

### scikit-image
- **What:** Image processing library.
- **Why:** Our water detection uses Otsu's method — an automatic histogram-based threshold that separates water (dark) from land (bright). scikit-image provides a fast, tested implementation.
- **Where:** `pipeline/water.py`.

### geopandas + shapely
- **What:** Vector geospatial operations library.
- **Why:** Converting raster change masks into GeoJSON polygons, computing areas, finding centroids, and matching to CEGIS forecast reaches.
- **Where:** `pipeline/change.py`, `pipeline/render.py`.

---

## 8. Architecture at a Glance

```text
                      ┌───────────────────── OFFLINE (developer machine) ──────────────────┐
 ASF DAAC (NISAR) ────┤                                                                      │
 PO.DAAC (DSWx-S1) ──┤  pipeline/ (Python 3.11)                                              │
 AWS (GLO-30 HAND) ──┤   discover → fetch → validate → preprocess → water → stage            │
 FFWC (gauge data) ──┤   → pairs → change → render → manifest → check_bundle                 │
                      ├───────────────────────────────────────────────────────────────────────┤
                      │  Output: web/public/data/v1/<reach_id>/                               │
                      │    reach.json, manifest.json, stage.json, qc.json, bounds.json,       │
                      │    erosion.geojson, accretion.geojson, img/*.png                      │
                      └──────────────────────────────┬────────────────────────────────────────┘
                                                     │  git commit → push → Vercel auto-deploy
                                                     ▼
                      ┌───────────────────── STATIC HOSTING (Vercel CDN) ──────────────────┐
                      │  web/ (React 18 + TypeScript + Vite)                                 │
  Browser ◄───────────┤    fetch('/data/v1/reaches.json') → load bundle → render             │
  (judge, analyst)    │                                                                       │
  NASA GIBS  ◄────────┤    basemap tiles fetched directly from NASA (context only)           │
                      └──────────────────────────────────────────────────────────────────────┘
```

### Key architectural decisions:

1. **No backend server.** The web app is purely static files on a CDN. This means zero cold starts, zero server costs, zero CORS issues, and instant loading for judges. The "API" is a set of JSON/GeoJSON/PNG files with a fixed schema.

2. **Pipeline output is a versioned data bundle.** The Python pipeline produces a self-contained directory that the web app reads as static files. This means the result is reproducible — anyone can run `make reproduce` and get the same bundle.

3. **Browser talks directly to NASA GIBS.** The basemap tiles (satellite context imagery) come from NASA's public GIBS tile service — no proxy needed.

4. **AI chat has no backend.** The River Intelligence chat engine runs entirely in the browser using intent classification and template-based responses powered by the loaded data bundle.

---

## 9. Two Real Data-Flow Examples

### A) "I click a date on the hydrograph"

1. User clicks a dot on the hydrograph in `Hydrograph.tsx`.
2. The click handler calls `setSelectedDate(date)` via Zustand store.
3. `MapStage.tsx` listens to `selectedDate` — when it changes, it updates the raster overlay visibility: show `img/radar_<date>.png`, hide other dates.
4. MapLibre re-renders with the new raster tile visible.
5. The `StoryPanel` reads the manifest and shows the headline for that date.
6. Total round-trip: ~20ms (everything is local, no network call).

### B) "I ask the AI chat: How much land was eroded?"

1. User types the question into `ChatWidget.tsx` and presses Enter (or clicks a chip).
2. `handleSend(text)` is called: the user message is added to the local messages array.
3. After a simulated "thinking" delay (600–1400ms for realism), `classifyIntent(text)` runs:
   - The intent engine in `intents.ts` scores the query against 20+ keyword/pattern rules.
   - Result: `erosion_amount` (highest-scoring intent).
4. `generateResponse('erosion_amount', dataContext)` runs in `responses.ts`:
   - Reads `manifest.metrics.find(m => m.id === 'erosion_area')`.
   - Extracts `value`, `low`, `high` from the actual data bundle.
   - Builds a natural-language response with embedded values: *"**X hectares** of land was lost…"*
   - Attaches source citations: `manifest.json → metrics[erosion_area].value`.
   - Suggests follow-up questions: `['How much new land was formed?', 'Where is the biggest erosion?']`.
5. The AI message is added to the messages array with source chips.
6. Chips update to the `followUp` array from the response.
7. No network call was made. Every answer comes from the data bundle loaded at page start.

---

## 10. Folder-by-Folder, File-by-File

Each entry uses the shape: **Path** — *What it is* — *Why it exists*.

### Root

- **`plan.md`** — The master specification. 1,250 lines covering every scientific, architectural, and UI decision. The single source of truth for the project.
- **`TASKS.md`** — Task checklist with phase tracking and dependencies. Progress tracker.
- **`Makefile`** — Pipeline make targets. Each step is independently runnable with `make <step> REACH=<id>`.
- **`environment.yml`** — Conda environment definition for the Python pipeline (Python 3.11, earthaccess, rasterio, etc.).
- **`vercel.json`** — Vercel deployment configuration: build command, output directory, SPA routing.
- **`config/reaches/jamuna-chilmari.yaml`** — Reach configuration: AOI bbox, NISAR track/frame, gauge stations, processing parameters.
- **`areas.json`** — AOI definitions for pipeline granule search.

### `pipeline/` — The Python Processing Pipeline

| File | What It Does | Inputs | Outputs |
|---|---|---|---|
| `discover.py` | Find NISAR GCOV granules for the reach AOI and time window. | `config/reaches/*.yaml` | `data/raw/<reach>/catalog.json` |
| `fetch.py` | Download and AOI-clip NISAR HDF5 to GeoTIFFs. | catalog, S3 credentials | AOI-clipped GeoTIFFs |
| `io_nisar.py` | Low-level reader for NISAR GCOV HDF5 structure. | HDF5 files | NumPy arrays |
| `io_dswx.py` | Download and parse OPERA DSWx-S1 water tiles. | PO.DAAC catalog | Water classification rasters |
| `io_stage.py` | Read river gauge data from FFWC or manual files. | FFWC API / CSV | Stage records |
| `validate_raw.py` | Reject broken, partial, or wrong-sized inputs. | Raw GeoTIFFs | `validation_raw.json` |
| `preprocess.py` | Convert linear power to dB, apply spatial filter. | Raw GeoTIFFs, HAND mask | Analysis-ready dB rasters |
| `water.py` | Otsu thresholding: classify each pixel as water or land. | dB rasters | Binary water masks + thresholds |
| `stage.py` | Match each NISAR acquisition to a river gauge height. | FFWC data, acquisition dates | `stage.csv` with matched heights |
| `pairs.py` | Find pairs of dates at equal or later-lower stage. | Stage data | Pair definitions (t₀, t₁) |
| `change.py` | Compare paired water masks → erosion/accretion polygons. | Water masks, pairs | `erosion.geojson`, `accretion.geojson` |
| `render.py` | Generate map-ready PNG tiles for the web app. | Water masks, radar data | PNG rasters per date |
| `manifest.py` | Build provenance chain: granule IDs, dates, params, metrics. | All pipeline outputs | `manifest.json` |
| `check_bundle.py` | Verify bundle integrity: file existence, schema compliance. | Complete bundle | Pass/fail report |
| `validate_science.py` | Cross-check results against DSWx, null test, sensitivity. | Results + DSWx data | `qc.json` |
| `config.py` | Load and validate reach configuration YAML. | `config/reaches/*.yaml` | Python config objects |
| `context.py` | Pipeline execution context (paths, parameters). | Config | Path resolver |
| `schemas.py` | Pydantic models for pipeline I/O validation. | — | Type definitions |

### `web/` — The Frontend Application

Top-level files:

- **`index.html`** — The single HTML entry point for the SPA.
- **`package.json`** — NPM manifest with 6 production dependencies (React, MapLibre, D3, Zustand).
- **`vite.config.ts`** — Vite build config with React plugin.
- **`tsconfig.json`** — TypeScript compiler settings (strict mode).
- **`generate_types.js`** — Script to generate TypeScript types from JSON schemas.

### `web/src/` — Source Code

#### `web/src/pages/` — Every URL in the App

| File | Route | Purpose |
|---|---|---|
| `Landing.tsx` | `/` | Public landing page with SAR concepts, pipeline steps, evidence stages, data sources, and hero CTA. |
| `MainApp.tsx` | `/app` | The investigation interface: orchestrates map, hydrograph, panels, HUD, and chat. |
| `Methods.tsx` | `/methods` | Scientific methodology documentation page. |
| `Cases.tsx` | `/cases` | Case studies with erosion detection examples. |
| `About.tsx` | `/about` | Team, motivation, and NASA Space Apps Challenge context. |
| `Auth.tsx` | `/auth` | Simple authentication gate with username/password. |

#### `web/src/map/` — Map Rendering

| File | Purpose |
|---|---|
| `MapStage.tsx` | The main MapLibre GL JS map component. Manages raster layers, GeoJSON overlays, click handlers, popups, and camera controls. ~550 lines. |
| `bundleLayers.ts` | Adds erosion, accretion, prediction, and earthquake layers to the map. Includes `requestAnimationFrame` animation loops for pulsing epicenters and fill-opacity cycling. |
| `CompareSwipe.tsx` | Before/after swipe comparison with a draggable vertical divider and clip regions. |
| `FlyIn.ts` | Animated camera fly-in to the reach bounds on first load. |
| `MapLegend.tsx` | Animated legend showing layer colors, prediction categories, and entry animations. |

#### `web/src/hydrograph/` — River Stage Timeline

| File | Purpose |
|---|---|
| `Hydrograph.tsx` | D3-powered SVG chart showing river stage over time. Renders gauge series, danger level line, NISAR acquisition dots, and date-switch buttons. |
| `MatchWaterButton.tsx` | "Match the Water" button that finds equal-stage pairs and activates compare mode. |

#### `web/src/panels/` — Information Panels

| File | Purpose |
|---|---|
| `EvidenceTabs.tsx` | The 5-stage agentic evidence trail (Detect → Investigate → Challenge → Explain → Field). ~1,000 lines. Can render as floating panel or split-screen report. |
| `EvidencePanel.tsx` | Panel showing detailed information about a selected erosion/accretion feature (area, dates, DSWx status). |
| `QCPanel.tsx` | Quality control checks display with PASS/WARN/FAIL badges. |
| `StoryPanel.tsx` | Headline panel showing the reach name and verdict. |
| `Headline.tsx` | The main erosion area number with uncertainty range. |
| `TelemetryPanel.tsx` | Real-time telemetry readout (data freshness, bundle version, metric summary). |
| `VerdictBadge.tsx` | SUPPORTED / LIMITED / INCONCLUSIVE badge component. |
| `LayerToggles.tsx` | Checkbox toggles for map layers (water, erosion, accretion, ambiguous). |
| `FullscreenHUD.tsx` | Cinematic fullscreen overlay during analysis processing, with progress indicators. |

#### `web/src/chat/` — AI Chat Engine

| File | Purpose |
|---|---|
| `ChatWidget.tsx` | The chat UI: 30% side panel, message bubbles, input area, history button, auto-suggestions. Uses `chatOpen` from Zustand store to coordinate with main layout. |
| `intents.ts` | Intent classification engine: scores user queries against 20+ keyword/regex rules to determine topic (erosion, confidence, rainfall, etc.). Returns one of 20 intent categories. |
| `responses.ts` | Response generator: builds natural-language answers from the loaded data bundle based on classified intent. Includes source citations, map actions, and follow-up suggestions. 316 lines covering all intents. |

#### `web/src/components/` — Shared Components

| File | Purpose |
|---|---|
| `Navbar.tsx` | Main navigation bar with layer toggles (Erosion, Water, Forecast, Earthquake), analysis mode, sensory mode, cinematic mode buttons. ~300 lines. |
| `CinematicDescription.tsx` | Auto-generated narrative description of the current map view, appearing as a cinematic overlay. |
| `Inspectable.tsx` | Wrapper that makes any data element clickable in Inspect Mode, revealing its raw source and provenance. |

#### `web/src/data/` — Data Loading & Types

| File | Purpose |
|---|---|
| `types.ts` | Complete TypeScript type definitions for the entire data bundle schema: `ReachDetail`, `Manifest`, `Stage`, `QC`, `Bounds`, `ChangeFeatureCollection`, and all nested types. 264 lines, generated from JSON schemas. |
| `load.ts` | Data loading functions: `fetchReaches()`, `loadReachBundle()`, with schema validation via type guards. Fetches all bundle files in parallel with `Promise.all`. |
| `schema.ts` | Runtime type guard functions (`isReaches`, `isManifest`, `isStage`, etc.) for validating fetched JSON. |

#### `web/src/state/` — State Management

| File | Purpose |
|---|---|
| `store.ts` | Zustand store with all global state: `reachId`, `selectedDate`, `compare`, `layers`, `panel`, `analysisMode`, `chatOpen`, and their setters. The central nervous system of the app. |
| `useDeepLink.ts` | Hook that reads URL hash parameters to restore state from shared links. |

#### `web/src/states/` — UI States

| File | Purpose |
|---|---|
| `Loading.tsx` | Loading spinner shown while the data bundle is being fetched. |
| `ErrorState.tsx` | Error screen shown when the bundle fails to load, with retry button. |

#### `web/src/styles/` — CSS Design System

| File | Purpose | Size |
|---|---|---|
| `tokens.css` | Design tokens: colors, typography, spacing, radii, shadows, transitions. The foundation of the design system. | 67 lines |
| `base.css` | Global reset, body styles, scrollbar styling, print overrides. | ~100 lines |
| `navbar.css` | Navigation bar styles: glassmorphism, layer buttons, mode toggles, responsive breakpoints. | ~200 lines |
| `landing.css` | Landing page styles: hero section, pipeline visualization, data cards, evidence stages. | ~300 lines |
| `agentic.css` | Evidence trail panel styles: tab system, action buttons, telemetry readout, fullscreen HUD. | ~550 lines |
| `chat.css` | Chat widget styles: side panel, message bubbles, typing indicator, suggestion chips, input area. | ~330 lines |

### `web/public/data/v1/` — The Data Bundle

- **`reaches.json`** — Catalog of available reaches (currently one: `jamuna-chilmari`).
- **`jamuna-chilmari/reach.json`** — Reach metadata: name, river, bbox, track info, acquisition dates with status.
- **`jamuna-chilmari/manifest.json`** — Provenance manifest: metrics with uncertainty ranges, pair definitions, verdict, code commit.
- **`jamuna-chilmari/stage.json`** — River gauge data: station info, time series, per-acquisition heights.
- **`jamuna-chilmari/qc.json`** — Quality control checks with PASS/WARN/FAIL status and explanations.
- **`jamuna-chilmari/bounds.json`** — Map bounding box for camera positioning.
- **`jamuna-chilmari/erosion.geojson`** — Erosion polygons with per-feature properties (area, dates, DSWx confirmation).
- **`jamuna-chilmari/accretion.geojson`** — Accretion polygons with per-feature properties.
- **`jamuna-chilmari/prediction.geojson`** — AI-predicted erosion/accretion risk zones.
- **`jamuna-chilmari/earthquakes.json`** — Recent seismic events near the reach.
- **`jamuna-chilmari/img/`** — Per-date radar and water mask PNG tiles.

---

## 11. The Data Bundle Contract

The data bundle is the **contract** between the pipeline and the web app. The pipeline produces it; the web app consumes it. Neither side may change the schema without updating the other.

### Bundle File Structure

```
web/public/data/v1/
├── reaches.json                    # List of available reaches
└── <reach_id>/
    ├── reach.json                  # Reach metadata + acquisition dates
    ├── manifest.json               # Provenance manifest + metrics
    ├── stage.json                  # River gauge data
    ├── qc.json                     # Quality control checks
    ├── bounds.json                 # Map bounding box
    ├── erosion.geojson             # Erosion polygons
    ├── accretion.geojson           # Accretion polygons
    ├── prediction.geojson          # Forecast zones (optional)
    ├── earthquakes.json            # Seismic events (optional)
    └── img/
        ├── radar_<date>.png        # Per-date radar imagery
        └── water_<date>.png        # Per-date water classification
```

### Key Types

**Manifest** contains the provenance chain for every number shown in the UI:

```typescript
interface Manifest {
  reach_id: string;
  generated_at: string;      // ISO timestamp
  code_commit: string;       // Git SHA
  pair: { t0: string; t1: string; type: string; dh_m: number };
  verdict: "SUPPORTED" | "LIMITED" | "INCONCLUSIVE";
  verdict_reasons: string[];
  headline_metric_id: string;
  metrics: Metric[];          // Each has: id, label, value, low, high, unit
}
```

**Every metric** (erosion area, accretion area, etc.) has a `value`, `low`, and `high` — the uncertainty range from threshold sensitivity analysis.

---

## 12. The Pipeline

### Pipeline Steps in Order

```
discover → fetch → validate_raw → preprocess → water → stage → pairs → change → render → manifest → check_bundle
```

| Step | Duration | What Happens |
|---|---|---|
| **discover** | ~10s | Queries ASF DAAC for NISAR GCOV granules matching the reach's bbox, time window, track/frame. |
| **fetch** | ~5 min | Downloads HDF5 files, clips to AOI, extracts HH backscatter, writes GeoTIFFs. |
| **validate_raw** | ~30s | Checks each raster: correct CRS, non-zero data, expected dimensions, no all-NaN bands. |
| **preprocess** | ~2 min | Converts linear power to dB (`10·log10`), applies Lee median filter (5×5), masks with HAND. |
| **water** | ~1 min | Otsu thresholding on dB histogram → binary water mask per date. Records threshold. |
| **stage** | ~30s | Matches each acquisition date to FFWC gauge height (±1 day window). |
| **pairs** | ~10s | Finds date pairs where stage(t₁) ≤ stage(t₀) + 0.15m → equal-stage or later-lower pairs. |
| **change** | ~2 min | Subtracts paired water masks → erosion/accretion pixels → polygonize → compute area → GeoJSON. |
| **render** | ~3 min | Generates map-ready PNGs: per-date radar imagery and water masks, colorized for the web. |
| **manifest** | ~10s | Builds provenance JSON: granule IDs, processing params, metrics, uncertainty, verdict. |
| **check_bundle** | ~10s | Validates complete bundle: file existence, schema compliance, value range checks. |

### Reproducibility

```bash
# Full pipeline for one reach:
make discover REACH=jamuna-chilmari
make fetch REACH=jamuna-chilmari
make validate-raw REACH=jamuna-chilmari
make preprocess REACH=jamuna-chilmari
make water REACH=jamuna-chilmari
make stage REACH=jamuna-chilmari
make pairs REACH=jamuna-chilmari
make change REACH=jamuna-chilmari
make render REACH=jamuna-chilmari
make manifest REACH=jamuna-chilmari
make check-bundle REACH=jamuna-chilmari
```

---

## 13. Quality Control & Verification

### QC Checks

| Check ID | What It Tests | PASS Condition | Failure Meaning |
|---|---|---|---|
| `threshold_sensitivity` | Is the erosion area stable if threshold shifts ±1 dB? | Area varies <20% | Result depends too much on an arbitrary choice |
| `dswx_agreement` | Do OPERA DSWx-S1 tiles agree water is present in erosion zones? | >50% overlap | Independent satellite disagrees with our water mask |
| `rfi_screening` | Were any passes corrupted by radio frequency interference? | <5% pixels affected | Radar data may be unreliable |
| `temporal_persistence` | Does the change persist across multiple NISAR passes? | Present in ≥2 post-monsoon passes | Could be a one-time artifact |
| `stage_match_quality` | Are the gauge heights within tolerance? | |Δh| ≤ 0.15 m | Water level difference might explain the change |
| `null_test` | Is there zero change in known-stable areas? | Change area = 0 in reference zone | The method itself may be producing false positives |
| `order_of_magnitude` | Is the total erosion plausible vs. CEGIS historical rates? | Within 10× historical annual rate | Either something extraordinary happened or there's an error |

### Verdict Logic

- **SUPPORTED**: All critical checks PASS. The erosion measurement is reliable.
- **LIMITED**: Some checks WARN. The measurement is directionally correct but has caveats.
- **INCONCLUSIVE**: Any critical check FAIL. The result cannot be trusted without further investigation.

### Explainable AI (XAI) Framework

To build trust in our automated detection, the system provides an **Explainable AI (XAI) Attribution** breakdown. This makes the AI's "black box" fully transparent. The EXPLAIN panel visually displays the exact weight (percentage) of each feature contributing to the final verdict:

1. **SAR Backscatter Intensity (Feature 1):** Primary radar return signal differences.
2. **Sentinel-1 Optical Match (Feature 2):** Cross-validation using independent data.
3. **Hydrological Stage Context (Feature 3):** River gauge height stability.
4. **Geomorphic Prior Models (Feature 4):** Historical plausibility of the erosion area.

---

## 14. External Data Sources

| Provider | Dataset | Role in Our System | Access Method |
|---|---|---|---|
| **ASF DAAC** | NISAR L2 GCOV Provisional V1 | Primary measurement — calibrated γ⁰ backscatter per pass | `earthaccess` + S3 |
| **PO.DAAC** | OPERA L3 DSWx-S1 V1 | Independent validation — Sentinel-1 water extent | `earthaccess` |
| **AWS Open Data** | ASF GLO-30 HAND | Terrain mask — excludes pixels >15m above nearest drainage | HTTPS COG tiles |
| **JRC** | Global Surface Water Occurrence | Permanent water reference for null tests | Pre-downloaded GeoTIFF |
| **FFWC Bangladesh** | River Stage Bulletins | Gauge heights for stage-matching | API (`api3.ffwc.gov.bd`) or manual CSV |
| **GES DISC** | GPM IMERG Daily | Rainfall anomaly context | `earthaccess` |
| **NASA** | GIBS WMTS | Basemap context tiles for the web app | Direct HTTP from browser |
| **CEGIS** | 2026 Erosion Forecast | Predicted erosion reaches for comparison | Digitized from published reports |

---

## 15. The AI Chat Engine

The River Intelligence chat runs **entirely in the browser** with zero backend. It has three components:

### Intent Classification (`intents.ts`)

20+ intent categories, each with keyword lists and regex patterns:
- `erosion_amount`, `accretion_amount`, `net_change`
- `date_range`, `satellite_info`, `threshold_info`
- `rainfall`, `water_level`, `confidence`, `verdict`
- `biggest_erosion`, `erosion_count`, `location_info`
- `what_if_more_passes`, `what_if_more_rain`
- `explain_simple`, `recommendation`, `greeting`, `unknown`

Each query is scored against all rules; the highest-scoring intent wins.

### Response Generation (`responses.ts`)

Each intent maps to a response template that reads live data from the bundle:

```typescript
// Example: erosion_amount intent
const metric = manifest.metrics.find(m => m.id === 'erosion_area');
text: `**${metric.value} hectares** of land was lost to the river.
       Range: ${metric.low} ha (low) to ${metric.high} ha (high).`
sources: [{ file: 'manifest.json', field: 'metrics[erosion_area].value' }]
followUp: ['How much new land?', 'Where is the biggest?', 'Is this reliable?']
```

### Auto-Suggestions (`getSuggestedQuestions`)

After each response, 3 randomized follow-up chips appear from context-appropriate question pools (detect, investigate, challenge, map, or random-all). The user never sees a dead-end.

---

## 16. Design System

The visual language is **purpose-built for scientific data communication** on dark backgrounds — optimizing for radar imagery contrast and information density.

### Color Palette

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0E1113` | App background — maximum contrast for radar |
| `--panel` | `#12161A` | Panel backgrounds |
| `--map-bg` | `#15191C` | Map container background |
| `--water` | `#39C4D9` | Primary accent — water, technology, interactive |
| `--erosion` | `#E4572E` | Danger — land permanently lost |
| `--accretion` | `#D9B26A` | Positive — new land formed |
| `--ambiguous` | `#8A9299` | Uncertain — flagged for review |
| `--pass` | `#7FBF8E` | QC check passed |
| `--warn` | `#E0B34A` | QC check warning |
| `--fail` | `#E4572E` | QC check failed |
| `--text` | `#E6E8EA` | Primary text |
| `--text-2` | `#A7AEB5` | Secondary text |
| `--text-3` | `#6F7880` | Tertiary text / labels |

### Typography

| Role | Font | Weight | Usage |
|---|---|---|---|
| Body text | IBM Plex Sans | 300–700 | All readable text; designed for data-heavy interfaces |
| Numbers | IBM Plex Mono | 400–600 | Measurements, metrics, coordinates; tabular alignment |
| Headlines | Inter | 300–700 | Navigation, page titles, hero text |

### Animation Tokens

| Token | Value | Usage |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Standard "fast then settle" |
| `--duration-fast` | `150ms` | Micro-interactions |
| `--duration-normal` | `250ms` | Panel transitions |
| `--duration-slow` | `400ms` | Page animations, map fly-in |

### Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `>768px` | Full layout: map + hydrograph + panels side-by-side |
| `≤768px` | Chat panel goes full-width; navbar collapses |
| `≤480px` | Mobile layout; panels stack vertically |

---

## 17. Security & Privacy

- **No user data collected.** The app has no database, no analytics, no tracking, and no cookies (beyond a session token for the simple auth gate).
- **No API keys in the browser.** The web app makes zero API calls that require authentication. NASA GIBS tiles are public. All data is pre-processed and served as static files.
- **Pipeline credentials never committed.** Earthdata credentials live in `~/.netrc`. The `.env` file (for any local config) is `.gitignore`d.
- **Reproducible by design.** Anyone can verify our results by running the pipeline themselves with their own Earthdata credentials.

---

## 18. Running & Deploying

### Local Development (Web App Only)

```bash
cd web
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Navigate to `/app` for the investigation interface.

### Local Development (Full Pipeline)

```bash
# 1. Create Python environment
conda env create -f environment.yml
conda activate srt-pipeline

# 2. Configure NASA Earthdata credentials
echo "machine urs.earthdata.nasa.gov login <USER> password <PASS>" > ~/.netrc

# 3. Run pipeline
make discover REACH=jamuna-chilmari
make fetch REACH=jamuna-chilmari
# ... (see Section 12)
```

### Deploying to Vercel

```bash
# From project root:
npx vercel --prod
```

The `vercel.json` config handles everything:
- Build: `cd web && npm install && npm run build`
- Output: `web/dist`
- Routing: SPA fallback to `index.html`

### Running Tests

```bash
cd web
npm run test        # Vitest unit tests
npx playwright test # E2E browser tests
```

---

## 19. Glossary for Non-Coders

- **SAR (Synthetic Aperture Radar):** A satellite radar that sends its own microwave pulse and measures the return. Works through clouds.
- **NISAR:** A joint NASA-ISRO satellite launched July 2025. The most advanced L-band SAR ever built.
- **L-band:** Microwave frequency with ~24 cm wavelength. Penetrates vegetation canopy to see the ground.
- **Backscatter (γ⁰):** How much radar energy returns from a surface. Calm water = very little (dark). Land = a lot (bright).
- **Stage:** River water level measured at a gauge station, in metres.
- **Stage-matching:** Comparing two radar images when the river is at the same height — so differences show real change, not flood.
- **Reach:** A stretch of river (~30-50 km) we analyze as one unit.
- **Char:** A river island or sandbar in the Jamuna. People live on chars.
- **Otsu thresholding:** An automatic method to find the best cutoff between "dark" (water) and "bright" (land) in a radar image.
- **GeoJSON:** A file format for geographic shapes (polygons, points, lines) with attached data.
- **Provenance:** The full trail of where a number came from — which satellite, which date, which processing step.
- **dB (decibels):** A logarithmic scale for radar power. Makes the math simpler and the histograms more symmetrical.
- **CDN (Content Delivery Network):** Servers around the world that cache your files so they load fast from anywhere.
- **SPA (Single Page Application):** A web app that loads once and then updates without full page refreshes.

---

## 20. FAQ & Troubleshooting

**The map is blank or shows no radar imagery.**
Check your browser console for 404 errors. The data bundle at `web/public/data/v1/jamuna-chilmari/` must exist. If you cloned fresh and haven't run the pipeline, the pre-committed bundle should be present.

**The hydrograph shows no dots.**
The `stage.json` file needs `acquisitions` with `status: 'ok'` entries. Check that the file exists and is valid JSON.

**The AI chat doesn't understand my question.**
The intent engine uses keyword matching, not natural language understanding. Try rephrasing with keywords like "erosion", "land lost", "water level", "confidence", or "threshold".

**"Match the Water" button is disabled.**
This requires at least two acquisitions with `status: 'ok'` and similar gauge heights. If only one date has valid data, matching isn't possible.

**The forecast layer doesn't show.**
Click the "Forecast" button in the navbar. The `prediction.geojson` file must exist in the reach bundle.

**Earthquake epicenters aren't visible.**
Click the "Earthquake" button in the navbar. The `earthquakes.json` file must exist in the reach bundle.

**The pipeline fails at `discover`.**
Check your Earthdata credentials in `~/.netrc`. Ensure `earthaccess` and `asf_search` are installed. Verify the reach config YAML has the correct `nisar_short_name`.

**The pipeline fails at `fetch`.**
S3 credential tokens expire after ~1 hour. Re-run `earthaccess` auth to refresh. Also check that the granule IDs in the catalog actually exist (NISAR data is progressively released).

**Vercel deploy shows a blank page.**
Ensure the build command includes `cd web && npm install && npm run build` and the output directory is `web/dist`. The SPA route fallback in `vercel.json` must be present.

**Where is the live demo?**
Deployed at [nasa-space-app-challenge.vercel.app](https://nasa-space-app-challenge.vercel.app). Navigate to `/app` for the investigation interface.

---

*Last updated: 28 September 2026. This guide covers SAME RIVER TWICE at the state of the codebase on this date — all routes, components, pipeline steps, and data sources listed above are the source of truth. If you add a new page, pipeline step, or data source, extend the relevant section here.*
