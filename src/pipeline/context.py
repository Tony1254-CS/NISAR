import argparse
import os
import json

def main():
    parser = argparse.ArgumentParser(description="Generate context layers (IMERG, HLS, CEGIS)")
    parser.add_argument("--reach", required=True, help="Reach ID")
    parser.add_argument("--out-dir", required=True, help="Output directory")
    args = parser.parse_args()

    # Create dummy optical and forecast data
    os.makedirs(args.out_dir, exist_ok=True)
    
    optical_path = os.path.join(args.out_dir, "optical.png")
    with open(optical_path, "wb") as f:
        # 1x1 transparent PNG
        f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82')
        
    forecast_path = os.path.join(args.out_dir, "forecast.geojson")
    with open(forecast_path, "w") as f:
        json.dump({
            "type": "FeatureCollection",
            "features": []
        }, f)
        
    rain_path = os.path.join(args.out_dir, "rain.json")
    with open(rain_path, "w") as f:
        json.dump({
            "series": []
        }, f)
        
    print(f"Context layers generated in {args.out_dir}")

if __name__ == "__main__":
    main()
