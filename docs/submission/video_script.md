# FluviSAR — 240-second video script and screen plan

This draft is timed for a four-minute submission video. Read at a measured pace (roughly 125–140 words per minute) and rehearse against the actual build. It tells a focused story: radar can reveal change through cloud and darkness; interpreting a two-date signal is difficult; FluviSAR exposes the evidence and uncertainty; different people can use the result to decide what to inspect next. It does not claim a confirmed erosion estimate.

## Core message

**FluviSAR turns SAR change candidates into an inspectable, uncertainty-aware review workflow for the Jamuna River.** SAR Lab teaches the measurement concepts. ML Intelligence demonstrates how models and diagnostics behave on generated scenarios and keeps real-case validation separate. Decision Desk helps a human review candidate patches, evidence gaps, and mapped context before a field investigation. TRACE Field is a separate companion app; FluviSAR exports a case packet for manual handoff.

## Timed script (240 seconds)

### 0:00–0:20 — The human problem (20 s)

**Visual:** Open on the braided Jamuna reach, then a cloud-covered optical view transitioning to a radar quicklook. Keep the labels visible and do not imply the optical image is a matched acquisition if it is illustrative.

**Narration:** “In a monsoon landscape, the river can reshape its banks while clouds limit optical observation. But seeing water in a radar image is not the same as proving that land was permanently lost. That distinction matters to researchers, planners, and communities deciding where to look more closely.”

### 0:20–0:43 — What FluviSAR is (23 s)

**Visual:** FluviSAR landing, project name, Jamuna case, and three destinations in sequence: SAR Lab, ML Intelligence, Decision Desk.

**Narration:** “FluviSAR is a web investigation platform built around a Jamuna River case study using NISAR L-band radar products. It connects the radar signal to a reviewable map, scientific explainers, model diagnostics, provenance, and a possible field follow-up. Each part has a different job—and each marks what its evidence can and cannot support.”

### 0:43–1:08 — SAR Lab: explain the signal (25 s)

**Visual:** In SAR Lab, show open-water versus vegetated flood scenarios, then the incidence-angle geometry or SweepSAR panel. Briefly land on the Change Detection Explorer and its manifest-linked area label.

**Narration:** “The SAR Lab makes the measurement legible. Its flood panel shows why smooth water can darken a return, while flooded stems can sometimes create a brighter double-bounce signal. Geometry and SweepSAR explain how radar observes the surface. These panels are conceptual teaching tools. The change explorer uses project quicklooks and manifest metrics, while clearly warning that a mapped transition is still a candidate—not confirmed erosion.”

### 1:08–1:38 — ML Intelligence: show how models behave (30 s)

**Visual:** `/intelligence`, point out “Scenario mode / generated.” Change the Temporal MLP/Random Forest selector or a scenario input, show predicted class scores; show one diagnostic such as the speckle stress test or selective review. Then switch to Jamuna evidence.

**Narration:** “ML Intelligence makes model behavior inspectable. In scenario mode, a Random Forest and a small temporal neural network respond to generated SAR-like examples. We can perturb the scene, inspect class scores, and see how speckle or a review threshold changes the result. These are mechanics demonstrations, not a model trained or validated on the Jamuna pixels. In the separate Jamuna workbench, accuracy and F1 are marked not evaluated because independent labels and persistence evidence are unavailable.”

### 1:38–2:18 — Decision Desk: prioritize human review (40 s)

**Visual:** `/impact`. Show native-proportion radar map, layer stack, top candidate patches, then select one candidate. Show the ledger and provenance/trust tabs. Keep the INCONCLUSIVE status on screen.

**Narration:** “The Decision Desk turns the bundle into a practical review queue. Candidates are ranked transparently by mapped area, and the map initially shows the fifteen largest patches per class so the scene stays readable. Select a patch and inspect its dates, source granules, processing parameters, and named quality checks. This is where a planner or analyst can ask: what should we examine first, and what evidence is still missing? The current two-date case remains inconclusive; the mapped area is not a verified loss measurement.”

### 2:18–2:48 — Context and impact without pretending to forecast (30 s)

**Visual:** Show compare swipe and hypothetical corridor. Adjust corridor dimensions; load OSM only if network works, or show the interface idle state and explain the query. Show audience brief toggles.

**Narration:** “A user can draw a hypothetical corridor around a candidate and calculate its area from the chosen length and depth. If connected, the Desk can query OpenStreetMap for mapped buildings and roads crossing that envelope. Those are mapped features—not residents, damaged homes, or a forecast. The analyst, planner, and public briefs adapt the wording for each audience while preserving the same evidence and the same caution.”

### 2:48–3:15 — The verdict and what it takes to improve it (27 s)

**Visual:** Open QC scorecard, show NOT EVALUATED, warning, and fail statuses as they actually appear; show provenance and rainfall context. Avoid implying rainfall caused the change.

**Narration:** “The checks explain why FluviSAR withholds a confirmed erosion label. The available pair does not establish later-pass persistence, independent water-reference agreement, or model accuracy against reference labels; the mapped area also raises a plausibility concern. Rainfall is shown only as context, not as proof of cause. More same-track observations, gauge-level stage control, and independent reference data are needed to resolve the case.”

### 3:15–3:38 — From web review to separate field app (23 s)

**Visual:** Export the TRACE Field JSON case packet. Show its filename/download and the separate TRACE Field app if available. Do not imply automatic import/sync unless the current app demonstrably supports it.

**Narration:** “When a candidate merits attention, FluviSAR can export a case packet for TRACE Field, our separate field app. The packet carries the candidate, observation dates, granule references, quality-check summaries, and the current inconclusive interpretation. A field note is independent evidence for a person to review; it does not automatically validate or change the satellite result.”

### 3:38–4:00 — Close with impact (22 s)

**Visual:** Return to the reach map, with “candidate → evidence review → field follow-up” as a simple three-step graphic. End on the INCONCLUSIVE label and project name.

**Narration:** “FluviSAR’s contribution is a transparent path from radar observation to a better-informed next step. Researchers can inspect the method. Learners can understand the signal. Resource managers can prioritize review. The public can see what is known and what is not. We do not claim to have proved erosion here. We show how to investigate the evidence honestly—and what is needed to make the next decision stronger.”

## On-screen truth checks

- Keep **INCONCLUSIVE** visible whenever the Jamuna estimate is shown.
- Say “candidate transition” or “threshold-derived candidate,” not “confirmed erosion,” “land lost,” or “validated map.”
- Label ML sandbox values **generated/simulated**; do not say the models were trained on NISAR scenes.
- In the real evidence tab, say accuracy/F1 are not evaluated; do not imply that opening the tab runs the models.
- Call OSM counts mapped building/road features. Do not translate them into people, households, damages, or risk.
- Call the scenario corridor hypothetical. It is not observed retreat or a forecast.
- Call the OPERA DSWx image older contextual evidence, not same-date validation.
- Describe JSON export as manual handoff to a separate TRACE Field app, not live synchronization.
- Do not invent users, deployments, field outcomes, quantified lives saved, or measured impact.

## Capture and rehearsal checklist

1. Use the current deployed build or a clean local build at a stable browser zoom and viewport. Verify all three routes before recording.
2. Clear or reset local Decision Desk review statuses if old browser notes would confuse the story. These statuses are local only.
3. Check that the OSM request works before planning to show live features. Keep a fallback shot of the idle/help text; do not fabricate results.
4. Verify the chosen candidate, selected date, bundle numbers, QC statuses, and export packet against the current data bundle on recording day.
5. Capture the synthetic labels on ML panels and the real-case validation gate. Avoid rapid scrolling that hides the distinction.
6. Rehearse narration and transitions to exactly 240 seconds. Leave time for readable evidence screens; no screen should imply live satellite acquisition.

## Supporting documentation

- [SAR Lab panel reference](../SAR_LAB.md)
- [ML Intelligence reference](../ML_INTELLIGENCE.md)
- [Decision Desk reference](../DECISION_DESK.md)
- [Methods and limitations](methods.md)
