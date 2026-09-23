from src.pipeline.schemas import Manifest, Metric, InputInfo, Params

def build_manifest(reach_id, generated_at, commit_sha, erosion_area, accretion_area, ambiguous_area):
    """
    Builds the Manifest object.
    """
    inputs = [
        InputInfo(kind="NISAR_GCOV", granule="dummy_granule_1", layer="HHHH"),
        InputInfo(kind="FFWC_STAGE", station="dummy_station", value_m=10.5)
    ]
    
    erosion_metric = Metric(
        id="erosion_area",
        label="Land lost to the river",
        value=erosion_area,
        unit="ha",
        definition="Land at t0, water at t1...",
        inputs=inputs,
        params=Params(mmu_px=12)
    )
    
    accretion_metric = Metric(
        id="accretion_area",
        label="New land formed",
        value=accretion_area,
        unit="ha",
        inputs=inputs,
        params=Params(mmu_px=12)
    )
    
    ambiguous_metric = Metric(
        id="ambiguous_area",
        label="Ambiguous classification",
        value=ambiguous_area,
        unit="ha",
        inputs=inputs
    )
    
    return Manifest(
        reach_id=reach_id,
        generated_at=generated_at,
        code_commit=commit_sha,
        metrics=[erosion_metric, accretion_metric, ambiguous_metric]
    )
