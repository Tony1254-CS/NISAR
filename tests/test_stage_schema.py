import os
import pandas as pd
import json

def test_stage_data_schema():
    reach = "jamuna-chilmari"
    stage_file = f"data/raw/{reach}/stage/stage_manual.csv"
    decisions_file = "docs/DECISIONS.md"
    
    expected_cols = [
        "station_id", "station_name", "river", "datetime_local",
        "water_level_m_msl", "danger_level_m_msl", "source",
        "source_url", "retrieved_at"
    ]
    
    proxy_fallback_documented = False
    if os.path.exists(decisions_file):
        with open(decisions_file, 'r', encoding='utf-8') as f:
            content = f.read().lower()
            if "proxy fallback" in content or "proxy" in content:
                proxy_fallback_documented = True

    if os.path.exists(stage_file):
        df = pd.read_csv(stage_file)
        # Check schema
        for col in expected_cols:
            assert col in df.columns, f"Missing column {col} in stage_manual.csv"
            
        # Check coverage
        catalog_file = f"data/raw/{reach}/catalog.json"
        if os.path.exists(catalog_file):
            with open(catalog_file, 'r') as f:
                cat = json.load(f)
            nisar_dates = []
            for feat in cat['features']:
                nisar_dates.append(feat['properties']['startTime'][:10])
            nisar_dates = set(nisar_dates)
            
            covered = 0
            if 'datetime_local' in df.columns:
                stage_dates = set(df['datetime_local'].str[:10].tolist())
                for nd in nisar_dates:
                    if nd in stage_dates:
                        covered += 1
            
            coverage = covered / len(nisar_dates) if len(nisar_dates) > 0 else 1.0
            
            if coverage < 0.8:
                assert proxy_fallback_documented, "Stage data coverage < 80% and proxy fallback not documented in DECISIONS.md"
    else:
        # If no stage file, we must have proxy fallback documented
        assert proxy_fallback_documented, "No stage_manual.csv found and proxy fallback not documented in DECISIONS.md"
        print("Using proxy fallback as documented in DECISIONS.md")

if __name__ == "__main__":
    test_stage_data_schema()
