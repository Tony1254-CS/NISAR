"""Create a web-ready, georeferenced preview of the local OPERA DSWx-S1 mask.

The input GeoTIFF is retained at the repository root. This script crops it to
the Jamuna case bounds, preserves open-water pixels as a transparent overlay,
and writes provenance beside the PNG for the FluviSAR Decision Desk.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web/public/data/v1/jamuna-chilmari/context"
INPUT = next(ROOT.glob("OPERA_L3_DSWx-S1_*_B02_BWTR.tif"))
WGS84_A = 6378137.0
WGS84_E2 = 0.0066943799901413165
K0 = 0.9996
ZONE = 45
CENTRAL_MERIDIAN = math.radians(ZONE * 6 - 183)


def lonlat_to_utm(lon: float, lat: float) -> tuple[float, float]:
    """Convert WGS84 lon/lat to UTM zone 45 north (metres)."""
    phi = math.radians(lat)
    lam = math.radians(lon)
    ep2 = WGS84_E2 / (1 - WGS84_E2)
    n = WGS84_A / math.sqrt(1 - WGS84_E2 * math.sin(phi) ** 2)
    t = math.tan(phi) ** 2
    c = ep2 * math.cos(phi) ** 2
    aa = math.cos(phi) * (lam - CENTRAL_MERIDIAN)
    m = WGS84_A * (
        (1 - WGS84_E2 / 4 - 3 * WGS84_E2**2 / 64 - 5 * WGS84_E2**3 / 256) * phi
        - (3 * WGS84_E2 / 8 + 3 * WGS84_E2**2 / 32 + 45 * WGS84_E2**3 / 1024) * math.sin(2 * phi)
        + (15 * WGS84_E2**2 / 256 + 45 * WGS84_E2**3 / 1024) * math.sin(4 * phi)
        - (35 * WGS84_E2**3 / 3072) * math.sin(6 * phi)
    )
    easting = 500000 + K0 * n * (
        aa + (1 - t + c) * aa**3 / 6
        + (5 - 18 * t + t**2 + 72 * c - 58 * ep2) * aa**5 / 120
    )
    northing = K0 * (
        m + n * math.tan(phi) * (
            aa**2 / 2
            + (5 - t + 9 * c + 4 * c**2) * aa**4 / 24
            + (61 - 58 * t + t**2 + 600 * c - 330 * ep2) * aa**6 / 720
        )
    )
    return easting, northing


def utm_to_lonlat(easting: float, northing: float) -> list[float]:
    """Convert UTM zone 45 north metres to WGS84 lon/lat."""
    ep2 = WGS84_E2 / (1 - WGS84_E2)
    m = northing / K0
    mu = m / (WGS84_A * (1 - WGS84_E2 / 4 - 3 * WGS84_E2**2 / 64 - 5 * WGS84_E2**3 / 256))
    e1 = (1 - math.sqrt(1 - WGS84_E2)) / (1 + math.sqrt(1 - WGS84_E2))
    phi1 = (
        mu
        + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu)
        + (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
        + (151 * e1**3 / 96) * math.sin(6 * mu)
        + (1097 * e1**4 / 512) * math.sin(8 * mu)
    )
    sin_phi = math.sin(phi1)
    cos_phi = math.cos(phi1)
    tan_phi = math.tan(phi1)
    n1 = WGS84_A / math.sqrt(1 - WGS84_E2 * sin_phi**2)
    r1 = WGS84_A * (1 - WGS84_E2) / (1 - WGS84_E2 * sin_phi**2) ** 1.5
    t1 = tan_phi**2
    c1 = ep2 * cos_phi**2
    d = (easting - 500000) / (n1 * K0)
    lat = phi1 - (n1 * tan_phi / r1) * (
        d**2 / 2
        - (5 + 3 * t1 + 10 * c1 - 4 * c1**2 - 9 * ep2) * d**4 / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * t1**2 - 252 * ep2 - 3 * c1**2) * d**6 / 720
    )
    lon = CENTRAL_MERIDIAN + (
        d - (1 + 2 * t1 + c1) * d**3 / 6
        + (5 - 2 * c1 + 28 * t1 - 3 * c1**2 + 8 * ep2 + 24 * t1**2) * d**5 / 120
    ) / cos_phi
    return [math.degrees(lon), math.degrees(lat)]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(INPUT)
    tags = src.tag_v2
    pixel_x, pixel_y, _ = tags[33550]
    tie = tags[33922]
    origin_e, origin_n = tie[3], tie[4]
    # Include a 1 km context margin around the actual Jamuna analysis bounds.
    west, south, east, north = 89.5923848, 25.3942552, 89.9084208, 25.7556806
    corners = [lonlat_to_utm(west, south), lonlat_to_utm(west, north),
               lonlat_to_utm(east, south), lonlat_to_utm(east, north)]
    left = math.floor((min(p[0] for p in corners) - 1000 - origin_e) / pixel_x)
    right = math.ceil((max(p[0] for p in corners) + 1000 - origin_e) / pixel_x)
    top = math.floor((origin_n - max(p[1] for p in corners) - 1000) / pixel_y)
    bottom = math.ceil((origin_n - min(p[1] for p in corners) + 1000) / pixel_y)
    left, top = max(0, left), max(0, top)
    right, bottom = min(src.width, right), min(src.height, bottom)
    crop = src.crop((left, top, right, bottom)).convert("L")

    # OPERA BWTR class 1 means water. Class 0 is valid non-water; other values
    # are masked or no-data and stay transparent in this comparison overlay.
    rgba = Image.new("RGBA", crop.size)
    pixels = crop.load()
    rgba_pixels = rgba.load()
    for y in range(crop.height):
        for x in range(crop.width):
            if pixels[x, y] == 1:
                rgba_pixels[x, y] = (43, 179, 205, 190)
    image_path = OUT / "opera-dswx-s1-20260617.png"
    rgba.save(image_path, optimize=True)

    # ImageSource coordinates follow top-left, top-right, bottom-right,
    # bottom-left and use pixel-edge coordinates, not pixel centres.
    crop_left_e = origin_e + left * pixel_x
    crop_top_n = origin_n - top * pixel_y
    crop_right_e = origin_e + right * pixel_x
    crop_bottom_n = origin_n - bottom * pixel_y
    coordinates = [
        utm_to_lonlat(crop_left_e, crop_top_n),
        utm_to_lonlat(crop_right_e, crop_top_n),
        utm_to_lonlat(crop_right_e, crop_bottom_n),
        utm_to_lonlat(crop_left_e, crop_bottom_n),
    ]
    metadata = {
        "id": "opera-dswx-s1-20260617",
        "title": "OPERA DSWx-S1 water extent",
        "sensor": "Sentinel-1 C-band SAR",
        "acquired": "2026-06-17T12:13:17Z",
        "processed": "2026-08-25T22:17:22Z",
        "product": "OPERA_L3_DSWx-S1 V1 B02_BWTR",
        "classification": "BWTR class 1 (water); valid non-water and masked/no-data classes are transparent",
        "resolution_m": [pixel_x, pixel_y],
        "crs_source": tags[34737],
        "source_file": INPUT.name,
        "source_provider": "NASA/JPL OPERA, distributed by NASA Earthdata",
        "attribution": "NASA/JPL OPERA DSWx-S1; Sentinel-1 data",
        "coordinates": coordinates,
        "interpretation": "Dated contextual water observation. It is not a same-date validation of the August/September NISAR pair.",
        "source_band": "B02_BWTR",
    }
    (OUT / "opera-dswx-s1-20260617.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"image": str(image_path), "size": rgba.size, "coordinates": coordinates, "bytes": image_path.stat().st_size}, indent=2))


if __name__ == "__main__":
    main()
