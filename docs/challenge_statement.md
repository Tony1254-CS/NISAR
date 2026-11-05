# Challenge context and project scope

FluviSAR is the team's project for the NASA Space Apps Challenge 2026, in the **Dancing with the SARs: Tracking Earth’s Changing Surface with Radar Remote Sensing** challenge area. This file records our product's framing and does not claim to reproduce an official NASA challenge statement verbatim.

## Our project question

How can a person move from a SAR-derived river land/water transition candidate to a transparent, evidence-aware decision about what merits closer review, while distinguishing temporary inundation from possible persistent bank change?

## What the project currently does

- **SAR Lab (`/sar-lab`):** teaches SAR and NISAR concepts and lets visitors explore project quicklooks and explicitly identified synthetic/conceptual models.
- **ML Intelligence (`/intelligence`):** demonstrates two classifiers and diagnostic methods on generated scenarios, then separately inspects the real Jamuna evidence bundle. The demo classifiers are not run on the Jamuna scene.
- **Decision Desk (`/impact`):** helps analysts and planners inspect candidate polygons, provenance, QC gaps, and hypothetical mapped context; it can export a JSON handoff for the separate TRACE Field app.

## Claim boundary

The configured Jamuna analysis currently compares two usable NISAR observations from 2026-08-26 and 2026-09-19. Its land-to-water polygons are threshold-derived candidates. The area result fails the plausibility gate, stage matching and later-pass persistence are unresolved, and independent reference agreement/model performance are not evaluated. The current verdict is **INCONCLUSIVE**. FluviSAR therefore demonstrates an evidence-review workflow; it does not currently establish a confirmed erosion estimate or operational forecast.

For current technical detail, see [README.md](../README.md), [SAR Lab](SAR_LAB.md), [ML Intelligence](ML_INTELLIGENCE.md), [Decision Desk](DECISION_DESK.md), and [methods](submission/methods.md). The original project plan and tasks are historical records and should not be treated as official challenge rules.
