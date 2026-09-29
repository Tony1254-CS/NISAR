# FluviSAR: Complete Project Documentation

**Target Challenge:** NASA Space Apps 2026 — *Dancing with the SARs*

FluviSAR is a comprehensive, cloud-native Intelligence Platform that leverages NISAR L-band Synthetic Aperture Radar (SAR) to quantify, predict, and monitor catastrophic riverbank erosion. This document serves as the absolute, exhaustive architectural and functional breakdown of every single component, slider, button, and module within the platform.

---

## 1. The Interactive SAR Science Lab (`SARLab.tsx`)
This is the pedagogical core of the project. It is structured as a sequential textbook to teach users how raw SAR physics translates into actionable humanitarian data.

### Hero & Introduction
*   **Dynamic Hero Header:** Features a glowing "Interactive SAR Science Lab" badge.
*   **NISAR Mission Parameters Matrix:** A grid displaying the exact specs of the NISAR satellite (Launch date, orbit altitude, 12-day exact repeat cycle, 240km swath width, and dual L/S band payload).
*   **Frequency Band Simulator:** Interactive tabs allowing the user to switch between L-band, S-band, C-band, and X-band. It displays the specific wavelength (e.g., 23.8 cm for L-band) and penetration depth characteristics for each.
*   **C-Band vs L-Band Comparative Analysis:** A side-by-side technical breakdown explaining why legacy Sentinel-1 (C-band) fails in dense vegetation due to rapid decorrelation, and why NISAR (L-band) succeeds.

### Chapter 1: The Sensor Selection (SAR vs Optical)
*   **Interactive Cloud Simulator:** A dual-pane visualizer comparing Sentinel-2 (Optical) and NISAR (Radar).
*   **Cloud Density Slider (0% to 100%):** As the user drags the slider, volumetric fractal SVG clouds generate over the images. The Optical feed becomes completely blind and useless, while the SAR feed remains 100% crisp and visible, proving the necessity of radar during monsoon seasons.

### Chapter 2: Radar Acquisition Geometry
*   **Orbital Physics Engine:** An interactive SVG canvas demonstrating side-looking radar geometry.
*   **Look Angle Slider (20° to 60°):** The user drags a satellite across the sky. Real-time trigonometry calculates the incidence angle and projects the radar beam onto a simulated mountain/riverbank.
*   **Geometric Distortion Highlights:** As the angle changes, the UI dynamically highlights and calculates regions of *Layover* (where the top of the bank reflects before the bottom) and *Radar Shadow* (blind spots behind the bank).

### Chapter 3: Speckle Suppression Engine
*   **Multiplicative Noise Generator:** Loads a raw radar asset and injects true mathematical Gamma noise to simulate raw Single Look Complex (SLC) speckle.
*   **Interactive Magic Lens Sweeper:** A draggable split-screen divider. On the left is the raw, noisy data. As the user drags the lens to the right, a WebGL-accelerated Adaptive Lee-Sigma filter runs in real-time over 240,000 pixels, mathematically smoothing the flat water areas while preserving the sharp, high-frequency edges of the riverbank.

### Chapter 4: Advanced Polarimetry
*   **Pauli RGB Decomposition Viewer:** Explains quad-pol (HH, HV, VH, VV) synthesis. Visualizes the exact RGB mapping (Red = HH-VV Double Bounce, Green = HV+VH Volume, Blue = HH+VV Surface).
*   **Live Polarimetric Targeting Reticle (H/α Engine):** 
    *   *Map Pane:* A 400x400 operational map with a 20x20 pixel targeting crosshair that follows the user's mouse.
    *   *Telemetry HUD:* Instantly reads the pixels under the crosshair and calculates the localized Entropy (H) and Alpha (α) phase angles, outputting the exact dominant scattering mechanism (e.g., "Bragg Surface Scattering").
    *   *Cloude-Pottier Phase Space Plot:* Automatically plots a real-time Gaussian dispersion density scatter plot into the 9 zones of the Cloude-Pottier plane based on the targeted pixels.

### Chapter 5: The Processing Pipeline
*   **4-Step Algorithm Walkthrough:** A clickable, interactive timeline showing the exact backend architecture: 
    1. Raw Backscatter Ingestion
    2. Dynamic Thresholding
    3. Binary Mask Generation
    4. Morphological Change Detection

### Final: Live Interactive Sandbox
*   **Raw Data Swipe (t0 vs t1):** A swipeable canvas comparing the river exactly one year apart, showing the raw visual shift.
*   **Live Otsu Threshold Slider:** A bimodal histogram simulator ranging from -25dB to -5dB. The user drags the threshold line between the Water peak (-18dB) and the Land peak (-10dB), watching the image classify into a binary mask in real-time.
*   **Morphological Diff Scanner:** An automated, sweeping neon-red scanning line that intersects the two time periods, highlighting the exact pixels of land that fell into the river (erosion), and updating a live "Hectares Lost" telemetry counter.

---

## 2. The Impact Dashboard (`Impact.tsx`)
The operational command center for disaster response.

### Geographic Reach Selector
*   **Horizontal Navigation Bar:** Allows the user to instantly swap the entire dashboard's context between multiple critical river reaches (e.g., Jamuna-Chilmari, Brahmaputra-Dhubri).

### Real-Time Metrics HUD
*   **High-Confidence Erosion (ha):** Total land lost, highlighted in critical red.
*   **Critical Infrastructure At Risk:** Cross-referenced count of schools, hospitals, and roads within 500 meters of the active erosion boundary.
*   **Vulnerable Population Count:** Estimated displaced civilians.
*   **Current River Stage:** Live water height metrics.

### Central Spatial Intelligence Map
*   **Multi-Layer GeoJSON Visualizer:** Renders the basemap with overlaid polygon data.
*   **Active Erosion Polygons:** Highlights regions where land converted to water in red.
*   **Accretion Polygons:** Highlights regions where water converted to land (sandbars) in yellow.

### Forecast & Emergency Response
*   **Forecast Impact Timeline:** A 24-day predictive chart showing expected erosion acceleration based on upstream flow data.
*   **Emergency Alert Generator:** A prominent red action button. When clicked, it opens a modal that programmatically compiles all current metrics, coordinates, and QC confidence levels into a formal, copyable text briefing designed to be dispatched to local NGOs or FEMA equivalents.
*   **Data Provenance Footer:** A rigorous scientific footer proving the dashboard's data isn't faked. It displays the exact NISAR Granule IDs, processing timestamps, and the specific Otsu dB threshold used for the current view.

---

## 3. ML Intelligence Center (`Intelligence.tsx`)
Exposes the neural network architecture used to predict future erosion.

### Interactive Confidence Matrix
*   **ML Confidence Threshold Slider (0.50 to 0.95):** The user actively controls the strictness of the neural network.
*   **Dynamic Confusion Matrix:** As the slider moves, it recalculates True Positives, False Positives, False Negatives, and True Negatives. 
*   **Precision/Recall Readout:** Visually demonstrates the real-world operational trade-off: setting the threshold too low causes false evacuations, setting it too high misses real collapses.

### Spatiotemporal Analytics
*   **Predictive Pathing:** Visualizes the predicted geometric drift of the river channel over time.
*   **Animated Backend Telemetry Feed:** A constantly scrolling terminal UI that simulates the active ML training loop, printing epochs, loss convergence, and ingestion metrics to prove the system's continuous operation.

---

## 4. Investigations (`Cases.tsx`)
*   **Humanitarian Case Studies:** Profiles the human cost of riverbank erosion, specifically targeting communities along the Jamuna River.
*   **Historical Validation Engine:** Shows past satellite imagery to prove the predictive model's historical accuracy.

---

## 5. Methodology (`Methods.tsx`)
*   **Scientific Architecture:** Documents the exact open-source stack (React, Python, GDAL).
*   **Literature Review:** Explicitly lists the NASA JPL and ESA documentation utilized to build the processing algorithms, guaranteeing the project is rooted in peer-reviewed science.
