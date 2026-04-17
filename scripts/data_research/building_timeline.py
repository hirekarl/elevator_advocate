"""
building_timeline.py — One Building's Full Story

Narrative: "This isn't a one-time problem. Look at the pattern."

Shows every complaint on record for a specific address: date, category code,
and an annual summary. Use this when you have a building to spotlight — in a
council briefing, a press pitch, or as evidence in Housing Court.

Usage:
    python building_timeline.py --address "341 EAST 162 ST" --borough bronx
    python building_timeline.py --address "150 LEFFERTS AVE" --borough brooklyn
    python building_timeline.py --address "1150 TIFFANY ST" --borough bronx
    python building_timeline.py --address "509 WEST 155 ST" --borough manhattan

Address must match SODA format: uppercase, abbreviated street type
(ST, AVE, BLVD, etc.). Use quotes around the address.
"""

import argparse
import os
import sys
from collections import Counter
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except ImportError:
    pass

SODA_URL = "https://data.cityofnewyork.us/resource/kqwi-7ncn.json"
APP_TOKEN = os.getenv("SODA_APP_TOKEN")

CATEGORY_LABELS = {
    "6S": "Elevator complaint",
    "6M": "Elevator/escalator",
    "81": "Inoperative (retired code)",
    "63": "Failed inspection (retired code)",
}

BOROUGH_MAP = {
    "bronx": "BRONX",
    "brooklyn": "BROOKLYN",
    "manhattan": "MANHATTAN",
    "queens": "QUEENS",
    "staten island": "STATEN ISLAND",
}


def fetch_complaints(address: str, borough: str) -> list[dict]:
    soda_borough = BOROUGH_MAP.get(borough.lower(), borough.upper())
    # Use LIKE to handle minor address normalization differences
    where = (
        f"incident_address LIKE '{address}%' "
        f"AND borough='{soda_borough}'"
    )
    params = {
        "$select": "incident_address, borough, complaint_category, date_entered, status, bin",
        "$where": where,
        "$order": "date_entered DESC",
        "$limit": 1000,
    }
    if APP_TOKEN:
        params["$$app_token"] = APP_TOKEN

    resp = requests.get(SODA_URL, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--address", required=True,
                        help='Address in SODA format, e.g. "341 EAST 162 ST"')
    parser.add_argument("--borough", required=True,
                        choices=["bronx", "brooklyn", "manhattan", "queens", "staten island"],
                        help="Borough (lowercase)")
    args = parser.parse_args()

    if not APP_TOKEN:
        print("Warning: SODA_APP_TOKEN not set. Request may be rate-limited.")

    print(f"\nFetching complaint history for: {args.address}, {args.borough.title()}...")
    try:
        complaints = fetch_complaints(args.address, args.borough)
    except requests.RequestException as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    if not complaints:
        print("No complaints found. Check address format (must be uppercase, abbreviated).")
        sys.exit(0)

    # Normalize address from first result
    resolved_address = complaints[0].get("incident_address", args.address)
    resolved_bin = complaints[0].get("bin", "Unknown")

    print(f"\n{'='*60}")
    print(f"  {resolved_address}, {args.borough.title()}")
    print(f"  BIN: {resolved_bin} | Total complaints on record: {len(complaints)}")
    print(f"{'='*60}")

    # Annual summary
    by_year: Counter = Counter()
    for c in complaints:
        raw_date = c.get("date_entered", "")
        if raw_date:
            by_year[raw_date[:4]] += 1

    print("\n  COMPLAINTS BY YEAR")
    print("  " + "-" * 40)
    for year in sorted(by_year.keys(), reverse=True):
        count = by_year[year]
        bar = "█" * count
        print(f"  {year}  {count:4d}  {bar}")

    # Full timeline (most recent first, limit to 50 for readability)
    print(f"\n  COMPLAINT TIMELINE (most recent {min(len(complaints), 50)})")
    print("  " + "-" * 56)
    print(f"  {'Date':<22}  {'Code':<4}  {'Description':<30}")
    print("  " + "-" * 56)
    for c in complaints[:50]:
        raw_date = c.get("date_entered", "")
        date_str = raw_date[:10] if raw_date else "Unknown"
        code = c.get("complaint_category", "?")
        label = CATEGORY_LABELS.get(code, code)
        complaint_status = c.get("status", "")
        detail = f"{label}"
        if complaint_status:
            detail += f" [{complaint_status}]"
        print(f"  {date_str:<22}  {code:<4}  {detail:<30}")

    if len(complaints) > 50:
        print(f"  ... and {len(complaints) - 50} more (use $limit in a custom query to see all)")

    # Loss-of-service estimate (rough: each complaint = 1 incident)
    recent = [c for c in complaints if c.get("date_entered", "")[:4] in
              [str(y) for y in range(2023, 2026)]]
    print(f"\n  SUMMARY (2023–2025): {len(recent)} complaints over ~3 years")
    if recent:
        first = min(c.get("date_entered", "")[:10] for c in recent)
        last = max(c.get("date_entered", "")[:10] for c in recent)
        print(f"  Earliest: {first}  |  Most recent: {last}")
    print()


if __name__ == "__main__":
    main()
