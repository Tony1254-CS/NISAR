# FluviSAR: Complete Project Documentation

**Target Challenge:** NASA Space Apps 2026 — *Dancing with the SARs*
**Mission:** Utilizing L-band Synthetic Aperture Radar (SAR) from the NASA-ISRO (NISAR) mission to predict, monitor, and mitigate catastrophic riverbank erosion during monsoon seasons when optical satellites are blinded by cloud cover.

This document serves as the comprehensive architectural and functional breakdown of the "FluviSAR" platform. It details every page, feature, and interactive component, explaining *what* it is, *what its purpose* is, and *how it functions*.

---

## 1. The Impact Dashboard (`Impact.tsx`)

**Purpose:** The operational command center designed for disaster response coordinators, local governments, and NGOs. It abstracts the complex SAR physics into actionable, immediate insights.

### Features
*   **Interactive Spatial Map:** A central geographic visualization tool that plots the active river reaches (e.g., Jamuna-Chilmari). It highlights active erosion zones in high-contrast colors.
*   **Critical Infrastructure Overlay:** Cross-references the SAR erosion data with local infrastructure maps to identify schools, hospitals, and bridges that are in immediate danger of collapsing into the river.
*   **Real-Time Metrics Panel:** Displays quantitative data such as "Total Hectares Lost", "Vulnerable Population Count", and "Erosion Velocity (meters/day)".
*   **Emergency Alert Generator (Actionable Output):** A system that compiles the current SAR metrics, the Machine Learning predictions, and the Quality Control (QC) confidence into a formalized, ready-to-dispatch emergency briefing.
*   **Data Provenance Footer:** Ensures scientific transparency by displaying the exact NISAR granule IDs, processing dates, and Otsu thresholds used to generate the current dashboard view.

---

## 2. ML Intelligence Center (`Intelligence.tsx`)

**Purpose:** The "brain" of the platform. This section demystifies the predictive models that forecast where the river will erode next, proving to the judges that the project utilizes advanced spatiotemporal Machine Learning, not just historical mapping.

### Features
*   **Spatiotemporal Forecasting View:** Visualizes the predicted path of the river over the next 14 to 30 days based on historical flow dynamics and recent bank collapses.
*   **Confidence Threshold Simulator:** An interactive slider allowing users to adjust the ML confidence threshold (e.g., 0.50 to 0.95). 
    *   *Function:* As the slider moves, it dynamically updates the confusion matrix (Precision vs. Recall). It demonstrates the operational trade-off between raising false alarms (low threshold) and missing an actual disaster (high threshold).
*   **Animated Telemetry Feed:** A live, streaming log interface that simulates the backend processing pipeline. It prints the neural network epochs, loss convergence, and data ingestion steps to visualize the backend's continuous operation.

---

## 3. Interactive SAR Science Lab (`SARLab.tsx`)

**Purpose:** A masterclass pedagogical module. This page is designed to convince scientists and judges of the project's rigorous foundation in remote sensing physics. It is structured sequentially like a textbook to teach users how raw satellite data becomes the actionable insights seen on the Dashboard.

### Features (Sequenced Chapters)

*   **Chapter 1: The Sensor Selection (SAR vs Optical)**
    *   *What it is:* A dual-pane simulator comparing optical satellite data (like Landsat/Sentinel-2) with NISAR's L-band SAR.
    *   *Function:* Features an interactive "Monsoon Cloud Density" slider. As the user increases cloud cover, the optical panel becomes completely obscured, while the SAR panel continues to render perfectly.
    *   *Purpose:* Visually proves *why* radar is the only viable technology for this problem.

*   **Chapter 2: Radar Acquisition Geometry**
    *   *What it is:* A dynamic, trigonometric physics engine.
    *   *Function:* The user drags an "Incidence Angle" slider which physically orbits a satellite across the screen. Real-time math calculates and renders the exact boundaries of radar Layover, Foreshortening, and Shadow against a simulated riverbank terrain.
    *   *Purpose:* Demonstrates a deep understanding of how side-looking radar actually captures imagery and the geometric distortions involved.

*   **Chapter 3: Speckle Suppression Engine**
    *   *What it is:* A high-performance WebGL/Canvas tool operating on real project data.
    *   *Function:* Injects mathematically accurate Multiplicative Gamma Noise to simulate raw Single Look Complex (SLC) data. A "Magic Lens" sweeper allows the user to drag across the image, revealing the output of an Adaptive Lee-Sigma filter operating over 240,000 pixels in real-time.
    *   *Purpose:* Explains that SAR data is inherently noisy (speckle) and proves we use advanced spatial filtering to preserve critical riverbank edges.

*   **Chapter 4: Advanced Polarimetry (Pauli RGB & H/α Scatter)**
    *   *What it is:* A real-time Quad-Pol scattering telemetry tool.
    *   *Function:* Features a professional targeting reticle. When the user hovers over the radar map, it extracts the pixels and mathematically decomposes them into the Cloude-Pottier phase space. It instantly plots a Gaussian dispersion cluster into the correct zones (Z5 Volume, Z7 Double-Bounce, Z9 Surface).
    *   *Purpose:* Explains how we distinguish between flat water, dense forest, and collapsed, chaotic riverbanks using polarization.

*   **Chapter 5: The Processing Pipeline**
    *   *What it is:* A linear, step-by-step UI component.
    *   *Function:* Breaks down the backend algorithm: Raw Backscatter → Histogram Analysis → Binary Masking → Morphological Operations.
    *   *Purpose:* Provides clear architectural documentation of the code.

*   **Final: Live Interactive Sandbox**
    *   *What it is:* A three-pane interactive workbench.
    *   *Function:* 
        1. **Raw Compare:** A swipeable comparison between $t_0$ and $t_1$ raw backscatter.
        2. **Live Otsu Threshold:** An interactive slider that classifies millions of pixels into Water/Land in real-time based on backscatter intensity.
        3. **Morphological Diff Engine:** A scanning beam that intersects the two time periods, highlighting exactly which pixels were lost to erosion and updating a live "Hectares Lost" counter.

---

## 4. Investigations (`Cases.tsx`)

**Purpose:** To ground the technology in real-world human impact.
### Features
*   **Geographic Case Studies:** Profiles of specific vulnerable communities along major river systems (e.g., the Jamuna River in Bangladesh or the Brahmaputra).
*   **Historical Validation:** Shows past satellite imagery where the river eroded towns, proving that if this platform existed then, it could have provided early warnings.

---

## 5. Methodology & Reporting (`Methods.tsx` & `Report.tsx`)

**Purpose:** The scientific bibliography and formal submission documents.
### Features
*   **Open Source Architecture:** Details the tech stack (React, Vite, Python, QGIS/GDAL for backend processing).
*   **Literature Review:** Cites the exact NASA JPL and ESA research papers used to formulate the SAR processing algorithms (like Otsu thresholding and Lee filtering).
*   **Project Generation:** The formal presentation format expected by Space Apps judges, summarizing the hackathon weekend's engineering feats.

---

## Conclusion
"FluviSAR" is not just a dashboard; it is a full-stack scientific platform. It bridges the gap between raw, highly complex orbital physics (handled in the SAR Lab & ML Intelligence center) and life-saving, actionable humanitarian data (delivered via the Impact Dashboard). Every feature has been engineered to be interactive, deterministic, and mathematically sound, ensuring it stands up to rigorous scientific scrutiny.
