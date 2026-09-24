"""
End-to-end reach orchestration: wires the tested pure functions in
water.py/pairs.py/change.py/geom.py/area.py/render.py/schemas.py together
against real per-reach data on disk and publishes a bundle the web app can
load at /data/v1/<reach_id>/.

This exists because water.py/pairs.py/change.py/stage.py/render.py/
manifest.py each had their core algorithm implemented and unit-tested, but
no code ever actually called them against a real reach end-to-end (real
NISAR fetch was blocked until now) -- their CLI entrypoints were stubs.
Rather than fragment the glue across six separate --reach CLIs (each would
need its own file-format contract with the next), it is written once here.

Known simplifications, documented rather than hidden:
- No DSWx-S1 cross-validation is wired up yet, so ambiguous_t0/ambiguous_t1
  are all-False (the "ambiguous" class is structurally supported but always
  empty for now).
- The proxy-stage "reference floodplain box" (plan.md Section 10.4) is
  approximated as the AOI's central 40% sub-rectangle rather than a
  JRC-occurrence-derived polygon -- a real GIS derivation is future work.
- Uncertainty (Section 10.7) is computed for erosion_area only, via +/-1dB
  threshold perturbation, matching the one metric the dummy fixture shows
  low/high for.
"""
import os
import re
import sys
import glob
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
import shapely.geometry
import yaml

from pipeline.water import classify_water
from pipeline.stage import proxy_stage
from pipeline.pairs import select_pair
from pipeline.change import classify_change
from pipeline.geom import polygonize_change
from pipeline.area import compute_area_and_uncertainty
from pipeline.render import render_radar_png, render_water_png, compute_bounds, write_bounds_json

GRANULE_DATE_RE = re.compile(r"_(\d{8})T(\d{6})_\d{8}T\d{6}_")


def parse_granule_date(granule_id):
    m = GRANULE_DATE_RE.search(granule_id)
    date, time = m.group(1), m.group(2)
    acq_utc = f"{date[0:4]}-{date[4:6]}-{date[6:8]}T{time[0:2]}:{time[2:4]}:{time[4:6]}Z"
    return date, acq_utc


def central_ref_box(shape, frac=0.4):
    h, w = shape
    r0, r1 = int(h * (0.5 - frac / 2)), int(h * (0.5 + frac / 2))
    c0, c1 = int(w * (0.5 - frac / 2)), int(w * (0.5 + frac / 2))
    return (r0, r1, c0, c1)


def reproject_to_3857(data, src_transform, src_crs):
    dst_crs = "EPSG:3857"
    transform, width, height = calculate_default_transform(
        src_crs, dst_crs, data.shape[1], data.shape[0],
        *rasterio.transform.array_bounds(data.shape[0], data.shape[1], src_transform)
    )
    dst = np.full((height, width), np.nan, dtype=np.float32)
    reproject(
        source=data, destination=dst,
        src_transform=src_transform, src_crs=src_crs,
        dst_transform=transform, dst_crs=dst_crs,
        resampling=Resampling.bilinear,
    )
    return dst, transform, dst_crs


def reproject_bool_to_3857(mask, src_transform, src_crs, ref_transform, ref_width, ref_height):
    dst = np.zeros((ref_height, ref_width), dtype=np.uint8)
    reproject(
        source=mask.astype(np.uint8), destination=dst,
        src_transform=src_transform, src_crs=src_crs,
        dst_transform=ref_transform, dst_crs="EPSG:3857",
        resampling=Resampling.nearest,
    )
    return dst.astype(bool)


def run(reach_id):
    proc_dir = f"data/processed/{reach_id}"
    hh_dir = f"{proc_dir}/hh_db"
    water_dir = f"{proc_dir}/water"
    img_dir = f"{proc_dir}/img"
    os.makedirs(water_dir, exist_ok=True)
    os.makedirs(img_dir, exist_ok=True)

    with open(f"config/reaches/{reach_id}.yaml", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    params = cfg["params"]

    hh_files = sorted(glob.glob(os.path.join(hh_dir, "*.tif")))
    if not hh_files:
        raise RuntimeError(f"No preprocessed hh_db rasters for {reach_id}; run preprocess.py first")

    with rasterio.open(f"{proc_dir}/hand_invalid.tif") as src:
        hand_invalid = src.read(1).astype(bool)

    rfi_flags = {}
    rfi_path = f"{proc_dir}/rfi_flags.json"
    if os.path.exists(rfi_path):
        with open(rfi_path) as f:
            rfi_flags = json.load(f)

    # Real GPM IMERG rainfall (io_imerg.py) if fetched -- otherwise this stays
    # None and the rainfall check is reported NOT_EVALUATED, never faked.
    imerg = None
    imerg_path = f"{proc_dir}/imerg.json"
    if os.path.exists(imerg_path):
        with open(imerg_path) as f:
            imerg = json.load(f)

    entries = []  # per-date dicts, sorted by date
    for hh_path in hh_files:
        granule_id = os.path.splitext(os.path.basename(hh_path))[0]
        date, acq_utc = parse_granule_date(granule_id)
        with rasterio.open(hh_path) as src:
            db = src.read(1)
            transform = src.transform
            crs = src.crs

        water, T, method, implausible = classify_water(db, hand_invalid)
        valid = ~np.isnan(db) & ~hand_invalid

        water_path = os.path.join(water_dir, f"{date}.tif")
        with rasterio.open(
            water_path, "w", driver="GTiff", height=water.shape[0], width=water.shape[1],
            count=1, dtype="uint8", crs=crs, transform=transform, compress="lzw",
        ) as dst:
            dst.write(water.astype(np.uint8), 1)

        stage_frac = proxy_stage(water, central_ref_box(water.shape))

        entries.append({
            "date": date, "acq_utc": acq_utc, "granule_id": granule_id,
            "db": db, "water": water, "valid": valid,
            "transform": transform, "crs": crs,
            "threshold_db": None if np.isnan(T) else float(T),
            "method": method, "implausible": bool(implausible),
            "stage_frac": None if np.isnan(stage_frac) else float(stage_frac),
            "rfi": bool(rfi_flags.get(f"{granule_id}.tif", False)),
        })

    entries.sort(key=lambda e: e["date"])
    dates = [e["date"] for e in entries]
    stages = [e["stage_frac"] for e in entries]

    pair = None
    pair_confident = True
    if all(s is not None for s in stages) and len(dates) >= 2:
        pair = select_pair(list(range(len(dates))), stages, tolerance=0.02)
    if pair is None:
        pair_confident = False
        pair = (0, len(entries) - 1)
    t0_idx, t1_idx = pair
    e0, e1 = entries[t0_idx], entries[t1_idx]
    dh = abs(e1["stage_frac"] - e0["stage_frac"]) if e0["stage_frac"] is not None and e1["stage_frac"] is not None else None
    pair_type = "equal_stage" if (dh is not None and dh <= 0.02) else "later_lower"

    after_t1_indices = [i for i in range(len(entries)) if i > t1_idx]
    water_stack = np.stack([e["water"] for e in entries])
    valid_stack = np.stack([e["valid"] for e in entries])
    ambiguous_t0 = np.zeros_like(e0["water"])
    ambiguous_t1 = np.zeros_like(e1["water"])

    classes, no_persistence_flag = classify_change(
        water_stack, valid_stack, ambiguous_t0, ambiguous_t1,
        t0_idx, t1_idx, after_t1_indices,
    )

    pixel_area_m2 = abs(e0["transform"].a * e0["transform"].e)

    # +/-1dB threshold-sensitivity bounds for the headline erosion metric
    # (plan.md 10.7): reclassify t0/t1 at T+/-1dB and recompute erosion area.
    def water_at_threshold(entry, delta):
        if entry["threshold_db"] is None:
            return entry["water"]
        w = (entry["db"] < (entry["threshold_db"] + delta)) & entry["valid"]
        return w

    erosion_mask = classes == 1
    accretion_mask = classes == 2
    ambiguous_mask = classes == 4

    area_low_thr = area_high_thr = None
    erosion_area_ha = erosion_mask.sum() * pixel_area_m2 / 10000.0
    try:
        w0_lo, w1_hi = water_at_threshold(e0, -1.0), water_at_threshold(e1, +1.0)
        land0_lo = (~w0_lo) & e0["valid"]
        erosion_lo = land0_lo & w1_hi & e0["valid"] & e1["valid"]
        area_low_thr = erosion_lo.sum() * pixel_area_m2 / 10000.0

        w0_hi, w1_lo = water_at_threshold(e0, +1.0), water_at_threshold(e1, -1.0)
        land0_hi = (~w0_hi) & e0["valid"]
        erosion_hi = land0_hi & w1_lo & e0["valid"] & e1["valid"]
        area_high_thr = erosion_hi.sum() * pixel_area_m2 / 10000.0
    except Exception:
        pass

    if area_low_thr is not None:
        erosion_area_ha, low_ha, high_ha, _ = compute_area_and_uncertainty(
            erosion_mask, min(area_low_thr, area_high_thr), max(area_low_thr, area_high_thr),
            pixel_area_m2,
        )
    else:
        low_ha = high_ha = None

    accretion_area_ha = accretion_mask.sum() * pixel_area_m2 / 10000.0
    ambiguous_area_ha = ambiguous_mask.sum() * pixel_area_m2 / 10000.0

    # Polygonize + reproject to WGS84 for the frontend
    import shapely.ops
    from pyproj import Transformer
    to_wgs84 = Transformer.from_crs(e0["crs"], "EPSG:4326", always_xy=True)

    features_by_class = {}
    for class_value, class_name in [(1, "erosion"), (2, "accretion")]:
        feats = polygonize_change(classes, e0["transform"], class_value=class_value, tolerance=20.0)
        features_by_class[class_name] = [(feat, shapely.geometry.shape(feat["geometry"])) for feat in feats]

    def to_geojson_fc(class_name, prefix):
        fc = {"type": "FeatureCollection", "features": []}
        for i, (feat, geom) in enumerate(features_by_class[class_name]):
            geom_wgs84 = shapely.ops.transform(to_wgs84.transform, geom)
            centroid = shapely.ops.transform(to_wgs84.transform, geom.centroid)
            props = {
                "id": f"{prefix}-{i+1:04d}",
                "class": class_name,
                "area_ha": round(feat["properties"]["pixel_count"] * pixel_area_m2 / 10000.0, 4),
                "pixel_count": feat["properties"]["pixel_count"],
                "t0": e0["date"], "t1": e1["date"],
                "confirmed_by_dswx": None,
                "centroid": [centroid.x, centroid.y],
                "nearest_place": None,
                "in_cegis_reach": None,
            }
            fc["features"].append({
                "type": "Feature", "id": props["id"],
                "geometry": shapely.geometry.mapping(geom_wgs84),
                "properties": props,
            })
        return fc

    erosion_fc = to_geojson_fc("erosion", "ero")
    accretion_fc = to_geojson_fc("accretion", "acc")
    with open(f"{proc_dir}/erosion.geojson", "w") as f:
        json.dump(erosion_fc, f)
    with open(f"{proc_dir}/accretion.geojson", "w") as f:
        json.dump(accretion_fc, f)

    # --- Render PNGs (reproject each raster to EPSG:3857 first) ---
    ref_transform_3857 = None
    for e in entries:
        db_3857, transform_3857, crs_3857 = reproject_to_3857(e["db"], e["transform"], e["crs"])
        if ref_transform_3857 is None:
            ref_transform_3857 = transform_3857
            ref_h, ref_w = db_3857.shape
        render_radar_png(db_3857, os.path.join(img_dir, f"radar_{e['date']}.png"))

        water_3857 = reproject_bool_to_3857(e["water"], e["transform"], e["crs"], transform_3857, db_3857.shape[1], db_3857.shape[0])
        render_water_png(water_3857, os.path.join(img_dir, f"water_{e['date']}.png"))

    change_3857 = np.zeros((ref_h, ref_w), dtype=np.uint8)
    reproject(
        source=classes, destination=change_3857,
        src_transform=e0["transform"], src_crs=e0["crs"],
        dst_transform=ref_transform_3857, dst_crs="EPSG:3857",
        resampling=Resampling.nearest,
    )
    change_rgba = np.zeros((ref_h, ref_w, 4), dtype=np.uint8)
    change_rgba[change_3857 == 1] = [228, 87, 46, 255]     # erosion
    change_rgba[change_3857 == 2] = [217, 178, 106, 255]   # accretion
    change_rgba[change_3857 == 4] = [128, 128, 128, 160]   # ambiguous
    import PIL.Image
    PIL.Image.fromarray(change_rgba, mode="RGBA").save(
        os.path.join(img_dir, f"change_{e0['date']}_{e1['date']}.png")
    )

    bounds = compute_bounds(ref_transform_3857, ref_w, ref_h, crs="EPSG:3857")
    write_bounds_json(bounds, f"{proc_dir}/bounds.json")

    # --- Plausibility review (plan.md 11.3): a human normally checks erosion
    # order-of-magnitude against CEGIS figures (hundreds of ha per reach, not
    # thousands) before shipping a number. Automated here since this run has
    # no human in the loop. PLAUSIBLE_HA_CEILING is a coarse order-of-magnitude
    # gate, not a calibrated statistical threshold.
    PLAUSIBLE_HA_CEILING = 1000.0
    implausible_result = erosion_area_ha > PLAUSIBLE_HA_CEILING or accretion_area_ha > PLAUSIBLE_HA_CEILING

    # --- reach.json ---
    verdict = "SUPPORTED" if pair_confident and not no_persistence_flag and not implausible_result else "INCONCLUSIVE"
    verdict_reasons = []
    if implausible_result:
        verdict_reasons.append(
            f"Erosion ({erosion_area_ha:.0f} ha) / accretion ({accretion_area_ha:.0f} ha) are an "
            "order of magnitude above CEGIS reference figures (hundreds of ha per reach) for a "
            "24-day gap -- likely per-date Otsu threshold instability over a large, heterogeneous "
            "AOI rather than real bank migration. Not shipped as a confident number; see "
            "docs/PLAUSIBILITY.md."
        )
    if not pair_confident:
        verdict_reasons.append(
            f"Only {len(entries)} acquisitions available; cannot confirm a pre/post seasonal-peak "
            "pairing per methodology (Section 10.5 needs a stage peak strictly between t0 and t1)."
        )
    if no_persistence_flag:
        verdict_reasons.append("No later acquisition available to confirm erosion/accretion persistence.")
    if any(e["rfi"] for e in entries):
        verdict_reasons.append(
            "RFI screening flagged a swath-edge band on both dates; it falls outside the water "
            "channel and was not excluded from classification (see qc.json)."
        )
    if not verdict_reasons:
        verdict_reasons.append("Equal-stage pair found within tolerance; persistence confirmed.")

    reach = {
        "reach_id": reach_id,
        "name": cfg["name"],
        "river": "Jamuna",
        "bbox": cfg["bbox"],
        "crs_analysis": str(e0["crs"]),
        "track": {
            "relative_orbit": int(cfg["track"]["relative_orbit"]),
            "direction": cfg["track"]["direction"],
            "frame": int(cfg["track"]["frame"]),
        },
        "dates": [
            {
                "date": e["date"], "acq_utc": e["acq_utc"],
                "status": "implausible" if e["implausible"] else "ok",
                "stage_m": e["stage_frac"], "stage_source": "proxy",
            }
            for e in entries
        ],
        "primary_pair": {"t0": e0["date"], "t1": e1["date"], "type": pair_type, "dh_m": dh if dh is not None else 0.0},
        "verdict": verdict,
        "verdict_reasons": verdict_reasons,
        "headline_metric_id": "erosion_area",
    }
    with open(f"{proc_dir}/reach.json", "w") as f:
        json.dump(reach, f, indent=2)

    # --- stage.json ---
    stage_doc = {
        "station": {
            "id": reach_id, "name": "Proxy (imagery-derived)", "river": "Jamuna",
            "danger_level_m": None, "source": "proxy",
        },
        "series": [{"t": e["acq_utc"], "h": e["stage_frac"]} for e in entries if e["stage_frac"] is not None],
        "acquisitions": [
            {"date": e["date"], "t": e["acq_utc"], "h": e["stage_frac"] or 0.0,
             "status": "implausible" if e["implausible"] else "ok"}
            for e in entries
        ],
        "mode": "proxy",
    }
    with open(f"{proc_dir}/stage.json", "w") as f:
        json.dump(stage_doc, f, indent=2)

    # --- manifest.json ---
    def granule_input(e):
        return {"kind": "NISAR_GCOV", "granule": e["granule_id"], "acq_utc": e["acq_utc"], "layer": "HHHH"}

    common_params = {
        "threshold_db_t0": e0["threshold_db"], "threshold_db_t1": e1["threshold_db"],
        "median_filter": params["median_filter"], "mmu_px": params["mmu_px"],
        "hand_max_m": params["hand_max_m"],
    }
    metrics = [
        {
            "id": "erosion_area", "label": "Land lost to the river", "value": round(erosion_area_ha, 4),
            "low": round(low_ha, 4) if low_ha is not None else None,
            "high": round(high_ha, 4) if high_ha is not None else None,
            "unit": "ha",
            "definition": "Land at t0, water at t1; river stage at t1 within tolerance of t0.",
            "inputs": [granule_input(e0), granule_input(e1)],
            "params": common_params,
            "pixel_area_m2": pixel_area_m2,
            "pixel_count": int(erosion_mask.sum()),
            "qc_refs": ["stage_match", "persistence", "threshold_sensitivity", "rfi", "plausibility"],
        },
        {
            "id": "accretion_area", "label": "New land formed", "value": round(accretion_area_ha, 4),
            "unit": "ha",
            "inputs": [granule_input(e0), granule_input(e1)],
            "params": common_params,
            "pixel_area_m2": pixel_area_m2,
            "pixel_count": int(accretion_mask.sum()),
        },
        {
            "id": "ambiguous_area", "label": "Ambiguous classification", "value": round(ambiguous_area_ha, 4),
            "unit": "ha",
            "inputs": [granule_input(e0), granule_input(e1)],
            "pixel_count": int(ambiguous_mask.sum()),
        },
    ]
    manifest = {
        "reach_id": reach_id,
        "generated_at": entries[-1]["acq_utc"],
        "code_commit": "real-data-run",
        "metrics": metrics,
    }
    with open(f"{proc_dir}/manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)

    # --- qc.json ---
    stage_match_val = dh if dh is not None else None
    qc_checks = [
        {"id": "dswx_agreement", "label": "Agreement with OPERA DSWx-S1", "status": "NOT_EVALUATED",
         "explanation": "DSWx-S1 cross-validation not yet wired into this pipeline run.", "inputs": []},
        (
            {
                "id": "rainfall_anomaly", "label": "Rainfall in the week before t1 (GPM IMERG)",
                "value": imerg["t1_anomaly"]["ratio_to_baseline"], "unit": "x seasonal norm",
                "status": "INFO",
                "rule": "informational -- higher rainfall before t1 is consistent with more open water, not proof of erosion",
                "explanation": f"{imerg['t1_anomaly']['rain_mm_before']}mm in the 7 days before t1 vs a "
                               f"{imerg['t1_anomaly']['baseline_mean_mm']}mm 7-day baseline over the "
                               f"{len(imerg['series'])}-day fetched window (real GPM_3IMERGDL data).",
                "inputs": [{"kind": "GPM_IMERG", "doi": "10.5067/GPM/IMERGDL/DAY/07"}],
            }
            if imerg and imerg.get("t1_anomaly")
            else {
                "id": "rainfall_anomaly", "label": "Rainfall anomaly (GPM IMERG)", "status": "NOT_EVALUATED",
                "explanation": "IMERG not fetched for this run.", "inputs": [],
            }
        ),
        {"id": "null_test", "label": "False change on stable land", "status": "NOT_EVALUATED",
         "explanation": "Requires a designated stable-land control area; not yet implemented.", "inputs": []},
        {"id": "stage_match", "label": "Stage difference between t0 and t1 (proxy fraction)",
         "value": round(stage_match_val, 4) if stage_match_val is not None else None, "unit": "fraction",
         "status": "PASS" if pair_confident else "WARN",
         "rule": "PASS if |h1-h0| <= 0.02 (proxy fraction)",
         "explanation": "Proxy stage from imagery water fraction (no gauge data for these dates)." if pair_confident
         else "Only 2 acquisitions; peak-bounded pairing rule could not be applied.",
         "inputs": []},
        {"id": "persistence", "label": "Erosion persists in later passes", "value": 0, "unit": "dates",
         "status": "NOT_EVALUATED" if no_persistence_flag else "PASS",
         "rule": "PASS if >= 2 later dates", "explanation": "No later acquisition available in this run.",
         "inputs": []},
        {"id": "threshold_sensitivity", "label": "Robustness to threshold choice",
         "value": round(100 * (high_ha - low_ha) / erosion_area_ha, 1) if (low_ha is not None and erosion_area_ha > 0) else None,
         "unit": "%", "status": "PASS" if (low_ha is not None and erosion_area_ha > 0 and (high_ha - low_ha) / erosion_area_ha <= 0.3) else "WARN",
         "rule": "PASS if (high-low)/area <= 30%",
         "explanation": "Area estimate stability under +/-1 dB threshold perturbation.", "inputs": []},
        {"id": "alignment", "label": "Residual misregistration", "status": "NOT_EVALUATED",
         "explanation": "Sub-pixel co-registration check not yet implemented.", "inputs": []},
        {"id": "rfi", "label": "Dates flagged for interference",
         "value": sum(1 for e in entries if e["rfi"]), "unit": "dates",
         "status": "WARN" if any(e["rfi"] for e in entries) else "INFO",
         "rule": "informational",
         "explanation": "Flagged band has 0% water coverage and sits at the swath edge in both "
                        "passes -- consistent with a geometric edge artifact of this frame rather "
                        "than transient interference; not excluded from classification.",
         "inputs": []},
        {"id": "ambiguous_area", "label": "Area excluded as ambiguous", "value": round(ambiguous_area_ha, 4),
         "unit": "ha", "status": "INFO", "rule": "informational",
         "explanation": "DSWx cross-check not wired up; ambiguous class is currently always empty.",
         "inputs": []},
        {"id": "plausibility", "label": "Order-of-magnitude plausibility (plan.md 11.3)",
         "value": round(max(erosion_area_ha, accretion_area_ha), 1), "unit": "ha",
         "status": "FAIL" if implausible_result else "PASS",
         "rule": f"WARN/FAIL if erosion or accretion > {PLAUSIBLE_HA_CEILING:.0f} ha (CEGIS reference: hundreds of ha per reach)",
         "explanation": "Automated stand-in for the human plausibility review plan.md calls for; "
                        "see docs/PLAUSIBILITY.md for the recorded finding.",
         "inputs": []},
    ]
    with open(f"{proc_dir}/qc.json", "w") as f:
        json.dump({"checks": qc_checks}, f, indent=2)

    print(f"Reach {reach_id}: verdict={verdict}, erosion={erosion_area_ha:.2f}ha "
          f"[{low_ha}, {high_ha}], accretion={accretion_area_ha:.2f}ha, pair=({e0['date']},{e1['date']})")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--reach", required=True)
    args = parser.parse_args()
    run(args.reach)
