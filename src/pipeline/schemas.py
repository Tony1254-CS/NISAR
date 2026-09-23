from typing import List, Literal, Optional, Any, Dict
from pydantic import BaseModel, Field

class ReachListItem(BaseModel):
    reach_id: str
    name: str
    river: str
    bbox: List[float] # [min_lon, min_lat, max_lon, max_lat]
    verdict: Literal["SUPPORTED", "LIMITED", "INCONCLUSIVE"]
    data_frozen_at: str
    bundle_version: str

class Track(BaseModel):
    relative_orbit: int
    direction: Literal["A", "D"]
    frame: int

class AcquisitionStatus(BaseModel):
    date: str
    acq_utc: str
    status: Literal["ok", "rfi", "rejected", "implausible"]
    stage_m: Optional[float]
    stage_source: Literal["FFWC", "proxy", "null"]

class PrimaryPair(BaseModel):
    t0: str
    t1: str
    type: Literal["equal_stage", "later_lower"]
    dh_m: float

class ReachDetail(BaseModel):
    reach_id: str
    name: str
    river: str
    bbox: List[float]
    crs_analysis: str
    track: Track
    dates: List[AcquisitionStatus]
    primary_pair: PrimaryPair
    verdict: Literal["SUPPORTED", "LIMITED", "INCONCLUSIVE"]
    verdict_reasons: List[str]
    headline_metric_id: str

class InputInfo(BaseModel):
    kind: str
    granule: Optional[str] = None
    acq_utc: Optional[str] = None
    layer: Optional[str] = None
    doi: Optional[str] = None
    station: Optional[str] = None
    value_m: Optional[float] = None
    time_local: Optional[str] = None
    source_url: Optional[str] = None

class Params(BaseModel):
    threshold_db_t0: Optional[float] = None
    threshold_db_t1: Optional[float] = None
    median_filter: Optional[int] = None
    mmu_px: Optional[int] = None
    hand_max_m: Optional[float] = None

class Metric(BaseModel):
    id: str
    label: str
    value: float
    low: Optional[float] = None
    high: Optional[float] = None
    unit: str
    definition: Optional[str] = None
    method_ref: Optional[str] = None
    inputs: Optional[List[InputInfo]] = None
    params: Optional[Params] = None
    pixel_area_m2: Optional[float] = None
    pixel_count: Optional[int] = None
    qc_refs: Optional[List[str]] = None

class Manifest(BaseModel):
    reach_id: str
    generated_at: str
    code_commit: str
    metrics: List[Metric]

class Station(BaseModel):
    id: str
    name: str
    river: str
    danger_level_m: Optional[float] = None
    source: str

class SeriesPoint(BaseModel):
    t: str
    h: float

class AcqPoint(BaseModel):
    date: str
    t: str
    h: float
    status: str

class Stage(BaseModel):
    station: Station
    series: List[SeriesPoint]
    acquisitions: List[AcqPoint]
    mode: Literal["gauge", "proxy"]

class QCCheck(BaseModel):
    id: str
    label: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    status: Literal["PASS", "WARN", "FAIL", "NOT_EVALUATED", "INFO"]
    rule: Optional[str] = None
    explanation: Optional[str] = None
    inputs: Optional[List[InputInfo]] = None

class QC(BaseModel):
    checks: List[QCCheck]

class Bounds(BaseModel):
    coordinates: List[List[float]] # [[lng, lat] * 4]

class ErosionProperties(BaseModel):
    id: str
    class_name: Literal["erosion", "accretion"] = Field(alias="class")
    area_ha: float
    pixel_count: int
    t0: str
    t1: str
    confirmed_by_dswx: Optional[bool] = None
    centroid: List[float]
    nearest_place: Optional[str] = None
    in_cegis_reach: Optional[str] = None

class AllModels(BaseModel):
    reaches: List[ReachListItem]
    reach: ReachDetail
    manifest: Manifest
    stage: Stage
    qc: QC
    bounds: Bounds
    erosion_props: ErosionProperties

def export_schemas(out_dir="schemas"):
    import os
    import json
    os.makedirs(out_dir, exist_ok=True)
    models = {
        "reaches": ReachListItem, # Note: this is a list of these usually
        "reach": ReachDetail,
        "manifest": Manifest,
        "stage": Stage,
        "qc": QC,
        "bounds": Bounds,
        "erosion_props": ErosionProperties
    }
    for name, model in models.items():
        with open(os.path.join(out_dir, f"{name}.json"), "w") as f:
            # pydantic v2
            if hasattr(model, 'model_json_schema'):
                json.dump(model.model_json_schema(), f, indent=2)
            else:
                json.dump(model.schema(), f, indent=2)
                
    with open(os.path.join(out_dir, "all.json"), "w") as f:
        if hasattr(AllModels, 'model_json_schema'):
            json.dump(AllModels.model_json_schema(), f, indent=2)
        else:
            json.dump(AllModels.schema(), f, indent=2)


if __name__ == "__main__":
    export_schemas()
