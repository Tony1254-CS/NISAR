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

## ML Intelligence

The Intelligence page has two distinct modes. Scenario mode generates hand-designed SAR-like examples and trains a 31-tree Random Forest and a four-input temporal MLP in the browser. The models, labels, holdout metrics, feature sensitivity, novelty thresholds, simulated speckle response, CUSUM sequence, segmentation audit, and selective-review curve all describe generated examples. They are useful for illustrating model mechanics, sensitivity, and abstention, but they are not model evaluation on NISAR or field data. Their output scores are not calibrated probabilities.

The separate Jamuna evidence tab reads the static case bundle and its recorded QC. It does not run those classifiers on the Jamuna pixels. Real-data accuracy and F1 are not evaluated because independent labels and a spatially separate test set are unavailable; a later pass for persistence is also unavailable. The threshold-derived area is a candidate, not ground truth. See the [ML Intelligence guide](../ML_INTELLIGENCE.md) for exact input features, network architecture, diagnostics, parameters, and interpretation limits.

## Decision Desk

The Decision Desk loads the Jamuna bundle and combines its erosion/accretion GeoJSON collections into a review queue sorted by mapped area. Map layers are the bundle's quicklook products aligned to recorded reach bounds; the satellite basemap is contextual. The map displays the top 15 features per class by area by default, while the queue and filters operate on the loaded candidates. No risk multiplier is used to rank them.

The Desk presents candidate provenance, manifest processing parameters, and recorded QC statuses. It does not calculate an aggregate probability or resolve failed/not-evaluated gates. Review states are browser-local. The hypothetical exposure corridor is user-drawn, and its area is simply length × depth. Optional OpenStreetMap building/road-way intersections indicate mapped objects only, not people, damage, or forecast risk. A JSON case packet can be downloaded for manual handoff to the separate TRACE Field app; there is no automatic synchronization. See the [Decision Desk guide](../DECISION_DESK.md) for controls, bundle fields, export schema, and demo wording.

## Evidence and claim boundaries

For this current two-date case, report the verdict as **INCONCLUSIVE**. Do not describe the threshold-based candidate area as confirmed erosion, quote generated model diagnostics as real-case performance, infer causation from rainfall context, or translate mapped OSM objects into exposed population. Additional same-track observations, gauge-level stage control, later-pass persistence, and independent reference labels are needed to support stronger claims.

## References

- [NASA NISAR mission overview](https://science.nasa.gov/mission/nisar/mission-overview/)
- [NASA/JPL SweepSAR overview](https://nisar.jpl.nasa.gov/mission/get-to-know-sar/sweepsar/)
- [NISAR Science Users’ Handbook](https://nisar.jpl.nasa.gov/documents/26/NISAR_FINAL_9-6-19.pdf)
