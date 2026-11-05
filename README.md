# FluviSAR — Complete Platform Encyclopedia

https://nasa-2026-web.vercel.app/

**Challenge:** NASA Space Apps 2026 — *Dancing with the SARs*
**Stack:** React 18 + TypeScript + Vite + MapLibre GL + D3.js + Zustand + Python (Backend Pipeline)

> **Current-status note (2026-11-05):** This encyclopedia contains earlier implementation descriptions and some planned capabilities that may no longer match the current build. The present application is centered on the Jamuna case; its two-date transition result remains **INCONCLUSIVE** and is not confirmed erosion or a forecast. For the latest SAR Lab, ML Intelligence, and Decision Desk behavior, use the detailed guides linked in **Current feature documentation** at the end of this README. Keep this historical material for context, and verify any feature against the current app before using it in a demo script.

FluviSAR is a web platform for examining a Jamuna River NISAR L-band SAR change case, learning about radar, exploring generated ML scenarios, and organizing human review of mapped transition candidates. It does not currently establish confirmed riverbank erosion across multiple sites or provide an operational forecast. This document preserves the original platform encyclopedia; the current feature guides linked below document the recent work and its evidence limits.

---

# TABLE OF CONTENTS

1. [Landing Page](#1-landing-page)
2. [Global Investigations Hub](#2-global-investigations-hub)
3. [The Investigation App (MainApp)](#3-the-investigation-app-mainapp)
4. [ML Intelligence Center](#4-ml-intelligence-center)
5. [Interactive SAR Science Lab](#5-interactive-sar-science-lab)
6. [Impact Dashboard](#6-impact-dashboard)
7. [Methodology & Architecture](#7-methodology--architecture)
8. [About Us & Data Provenance](#8-about-us--data-provenance)
9. [Printable Whitepaper Report](#9-printable-whitepaper-report)
10. [Authentication](#10-authentication)
11. [Global State Management](#11-global-state-management)
12. [Routing](#12-routing)

---

# 1. Landing Page
**File:** `Landing.tsx` (417 lines)

## 1.1 Cinematic Hero Section
- **Animated Radar Sweep Light:** A CSS `@keyframes subtle-sweep` animation that rotates a translucent beam across the viewport simulating an active radar pulse.
- **Grid Mesh Overlay:** A pulsing coordinate grid (`@keyframes pulse-mesh`, scales 1.0→1.05, opacity 0.2→0.4 over 10s) evoking satellite telemetry aesthetics.
- **Headline:** `"See the invisible. Predict the inevitable."` with gradient text fill.
- **Subheadline:** Describes the platform's core mission — cloud-penetrating radar for erosion detection.
- **CTA Buttons:**
  - `"Begin Investigation"` → navigates to `/cases`.
  - `"How it works"` → navigates to `/methods`.

## 1.2 How SAR Works — 4 Concept Cards
Interactive cards explaining foundational radar science:
1. **Active Sensing (📡):** Satellite emits its own microwave pulse — doesn't need sunlight.
2. **L-Band Radar (~24 cm) (〰️):** Long wavelength penetrates forest canopy to reach the ground.
3. **Backscatter & Water (⬛):** Water reflects radar away (appears dark), land scatters it back (appears bright).
4. **Change Detection (🔄):** Comparing two dates reveals what shifted.

## 1.3 Processing Pipeline Flow — 12 Steps
A horizontal node-chain visualizing the exact `run_reach.py` backend architecture:
1. Discover (Find NISAR GCOV granules)
2. Fetch (Stream & AOI-clip)
3. Validate (Reject broken granules)
4. Preprocess (dB conversion & speckle filter)
5. Water (Otsu thresholding)
6. Stage (Gauge height matching)
7. Pairs (Equal-stage pairing)
8. Change (Erosion / accretion mask)
9. Validate (Cross-sensor QC)
10. Render (Map-ready PNGs)
11. Manifest (Provenance chain)
12. Check (Bundle integrity)

## 1.4 Five-Stage Evidence Trail
5 numbered step cards explaining the adversarial verification philosophy:
1. **Detect:** NISAR L-band radar contrast.
2. **Investigate:** Cross-checks with OPERA DSWx-S1, river stage, GPM IMERG precipitation.
3. **Challenge:** Stress tests — sensitivity, RFI, alignment, plausibility.
4. **Explain:** Template-generated provenance summary.
5. **Field:** Local GPS proximity, offline field notes, photographs.

## 1.5 NASA Open Data Sources — 6 Cards
Each card shows the dataset name, provider badge, role description, and a **clickable DOI hyperlink**:
1. NISAR L2 GCOV Provisional V1 (`10.5067/NIL2GCOV-P1`)
2. OPERA L3 DSWx-S1 V1 (`10.5067/OPDSWS1-L3V1`)
3. GPM IMERG Daily (`10.5067/GPM/IMERGDL/DAY/07`)
4. ASF GLO-30 HAND
5. NASA GIBS Blue Marble
6. FFWC River Stage

## 1.6 Footer
FluviSAR · NASA Space Apps Challenge 2026 · Dancing with the SARs · Links to `/methods` and NASA SAR Reference.

---

# 2. Global Investigations Hub
**File:** `Cases.tsx` (275 lines)

## 2.1 Hero Section
- **Live Badge:** `"GLOBAL SURFACE CHANGE MONITORING · NISAR L-BAND SAR"` with pulsing green dot.
- **Title:** `"Monitoring Earth's Surface Across the Globe"`
- **Subtitle:** Describes 4 active investigations spanning 3 continents.
- **Global Telemetry HUD — 4 Stats:**
  1. **Active Sites:** Dynamic count of loaded reaches.
  2. **Change Types:** 4 (Erosion, Glacier Retreat, Wildfire Burn Scar, Wetland Loss).
  3. **Continents:** 3.
  4. **Pipeline Steps:** 12.

## 2.2 Interactive SVG World Map
- **Custom Vector Map Engine:** Hand-coded SVG `<path>` coordinates for 7 continent outlines (North America, South America, Europe, Africa, Asia, South/Southeast Asia, Australia).
- **Latitude/Longitude Grid:** 7 horizontal + 9 vertical `<line>` elements.
- **Live Radar Pings:** Each investigation site is plotted using its geographic bounding box coordinates (`mapX * 10`, `mapY * 10`). Sites display:
  - A pulsing outer ring: `<animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite" />`
  - A pulsing opacity: `<animate attributeName="opacity" values="0.9;0.3;0.9" dur="3s" repeatCount="indefinite" />`
  - Color dynamically reflects the pipeline verdict (Green = SUPPORTED, Yellow = LIMITED, Red = INCONCLUSIVE).

## 2.3 Location Metadata Registry — 4 Sites
Each site has an icon, changeType, changeClass, region, description, and map coordinates:
1. **Jamuna-Chilmari (🏞️):** River Erosion · South Asia · *"Monsoon-driven bank migration on the Jamuna — detected through clouds using L-band SAR."*
2. **Glacier Bay Alaska (🏔️):** Glacier Retreat · North America · *"Glacier terminus retreat measured by radar coherence loss at the calving front."*
3. **NorCal Wildfire (🔥):** Wildfire Burn Scar · North America · *"Forest canopy destruction mapped via SAR backscatter decrease in burned areas."*
4. **Sundarbans Mangrove (🌿):** Wetland Loss · South Asia · *"Mangrove degradation along the Passur River estuary tracked through tidal-adjusted SAR."*

## 2.4 Case Study Cards
Each card is a clickable `<a>` link navigating to `/app?reach={reach_id}`. Cards display:
- **Change Type Badge:** Icon + type + region.
- **Title:** Reach name.
- **Location:** River name + scientific description.
- **Verdict Badge:** Color-coded (✓ SUPPORTED / ~ LIMITED / ? INCONCLUSIVE).
- **Change Type Tag:** Styled pill badge (erosion/glacier/wildfire/wetland).
- **Metadata Row:** 📡 NISAR L-band · 📍 Bounding Box coordinates · 🕐 Data frozen date.
- **CTA:** `"Open Investigation →"`
- **Staggered Animation:** `fade-in-up` with `0.1s` delay per card.

## 2.5 Verdict Explanation Footer
Explains the 12-step adversarial verification: *"The system actively tries to break its own findings — if any quality check fails (threshold sensitivity, plausibility, insufficient acquisitions), the verdict reflects it honestly."* Ends with: *"Our system was designed to be honest, not impressive."*

---

# 3. The Investigation App (MainApp)
**File:** `MainApp.tsx` (189 lines) — The core operational workspace.

## 3.1 Architecture Overview
MainApp assembles 12+ sub-components into a single operational view:
- `<TopBar>` — Navbar configured for app mode.
- `<MapStage>` — Full-screen MapLibre GL satellite map.
- `<StoryPanel>` — Left sidebar with verdict, headline, layer toggles, telemetry.
- `<EvidencePanel>` — Deep-dive provenance inspector for any clicked feature.
- `<QCPanel>` — Quality control check list.
- `<EvidenceTabs>` — 6-tab agentic analysis workflow.
- `<Hydrograph>` — D3-powered river stage chart at bottom.
- `<FullscreenHUD>` — Sci-fi tactical overlay during processing.
- `<ChatWidget>` — AI assistant.
- `<CinematicDescription>` — Dramatic typewriter reveal overlay.

## 3.2 MapStage — Interactive Satellite Map
**File:** `MapStage.tsx` (393 lines)

### 3.2.1 Map Engine
- **MapLibre GL JS** with ESRI World Imagery satellite basemap tiles.
- Dark background (`#070A0C`), desaturated satellite imagery (`raster-saturation: -0.3`, `raster-contrast: 0.15`).
- Initial center: `[89.7, 24.5]` (Bangladesh), zoom 6.

### 3.2.2 Interactive Map Layers
- **Erosion Polygons (`layer-8-erosion`):** Click selects feature → opens EvidencePanel. Cursor changes to pointer on hover.
- **Accretion Polygons (`layer-7-accretion`):** Same click/hover behavior.
- **Water Mask (`layer-6-water`):** Togglable blue overlay.
- **Forecast Prediction Layers:** `layer-13-predict-erosion`, `layer-13-predict-accretion`, `layer-13-predict-ambiguity`. Click opens a MapLibre Popup showing Probability %, AI Reasoning text, and source label.
- **Earthquake Markers (`layer-12-earthquakes`):** Click opens a Popup with Title, Magnitude, Date, and Source: NASA EONET API.

### 3.2.3 3D Terrain Toggle
- Button at top-right: `"3D relief"` / `"✓ 3D relief"`. Toggles DEM hillshade terrain exaggeration.
- Tooltip: *"Terrain relief is a presentation layer (public elevation tiles) — not a scientific measurement."*

### 3.2.4 Sensory Mode (Audio + Haptic Feedback)
When enabled, the cursor becomes a crosshair. Moving the mouse over the map produces:
- **Erosion zone:** 200 Hz low warning tone + haptic vibration pattern `[30, 30, 30]` ms.
- **Accretion zone:** 600 Hz high positive tone + haptic vibration `20` ms.
- **Water zone:** 400 Hz mid tone.
- **Land (default):** 100 Hz faint click (Geiger-counter style probe).
- Audio uses Web Audio API with `exponentialRampToValueAtTime` decay.
- Throttled at 80ms intervals.

### 3.2.5 Outside Coverage Warning
When the user pans >5km beyond the reach bounding box, an `<OutsideCoverage>` overlay appears with a "Fly Back" button.

### 3.2.6 Cinematic Camera Events
Listens for `cinematic-fly` custom events to programmatically fly the camera to specific coordinates, pitch, bearing, and zoom.

## 3.3 CompareSwipe — Temporal Before/After Comparison
**File:** `CompareSwipe.tsx` (234 lines)

- **Dual Map Engine:** Spawns a second MapLibre instance synchronized to the primary map's camera (center, zoom, bearing, pitch).
- **Draggable Slider:** A vertical divider that clips the secondary map using CSS `clipPath: inset(0 0 0 ${position}%)`.
  - Drag handle: 24×48px pill with two vertical grip lines.
  - Keyboard accessible: `aria-role="slider"`, Arrow keys move ±5%.
  - Floating date badges: `"Before: {t0}"` and `"After: {t1}"` pinned to the slider position.
- **Cinematic Auto-Swipe:** When `cinematicMode` is active, the slider animates automatically using a sine wave: `position = (Math.sin(elapsed / 1500) + 1) / 2 * 100`.

## 3.4 RiverMemory — Time-Lapse Playback Engine
**File:** `RiverMemory.tsx` (126 lines)

- **Floating Pill Dock:** Centered at bottom of map with frosted glass backdrop.
- **Play/Pause Button:** 40×40px round button. Automatically enables the water layer if off.
- **Interactive Scrubber Track:** A 4px horizontal bar with clickable dot markers for each acquisition date.
  - Active dot: 14×14px with cyan glow shadow.
  - Inactive dot: 8×8px grey.
  - Click any dot: instantly jumps to that date.
- **Auto-Play Logic:** Steps through dates every 1.5 seconds. Stops automatically at the last frame.
- **Date Readout:** Cyan monospace display of currently selected date.

## 3.5 SensorFusion — Multi-Source Validation Panel
**File:** `SensorFusion.tsx` (108 lines)

- **Toggle Button:** `"🛰️ Cross-Sensor Fusion ▼"` at top-right of map.
- **Dropdown Card (320px):** Shows 4 independent data sources and their agreement:
  1. **NISAR L2 GCOV (L-band):** ✅ PRIMARY — `σ⁰ drop: -6.1 dB at erosion front`
  2. **Sentinel-1 (OPERA DSWx):** ✅ SUPPORTS — `87% agreement on water extent`
  3. **GPM IMERG (Precipitation):** ✅ EXPLAINS — `+42mm above 30-year normal`
  4. **SRTM / HAND (Elevation):** ✅ PLAUSIBLE — `Detection zone 2.1m above drainage`
- **Consensus Summary:** `"CONSENSUS: 4/4 SOURCES AGREE"` — `"Overall Confidence: 94%"`

## 3.6 MissionBriefing — Cinematic Auto-Narrated Sequence
**File:** `MissionBriefing.tsx` (151 lines)

A 6-step automated cinematic presentation that disables user input and takes control of the camera:
1. **Step 0 (Country Overview):** Zoom out to country level, pitch 0°, bearing 0°. Holds 4s. Text: `"MISSION BRIEFING: {REACH NAME}"`
2. **Step 1 (Site Approach):** Zoom to site, pitch 65°, bearing 30°. Holds 7s. Text: `"Targeting Brahmaputra-Jamuna floodplain..."`
3. **Step 2 (Sensor Sync):** Loads latest radar acquisition, clears overlays. Holds 4s. Text: `"NISAR L2 GCOV Acquisition Detected"` + `"Mode: ScanSAR | Processing Level: L2"`
4. **Step 3 (Detection Reveal):** Enables erosion + accretion layers, rotates bearing to -15°. Holds 6s. Text: `"Change Detected: 1,247 hectares"` + `"Verdict: SUPPORTED (Cross-validated)"`
5. **Step 4 (Risk Prediction):** Enables risk heatmap layer. Holds 5s. Text: `"Predictive Model Engaged"` + `"⚠️ 3,247 people within impact radius"`
6. **Step 5 (Assessment Complete):** Camera pulls back. Holds 6s. Text: `"ASSESSMENT COMPLETE"` + `"Returning control to operator."`
- **Scanline FX:** A 10px cyan bar sweeps vertically across the viewport (`translateY(0) → translateY(100vh)` over 4s, infinite loop).

## 3.7 MapLegend — Context-Aware Legend
**File:** `MapLegend.tsx` (75 lines)

- **Browse Mode:** Shows Radar grayscale swatch + Water mask swatch (if enabled).
- **Compare Mode:** Shows Erosion (red), Accretion (yellow), Ambiguous (grey with diagonal stripes).
- **Forecast Mode:** Additional section showing Erosion Risk (red), Accretion Risk (yellow), and Ambiguity (grey) swatches. Enters with `fadeInUp` animation.

## 3.8 Hydrograph — D3-Powered River Stage Chart
**File:** `Hydrograph.tsx` (183 lines)

- **D3 Scales:** `scaleTime` for X-axis, `scaleLinear` for Y-axis (river height in meters).
- **River Stage Curve:** Continuous SVG `<path>` plotting water height over time.
- **Danger Level Line:** Dashed red horizontal line at the station's danger level.
- **SAR Acquisition Pins:** Cyan circles on the curve for each valid acquisition date. Click any pin → switches the map to that date's radar image.
- **Date Selector Strip:** Row of buttons above the chart for quick date switching (e.g., `"✓ Sep 13"`, `"Aug 26"`).
- **Earthquake Markers:** 2 recorded seismic events (Aug 26 M5.2, Sep 19 M4.8) rendered as orange dashed vertical stems with `"EQ"` badge and magnitude label.
- **Match Water Button:** `<MatchWaterButton />` component for stage-matching operations.

## 3.9 StoryPanel — Left Sidebar
**File:** `StoryPanel.tsx` (27 lines)

Renders:
- `<VerdictBadge />` — Color-coded SUPPORTED/LIMITED/INCONCLUSIVE pill.
- `<h1>{reach.river} / {reach.name}</h1>`
- `<Headline />` — Primary metric display (e.g., `"1,247 ha"` in large red text with pulsing hazard triangle SVG).
- `<h3>Map Layers</h3>` + `<LayerToggles />` — 4 toggle buttons: Water, Accretion, Erosion, Ambiguous.
- `<TelemetryPanel />` — SAR orbital parameters readout.

## 3.10 TelemetryPanel — SAR Orbital Parameters
**File:** `TelemetryPanel.tsx` (98 lines)

Displays 8 rows of satellite metadata:
1. **SATELLITE:** NISAR
2. **GRANULE:** Exact NISAR granule name (truncated if >5 parts).
3. **REACH:** Reach name in uppercase.
4. **TRACK:** Relative orbit / Direction (ASCENDING/DESCENDING) / Frame.
5. **POLARIZATION:** HHHH (co-pol).
6. **ACTIVE DATE:** Currently selected acquisition date.
7. **THRESHOLD:** Otsu dB value for current date (t0 or t1).
8. **Footnote:** *"Showing pre-computed analysis results from the offline pipeline. Backscatter classification via Otsu thresholding on calibrated γ⁰ values."*

## 3.11 EvidencePanel — Deep Provenance Inspector
**File:** `EvidencePanel.tsx` (164 lines)

Opens when a map feature is clicked. Contains 7 sections:
1. **What:** Area in hectares (polygon) or metric value with uncertainty range.
2. **Where:** Nearest place name + CEGIS Reach ID.
3. **When:** t0 and t1 dates with river stage heights in meters.
4. **Radar:** Side-by-side radar crop images for both dates.
5. **Sources:** Input granules with kind, UTC timestamp, and clickable DOI links.
6. **Method:** Algorithm description + parameters table + link to full method reference.
7. **Checks:** All linked QC checks with pass/fail/warn status.

## 3.12 QCPanel — Quality Control Checks
**File:** `QCPanel.tsx` (49 lines)

Renders a prioritized list of automated checks sorted by severity: `FAIL → WARN → NOT_EVALUATED → PASS → INFO`. Each card shows status color, title, metric value (if defined), and explanatory note.

## 3.13 EvidenceTabs — 6-Tab Agentic Analysis Workflow
**File:** `EvidenceTabs.tsx` (769 lines) — The largest interactive panel.

### 3.13.1 Tab System
6 specialized analysis tabs:
1. **Detect** (radar measurement)
2. **Investigate** (cross-sensor sync)
3. **Challenge** (adversarial test)
4. **Explain** (final verdict)
5. **Field** (ground truth)
6. **Impact** (risk assessment)

### 3.13.2 Detect Tab
- **SAR Morphodynamics Metrics:** Total Geomorphic Change (km²) and Otsu Threshold Shift (dB variance between t0/t1).
- **Synthetic Backscatter Histogram:** 20 bar chart elements simulating the bimodal water/land distribution.
- **Detection Parameters:** Median Filter Window, MMU, HAND Max Elevation, Relative Orbit, Acquisition Direction.
- **Raw L2 Granule Preview:** Actual radar image with animated radar-sweep CSS overlay and EPSG badge.

### 3.13.3 Investigate Tab
- **6-Sensor Verification Matrix:** Each sensor card shows technology, source, confidence (ρ), and status LED:
  1. NISAR L-band Calibration (ρ=0.99)
  2. Sentinel-1 DSWx Alignment (ρ=0.84)
  3. FFWC Hydrological Stage (ρ=0.92)
  4. GPM IMERG Precipitation (ρ=0.88)
  5. FIRMS Thermal Anomaly (ρ=0.97)
  6. MODIS NDVI Vegetation (ρ=0.89)
- **Click any card** → Opens a technical detail modal with Data Source, Confidence Interval, Status Code, and Description.
- **Timeline of Changes Widget:** Visual timeline showing Before/After dates with a connecting "Period of Change Detected" span bar.

### 3.13.4 Challenge Tab
- **Confidence Gauge:** Dynamic percentage (98% for SUPPORTED, 64% for LIMITED, 12% for INCONCLUSIVE) with glowing progress bar.
- **Penalty Deductions:** RFI (-20%), Alignment (-10%), Plausibility Limit (-68%).
- **False Positive Probability:** Calculated as `(100 - confidence)%`.
- **Human Verification Section:** `"DID THIS HAPPEN?"` with 👍 Hit and 👎 Miss buttons (SVG thumbs icons).
- **7-Step Adversarial Pipeline Timeline:** Uses `<StepTimeline>` with PASS/WARN/FAIL/INFO SVG icons and connector lines.

### 3.13.5 Explain Tab
- **Final System Verdict:** Executive summary with colored border, text glow, and recommendation text.
- **Satellite Preview Image:** Hover-activated zoom card with coordinates and date metadata.
- **Explainable AI (XAI) Attribution:** 4 SHAP-style importance bars:
  1. SAR Backscatter Intensity: 78.2%
  2. Sentinel-1 Optical Match: 14.5%
  3. Hydrological Stage Context: 6.1%
  4. Geomorphic Prior Models: 1.2%
- **Stacked Proportion Bar:** Multi-color bar visualizing the 4 contributions.

### 3.13.6 Field Tab
- **GPS Field Node 01:** Pulsing green dot, status ONLINE (SYNCED), with exact coordinates.
- **Drone Survey Status:** Pulsing yellow dot, AWAITING DEPLOYMENT.
- **Community Alert Integration:** SMS Alerts Dispatched (4,250), Evacuation Status (PREPARED), Local Authority Sync (VERIFIED).
- **7-Step Field Team Synchronization Timeline.**

### 3.13.7 Impact Tab
- **3 Impact Metric Cards:** Homes at Risk (2.5 per ha), People Affected (×4.5 household multiplier), Agricultural Land Lost (85% ratio).
- **4 Recommended Operational Actions.**
- **River Reach Vulnerability Index:** 5 comparative reaches with proportional progress bars (Chilmari–Roumari: 92, Sariakandi: 85, Sirajganj: 78, Kazipur: 65, Aricha: 45).

### 3.13.8 Processing Terminal
- **9-step log stream** animated at 400ms intervals with blinking cursor.
- **FullscreenHUD overlay** (file: `FullscreenHUD.tsx`, 85 lines) during processing: tactical ring with percentage counter, streaming terminal output, per-tab status messages.

## 3.14 ChatWidget — AI Assistant
**File:** `ChatWidget.tsx` (252 lines)

- **Floating Action Button:** Speech bubble SVG icon. Opens the chat window.
- **Chat Header:** `"🛰️ River Intelligence"` — `"Online — {reach name}"`.
- **History Button:** Loads one of 3 pre-built Q&A mockups (river migration, erosion areas, earthquake impact).
- **Message Bubbles:** Markdown bold rendering (`**text**`). Newline support.
- **Source Provenance Chips:** `"📎 Show sources (N)"` toggle reveals file→field provenance chips (e.g., `reach.json → bbox`).
- **Typing Indicator:** 3-dot bouncing animation.
- **Suggested Question Chips:** Auto-populated follow-up questions. Click sends immediately.
- **Intent Classification Engine:** `classifyIntent(text)` routes user questions to domain-specific response generators.
- **Map Action Dispatch:** Responses can trigger `chat-map-action` custom events to fly the camera or toggle layers.
- **AI "Thinking" Delay:** `600 + Math.random() * 800` ms for realistic feel.

## 3.15 Inspectable — Inline AI Q&A on Any Data Element
**File:** `Inspectable.tsx` (155 lines)

- **Inspect Mode:** When enabled globally, any `<Inspectable>` wrapper shows a `"🔍 Inspect"` floating pill badge.
- **Click to Expand:** Opens an inline AI analysis drawer directly on the data element.
- **Embedded Chat:** Full conversational Q&A within the element — user can ask follow-up questions.
- **Auto-generates initial explanation** using the `intentKey` prop via `classifyIntent()` + `generateResponse()`.
- **Map Actions:** AI responses can dispatch viewport/layer changes.

## 3.16 CinematicDescription — Dramatic Reveal Overlay
**File:** `CinematicDescription.tsx` (129 lines)

- **Radial Vignette Backdrop:** Dark radial gradient, zIndex 3000.
- **Typewriter Text Stages** (staggered at 1s, 2.5s, 4s):
  1. Target name with cyan glow.
  2. Scientific description + CRITICAL ALERT banner (red SVG danger triangle + `"SIGNIFICANT LAND SURFACE CHANGE"`).
  3. Twin metric panels: Hydrological Regime (`"High-Flow Braided"`) and Vulnerability Index (`"Critical Level 4"`).
- **Camera Control:** Dispatches `cinematic-fly` event (zoom 11, pitch 65°, bearing -20°).

---

# 4. ML Intelligence Center
**File:** `Intelligence.tsx` (885 lines, 59KB)

## 4.1 Hero & KPI Cards
- **Badge:** `"LIVE ML INFERENCE CLUSTER"`
- **Title:** `"Spatio-Temporal Prediction Engine"`
- **4 KPI Metric Cards:** Global Sites Monitored (4), SAR Acquisitions Processed (12), Mean IoU (0.872), BCE Loss (< 0.12).

## 4.2 Temporal Backscatter Signature Chart (HH vs HV)
- **SVG Chart (620×220):** Dual polylines plotting HH (cyan) and HV (gold) backscatter intensity over 8 dates.
- **Animated Stroke:** `stroke-dashoffset` transition over 2 seconds.
- **Dashed Otsu Reference Line** at -14.2 dB.
- **Shaded Water Zone Rectangle** below the Otsu line.
- **Interactive Hover Nodes:** Hovering any data point shows a tooltip bubble with exact HH/HV values.
- **Change Event Marker:** Aug 20 highlighted as the morphological transition point.

## 4.3 InSAR Coherence Decay Profiler
- **SVG Chart (800×350):** Plots coherence (γ ∈ [0, 1.0]) over 0–48 days.
- **4 Decay Curves:**
  1. Urban (τ=500 days) — slow decay.
  2. Bare Soil (τ=365 days) — moderate decay.
  3. Vegetation (τ=15 days) — rapid decay.
  4. Changed Surface — sudden anomalous drop at day 12 to γ=0.1.
- **Water Baseline:** γ ≈ 0 (complete decorrelation).
- **Interactive Threshold Slider.**

## 4.4 Dual-Pol Decomposition Panels
3 visual cards for HH (Co-pol), HV (Cross-pol), and HH/HV ratio with radial/conic gradients and gradient legend bars.

## 4.5 Interactive Confidence Threshold Simulator
- **Slider (0.50 → 0.95, step 0.01):** Controls ML strictness.
- **Dynamic Scaling Factor:** `tf = (threshold - 0.5) / 0.45`
- **Dynamic Hectares:** `round(1247 - tf × 600)` — shows how stricter thresholds reduce detected area.

## 4.6 3×3 Confusion Matrix
- **3 Classes:** Water, Land, Changed.
- **Interactive Cells:** Hover zooms (scale 1.1) and highlights the cell.
- **Per-Class Metrics:** Real-time Precision, Recall, and F1-Score calculated as:
  - `Precision = TP / (TP + FP) × 100%`
  - `Recall = TP / (TP + FN) × 100%`
  - `F1 = 2·TP / (2·TP + FP + FN) × 100%`

## 4.7 ROC Curve
- SVG plot with AUC = 0.964, diagonal reference line, and the operating point highlighted.

## 4.8 SHAP Feature Importance — 7 Bars
Animated horizontal bars (transition delay per index):
1. σ⁰ HH Backscatter Change (dB): 0.31
2. Coherence Loss (γ): 0.22
3. σ⁰ HV Cross-pol Ratio: 0.18
4. HAND (Height Above Nearest Drainage): 0.12
5. Precipitation Anomaly (GPM): 0.09
6. DEM Slope (°): 0.05
7. Distance to Channel (m): 0.03

## 4.9 Training Convergence Chart
Dual-axis chart plotting BCE Loss (left) and IoU (right) across 50 epochs:
- Loss formula: `0.12 + 0.73 × exp(-i/10)`
- IoU formula: `0.872 - 0.722 × exp(-i/8)`
- Dashed early stopping line at Epoch 350.

## 4.10 Stratified K-Fold Cross-Validation Table
5 folds + Mean row showing Train/Val IoU, Train/Val F1, and Epochs.

## 4.11 Explainable AI Self-Attention Visualization
Multi-head attention (Head 4) activation map with radial gradient heatmaps pulsing over river bends. 94.2% attention statistic, 14 transformer layers.

## 4.12 Real-Time Telemetry Feed
9 colored terminal log lines (ANOMALY=warn, FILTER=fail, COMMIT=pass) with blinking cursor and auto-scroll.

## 4.13 4D-SAR Transformer Architecture Diagram
6-stage block flow: Inputs → Spatial Encoder → Temporal Attention → Fusion Layer → Decoder → Output, connected by chevron arrows.

## 4.14 Global Site Prediction Summary
4 cards: Jamuna-Chilmari (1,247 ha, 72%), Glacier Bay (47 ha, 84%), Park Fire NorCal (892 ha, 68%), Sundarbans (156 ha, 61%).

## 4.15 SBAS Interferometric Network Graph
SVG chart plotting Perpendicular Baseline (m) [-200, 200] vs Temporal Baseline (Days) with 8 acquisition nodes and interferogram connection lines.

## 4.16 Ionospheric Faraday Rotation Compensation
Module description showing 42% global phase unwrapping error reduction.

---

# 5. Interactive SAR Science Lab

The SAR Lab is an educational collection of reference panels, project-product viewers, and clearly labeled synthetic or schematic simulations. It does not imply that every displayed teaching metric was computed from the Jamuna data. The current panel inventory, controls, assumptions, and limits are documented in [docs/SAR_LAB.md](docs/SAR_LAB.md).

### Current interactive simulations and viewers

- Cloud-density comparison for illustrative optical imagery and a Jamuna SAR quicklook.
- Flood scattering mechanism scenarios for open water, crops, and woody vegetation.
- Incidence-angle radar geometry cross-section for layover, foreshortening, and shadow.
- NISAR SweepSAR versus conceptual stripmap animation.
- Flat-interface Fresnel reflectance explorer with a live ray diagram and angle control.
- L-band/S-band target-size scale comparison using `x = πd/λ`.
- Synthetic Gamma-speckle and Lee-style filtering demonstration.
- Synthetic H/α eigenvalue-weight teaching model.
- Parameterized temporal coherence term `γₜ = exp(−Δt/τ)`.
- Jamuna change explorer, water/change map lens, and water-classification walkthrough.
- Synthetic threshold-sensitivity histogram and InSAR fringe synthesizer.

The lab also includes NISAR mission and frequency references, polarization explainers, an InSAR processing overview, and a qualitative L-/C-band comparison. See the dedicated guide for scientific assumptions and interpretation limits for each panel.
# 6. Impact Dashboard
**File:** `Impact.tsx` (386 lines) + `ForecastImpact.tsx` (310 lines)

## 6.1 Mission Status Bar
Badges: NISAR L2 GCOV PROVISIONAL, ORBIT 19 | FRAME 76, Reach identifier, Stage variance Δh = 0.039m (WARN), Verdict status.

## 6.2 Reach Selector — 4 Buttons
Switch between: `jamuna-chilmari`, `glacier-bay-alaska`, `norcal-wildfire`, `sundarbans-mangrove`.

## 6.3 Animated KPI Counters
Uses `requestAnimationFrame` with quartic easing: `easeOutQuart = 1 - (1 - progress)⁴`.
4 Sendai-aligned cards:
1. **Target B-1:** People at Risk (e.g., 45,200).
2. **Target B-3:** Homes Threatened (e.g., 8,900).
3. **Target C-2:** Agricultural Loss in hectares.
4. **Target C-3:** Economic Exposure in $M USD.

## 6.4 UNDRR Sendai Framework Indicators
Progress bars for: B-3 Dwellings (75%), B-4 Livelihoods (85%), C-2 Agriculture (60%), C-4 Housing Sector (45%).

## 6.5 World Bank DaLA Economic Ledger
- **Direct Physical Damage (65% of total):** Rural Homesteads (38%), Agricultural Land (34%), Flood Control (17%), Tubewells (11%).
- **Economic Flow Losses (35% of total):** Lost Harvests (48%), Lost Wage Labor (28%), Emergency Relocation (24%).
- **Total Calculation:** Grand total in $M USD.

## 6.6 Erosion Risk Zones Panel
List of specific geographic zones with exact area (ha), probability of collapse (0–100%), and visual risk bars.

## 6.7 Temporal Economic Decay Trajectory
SVG chart: Confidence polygon, red physical damage line, cyan cascading flow loss curve, labeled dates (AUG t0, SEP t1, OCT, NOV HARVEST).

## 6.8 Community Action Matrix
Triage table: P1 ⚠ EVACUATE (red), P2 ⚙ PREPOSIT. (yellow), P3 ✓ MONITOR (green).

## 6.9 Emergency Alert Generator
Red button `"⚠ GENERATE EMERGENCY BRIEFING"`. Opens a modal that programmatically compiles reach name, people at risk, economic impact, required actions, and pipeline confidence into a formal text briefing. `"Copy to Clipboard"` button uses `navigator.clipboard.writeText()`.

## 6.10 Scientific Provenance Footer
Displays: NISAR t0/t1 Granule IDs, Otsu Threshold string, QC Flags grid (traffic lights), Resolution/MMU (20m / 400 m², 12 px / 4,800 m²), Methodology reference (Section 10.5).

## 6.11 Per-Reach Forecast Models (ForecastImpact.tsx)
Each of the 4 sites has a unique predictive model:
1. **Jamuna-Chilmari:** LSTM-SAR Temporal + BWDB Gauge Regression, 90-day horizon, 72% confidence.
2. **Glacier Bay:** Ice Velocity + Terminus Position Regression, 12-month horizon, 84% confidence.
3. **NorCal Wildfire:** Post-Fire Recovery + NDVI Trajectory, 6-month horizon, 68% confidence.
4. **Sundarbans:** Mangrove Canopy Loss + Tidal Regression, 6-month horizon, 61% confidence.

---

# 7. Methodology & Architecture
**File:** `Methods.tsx` (459 lines)

## 7.1 Six Interactive Modal Dialogs
Click any card to open a detailed modal with backdrop blur:
1. **Processing Pipeline:** 12-step cards with descriptions.
2. **Data Sources:** 5 source cards with DOIs and providers.
3. **Methodology:** Strict erosion criteria: Land at t₀, Water at t₁, Stage at t₁ ≤ t₀ + 0.15m, temporal persistence.
4. **Quality Control:** All QC checks with dynamic PASS/WARN/FAIL color pills.
5. **Configuration Parameters:** Key-value pairs from `manifest.metrics.params`.
6. **Limitations & Caveats:** What we don't claim (causes, displaced persons count, flood forecasting) and known limitations (Otsu confusion, 24h gauge lag, residual RFI).

---

# 8. About Us & Data Provenance
**File:** `About.tsx` (419 lines)

## 8.1 Cinematic Hero
Background image with luminosity blend, title `"The River Takes It All"`, gradient text.

## 8.2 Story Cards
`"Blinded by the Monsoon"` + `"Piercing the Veil with SAR"` with scanline animation.

## 8.3 The Architects — 4 Crew Members
Cards with initials, role badges, descriptions:
- **Sabbir Ahmed** ([@Tony1254-CS](https://github.com/Tony1254-CS)) — Mission Commander & Principal Systems Architect (Core Pipeline, Radar Physics, InSAR & Full-Stack Architecture)
- Sanjid Talukder (Data Scientist — SAR Processing & Remote Sensing)
- Sakibul Hassan Shovon (Frontend Engineer — Interactive Visualization & UX)
- Yasin Arafat (Hydro Analyst — River Dynamics & Quality Assurance)

## 8.4 Data Flow Pipeline
9-step horizontal chain: NASA NISAR → ASF DAAC → AOI Clip → Water Classification → Stage Matching → Change Detection → QC Validation → Bundle Generation → Web Application.

## 8.5 7 Detailed Data Sources
Full scientific descriptions with DOIs, providers, and role explanations for NISAR, OPERA DSWx, GPM IMERG, ASF HAND, JRC Global Surface Water, FFWC Stage, NASA GIBS.

## 8.6 6 SAR Concepts Accordion
Collapsible `<details>` elements: SAR, Active Sensing, L-Band, Backscatter Coefficient, Polarization, Change Detection.

## 8.7 Honest Disclosure
AI coding assistance attribution. Statement: all metrics resolve to `manifest.json`.

---

# 9. Printable Whitepaper Report
**File:** `Report.tsx` (106 lines)

- **Print CSS:** `@media print` stylesheet for clean printing.
- **🖨️ Print Button.**
- **5 Sections:**
  1. Executive Summary: 4.2 km erosion, 1,247 ha, HIGH confidence.
  2. Key Findings: σ⁰ decrease of -6.1 dB, 5 cross-validated sources, 94% confidence.
  3. Impact Assessment Table: 3,247 people, 14 schools, 847 ha cropland, $4.2M USD.
  4. Recommendations: Immediate, 30-day, 90-day action items.
  5. Data Provenance: Granule IDs, processing node, hash verification.

---

# 10. Authentication
**File:** `Auth.tsx` (139 lines)

- **Brand:** `"FLUVISAR"`.
- **Google Sign-In Button** (demo only — redirects to `/cases`).
- **Email/Password Form** (demo only).
- **Note:** *"Demo only — no account needed, any details work."*

---

# 11. Global State Management
**File:** `store.ts` (148 lines) — Zustand store with 23 state properties and 17 action dispatchers.

Key state: `reachId`, `reach`, `manifest`, `stage`, `qc`, `bounds`, `erosion`, `accretion`, `selectedDate`, `compare`, `selectedFeatureId`, `layers` (7 toggles), `panel`, `analysisMode`, `analysisSplit`, `analysisModeType`, `analysisActiveTab`, `analysisStepIndex`, `analysisState`, `sensoryMode`, `cinematicMode`, `inspectMode`, `chatOpen`.

---

# 12. Routing
**File:** `App.tsx` (26 lines)

Client-side routing via `window.location.pathname`:
- `/` → Landing
- `/cases` → Investigations
- `/app` → MainApp (Investigation Workspace)
- `/intelligence` → ML Intelligence
- `/sar-lab` → SAR Lab
- `/impact` → Impact Dashboard
- `/methods` → Methodology
- `/about` → About Us
- `/report` → Whitepaper Report
- `/auth` → Authentication

---

# Navbar — Global Navigation
**File:** `Navbar.tsx` (280 lines)

## Navigation Links
🚨 Impact Dashboard · Investigations · 🧠 ML Intelligence · 🔬 SAR Lab · Methods · About Us · 📄 Report · Sign In.

## App Mode Tools Dropdown
- 🔊 Bangla Voice Report (Web Speech API — Bengali/English fallback).
- Earthquakes layer toggle (NASA EONET).
- Sensory Inspector (Audio + Haptic).
- Mission Briefing (Cinematic sequence).
- Forecast Model layer toggle.
- Predictive Risk Heatmap toggle.

## Evidence Dropdown
6 tabs: Detect, Investigate, Challenge, Explain, Field, Impact.

## Live Analysis Button
Triggers full 6-step agentic workflow with processing state.

---

# Current feature documentation (2026-11-05)

The encyclopedia above retains earlier descriptions. These guides document the current implementation of the three recently updated areas and are the preferred reference for the demo/video script:

- [SAR Lab: panel-by-panel science, controls, formulas, data types, and limitations](docs/SAR_LAB.md)
- [ML Intelligence: synthetic sample design, Random Forest and Temporal MLP, each diagnostic, Jamuna evidence tab, and interpretation boundaries](docs/ML_INTELLIGENCE.md)
- [Decision Desk: map layers, area-ranked candidate ledger, QC/provenance, hypothetical corridor, OSM query, audience briefs, and TRACE Field JSON handoff](docs/DECISION_DESK.md)
- [240-second submission video script](docs/submission/video_script.md)
- [Demo walkthrough and current interaction checklist](docs/submission/demo_walkthrough.md)
- [Methods and claim boundaries](docs/submission/methods.md)

## Current case status

The configured Jamuna comparison uses two usable NISAR acquisitions (2026-08-26 and 2026-09-19). Its polygons are threshold-derived land↔water transition candidates. The reported area fails the plausibility review, stage matching and later-pass persistence are unresolved, and independent water-reference agreement and real-data ML performance have not been evaluated. The verdict remains **INCONCLUSIVE**. Do not narrate these candidates as verified erosion or use synthetic model scores as real-case performance.

## Current platform boundaries

- ML Intelligence's model sandbox is generated-data demonstration. Its real Jamuna tab displays bundle evidence and validation gaps; it does not run those demo classifiers on the Jamuna pixels.
- Decision Desk sorting is by mapped area. Its impact envelope is hypothetical; optional OpenStreetMap counts are mapped features, not people or damages.
- FluviSAR and TRACE Field are separate platforms. The Decision Desk exports a JSON packet for manual handoff; it does not synchronize automatically.
- `web/tests/fixtures/PROVENANCE.md` is test-fixture provenance and remains a record of the fixture, not product documentation.
