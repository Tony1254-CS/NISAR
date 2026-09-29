# FluviSAR: Complete Project Documentation

**Target Challenge:** NASA Space Apps 2026 — *Dancing with the SARs*

FluviSAR is a comprehensive, cloud-native Intelligence Platform that leverages NISAR L-band Synthetic Aperture Radar (SAR) to quantify, predict, and monitor catastrophic riverbank erosion. This document serves as the absolute, exhaustive architectural and functional breakdown of every single component, slider, button, metric, and module within the platform.

---

## 1. The Interactive SAR Science Lab (`SARLab.tsx`)
This is the pedagogical core of the project. It is structured as a sequential textbook to teach users how raw SAR physics translates into actionable humanitarian data.

### Hero & Introduction
*   **Dynamic Hero Header:** Features a glowing "Interactive SAR Science Lab" badge.
*   **NISAR Mission Parameters Matrix:** A detailed statistical grid displaying the exact physical specs of the NISAR satellite:
    *   **Launch Date:** Early 2025
    *   **Orbit Altitude:** 747 km (Sun-synchronous)
    *   **Temporal Resolution:** 12-day exact repeat cycle
    *   **Spatial Swath:** 240 km SweepSAR technique
    *   **Payload:** Dual L-band (NASA) and S-band (ISRO) radars.
*   **Frequency Band Simulator:** Interactive tabs allowing the user to switch between L-band, S-band, C-band, and X-band. 
    *   *Interaction:* Clicking a tab dynamically updates the displayed wavelength, spatial resolution, and penetration depth characteristics for that specific microwave frequency.
*   **C-Band vs L-Band Comparative Analysis:** A side-by-side technical breakdown explaining why legacy Sentinel-1 (C-band at 5.6 cm) fails in dense vegetation due to rapid decorrelation, and why NISAR (L-band at 23.8 cm) succeeds in penetrating the forest canopy to hit the true riverbank ground.

### Chapter 1: The Sensor Selection (SAR vs Optical)
*   **Interactive Cloud Simulator:** A dual-pane visualizer comparing Sentinel-2 (Optical) and NISAR (Radar) satellite feeds.
*   **Cloud Density Slider (0% to 100%):** 
    *   *Interaction:* As the user drags the slider from left to right, volumetric fractal SVG clouds dynamically generate over the images. 
    *   *Effect:* The Optical feed becomes progressively obscured until it is completely blind and useless, while the SAR feed remains 100% crisp and visible. This mathematically proves the necessity of radar during heavy monsoon seasons when river erosion is most active.

### Chapter 2: Radar Acquisition Geometry
*   **Orbital Physics Engine:** An interactive SVG canvas demonstrating side-looking radar geometry against a simulated topographic riverbank profile.
*   **Look Angle Slider (20° to 60°):** 
    *   *Interaction:* The user drags a satellite graphic in an arc across the sky. Real-time trigonometry calculates the incidence angle and projects the radar beam onto the simulated terrain below.
    *   *Geometric Distortion Highlights:* As the angle changes, the UI dynamically computes, highlights, and labels regions of *Layover* (where the top of the bank reflects the signal before the bottom) and *Radar Shadow* (blind spots directly behind the steep riverbank).

### Chapter 3: Speckle Suppression Engine
*   **Multiplicative Noise Generator:** Loads a raw radar asset and injects true mathematical Gamma noise to simulate raw Single Look Complex (SLC) speckle, making the image highly grainy.
*   **Interactive Magic Lens Sweeper:** 
    *   *Interaction:* A draggable vertical split-screen divider. On the left is the raw, noisy data. 
    *   *Effect:* As the user drags the lens to the right, a WebGL-accelerated Adaptive Lee-Sigma filter runs in real-time over a 240,000-pixel grid. It mathematically smooths the homogeneous flat water areas while explicitly preserving the sharp, high-frequency edges of the active riverbank.

### Chapter 4: Advanced Polarimetry
*   **Pauli RGB Decomposition Viewer:** Explains quad-pol (HH, HV, VH, VV) synthesis. Visualizes the exact RGB mapping:
    *   **Red Channel:** HH-VV (Dihedral Double Bounce - urban structures and steep eroded banks)
    *   **Green Channel:** HV+VH (Volume Scattering - dense forest canopy)
    *   **Blue Channel:** HH+VV (Bragg Surface Scattering - flat water and bare soil)
*   **Live Polarimetric Targeting Reticle (H/α Engine):** 
    *   *Map Pane:* A 400x400 operational map with a 20x20 pixel targeting crosshair that follows the user's mouse cursor in real-time.
    *   *Telemetry HUD:* Instantly reads the 400 pixels inside the crosshair bounding box. Calculates the localized Entropy (H) and Alpha (α) phase angles, outputting the exact dominant scattering mechanism (e.g., "Bragg Surface Scattering" or "Dihedral Double-Bounce"). It also outputs real-time simulated Latitude/Longitude targeting coordinates.
    *   *Cloude-Pottier Phase Space Plot:* Automatically plots a real-time Gaussian dispersion density scatter plot into the 9 specific physical zones of the Cloude-Pottier plane based on the exact pixels the user is currently targeting.

### Chapter 5: The Processing Pipeline
*   **4-Step Algorithm Walkthrough:** A clickable, interactive horizontal timeline breaking down the exact backend architecture: 
    1. **Raw Backscatter Ingestion:** Loading RTC (Radiometrically Terrain Corrected) data.
    2. **Dynamic Thresholding:** Applying statistical histograms.
    3. **Binary Mask Generation:** Converting intensities to 1s (water) and 0s (land).
    4. **Morphological Change Detection:** Running logical AND/XOR operations across t0 and t1 masks.

### Final: Live Interactive Sandbox
*   **Raw Data Swipe (t0 vs t1):** A swipeable canvas comparing the river exactly one year apart, showing the raw visual shift in backscatter intensity.
*   **Live Otsu Threshold Slider:** A bimodal histogram simulator.
    *   *Interaction:* A slider ranging from -25dB to -5dB. The user drags the threshold line between the Water peak (~ -18dB) and the Land peak (~ -10dB). 
    *   *Effect:* As the slider moves, the satellite image instantly classifies into a binary Water/Land mask in real-time.
*   **Morphological Diff Scanner:** An automated, sweeping neon-red scanning line that intersects the two time periods. It highlights the exact pixels of land that fell into the river (active erosion) in bright red, and updates a live "Hectares Lost" telemetry counter as the beam sweeps across the screen.

---

## 2. The Impact Dashboard (`Impact.tsx`)
The operational command center for disaster response coordinators.

### Geographic Reach Selector & Core HUD
*   **Horizontal Navigation Bar:** Allows the user to instantly swap the entire dashboard's context between multiple critical river reaches (e.g., Jamuna-Chilmari vs Brahmaputra-Dhubri).
*   **KPI Metric Cards:** Four massive readout cards that update dynamically:
    1. **Homes Threatened:** Raw civilian housing count in the danger zone.
    2. **Agricultural Loss (Target C-2):** Hectares of farmland destroyed.
    3. **Economic Exposure (Target C-3):** Dollar value estimation of at-risk infrastructure.
    4. **River Stage:** Live water height vs the local danger level.

### Central Spatial Intelligence Map
*   **Multi-Layer GeoJSON Visualizer:** Renders the geographic basemap with overlaid vector polygon data.
*   **Active Erosion Polygons:** Highlights regions where land converted to water in stark, high-contrast red.
*   **Accretion Polygons:** Highlights regions where water converted to land (sandbars/chars) in yellow.
*   **Erosion Risk Zones (NISAR Detected) Panel:** A sidebar listing specific geographic zones with their exact calculated area (in hectares), probability of collapse (0-100%), and a visual risk-bar indicator.

### UNDRR Sendai Framework Indicators (2015-2030)
*   **Target B (Affected Population):**
    *   **B-3:** Dwellings damaged/destroyed counter and severity progress bar.
    *   **B-4:** Livelihoods disrupted counter and severity progress bar.
*   **Target C (Direct Economic Loss):**
    *   **C-2:** Agricultural loss (ha).
    *   **C-4:** Housing sector monetary loss ($M USD).

### World Bank DaLA (Damage and Loss Assessment) Economic Ledger
*   **Direct Physical Damage (Replacement Cost):** Itemized breakdown calculating the precise dollar value loss of:
    *   Rural Homesteads (Kacha/Semi-pucca)
    *   Agricultural Land Value
    *   Flood Control Infrastructure
    *   Drinking Water Tubewells
*   **Economic Flow Losses (Foregone Revenue):**
    *   Lost Aman/Boro Harvest cycles
    *   Lost Wage Labor Days
    *   Emergency Relocation Costs
*   **Temporal Economic Decay Trajectory:** A highly detailed line chart plotting Physical Infrastructure Loss vs Economic Flow Cascading Loss over time.

### Emergency Response & Data Provenance
*   **Community Action Matrix:** A prioritized triage list assigning "P1 EVACUATE", "P2 PREPOSIT.", or "P3 MONITOR" statuses to different sub-regions based on the SAR data.
*   **Emergency Alert Generator:** A prominent red action button. When clicked, it opens a modal that programmatically compiles all current metrics, coordinates, and QC confidence levels into a formal, copyable text briefing designed to be instantly dispatched to local NGOs or FEMA equivalents.
*   **Scientific Provenance & Audit Trail Footer:** A rigorous footer proving the dashboard's data isn't faked. It displays:
    *   NISAR t0 Granule ID (Pre)
    *   NISAR t1 Granule ID (Post)
    *   The specific Otsu dB Thresholds used
    *   Pipeline QC Flags (e.g., "Radiometric Calibration Valid")
    *   Resolution / MMU (Minimum Mapping Unit)

---

## 3. ML Intelligence Center (`Intelligence.tsx`)
Exposes the backend neural network architecture and time-series analytics used to predict future erosion.

### Deep Learning Telemetry & Visualization
*   **Time Series Backscatter Graph:** Plots HH vs HV polarization backscatter intensity (dB) over an extended time series, demonstrating the seasonal signal drop caused by monsoon inundation.
*   **ML Training Epochs Graph:** A dual-axis line chart plotting neural network Loss function convergence vs Intersection over Union (IoU) accuracy across 50 training epochs.
*   **Animated Backend Telemetry Feed:** A constantly scrolling terminal UI that simulates the active ML training loop, printing batch processing IDs, tensor allocations, and ingestion metrics to prove the system's continuous computational operation.

### Interactive Confidence Matrix
*   **ML Confidence Threshold Slider (0.50 to 0.95):** The user actively controls the strictness of the neural network's classification algorithm.
*   **Dynamic Confusion Matrix Grid:** As the slider moves, it mathematically recalculates and visualizes a 3x3 matrix for three classes (Water, Land, Changed). It displays the exact counts for:
    *   True Positives (TP)
    *   False Positives (FP)
    *   False Negatives (FN)
    *   True Negatives (TN)
*   **Precision/Recall Readout:** Calculates the exact F1 Score, Precision %, and Recall % for each class in real-time. This visually demonstrates the real-world operational trade-off: setting the threshold too low causes false evacuations, setting it too high misses real riverbank collapses.

---

## 4. Investigations (`Cases.tsx`)
Grounds the technology in real-world human impact.
*   **Humanitarian Case Studies:** Deep-dive profiles of the human cost of riverbank erosion, specifically targeting vulnerable communities along the Jamuna and Brahmaputra rivers.
*   **Historical Validation Engine:** Showcases past satellite imagery to prove the predictive model's historical accuracy against documented disaster events.

---

## 5. Methodology (`Methods.tsx`)
The scientific bibliography ensuring the platform's academic validity.
*   **Scientific Architecture:** Documents the exact open-source stack (React, Vite, Python, GDAL).
*   **Literature Review:** Explicitly lists and links the NASA JPL and ESA (Sentinel-1) documentation utilized to build the processing algorithms, guaranteeing the project is rooted in peer-reviewed science and physics.


## 6. Landing Page (Landing.tsx)
* **Interactive Pipeline Node UI**: Visualizes the flow from Raw Data to Actionable Insights.
* **Evidence Trail Matrix**: Explains the exact burden of proof required to declare land as 'eroded'.
* **Data Source DOIs**: A card grid listing all external NASA datasets (e.g. OPERA RTC) with clickable DOIs.
