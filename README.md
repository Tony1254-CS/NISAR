# FluviSAR: Comprehensive Architecture & Component Encyclopedia

**Target Challenge:** NASA Space Apps 2026 — *Dancing with the SARs*

This document provides a deep-dive, component-by-component breakdown of every single feature in the FluviSAR platform. It explicitly defines the **Role** (why it exists) and the **Work** (how it functions) of every module.

---

## 1. Global Investigations Dispatch (`Cases.tsx`)

### 1.1 Global Telemetry HUD
*   **Role:** To provide a high-level overview of the platform's global scalability and active monitoring capabilities.
*   **Work:** Displays four critical statistics: Active Sites, Change Types (Erosion, Glacial Retreat, Deforestation, Subsidence), Continents Monitored, and Pipeline Steps (the 12-step verification process).

### 1.2 Interactive SVG World Map Engine
*   **Role:** To visually anchor the case studies to real-world geography without relying on heavy external mapping libraries.
*   **Work:** Renders a purely mathematical, hand-coded SVG vector map of the continents. It maps the geographic bounding box coordinates of each investigation site to the 2D grid. It uses `<animate>` tags to render pulsing radar-echo rings over active sites. The color of the pulse dynamically reflects the site's pipeline verdict (Green, Yellow, Red).

### 1.3 Verdict-Driven Case Study Cards
*   **Role:** To provide accessible entry points into specific river reaches while maintaining scientific transparency about data quality.
*   **Work:** Iterates through the active investigations and renders a card for each. The card's styling is driven by the algorithmic verdict:
    *   `SUPPORTED` (Green): High-confidence SAR data.
    *   `LIMITED` (Yellow): Moderate confidence (e.g., severe radar noise).
    *   `INCONCLUSIVE` (Red): Noise floor too high, no definitive result.
    The card displays the exact Bounding Box coordinates, the specific Change Type, and the exact timestamp the data was frozen.

---

## 2. ML Intelligence Center (`Intelligence.tsx`)

### 2.1 ML Confidence Threshold Simulator
*   **Role:** To demonstrate the real-world operational trade-offs of deploying Machine Learning in disaster scenarios.
*   **Work:** An interactive slider (0.50 to 0.95) that allows the user to adjust the strictness of the neural network. As the slider moves, it mathematically triggers recalculations across the entire page.

### 2.2 Dynamic Precision-Recall Confusion Matrix
*   **Role:** To explicitly quantify the neural network's accuracy across three classes: Water, Land, and Changed.
*   **Work:** Reads the state of the Confidence Threshold Simulator. It mathematically calculates the True Positives (TP), False Positives (FP), and False Negatives (FN). It then renders these raw counts into a 3x3 grid. Finally, it computes and displays the real-time F1 Score, Precision %, and Recall % for each class, visually demonstrating the danger of False Alarms vs Missed Collapses.

### 2.3 Temporal Backscatter Signature Graph
*   **Role:** To prove that riverbank collapse has a distinct physical signature in radar data.
*   **Work:** Plots a time-series line chart mapping backscatter Intensity (dB). It plots both HH (horizontal transmit/receive) and HV (cross-polarized) signatures over a year, demonstrating the exact seasonal signal drop caused by the monsoon inundation.

### 2.4 ML Training Epochs Convergence Graph
*   **Role:** To visualize the backend training process of the spatiotemporal model.
*   **Work:** A dual-axis line chart plotting 50 training epochs. It calculates the Loss function convergence (approaching 0) and the Intersection over Union (IoU) accuracy curve (approaching 1.0).

### 2.5 Animated Backend Telemetry Feed
*   **Role:** To prove the system is actively computing and ingesting data, rather than just displaying static graphics.
*   **Work:** A `useEffect` interval stream that acts as a scrolling terminal UI. It continuously prints simulated backend logs, including batch processing IDs, tensor allocations, learning rates, and gradient descent steps.

---

## 3. The Interactive SAR Science Lab (`SARLab.tsx`)

### 3.1 Chapter 1: The Sensor Selection (SAR vs Optical)
*   **Role:** To mathematically prove why optical satellites (Sentinel-2) are useless during monsoons, and why SAR (NISAR) is the only solution.
*   **Work:** A dual-pane visualizer with an interactive "Cloud Density" slider. As the user drags the slider, volumetric fractal SVG clouds generate over the images. The Optical feed becomes completely obscured (blind), while the SAR feed remains 100% crisp, demonstrating radar's microwave penetration capabilities.

### 3.2 Chapter 2: Radar Acquisition Geometry
*   **Role:** To teach the user about the inherent geometric distortions of side-looking radar.
*   **Work:** An interactive orbital physics engine. The user drags a satellite across an SVG sky using a Look Angle Slider (20° to 60°). Real-time trigonometry calculates the incidence angle, projects the radar beam onto a simulated topographic riverbank, and dynamically highlights regions of *Layover* and *Radar Shadow*.

### 3.3 Chapter 3: Speckle Suppression Engine
*   **Role:** To explain that raw Single Look Complex (SLC) radar is inherently noisy, and to demonstrate how we clean it without destroying the riverbank edges.
*   **Work:** Loads a raw radar asset and injects mathematical Multiplicative Gamma Noise. Provides a draggable "Magic Lens" split-screen divider. As the user drags the lens, a WebGL-accelerated Adaptive Lee-Sigma spatial filter runs in real-time over a 240,000-pixel grid, mathematically smoothing the water while preserving the high-frequency edges of the land.

### 3.4 Chapter 4: Advanced Polarimetry (H/α Engine)
*   **Role:** To demonstrate how quad-polarization is used to physically classify terrain (Water vs Forest vs Urban).
*   **Work:** Features a Live Polarimetric Targeting Reticle over a 400x400 map. As the user moves their mouse, the reticle reads the exact 400 pixels inside the crosshair. It calculates the localized Entropy (H) and Alpha (α) phase angles to determine the scattering mechanism. It then renders a Gaussian dispersion density cluster onto the 9 zones of the Cloude-Pottier Phase Space Plot in real-time. It also explains Pauli RGB Decomposition (Red: HH-VV Double Bounce, Green: HV+VH Volume, Blue: HH+VV Surface).

### 3.5 Final Sandbox: Morphological Diff Scanner
*   **Role:** The grand finale combining all techniques into the final erosion calculation.
*   **Work:** A swipeable canvas comparing t0 and t1 radar images. Features a Live Otsu Threshold Slider (-25dB to -5dB) that instantly classifies the image into a binary Water/Land mask. It includes an automated sweeping neon-red scanning line that intersects the two time periods, highlights the exact eroded pixels in bright red, and updates a live "Hectares Lost" telemetry counter.

---

## 4. The Impact Dashboard (`Impact.tsx`)

### 4.1 Geographic Reach Selector & Core HUD
*   **Role:** The operational command center abstracting the physics into actionable disaster response data.
*   **Work:** A top navigation bar allowing instant context switching between river reaches (e.g., Jamuna-Chilmari). Below it, four massive KPI cards dynamically update: Homes Threatened, Agricultural Loss, Economic Exposure, and River Stage.

### 4.2 Central Spatial Intelligence Map
*   **Role:** To provide spatial awareness of the disaster zone.
*   **Work:** Renders a geographic basemap with multi-layer GeoJSON vector overlays. It highlights Active Erosion Polygons in stark red and Accretion Sandbars in yellow. It includes a sidebar listing exact geographic zones, their calculated area in hectares, and their probability of collapse.

### 4.3 UNDRR Sendai Framework Indicators (2015-2030)
*   **Role:** To align the project's outputs with global United Nations disaster risk reduction standards.
*   **Work:** Explicitly tracks and renders progress bars for Target B-3 (Dwellings damaged), Target B-4 (Livelihoods disrupted), Target C-2 (Agricultural loss), and Target C-4 (Housing sector loss).

### 4.4 World Bank DaLA Economic Ledger
*   **Role:** To translate pixel loss into exact financial damage using the World Bank's Damage and Loss Assessment methodology.
*   **Work:** Calculates the exact replacement costs for Direct Physical Damage (Rural Homesteads, Agriculture, Flood Control, Tubewells) and Economic Flow Losses (Lost Harvests, Lost Wage Labor, Emergency Relocation). It plots a Temporal Decay Chart showing physical vs flow loss decay trajectories.

### 4.5 Emergency Alert System & Data Provenance
*   **Role:** To allow operators to instantly dispatch information, and to prove the scientific validity of that information.
*   **Work:** Features a Community Action Matrix triaging zones (P1 EVACUATE, P2 PREPOSIT, P3 MONITOR). It includes an Emergency Alert Generator button that programmatically compiles all current metrics into a formal, copyable text briefing. The Data Provenance Footer renders the exact NISAR Granule IDs, Otsu dB thresholds, and Pipeline QC Flags used to generate the dashboard.

---

## 5. Landing Page (`Landing.tsx`)

### 5.1 Dynamic Hero & Navigation
*   **Role:** To instantly hook the user with a professional, elegant NASA-grade aesthetic.
*   **Work:** Utilizes `elegant-bg`, `grid-mesh`, and `radar-light` CSS classes to create a dark, glowing aesthetic. 

### 5.2 Processing Pipeline Node Graph
*   **Role:** To visualize the system architecture.
*   **Work:** A horizontal node graph detailing the flow from Raw Satellite Data -> Processing -> ML Analytics -> Actionable Insights.

### 5.3 Evidence Trail Matrix
*   **Role:** To explain the rigorous burden of proof required by the system.
*   **Work:** A step-by-step matrix explaining how the system verifies data before declaring land as 'eroded'.

### 5.4 Data Source Validation Grid
*   **Role:** To prove the project uses real, valid NASA data.
*   **Work:** A card grid listing all external datasets (e.g. OPERA RTC, Sentinel-1) with clickable DOIs validating their provenance.
