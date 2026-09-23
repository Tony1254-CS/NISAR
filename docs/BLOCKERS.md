# Blockers

## P0.3: Missing Earthdata Login Credentials
**What I tried:** Attempted to run the EDL login smoke test for task P0.3.
**What failed:** The test threw an `earthaccess.exceptions.LoginStrategyUnavailable` exception.
**What I need:** The human team member needs to copy `.env.example` to `.env` and fill in their actual `EARTHDATA_USERNAME` and `EARTHDATA_PASSWORD`.
