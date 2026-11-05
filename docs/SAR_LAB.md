# SAR Lab: simulations and interactive visualizations

The SAR Lab is a set of interactive explainers for radar physics, mission concepts, and the project’s processing workflow. It is an educational interface, not a second analysis pipeline. Controls update the visualization or the stated teaching model; they do not rerun the Jamuna classification unless a panel explicitly says it reads a project product.

## How to read the lab

The panels use three kinds of inputs:

- **Project products:** Jamuna radar quicklooks, change masks, and manifest metrics produced by the project. Quicklooks are display images and do not carry the full calibrated data needed to reproduce analysis.
- **Synthetic teaching inputs:** Generated scenes, toy values, and idealized equations used to demonstrate a concept. They are not measurements or calibrated NISAR outputs.
- **Conceptual schematics:** Drawings that explain geometry or instrument operation. Their beam counts, sizes, positions, and animations are not engineering drawings or to-scale measurements.

Treat each result according to the label shown in its panel. In particular, a visual resemblance to a SAR image does not make a synthetic panel an observation, and a mapped land-to-water change is not automatically confirmed erosion.

## Mission and radar context

The mission overview identifies NISAR as a NASA–ISRO L- and S-band SAR mission. The lab presents representative L-band wavelength near 24 cm and an L-band wide-swath concept near 242 km. These are mission context, not a promise that every mode or acquisition has the same resolution, polarization, or coverage. NISAR launched on **July 30, 2025** ([NASA mission overview](https://science.nasa.gov/mission/nisar/mission-overview/)).

The band selector compares wavelength and qualitative target interactions. Canopy interaction is not a fixed penetration depth: moisture, structure, incidence angle, polarization, and acquisition mode matter. The polarization cards introduce HH, HV, VV, and VH notation and common scattering interpretations; they do not claim the Jamuna inputs contain all four channels. The mission panel and frequency selector are reference explainers, rather than numerical simulations of a particular NISAR acquisition.

## Interactive panels

### 1. SAR and optical in cloudy conditions

**Controls:** Cloud-density slider (0–100%).  
**What changes:** A procedural cloud texture obscures an illustrative optical scene. A separate panel displays a Jamuna radar quicklook with an animated sweep overlay.  
**What it teaches:** Visible and near-infrared observations can be obscured by cloud, while microwave SAR is generally much less affected by ordinary clouds and works without sunlight.  
**Limits:** The cloud slider is a visual analogy, not a cloud radiative-transfer model, optical availability forecast, or measured SAR response. The radar sweep overlay is decoration; it is not a scan of the displayed image.

### 2. Flood signal mechanism simulator

**Controls:** Select open floodplain, crops/emergent plants, or woody vegetation; toggle standing water; adjust wind for the open-water case.  
**What changes:** The schematic and explanatory text update to show plausible surface reflection, canopy-volume, and possible trunk–water double-bounce paths.  
**What it teaches:** Smooth open water can return less co-polarized energy to a side-looking radar, while flooded stems or trunks can sometimes increase HH return through double-bounce scattering. Wind roughness can alter the open-water cue.  
**Limits:** The diagram and qualitative HH/HV statements are conceptual, not simulated backscatter values or a flood classifier. Scattering direction is not universal; surface roughness, vegetation, polarization, moisture, and viewing geometry affect observations. A bright or dark pixel alone does not establish flooding.

### 3. Radar geometry cross-section

**Controls:** Incidence-angle slider.  
**What changes:** Satellite look geometry, terrain illumination, and the illustrated layover, foreshortening, and radar-shadow regions update.  
**What it teaches:** Side-looking radar geometry can compress slopes facing the sensor, cause slope returns to overlap in layover, and leave terrain behind steep features unilluminated.  
**Limits:** This is a two-dimensional geometric schematic using a simplified terrain profile. It is not a terrain-corrected product, a digital elevation model, or a geolocation-quality assessment.

### 4. SweepSAR and digital beamforming

**Controls:** Switch between a conceptual traditional stripmap view and NISAR SweepSAR.  
**What changes:** An animated schematic contrasts one moving narrow illumination footprint with scan-on-receive beams across a wide swath.  
**What it teaches:** NISAR’s array-fed reflector illuminates a wide swath on transmit and uses digital beamforming on receive to support wide-swath imaging.  
**Limits:** Beam count, timing, and geometry in the animation are illustrative, not an engineering simulation. The approximately 242 km label refers to the L-band wide-swath capability; actual acquisition mode governs coverage and resolution. [NASA SweepSAR overview](https://nisar.jpl.nasa.gov/mission/get-to-know-sar/sweepsar/).

### 5. Dielectric interface: Fresnel reflectance

**Controls:** Choose representative water, wet soil, dry soil, ice, or concrete permittivity; adjust incidence angle from 10° to 65°.  
**What changes:** Incident, reflected, and transmitted rays update using Snell’s law. The panel calculates ideal H- and V-polarized Fresnel power reflectance at the selected flat boundary.  
**What it teaches:** Reflection and transmission at an ideal dielectric boundary depend on incidence angle, polarization, and relative permittivity.  
**Limits:** This assumes a flat, lossless, non-magnetic interface and real scalar permittivity. The listed material values are representative teaching values, not universal material constants. Fresnel reflectance is not SAR backscatter σ⁰: roughness, volume scattering, complex frequency-dependent permittivity, and monostatic return geometry are not modeled. The recent layout change puts the angle control directly above the live ray diagram, uses a centered diagram sized for the card, and places the material details and reflectance results in a compact responsive layout.

### 6. L- and S-band target-scale simulator

**Controls:** Set an illustrative target diameter from 1 to 300 mm.  
**What changes:** For the lab’s representative L-band wavelength (238 mm) and S-band wavelength (94 mm), it calculates the dimensionless size parameter `x = πd/λ` and labels a broad size regime.  
**What it teaches:** Comparing target size with wavelength helps explain why the same object can interact differently at different radar wavelengths.  
**Limits:** The diameter is an idealized effective size. The sinusoid and circle are a scale illustration, not an electromagnetic scattering solution. The regime label is a teaching heuristic. It does not calculate penetration depth, scattering cross-section, or backscatter; actual NISAR modes and effective S-band wavelength should be checked against mission documentation before using these representative values quantitatively.

### 7. Speckle statistics and Lee filtering

**Controls:** Number of looks, local window size, and a draggable raw/filtered comparison divider.  
**What changes:** A known synthetic grayscale intensity scene is multiplied by mean-one Gamma-distributed speckle, then smoothed with a local Lee-style estimator.  
**What it teaches:** Multilooking reduces speckle variance, while an adaptive local filter trades noise suppression against preservation of local contrast and edges.  
**Limits:** This operates on generated display intensities, not complex SAR SLC data. Display clipping affects the synthetic values, and the implementation is a teaching filter rather than the production pipeline filter. It does not model phase, a complete instrument noise process, or validate a filter’s performance on the Jamuna data.

### 8. H/α eigenvalue decomposition: synthetic lab

**Controls:** Three component-power sliders and surface-dominant, mixed, or dihedral-dominant presets.  
**What changes:** Normalized toy component weights determine entropy `H = −Σpᵢlog₃pᵢ` and a weighted mean α using canonical example angles (10°, 45°, 80°); a marker moves on an H/α plot.  
**What it teaches:** Entropy summarizes the spread of normalized eigenvalue powers; mean α summarizes a weighted orientation/scattering archetype in a Cloude–Pottier-style interpretation.  
**Limits:** The model uses selected synthetic powers and fixed teaching angles. It does not estimate a polarimetric covariance/coherency matrix, perform an eigendecomposition on project data, or produce H/α measurements for the Jamuna scene. The panel was explicitly relabeled as synthetic to avoid implying that those calculations have been performed on project imagery.

### 9. Temporal coherence model

**Controls:** Temporal separation `Δt` and user-set time constant `τ`.  
**What changes:** The graph and displayed temporal term follow `γₜ = exp(−Δt/τ)`.  
**What it teaches:** Under a first-order exponential model, the temporal contribution decreases as observations become farther apart, with the rate set by τ.  
**Limits:** τ is a scenario parameter, not a measured land-cover constant. The curve omits thermal, spatial-baseline, co-registration, atmospheric, and other decorrelation contributions. Earlier hand-set land-cover curves and an abrupt erosion drop are not part of the current panel.

### 10. Change Detection Explorer

**Controls:** Swipe between two configured Jamuna HH display quicklooks; adjust a brightness cutoff on a quicklook; run an animated scan of the change mask.  
**What changes:** The first pane compares the two date images, the second recolors a display PNG according to its brightness cutoff, and the third reveals the project’s mapped change mask. If available, area and its sensitivity envelope are read from the project manifest.  
**What it teaches:** It connects imagery, a visual cutoff, and the corresponding mapped candidate layer while showing where the reported area comes from.  
**Limits:** The cutoff is applied to an 8-bit quicklook and is not calibrated σ⁰ or the production Otsu classifier. The scanner does not recalculate area from the image pixels. The current result is marked inconclusive where project QC says so; it is not confirmed erosion.

### 11. Water and change map lens

**Controls:** Move the interactive lens over the map display.  
**What changes:** The lens reveals the configured Jamuna HH backscatter alongside the project’s water and change masks.  
**What it teaches:** It lets viewers inspect how the classified masks line up with the displayed radar scene.  
**Limits:** The displayed colors are map layers, not Pauli RGB channels or a polarimetric decomposition. Quicklook imagery is for visual inspection; use the data manifest and processing methods for the analysis result and its provenance.

### 12. Water-classification pipeline walkthrough

**Controls:** Select pipeline steps.  
**What changes:** The selected stage is highlighted as the viewer follows calibrated backscatter, quality checks and thresholding, binary masks, median filtering, HAND screening, date comparison, polygonization, and candidate-map review.  
**What it teaches:** It summarizes the project’s processing sequence and the checks between water classification and interpretation.  
**Limits:** This is a process walkthrough, not a live rerun of each stage. The two-date project result remains inconclusive and candidate transitions should not be presented as confirmed bank erosion.

### 13. Threshold sensitivity: synthetic histogram

**Controls:** Move the threshold slider from −25 to −5 dB.  
**What changes:** A generated two-population histogram is divided into below- and above-threshold groups; displayed counts update.  
**What it teaches:** A classification boundary can change class membership, especially where backscatter populations overlap.  
**Limits:** The histogram is synthetic and the slider is not running Otsu. It does not calculate a threshold from a scene or change the production project result.

### 14. InSAR fringe synthesizer

**Controls:** Click the canvas to place the synthetic deformation center; adjust peak line-of-sight displacement and deformation radius.  
**What changes:** A wrapped-phase fringe pattern is generated from a Gaussian-shaped displacement field using `φ = (4π/λ)d_LOS` at a representative L-band wavelength of 23.8 cm. The fringe count responds to displacement relative to the half-wavelength phase cycle.  
**What it teaches:** Interferometric phase is related to line-of-sight displacement, and a half-wavelength displacement corresponds to one full phase cycle in a two-way radar path.  
**Limits:** This is a synthetic, noiseless deformation example. It does not process an interferogram, unwrap phase, remove topography, or estimate ground motion from the Jamuna project.

## Other reference visualizations

- **Radar frequency bands:** Select a band to view its frequency, wavelength, qualitative canopy interaction, mission examples, and a conceptual canopy/ground illustration. The graphic is explicitly not to scale; it is not a penetration-depth model.
- **Polarization cards:** Select a channel card to read a qualitative scattering interpretation. The panel explains terminology and is not evidence that every channel was acquired in the case study.
- **InSAR processing pipeline:** Select stages to review a typical repeat-pass processing chain. It is an overview, not an executed displacement result.
- **Complementary radar wavelengths:** Compare qualitative L- and C-band strengths and limitations. Neither band guarantees coherence or visibility beneath vegetation.

## Recent changes reflected here

- **2026-11-04–05 SAR Lab refresh:** the mission specification cards were compacted and icon sizing standardized; the scientific-reference footer was regrouped by category with direct external-link chips. The changes improve scannability and source access without changing the analysis pipeline.
- **2026-11-03 SAR Lab overhaul:** SweepSAR and dual-frequency/L/S-band teaching views were added alongside expanded radar-physics explainers, flood-scattering scenarios, and explicit source attribution. The present page contains both project-linked viewers and conceptual/synthetic panels; those categories are described above.
- Added the interactive flood scattering scenarios and the target-size L/S-band comparison.
- Reframed dielectric values as ideal-interface Fresnel reflectance and clarified that it is not SAR backscatter.
- Kept H/α explicitly theory-only and synthetic; removed the implication that the project calculates those metrics from Jamuna covariance data.
- Replaced empirical-looking coherence curves with the parameterized exponential temporal term and explicit omitted effects.
- Clarified that the map lens is a water/change layer comparison, not Pauli decomposition.
- Reorganized the dielectric controls and visualization so the angle slider is adjacent to the live ray diagram and the card uses a responsive layout.

The panel list and statements above are based on the current `SARLab.tsx` implementation. Visual polish commits do not convert an explainer into a scientific processing output. The only SAR Lab content tied to the Jamuna case is the content explicitly described as reading project quicklooks, masks, manifest values, or pipeline narration; other calculations remain synthetic or conceptual.

## Scientific references

- [NASA NISAR mission overview and quick facts](https://science.nasa.gov/mission/nisar/mission-overview/)
- [NASA/JPL SweepSAR explanation](https://nisar.jpl.nasa.gov/mission/get-to-know-sar/sweepsar/)
- [NISAR Science Users’ Handbook](https://nisar.jpl.nasa.gov/documents/26/NISAR_FINAL_9-6-19.pdf)
- [NASA ARSET: SAR for flood mapping and limitations](https://appliedsciences.nasa.gov/sites/default/files/2023-11/SAR_Part3.pdf)
- [Cloude–Pottier polarimetric decomposition overview](https://www.mdpi.com/2072-4292/7/6/7447)
- [NISAR interferometry overview](https://science.nasa.gov/mission/nisar/interferometry/)
