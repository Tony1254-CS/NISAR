"""
Fetch GPM IMERG Late-run daily precipitation (GPM_3IMERGDL) for a reach's AOI
and compute a rainfall-anomaly stat: 7-day rain sum before an acquisition vs
the mean 7-day rolling sum over a longer baseline window. Real data, small
files (~32MB/day, global 0.1deg grid) -- nothing like NISAR's per-granule size.
"""
import os
import glob
import json
import numpy as np
import xarray as xr
import earthaccess


def fetch_imerg_range(start_date, end_date, out_dir="data/raw/common/imerg"):
    os.makedirs(out_dir, exist_ok=True)
    earthaccess.login(strategy="environment")
    results = earthaccess.search_data(
        short_name="GPM_3IMERGDL",
        temporal=(start_date, end_date),
    )
    existing = {os.path.basename(p) for p in glob.glob(os.path.join(out_dir, "*.nc4"))}
    to_fetch = [r for r in results if r["umm"]["DataGranule"]["Identifiers"][0]["Identifier"] not in existing]
    if to_fetch:
        earthaccess.download(to_fetch, local_path=out_dir)
    return sorted(glob.glob(os.path.join(out_dir, "*.nc4")))


def daily_aoi_precip(nc_paths, bbox):
    """Returns a sorted list of (date_str, mean_mm_per_day) over the bbox."""
    w, s, e, n = bbox
    series = []
    for p in nc_paths:
        with xr.open_dataset(p) as ds:
            sub = ds["precipitation"].sel(lon=slice(w, e), lat=slice(s, n))
            val = float(sub.mean(skipna=True).values)
            date = str(ds["time"].values[0])[:10]
            series.append((date, val))
    series.sort(key=lambda x: x[0])
    return series


def rainfall_anomaly(series, target_date, window_days=7):
    """
    Compares the window_days-day rain sum ending at target_date against the
    mean window_days-day rolling sum over the whole series (the "seasonal
    norm" for this stretch of data). Returns (sum_before, baseline_mean, ratio).
    """
    dates = [d for d, _ in series]
    values = np.array([v for _, v in series])
    if target_date not in dates:
        return None
    idx = dates.index(target_date)
    if idx + 1 < window_days:
        return None
    window_sum = values[idx + 1 - window_days: idx + 1].sum()

    rolling_sums = []
    for i in range(window_days - 1, len(values)):
        rolling_sums.append(values[i + 1 - window_days: i + 1].sum())
    baseline_mean = float(np.mean(rolling_sums)) if rolling_sums else 0.0

    ratio = window_sum / baseline_mean if baseline_mean > 0 else None
    return {
        "window_days": window_days,
        "rain_mm_before": round(float(window_sum), 2),
        "baseline_mean_mm": round(baseline_mean, 2),
        "ratio_to_baseline": round(ratio, 2) if ratio is not None else None,
    }


if __name__ == "__main__":
    import argparse
    import yaml

    parser = argparse.ArgumentParser()
    parser.add_argument("--reach", required=True)
    parser.add_argument("--start", required=True)
    parser.add_argument("--end", required=True)
    args = parser.parse_args()

    with open(f"config/reaches/{args.reach}.yaml", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    paths = fetch_imerg_range(args.start, args.end)
    series = daily_aoi_precip(paths, cfg["bbox"])

    out_path = f"data/processed/{args.reach}/imerg_series.json"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump({"series": series}, f, indent=2)
    print(f"Wrote {len(series)} days to {out_path}")
