"""
district_hotspots.py — Worst Buildings Per Priority District

Narrative: "Here are the buildings in your district that have failed their
tenants the most in the last 12 months."

Shows the top buildings by complaint count for each of the six priority
council districts, inferred from community board geography.

Usage:
    python district_hotspots.py                    # all six priority districts
    python district_hotspots.py --borough bronx    # one borough
    python district_hotspots.py --months 6         # shorter window (default: 12)
    python district_hotspots.py --top 15           # more results per district
"""

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except ImportError:
    pass

SODA_URL = "https://data.cityofnewyork.us/resource/kqwi-7ncn.json"
APP_TOKEN = os.getenv("SODA_APP_TOKEN")

# Community board numbers that cover each priority council district.
# Format: SODA stores CB as e.g. "201" = Bronx CB1, "302" = Brooklyn CB2.
# These are approximate — CB boundaries do not perfectly match council districts.
PRIORITY_DISTRICTS = [
    {
        "councilmember": "Justin Sanchez",
        "district": "D17",
        "borough": "Bronx",
        "soda_borough": "BRONX",
        "community_boards": ["202", "209"],  # CB2 (Hunts Point), CB9 (Morrisania edge)
        "neighborhoods": "Hunts Point, Port Morris, Mott Haven",
    },
    {
        "councilmember": "Althea Stevens",
        "district": "D16",
        "borough": "Bronx",
        "soda_borough": "BRONX",
        "community_boards": ["203", "201"],  # CB3 (Morrisania), CB1 (Mott Haven)
        "neighborhoods": "Morrisania, Melrose, Mott Haven",
    },
    {
        "councilmember": "Amanda Farías",
        "district": "D18",
        "borough": "Bronx",
        "soda_borough": "BRONX",
        "community_boards": ["209", "210"],  # CB9 (Parkchester), CB10 (Co-op City edge)
        "neighborhoods": "Parkchester, Castle Hill, Soundview",
    },
    {
        "councilmember": "Chris Banks",
        "district": "D42",
        "borough": "Brooklyn",
        "soda_borough": "BROOKLYN",
        "community_boards": ["316", "317"],  # CB16 (Brownsville), CB17 (East NY)
        "neighborhoods": "Brownsville, East New York",
    },
    {
        "councilmember": "Crystal Hudson",
        "district": "D35",
        "borough": "Brooklyn",
        "soda_borough": "BROOKLYN",
        "community_boards": ["308", "309"],  # CB8 (Crown Heights N), CB9 (Crown Heights S)
        "neighborhoods": "Crown Heights, Prospect Heights",
    },
    {
        "councilmember": "Carmen De La Rosa",
        "district": "D10",
        "borough": "Manhattan",
        "soda_borough": "MANHATTAN",
        "community_boards": ["112"],  # CB12 (Washington Heights / Inwood)
        "neighborhoods": "Washington Heights, Inwood",
    },
]


def fetch_top_buildings(soda_borough: str, community_boards: list[str],
                        since: str, top_n: int) -> list[dict]:
    cb_list = ", ".join(f"'{cb}'" for cb in community_boards)
    where = (
        f"borough='{soda_borough}' "
        f"AND community_board IN ({cb_list}) "
        f"AND complaint_category IN ('6S', '6M') "
        f"AND date_entered >= '{since}'"
    )
    params = {
        "$select": "incident_address, count(*) AS complaint_count",
        "$where": where,
        "$group": "incident_address",
        "$order": "complaint_count DESC",
        "$limit": top_n,
    }
    if APP_TOKEN:
        params["$$app_token"] = APP_TOKEN

    resp = requests.get(SODA_URL, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def print_district(district: dict, buildings: list[dict]) -> None:
    cm = district["councilmember"]
    d = district["district"]
    hood = district["neighborhoods"]
    print(f"\n  {cm} ({d}) — {hood}")
    print("  " + "-" * 54)
    if not buildings:
        print("  No complaints found in this area for this period.")
        return
    for i, b in enumerate(buildings, 1):
        addr = b.get("incident_address", "Unknown")
        count = b.get("complaint_count", "0")
        bar = "█" * (int(count) // 2)
        print(f"  {i:2d}. {addr:<35s}  {count:>4s}  {bar}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--borough",
        choices=["bronx", "brooklyn", "manhattan"],
        help="Filter to one borough",
    )
    parser.add_argument(
        "--months", type=int, default=12, help="Lookback window in months (default: 12)"
    )
    parser.add_argument(
        "--top", type=int, default=10, help="Results per district (default: 10)"
    )
    args = parser.parse_args()

    if not APP_TOKEN:
        print("Warning: SODA_APP_TOKEN not set. Request may be rate-limited.")

    since_dt = datetime.now(tz=timezone.utc) - timedelta(days=args.months * 30)
    since = since_dt.strftime("%Y-%m-%dT%H:%M:%S")

    districts = PRIORITY_DISTRICTS
    if args.borough:
        districts = [d for d in PRIORITY_DISTRICTS
                     if d["borough"].lower() == args.borough.lower()]

    print(f"\n{'='*58}")
    print("  ELEVATOR COMPLAINT HOTSPOTS — PRIORITY COUNCIL DISTRICTS")
    print(f"  Window: last {args.months} months | Codes: 6S, 6M")
    print(f"  ⚠  District assignments inferred from community board geography.")
    print(f"{'='*58}")

    for district in districts:
        try:
            buildings = fetch_top_buildings(
                district["soda_borough"],
                district["community_boards"],
                since,
                args.top,
            )
        except requests.RequestException as e:
            print(f"\n  Error fetching {district['district']}: {e}", file=sys.stderr)
            continue
        print_district(district, buildings)

    print()


if __name__ == "__main__":
    main()
