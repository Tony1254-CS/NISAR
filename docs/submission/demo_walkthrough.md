# Four-minute demo walkthrough

This is a recording checklist for the current app. It follows the same story as [video_script.md](video_script.md), with concrete interactions and guardrails. Routes are `/sar-lab`, `/intelligence`, and `/impact`. TRACE Field is a separate app; no route or automatic web integration is assumed here.

## Before recording

- Open the current build and confirm all three pages load.
- Confirm the Jamuna bundle displays the current `INCONCLUSIVE` verdict and the expected pair dates (2026-08-26 → 2026-09-19).
- Reset or inspect browser-local Decision Desk review statuses so a previous demo does not look like a shared review record.
- Test whether the optional OpenStreetMap Overpass request works. If it does not, show the idle state and narrate its purpose without inventing counts.
- Confirm that the JSON download is available, but do not imply it imports or synchronizes automatically with TRACE Field.
- Use a stable viewport and readable zoom. Hide browser chrome only if doing so does not hide the route or source labels.

## Page sequence and operator actions

### 1. SAR Lab — explain how the radar signal can behave

**Show:** `/sar-lab`, the NISAR context and its clearly labeled educational panels.

**Interact:** switch the flood mechanism among open floodplain/crops/woody vegetation and toggle standing water. Adjust incidence angle in geometry or Fresnel panel. Optionally show SweepSAR and the target-scale simulator.

**Say:** The scattering pathways and instrument illustrations explain mechanisms; the controls are conceptual/synthetic and do not predict project backscatter. If showing Fresnel values, state they are ideal flat-boundary reflectance, not SAR σ⁰.

**Then show:** Change Detection Explorer quicklook pair and candidate mask; point to the manifest-linked metric and the inconclusive interpretation.

**Say:** Quicklook brightness control is a teaching comparison, not the production classifier. The mapped transition is not confirmed erosion.

### 2. ML Intelligence — separate model mechanics from case evidence

**Show:** `/intelligence` in Scenario mode. Keep the `SYNTHETIC`/generated label in frame.

**Interact:** select a Temporal MLP or Random Forest, change one generated feature/preset, and point to the class-score output and review cutoff. Choose one diagnostic: Gamma speckle stress (simulation draws) or selective review (generated holdout). Do not try to show every panel in a short demo.

**Say:** Models and labels use generated scenario data; scores and metrics are not real-data accuracy or validated NISAR inference. The RF share is a tree-vote frequency, and the MLP output is a softmax score; neither is calibrated probability.

**Then show:** switch to Jamuna evidence. Show the no-reference-labels gate, two usable acquisitions, and the acquisition-pair inspector.

**Say:** the page does not apply the demo models to Jamuna. Real-data model performance is not evaluated; the candidate area is not ground truth.

### 3. Decision Desk — use evidence to prioritize a human review

**Show:** `/impact`. Let the map and readout load. Explain that NISAR radar is an overlay; the satellite basemap is geographic context.

**Interact:** show candidate layers and one date change. Point out that the default map draws the top 15 by area per class. Select a polygon from the map or ledger, then open provenance and trust/QC details.

**Say:** area is a transparent sorting key, not likelihood or severity. QC shows recorded evidence and gaps; `NOT_EVALUATED` does not mean pass. Keep `INCONCLUSIVE` visible.

**Then show:** switch to the hypothetical corridor view; adjust length/depth and explain the simple area formula. Load OSM only if functioning. Switch the audience brief between analyst/planner/public.

**Say:** the corridor is a user-defined scenario, not observed retreat. OSM counts are mapped ways, not residents, homes at risk, or losses. Audience copy does not change evidence.

**Finally show:** export a JSON case packet and the file download. If available, show TRACE Field separately.

**Say:** the file is a manual handoff; it does not auto-sync. A field observation is separate evidence and does not itself flip the satellite verdict.

## Suggested short version (90 seconds)

1. 15 s: state the cloud/interpretation problem and identify the Jamuna case.
2. 15 s: SAR Lab flood mechanism and its conceptual label.
3. 20 s: ML sandbox one generated slider change, then the real evidence tab's “not evaluated” gate.
4. 25 s: Decision Desk candidate selection and QC/provenance.
5. 15 s: inconclusive result, manual TRACE Field handoff, and what evidence is needed.

## Avoid these outdated or unsupported demo claims

- Do not show a Google sign-in, five-step evidence drawer, GPS field-note flow, audio pulse, or old multi-case library as current capabilities unless the current build visibly contains them and they are separately verified.
- Do not call the current data bundle a multi-reach, four-site validated global product.
- Do not claim the pass animation is live telemetry.
- Do not say OSM features are affected people or that the hypothetical corridor estimates damage.
- Do not claim an ML model produced the map or has a real-data accuracy score.
- Do not present the 3,622.64 ha candidate as confirmed land loss.

## Page references

- [SAR Lab guide](../SAR_LAB.md)
- [ML Intelligence guide](../ML_INTELLIGENCE.md)
- [Decision Desk guide](../DECISION_DESK.md)
- [Timed video script](video_script.md)
