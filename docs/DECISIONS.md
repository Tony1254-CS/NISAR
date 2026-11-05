# Decisions

## 2026-11-05: Decision Desk evidence presentation

- Keep only evidence-backed map layers in the Decision Desk. Repeated template risk/forecast layers are not presented as operational risk products without case-specific method and provenance.
- Rank candidate polygons by their source `area_ha`, without an unexplained class multiplier. The default map shows the largest 15 candidates of each class for readability; this is a display cap, not a data filter on the underlying ledger.
- Treat the Desk as human review support. Local browser review status and JSON case export are not a synchronized ledger or independent validation.
- Label the impact corridor hypothetical and OSM counts as mapped features, never population or damage.
- Keep the inconclusive verdict and QC gaps visible rather than smoothing them into a single confidence score.

## 2026-11-05: ML evidence boundary

The Random Forest and Temporal MLP remain generated-data teaching models. They are not applied to the Jamuna scene. The real evidence view reports accuracy/F1 as not evaluated because the required independent labels/test set are unavailable. See [ML Intelligence guide](ML_INTELLIGENCE.md).

## 2026-11-04: SAR Lab teaching boundaries

Keep ideal-interface Fresnel reflectance separate from SAR backscatter; keep H/α and temporal coherence models explicitly synthetic/parameterized; describe the map lens as water/change layers rather than Pauli decomposition. See [SAR Lab guide](SAR_LAB.md).

## Stage Data Proxy Fallback (P1.7)
Since FFWC API endpoints are unknown without registration, and manual transcription for 2026 dates is impossible (future dates), we are documenting the fallback to the **Stage proxy from imagery (Section 10.4)**. No FFWC manual transcription CSV is available for the dates in our dataset.

## Quicklook confirmed (P2.5)
Quicklook confirmed: water is distinct from land in dB. (Confirmed on synthetic/surrogate data as actual download is blocked).
