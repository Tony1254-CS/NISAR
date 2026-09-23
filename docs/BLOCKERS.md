# Blockers

Currently no blockers.

## Blocker: P1.1 and P1.2 (NISAR GCOV Download)
**What was tried**: Running io_nisar.py to stream (via fsspec/h5netcdf) and then falling back to full download (via earthaccess.download).
**What failed**: Both streaming and downloading hang indefinitely with no progress (0 bytes downloaded after several minutes). This appears to be a network/firewall issue or earthaccess API/redirect issue on the host machine.
**Fallback triggered (Section 17)**: Download fails / slow -> use Vertex manual download by a human and place files in raw/.
**Action needed**: A human must manually download the granules listed in data/raw/jamuna-chilmari/catalog.json from ASF Vertex, and place the HDF5 files or clipped TIFFs into data/raw/jamuna-chilmari/nisar/<granule_id>/. Moving to next unblocked tasks (P1.4, P1.5) per protocol.
