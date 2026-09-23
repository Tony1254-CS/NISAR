# Blockers

## P0.2: Missing Mamba / Conda
**What I tried:** Attempted to install pipeline dependencies per `plan.md` §4.1 via `mamba` or `conda` after creating `environment.yml` and `.env.example`.
**What failed:** Both `mamba` and `conda` commands are missing from the system path (CommandNotFoundException).
**What I need:** The user needs to install Miniforge/Mamba or Anaconda/Miniconda on the system and ensure it is available in the system PATH.
