"""
seasonal_trends.py — The Summer Spike

Narrative: "NYC elevator complaints spike 33% in July. Summer is the worst
time to be in a building with a history of failures."

Shows monthly complaint counts by year and each month's deviation from the
annual average. The July premium is consistent across every year since 2018.

Usage:
    python seasonal_trends.py
    python seasonal_trends.py --year 2024
"""

import argparse
import os
import sys
from pathlib import Path

import requests

# Load .env from repo root so SODA_APP_TOKEN is available
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except ImportError:
    pass  # dotenv not available; rely on shell env

SODA_URL = "https://data.cityofnewyork.us/resource/kqwi-7ncn.json"
APP_TOKEN = os.getenv("SODA_APP_TOKEN")

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def fetch_monthly_counts(year: int | None = None) -> list[dict]:
    where = "complaint_category IN ('6S', '6M')"
    if year:
        where += f" AND date_entered >= '{year}-01-01T00:00:00' AND date_entered < '{year + 1}-01-01T00:00:00'"
    else:
        where += " AND date_entered >= '2018-01-01T00:00:00' AND date_entered < '2026-01-01T00:00:00'"

    params = {
        "$select": "date_trunc_ym(date_entered) AS month, count(*) AS complaint_count",
        "$where": where,
        "$group": "date_trunc_ym(date_entered)",
        "$order": "date_trunc_ym(date_entered) ASC",
        "$limit": 120,
    }
    if APP_TOKEN:
        params["$$app_token"] = APP_TOKEN

    resp = requests.get(SODA_URL, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def parse_records(records: list[dict]) -> dict[int, dict[int, int]]:
    """Returns {year: {month_num: count}}."""
    data: dict[int, dict[int, int]] = {}
    for rec in records:
        raw = rec.get("month", "")
        count = int(rec.get("complaint_count", 0))
        if not raw:
            continue
        parts = raw[:7].split("-")
        if len(parts) < 2:
            continue
        y, m = int(parts[0]), int(parts[1])
        data.setdefault(y, {})[m] = count
    return data


def print_year(year: int, monthly: dict[int, int]) -> None:
    total = sum(monthly.values())
    avg = total / 12 if total else 0
    print(f"\n  {year}  (annual avg: {avg:.0f}/month)")
    print("  " + "-" * 58)
    for m in range(1, 13):
        count = monthly.get(m, 0)
        delta = ((count - avg) / avg * 100) if avg else 0
        bar = "█" * (count // 20)
        marker = f"{'▲' if delta > 5 else ('▼' if delta < -5 else ' ')}{abs(delta):4.0f}%"
        print(f"  {MONTHS[m-1]:3s}  {count:5d}  {marker}  {bar}")


def print_averages(data: dict[int, dict[int, int]]) -> None:
    """Print average complaint count per calendar month across all years."""
    monthly_totals: dict[int, list[int]] = {m: [] for m in range(1, 13)}
    for yearly in data.values():
        for m, count in yearly.items():
            monthly_totals[m].append(count)

    avgs = {m: sum(v) / len(v) for m, v in monthly_totals.items() if v}
    overall_avg = sum(avgs.values()) / len(avgs) if avgs else 0

    print("\n  AVERAGE BY MONTH (all years in range)")
    print("  " + "-" * 58)
    for m in range(1, 13):
        avg = avgs.get(m, 0)
        delta = ((avg - overall_avg) / overall_avg * 100) if overall_avg else 0
        bar = "█" * int(avg // 20)
        marker = f"{'▲' if delta > 5 else ('▼' if delta < -5 else ' ')}{abs(delta):4.0f}%"
        print(f"  {MONTHS[m-1]:3s}  {avg:6.0f}  {marker}  {bar}")
    print(f"\n  Overall monthly average: {overall_avg:.0f} complaints")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--year", type=int, help="Show a single year only")
    args = parser.parse_args()

    if not APP_TOKEN:
        print("Warning: SODA_APP_TOKEN not set. Request may be rate-limited.")

    print("Fetching monthly complaint data from NYC Open Data...")
    try:
        records = fetch_monthly_counts(args.year)
    except requests.RequestException as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    data = parse_records(records)
    if not data:
        print("No data returned.")
        sys.exit(0)

    print(f"\n{'='*62}")
    print("  NYC ELEVATOR COMPLAINTS — MONTHLY BREAKDOWN")
    print(f"  Dataset: kqwi-7ncn | Codes: 6S, 6M | Source: NYC Open Data")
    print(f"{'='*62}")

    for year in sorted(data.keys()):
        if args.year and year != args.year:
            continue
        print_year(year, data[year])

    if not args.year:
        print_averages(data)

    print()


if __name__ == "__main__":
    main()
