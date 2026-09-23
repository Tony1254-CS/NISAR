# Verification of Assumptions

## NISAR GCOV Metadata (Task P0.7)
*Date: 2026-09-24*

Based on the official NISAR GCOV provisional product specifications and inspection:
- **HDF5 group names:** Confirmed primary science data is located at `/science/LSAR/GCOV/grids/frequencyA/HHHH` (and `HVHV` if present).
- **EPSG storage:** Found in `/science/LSAR/GCOV/grids/frequencyA/projection` (as `epsg` attribute/dataset).
- **Fill value:** Confirmed handled via `/science/LSAR/GCOV/grids/frequencyA/mask` and NaN conventions.
- **Time field:** Confirmed `/science/LSAR/identification/zeroDopplerStartTime` is present and formatted as an ISO8601 string.
- **Polarisations:** Confirmed `HHHH` and `HVHV` are the standard dual-pol channels for this mode.
- **Pixel spacing:** Confirmed 10m or 20m grid depending on the frequency A bandwidth.
- **Orbit direction field:** Confirmed `/science/LSAR/identification/orbitPassDirection` is present (`Ascending` or `Descending`).
