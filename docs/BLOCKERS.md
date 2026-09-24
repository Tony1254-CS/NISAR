# Blockers

Currently no blockers.

## RESOLVED 2026-09-25: P1.1/P1.2 Earthdata credentials
`.env` now has working `EARTHDATA_USERNAME`/`EARTHDATA_PASSWORD`; `earthaccess.login()` succeeds.
Fetched 2 real NISAR GCOV granules for jamuna-chilmari (2026-08-26, 2026-09-19). Full real-data run
completed through the whole pipeline (see `TASKS.md` P1.1-P5.6 notes and `docs/PLAUSIBILITY.md`).
No credential/network blocker remains. What's actually blocking a *shippable* number now is data
volume, not access: only 2 of 30 catalogued granules were fetched (each is 8.78 GB, so fetching
all 30 is ~260 GB -- impractical on this machine). 2 dates is not enough for `pairs.py`'s real
pair-selection algorithm, which structurally requires a stage peak strictly between t0 and t1.
The real-data run comes back `INCONCLUSIVE` as a result -- not a code bug, a data-volume gap.
See `docs/PLAUSIBILITY.md` "Real-data run, jamuna-chilmari, 2026-09-25" for the full finding.

## Blocker: P1.1 and P1.2 (NISAR GCOV Download) — RE-DIAGNOSED 2026-09-24 (historical, resolved above)
**Re-tested 2026-09-24**: Outbound HTTPS to urs.earthdata.nasa.gov, nisar-docs.asf.alaska.edu, and
glo-30-hand.s3.us-west-2.amazonaws.com all succeed (200 OK, <3s). Network/firewall is NOT the blocker.
Set up a working Python 3.13 venv (`.venv313`) with the full geo stack (asf_search, earthaccess, h5py,
rasterio, rioxarray, geopandas, etc. — all installed cleanly via pip, no conda needed). 30/31 pytest tests
pass against this env (the one failure, test_p1_1.py, correctly requires real downloaded granule data).
**Actual remaining blocker**: `.env` has `EARTHDATA_USERNAME=` and `EARTHDATA_PASSWORD=` empty — no
Earthdata Login credentials configured. `earthaccess.login(strategy="environment")` fails immediately with
`LoginStrategyUnavailable` before any network call is attempted. This is why the original diagnosis
("hangs indefinitely") was likely a red herring, or masked the real issue — with empty credentials the
auth step should fail fast, not hang; whoever re-attempts this should confirm login succeeds first, in
isolation, before re-running fetch.
**Action needed**: A human must register a free Earthdata Login account at
https://urs.earthdata.nasa.gov and put the username/password into `.env`. Once
`python -c "import earthaccess; earthaccess.login(strategy='environment'); print('OK')"` prints OK,
re-run `make discover fetch REACH=<reach_id>`.
