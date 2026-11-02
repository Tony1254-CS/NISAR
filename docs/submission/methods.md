# Methods

## Project analysis

FluviSAR uses NISAR L-band GCOV backscatter products for a Jamuna River case study. The analysis workflow reads the configured acquisitions, applies the project’s quality and masking steps, creates water classifications from eligible backscatter samples, compares the date-specific masks, and records outputs and quality checks in the reach bundle and manifest. The map and Change Detection Explorer use those project outputs; the display quicklooks are not substitutes for the source rasters.

The currently configured Jamuna comparison has two dates. The available evidence does not support a stage-matched, persistent erosion estimate, and the project’s plausibility checks fail. The current mapped land-to-water area is therefore labeled **INCONCLUSIVE** and must not be described as confirmed riverbank erosion. See [docs/PLAUSIBILITY.md](../PLAUSIBILITY.md) for the recorded review and [docs/VERIFIED.md](../VERIFIED.md) for data and processing facts.

## SAR Lab and teaching models

The SAR Lab is a separate educational layer. It contains mission and signal references, product viewers, conceptual diagrams, and interactive models. A panel’s presence does not mean that its calculations feed into the Jamuna analysis. In particular:

- Fresnel controls compute idealized flat-boundary reflectance, not calibrated SAR backscatter.
- H/α values are derived from synthetic component weights and canonical teaching angles, not a project covariance matrix.
- Speckle, threshold, InSAR fringe, target-scale, and temporal-coherence panels use synthetic inputs or parameterized models; they do not produce project measurements.
- The cloud, flood-scattering, terrain-geometry, and SweepSAR illustrations are conceptual explainers.
- The Change Detection Explorer reads the project manifest for area; its quicklook brightness slider is a display demonstration and does not rerun the production classifier.

For panel-by-panel controls, equations, assumptions, and limits, see the [SAR Lab guide](../SAR_LAB.md).

## References

- [NASA NISAR mission overview](https://science.nasa.gov/mission/nisar/mission-overview/)
- [NASA/JPL SweepSAR overview](https://nisar.jpl.nasa.gov/mission/get-to-know-sar/sweepsar/)
- [NISAR Science Users’ Handbook](https://nisar.jpl.nasa.gov/documents/26/NISAR_FINAL_9-6-19.pdf)
