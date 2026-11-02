# Project Contributors & Architectural Attribution

## FluviSAR: "Same River Twice" — NASA Space Apps Challenge 2026
**Challenge Track:** *Dancing with the SARs: Tracking Earth’s Changing Surface with Radar Remote Sensing*  
**Repository:** [https://github.com/Tony1254-CS/nasa-2026-web](https://github.com/Tony1254-CS/nasa-2026-web)

---

## 🚀 Mission Leadership & Core Engineering

### Sabbir Ahmed ([@Tony1254-CS](https://github.com/Tony1254-CS))
**Role:** **Mission Commander & Principal Systems Architect**  
**GitHub Profile:** [https://github.com/Tony1254-CS](https://github.com/Tony1254-CS)  
**Commit Signature:** `Sabbir Ahmed <195802211+Tony1254-CS@users.noreply.github.com>`  

#### Key Technical Contributions & Systems Built:
1. **NISAR Radar Remote Sensing Engine (SAR Lab):**
   * **SweepSAR & Digital Beamforming (DBF) Simulation:** Mathematical modeling and real-time visualization of NISAR's 240 km wide-swath phased-array antenna, comparing single-beam stripmap SAR against multi-channel digital receive beamforming.
   * **Dielectric Constant ($\varepsilon$) & Backscatter Physics Simulator:** Implementation of Fresnel reflection coefficient formulations ($|R_{HH}|^2$, $|R_{VV}|^2$), roughness dispersion models ($k \cdot s$), and incidence angle curve projections across 8 terrestrial materials.
   * **Dual-Frequency L+S Band Penetration Engine:** Canopy attenuation modeling simulating L-band ($\lambda = 23.8\text{ cm}$) and S-band ($\lambda = 9.3\text{ cm}$) electromagnetic penetration through canopy, trunk double-bounce, and volumetric soil moisture layers.
   * **InSAR Deformation Synthesizer:** Phase generation algorithm $\phi(x,y) = \frac{4\pi}{\lambda} d(x,y)$ with interactive Gaussian displacement epicenter modeling and interferometric fringe calculation.
   * **Dynamic Otsu Thresholding & Classification:** Bimodal histogram segmentation separating specular water ($\sim -18\text{ dB}$) from rough terrestrial land ($\sim -10\text{ dB}$) with interactive real-time pixel masking.
   * **Adaptive Speckle Suppression (Lee-Sigma):** Multiplicative gamma noise injection and local window variance filtering preserving fine fluvial boundaries.

2. **Full-Stack Application Architecture:**
   * High-performance React 18 + TypeScript + Vite architecture with MapLibre GL georeferenced raster/vector layers.
   * Sub-pixel alignment pipeline integrating OPERA DSWx-S1, ASF DAAC L-band backscatter, and GPM IMERG precipitation data.
   * Zustand reactive state store orchestrating multi-temporal reach comparisons (`jamuna-chilmari`).

3. **Disaster Impact & Economic Modeling:**
   * Sendai Framework for Disaster Risk Reduction and UN DaLA (Damage and Loss Assessment) methodology integration.
   * Probabilistic land loss projection algorithms and automated community displacement analytics.

---

## 👥 Engineering & Research Team

### Sakibul Hassan Shovon
* **Role:** AI Engineer — Interactive Visualization & UX Collaborator
* **GitHub / Email:** `sakibulhassan.shovon@gmail.com`
* **Contributions:** Visual design tokens, flip-card UX components, sensory mode styling, and frontend UI refactoring.

### Sanjid Talukder
* **Role:** Data Scientist — SAR Processing & Remote Sensing
* **Contributions:** SAR granule selection, reach metadata curation, and satellite ephemeris verification.

### Yasin Arafat
* **Role:** Hydro Analyst — River Dynamics & Quality Assurance
* **Contributions:** River stage gauge validation, hydrology cross-checking, and morphological plausibility review.

---

## 📜 Historical Commit Attribution Note
Due to an environment configuration during rapid hackathon development sprints, commits pushed from the primary workstation (`Tony1254-CS`) inherited the local Git user configuration of team collaborator Shovon. 

Official mapping is formalized via the project's [`.mailmap`](.mailmap) file, mapping all 144 repository commits to:
```
Sabbir Ahmed <195802211+Tony1254-CS@users.noreply.github.com>
```
All repository management, GitHub deployments, releases, and architectural implementations are directed under GitHub user **`Tony1254-CS`**.
