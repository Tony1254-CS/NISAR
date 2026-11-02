# FluviSAR: Same River Twice
## NASA Space Apps Challenge 2026 Submission

### Track: Dancing with the SARs: Tracking Earth’s Changing Surface with Radar Remote Sensing

FluviSAR is a web application for exploring a Jamuna River case study with NISAR L-band SAR data. It combines a documented processing workflow, mapped outputs, quality checks, and an interactive SAR Science Lab. The Lab helps visitors understand radar concepts; its teaching simulations are clearly distinguished from the project’s measured inputs and analysis products.

NISAR launched on July 30, 2025. Its L-band and S-band instruments support observations in day and night and are generally much less affected by ordinary cloud cover than visible/near-infrared optical imagery. Heavy precipitation, surface conditions, sensor mode, and data availability still matter; SAR does not guarantee a usable observation in every situation. The cloud-density control in FluviSAR is an illustration, not an availability model.

## What visitors can explore

- **Jamuna case viewer:** Compare the configured HH quicklooks, inspect the mapped water/change layers, and follow the area value back to the project manifest. The current two-date result is marked **INCONCLUSIVE** and is not presented as confirmed erosion.
- **Flood signal mechanism simulator:** Change land cover and standing-water state to see schematic surface, volume, and possible trunk–water double-bounce paths. It explains why flood responses vary; it does not predict backscatter or classify floods.
- **Radar geometry cross-section:** Change incidence angle to explore schematic layover, foreshortening, and radar shadow.
- **SweepSAR explainer:** Compare conceptual stripmap and scan-on-receive digital beamforming views. The animation is illustrative, not an instrument model.
- **Fresnel interface explorer:** Adjust representative permittivity and angle to update ideal flat-boundary rays and H/V Fresnel power reflectance. The value is not SAR backscatter σ⁰. The angle control sits directly above the live ray visualization, with material details and results in a compact responsive layout.
- **L-/S-band target-scale comparison:** Change an idealized target diameter and compare `x = πd/λ`. It demonstrates size relative to wavelength, not penetration depth or scattering strength.
- **Speckle filtering lab:** Add mean-one Gamma speckle to a synthetic intensity scene and compare a local Lee-style estimate. It does not process complex SLC data or reproduce the production filter.
- **Synthetic H/α lab:** Adjust toy component powers to calculate entropy and a weighted mean angle. It does not calculate Cloude–Pottier metrics from the Jamuna data.
- **Parameterized temporal coherence model:** Adjust `Δt` and `τ` in `γₜ = exp(−Δt/τ)`. The time constant is user-set and the model omits other coherence losses.
- **Additional explainers:** A synthetic threshold-sensitivity histogram, synthetic InSAR fringe model, cloud/optical comparison, frequency and polarization references, and a water-classification pipeline walkthrough.

Each teaching panel states its assumptions and limits. The complete panel-by-panel guide is [docs/SAR_LAB.md](../SAR_LAB.md).

## Analysis status and limits

The configured Jamuna comparison has two dates, and the current checks do not support a stage-matched, persistent erosion estimate. Its mapped land-to-water area fails plausibility review, so the verdict remains **INCONCLUSIVE**. The application does not claim that the Lab’s synthetic H/α, coherence, InSAR, speckle, threshold, dielectric, or target-scale examples are measurements from the Jamuna scene. See [docs/PLAUSIBILITY.md](../PLAUSIBILITY.md) and [docs/submission/methods.md](methods.md).

## References

- [NASA NISAR mission overview](https://science.nasa.gov/mission/nisar/mission-overview/)
- [NASA/JPL SweepSAR overview](https://nisar.jpl.nasa.gov/mission/get-to-know-sar/sweepsar/)
- [NASA ARSET: SAR for flood mapping and limitations](https://appliedsciences.nasa.gov/sites/default/files/2023-11/SAR_Part3.pdf)
