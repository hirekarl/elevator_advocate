"""
city_overview.py — The Scale of the Problem

Narrative: "This isn't a District 17 problem. It's a city-wide failure of
accountability — and the data proves it."

Shows the top buildings city-wide, a borough-level breakdown, and headline
stats. Use this for Pursuit demos, press pitches, or any audience that needs
to understand the full scope before you narrow to a specific district.

Usage:
    python city_overview.py                  # last 12 months
    python city_overview.py --months 24      # two-year view
    python city_overview.py --top 50         # expand the leaderboard
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

BOROUGHS = ["BRONX", "BROOKLYN", "MANHATTAN", "QUEENS", "STATEN ISLAND"]


def fetch_top_buildings(since: str, top_n: int) -> list[dict]:
    params = {
        "$select": "incident_address, borough, community_board, count(*) AS complaint_count",
        "$where": f"complaint_category IN ('6S', '6M') AND date_entered >= '{since}'",
        "$group": "incident_address, borough, community_board",
        "$order": "complaint_count DESC",
        "$limit": top_n,
    }
    if APP_TOKEN:
        params["$$app_token"] = APP_TOKEN
    resp = requests.get(SODA_URL, params=params, timeout=20)
    resp.raise_for_status()
    return resp.json()


def fetch_borough_totals(since: str) -> list[dict]:
    params = {
        "$select": "borough, count(*) AS complaint_count",
        "$where": f"complaint_category IN ('6S', '6M') AND date_entered >= '{since}'",
        "$group": "borough",
        "$order": "complaint_count DESC",
        "$limit": 10,
    }
    if APP_TOKEN:
        params["$$app_token"] = APP_TOKEN
    resp = requests.get(SODA_URL, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def fetch_total_count(since: str) -> int:
    params = {
        "$select": "count(*) AS total",
        "$where": f"complaint_category IN ('6S', '6M') AND date_entered >= '{since}'",
    }
    if APP_TOKEN:
        params["$$app_token"] = APP_TOKEN
    resp = requests.get(SODA_URL, params=params, timeout=15)
    resp.raise_for_status()
    records = resp.json()
    return int(records[0].get("total", 0)) if records else 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--months", type=int, default=12,
                        help="Lookback window in months (default: 12)")
    parser.add_argument("--top", type=int, default=25,
                        help="Number of top buildings to show (default: 25)")
    args = parser.parse_args()

    if not APP_TOKEN:
        print("Warning: SODA_APP_TOKEN not set. Request may be rate-limited.")

    since_dt = datetime.now(tz=timezone.utc) - timedelta(days=args.months * 30)
    since = since_dt.strftime("%Y-%m-%dT%H:%M:%S")
    since_display = since_dt.strftime("%B %Y")

    print(f"\nFetching city-wide data since {since_display}...")

    try:
        total = fetch_total_count(since)
        borough_totals = fetch_borough_totals(since)
        top_buildings = fetch_top_buildings(since, args.top)
    except requests.RequestException as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"\n{'='*62}")
    print("  NYC ELEVATOR COMPLAINTS — CITY-WIDE OVERVIEW")
    print(f"  {since_display} – Present | Codes: 6S, 6M | Source: NYC Open Data")
    print(f"{'='*62}")

    # Headline stat
    print(f"\n  Total complaints in period: {total:,}")

    # Borough breakdown
    print(f"\n  COMPLAINTS BY BOROUGH")
    print("  " + "-" * 46)
    max_borough = max((int(b.get("complaint_count", 0)) for b in borough_totals), default=1)
    for b in borough_totals:
        name = b.get("borough", "Unknown").title()
        count = int(b.get("complaint_count", 0))
        pct = (count / total * 100) if total else 0
        bar = "█" * (count * 30 // max_borough)
        print(f"  {name:<16}  {count:6,}  ({pct:4.1f}%)  {bar}")

    # Top buildings leaderboard
    print(f"\n  TOP {args.top} BUILDINGS CITY-WIDE")
    print("  " + "-" * 58)
    print(f"  {'Rank':<5}  {'Address':<35}  {'Borough':<10}  {'CB':<5}  {'Count':>5}")
    print("  " + "-" * 58)
    for i, b in enumerate(top_buildings, 1):
        addr = b.get("incident_address", "Unknown")[:34]
        borough = b.get("borough", "").title()[:9]
        cb = b.get("community_board", "")
        count = b.get("complaint_count", "0")
        print(f"  {i:<5}  {addr:<35}  {borough:<10}  {cb:<5}  {count:>5}")

    # Quick note for briefings
    if top_buildings:
        top_addr = top_buildings[0].get("incident_address", "")
        top_count = top_buildings[0].get("complaint_count", "0")
        top_borough = top_buildings[0].get("borough", "").title()
        print(f"\n  The most-complained building in NYC over this period:")
        print(f"  {top_addr}, {top_borough} — {top_count} complaints")

    print(f"\n  ⚠  Community board assignments are in SODA format:")
    print(f"     First digit = borough (1=Manhattan 2=Bronx 3=Brooklyn 4=Queens)")
    print(f"     Last two digits = community board number")
    print()


if __name__ == "__main__":
    main()
