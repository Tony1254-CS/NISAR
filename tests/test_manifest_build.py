import pytest
from src.pipeline.manifest import build_manifest

def test_build_manifest():
    manifest = build_manifest(
        reach_id="jamuna-kazipur",
        generated_at="2026-11-14T18:40:00Z",
        commit_sha="abcdef",
        erosion_area=100.0,
        accretion_area=50.0,
        ambiguous_area=10.0
    )
    
    # Must be valid Pydantic model
    assert manifest.reach_id == "jamuna-kazipur"
    
    # Every metric has >=1 input with a granule/source
    for m in manifest.metrics:
        assert m.inputs is not None
        assert len(m.inputs) >= 1
        has_granule_or_source = any((i.granule is not None) or (i.station is not None) for i in m.inputs)
        assert has_granule_or_source
