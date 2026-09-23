import json
import pytest
from src.pipeline.schemas import Manifest, Metric, InputInfo

def test_manifest_schema():
    data = {
        "reach_id": "jamuna-kazipur",
        "generated_at": "2026-11-14T18:40:00Z",
        "code_commit": "abcdef",
        "metrics": [
            {
                "id": "erosion_area",
                "label": "Land lost",
                "value": 100.5,
                "low": 90.0,
                "high": 110.0,
                "unit": "ha",
                "inputs": [
                    {"kind": "NISAR_GCOV", "granule": "G1"}
                ]
            }
        ]
    }
    
    # This will raise ValidationError if invalid
    manifest = Manifest(**data)
    assert manifest.reach_id == "jamuna-kazipur"
    assert len(manifest.metrics) == 1
    assert manifest.metrics[0].id == "erosion_area"
    assert manifest.metrics[0].inputs[0].granule == "G1"
