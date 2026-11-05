# ML Intelligence: model sandbox and Jamuna evidence workbench

This guide describes the current `/intelligence` page and the code that powers it. It is intended for product orientation, judging, and video scripting. The page deliberately has two evidence contexts with different meanings:

1. **Scenario mode** trains and exercises models using generated, hand-designed examples. Its metrics explain mechanics and trade-offs; they are not NISAR model validation.
2. **Jamuna evidence mode** reads the project's real static reach bundle and shows its inputs and quality-control gaps. It does not run the sandbox classifiers over the real scene.

Keep this distinction visible in narration. A chart can be interactive and technically computed while still describing a synthetic experiment.

## Page purpose and users

The page is a model-literacy and evidence-inspection surface. Researchers and learners can inspect model inputs, training, output scores, error patterns, sensitivity, and failure modes. A resource manager or analyst can inspect the Jamuna acquisition pair and see why a candidate change must remain unconfirmed. The page does not issue an operational flood warning, a bank-retreat forecast, or a validated pixel-level erosion map.

The page header names NISAR L-band, Random Forest, Temporal MLP, and Jamuna evidence. The visual labels `SCENARIO MODE`, `GENERATED HOLDOUT`, and `REAL NISAR CASE` are substantive provenance cues. Preserve them when demonstrating the page.

## Page structure and navigation

### Model sandbox: synthetic scenario analysis

The sandbox lets the user switch between a Temporal MLP and a Random Forest, perturb a generated scene, inspect a selected feature vector, and see how model outputs and diagnostic views respond. Scene-wide controls shift event backscatter, stage-difference index, and persistence for the generated tile. These offsets are applied to generated examples; they do not edit the Jamuna bundle.

Four feature values are used throughout the scenario interface:

| Input | Meaning in the demo | Important qualification |
|---|---|---|
| T0 pre-event HH γ⁰ (dB) | Generated pre-event backscatter value | Not read from a Jamuna raster in scenario mode. |
| T1 event HH γ⁰ (dB) | Generated event backscatter value | Scene-wide perturbation can shift it. |
| Stage-difference index | Normalized synthetic stage-context feature (0–1) | Not a gauge height or a validated stage model. |
| Later-water persistence input | Synthetic persistence (0–1) | Used to derive the illustrative T2 value; not observed persistence from a later NISAR pass. |

The T2 point in the trajectory is blended in **linear power**, then converted back to dB: `10 log10((1−p)·10^(T0/10) + p·10^(T1/10))`, where `p` is the persistence input. Averaging dB values directly would not represent a power blend. The pixel inspector displays the largest model score and the full four-class score distribution. A score below the user-set threshold is labelled for review. The RF output is a tree-vote share; the MLP output is a softmax score. Neither is calibrated probability.

The four generated labels are **Stable land**, **Open water**, **Seasonal inundation**, and **Persistent transition candidate**. Their spatial tile arrangement and labels are generated for demonstration. “Persistent transition candidate” is a scenario class name, not an observed change result.

### Generated inputs and dataset split

The synthetic sample generator creates class-conditional feature examples from explicit scenario distributions: 180 per class, 720 total. A seeded, class-stratified split assigns approximately 70% to training, 15% to validation, and 15% to test (about 504/108/108 examples total). Fixed seeds make the demo repeatable (sample seed 2609; split seed 2031). Each feature is bounded to the UI's range. The generated class rules are:

| Generated label | T0 / T1 backscatter distribution | Stage index | Persistence |
|---|---|---|---|
| Stable land | T0 drawn around −9.5 dB (σ 2.8); T1 = T0 plus zero-mean noise (σ 1.8 dB) | absolute draw around 0.07 (σ 0.05) | around 0.08 (σ 0.10), clipped to 0–1 |
| Open water | T0 around −19 dB (σ 2.7); T1 = T0 plus noise (σ 1.8 dB) | same low-stage distribution as stable land | around 0.92 (σ 0.10) |
| Seasonal inundation | T0 around −9.5 dB (σ 2.8); T1 around −17.5 dB (σ 2.8) | absolute draw around 0.42 (σ 0.16) | around 0.18 (σ 0.16) |
| Persistent transition candidate | T0 around −9.5 dB (σ 2.8); T1 around −17.5 dB (σ 2.8) | same low-stage distribution as stable land | around 0.91 (σ 0.11) |

The novelty monitor uses the validation split as its generated reference distribution; this is separate from the training examples but is not a real-world calibration set. These are generated labels, not independently interpreted satellite pixels, field observations, or a ground-truth benchmark.

### Random Forest

The forest uses 31 CART trees (forest seed 941), each trained on a bootstrap sample drawn with replacement. At each node, two of the four features are sampled as split candidates. Candidate thresholds are drawn from up to 18 positions between sorted unique feature values; the tree selects a split by Gini impurity reduction. Growth stops at depth 5, below 10 samples, at near-pure nodes, or when no useful split remains; candidate child nodes require at least four examples. Each tree casts one class vote; the displayed score is the share of tree votes per class. It is useful for showing nonlinear partitioning and how an ensemble can disagree across plausible inputs. Its test metrics measure agreement with the synthetic test labels only.

### Temporal MLP

The dense network has four inputs, hidden layers of 16 and 8 ReLU units, and a four-class softmax output. Inputs are scaled as `(T0+15)/10`, `(T1+15)/10`, `(T2+15)/10`, and `2·stageIndex−1`; T2 is derived from linear-power blending using persistence. Weights use seeded Glorot-uniform initialization. It trains in-browser with mini-batch SGD (learning rate 0.018), batch size 24, cross-entropy loss, up to 140 epochs, and a 0.0005 weight-decay term on output-layer weights. Best weights are retained when validation loss improves by more than 0.0005; training stops after 18 stale epochs. The chart shows training and validation loss, marks the best validation epoch, and supports epoch inspection. The displayed optimization trace is for generated data, not a published or field-trained NISAR model.

### Scenario sequence and feature-space views

The **scenario cube** shows generated HH T0, T1, and T2 panels, then the active classifier's class output and normalized score entropy. Clickable pixels load an example into the inspector. Gold outlines identify a generated label/model disagreement. The **feature-space plot** places generated examples by pre-event HH and post-minus-pre HH change; selecting a point loads its feature vector. Brightness and labels are visualization encodings, not geophysical classifications.

## Interactive diagnostics

All diagnostics below are computed from generated examples or idealized random processes. They are demonstrations of method behavior and QA ideas, not validation claims for the Jamuna case.

### Gamma speckle stress probe

The probe uses 160 Monte Carlo draws. For each draw, independent unit-mean Gamma intensity noise is applied to T0 and T1 powers. The effective-looks slider spans 1–8; lower looks produce higher variance. A resampling button changes the random seed. It reports the modal model label, its frequency across draws, the mean and standard deviation of T1−T0 in dB, a delta histogram, and class counts. Stage and persistence stay fixed. The simplified model excludes spatially correlated speckle, mixed/heterogeneous targets, terrain, and RFI. The frequency is simulation consistency, not confidence or accuracy.

### Temporal onset / CUSUM probe

This diagnostic generates a 24-acquisition HH sequence with Gamma speckle. Controls set effective looks (1–8), event onset (acquisitions 7–16), duration (1–7 acquisitions), and random seed. It estimates baseline mean and sample standard deviation from the first six simulated samples, uses allowance `0.5σ`, and signals when a one-sided positive or negative cumulative sum crosses `5σ`. It reports first alarm, selected synthetic onset, and persistence-derived follow-up state. CUSUM detects a shift in this simulated series; it does not classify erosion or infer a real event date. Baseline stationarity, acquisition geometry, and realistic temporal correlation are not established.

### Domain-shift novelty monitor

For each generated class, the monitor calculates feature means and per-feature sample variances (variance floor 0.04). It scores the selected vector with a diagonal class-conditional Mahalanobis distance, chooses the nearest class distribution, then compares the score with a percentile cutoff calculated from generated reference samples' nearest-class distances. The slider selects the 90th–99th percentile. A score above the cutoff is labelled outside the generated reference range. This is a diagonal approximation: cross-feature covariance is ignored. The percentile interpretation applies only to this generated reference distribution; it does not establish a false-alarm rate for real SAR inputs or guarantee generalization.

### Segmentation and connected-component audit

The audit runs the active model on a generated 26 × 13 tile and forms a transition mask from the model's persistent-transition class. A score threshold (0.20–0.85) can reject lower-scoring transition outputs. A four-connected component filter removes patches smaller than the selected 1–12 pixels. The paired views show raw and filtered masks and counts. IoU, Dice, precision, and recall are calculated against the tile's generated scenario labels before and after filtering. These metrics quantify only this toy tile; filtering can remove small true patches as well as noise. The interface does not process project GeoTIFFs or alter production polygons.

### Selective review / abstention curve

This diagnostic sorts generated holdout examples by their model's largest raw class score. A slider (0.20–0.95) sets the auto-accept threshold. The page reports generated holdout coverage (fraction accepted), error among accepted examples (disagreement with generated labels), and cases routed to review. The curve shows risk versus coverage as the threshold changes. It demonstrates an abstention strategy: accept fewer examples to potentially reduce accepted-set error. The score is not calibrated probability and the curve is not an operational service-level guarantee.

### Confusion matrix and feature permutation sensitivity

The confusion matrix uses generated test examples; rows are generated labels and columns are model outputs. Clicking a cell reports its row share. Per-class precision and recall are derived from that generated matrix. The transition review cutoff shown beside the matrix is explicitly a raw class score, not a calibrated probability.

Permutation sensitivity shuffles one input column among generated test examples and measures accuracy drop relative to baseline. It describes dependence of this model on the generated holdout distribution. Correlated inputs can share or mask importance; it is not causal attribution, a scientific driver analysis, or feature importance established on real NISAR cases.

## Jamuna evidence workbench: real bundle, no model score

The second tab loads the `jamuna-chilmari` static reach bundle. It is separate from scenario mode and should be introduced as **evidence inspection**, not real-data ML inference.

### Evidence status and validation gate

The case summary reads acquisition metadata, manifest metrics, and QC records. It states that there are two usable observations in the configured pair and no independent erosion reference labels, spatially separate test set, or later-pass persistence evidence. Therefore real-data accuracy and F1 are **not evaluated**. The threshold-derived transition area is a candidate value rather than verified ground truth.

The evidence gate lists recorded checks such as stage matching, persistence, independent water reference agreement, threshold stability, and swath-edge/RFI screening. Each displayed status comes from the loaded QC bundle; statuses can be PASS, WARN, FAIL, NOT_EVALUATED, or INFO/context. The gate is a rule-based view of recorded evidence, not an ML score. Rainfall is contextual evidence, not causal attribution. Stage context in this bundle is imagery-derived proxy context, not gauge data.

### NISAR evidence workbench

**Acquisitions and masks** provides a swipe between the configured HH radar quicklooks, a pairwise change-candidate PNG, or a date-specific threshold water-mask PNG. The quicklooks are display-scaled; they are not the calibrated analysis rasters. The date toggle chooses T0 or T1 water mask. Orbit direction, relative orbit, and frame are shown from the reach record.

**Candidate polygons** renders the source erosion and accretion GeoJSON over a geographic coordinate grid. Class toggles filter the two candidate collections; the minimum-patch-area slider filters polygons; selecting a feature highlights it and exposes attributes. The totals and polygons are bundle products from the configured analysis; they are not automatically verified bank retreat. A map visual is not independent validation.

## Current real-case interpretation

The current Jamuna record remains **INCONCLUSIVE**. The configured comparison has two usable acquisitions. It has no independent labeled erosion reference, no spatially separate test set, and no later same-track observation to test persistence. The current measured area is explicitly a threshold-based candidate. The page's evidence caveat calls for additional same-track temporal coverage, gauge-level stage control, persistence evidence, and independent reference validation before an erosion estimate can be confirmed.

Do not quote the candidate area as confirmed land loss, model accuracy, or forecast. Do not say the RF/MLP were trained on NISAR, that they inferred the Jamuna candidate map, or that scenario sensitivity/accuracy transfers to field data. Explain that the project exposes model mechanics while the real case is evaluated through its evidence bundle and quality gates.

## Suggested narration and demo order

1. Start on the mode tabs and state that the left side is a generated model sandbox.
2. Change one scenario preset or the T1 slider; point out the changing class scores and review threshold.
3. Show the temporal sequence and one diagnostic (preferably speckle stress or selective review), explicitly naming it as simulated.
4. Open Jamuna evidence; show the independent-label/persistence gap and the acquisition-pair workbench.
5. Close with the honest result: a useful candidate for review, but no confirmed erosion estimate or real-data model performance claim.

## Recent implementation changes (Nov 4–5, 2026)

- Added a domain-novelty monitor using a diagonal class-conditional Mahalanobis distance and a generated-reference percentile cutoff, with a visible moving threshold marker.
- Added a 24-acquisition synthetic time-series probe with two-sided CUSUM, configurable event onset/duration, Gamma speckle, and an explicit first-alarm readout.
- Added selective review diagnostics to show the generated holdout coverage/error trade-off as the raw-score threshold changes.
- Added the Monte Carlo Gamma speckle stress probe, reporting class stability and T1−T0 dB variability over repeated draws.
- Added a real-case evidence gate and Jamuna workbench that display the actual bundle and explicitly report real-data model performance as not evaluated.
- Refined the page's visual hierarchy and typography, added live slider readouts/feedback, and made the novelty cutoff marker move with its selected percentile.

These additions extend the explanatory/model-QA interface; they do not change or validate the production Jamuna transition map.

## Source code map

- `web/src/pages/Intelligence.tsx`: page layout, controls, visual panels, and bundle workbench.
- `web/src/pages/sarForestDemo.ts`: synthetic sample generation, forest, split, confusion matrix, metrics, and permutation importance.
- `web/src/pages/temporalMlpDemo.ts`: in-browser network, optimization, early stopping, and inference.
- `web/src/pages/sarSpeckleDemo.ts`: Gamma noise and Monte Carlo classifier stress calculations.
- `web/src/pages/sarAdvancedDiagnostics.ts`: novelty and temporal CUSUM calculations.
- `web/src/data/load.ts` and `web/src/data/types.ts`: static case bundle loading and types.
- Related guides: [Decision Desk](DECISION_DESK.md), [SAR Lab](SAR_LAB.md), and [analysis methods](submission/methods.md).
