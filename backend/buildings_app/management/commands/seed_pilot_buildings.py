"""
Seed command: pre-loads the six highest-priority pilot buildings onto the map.

Strategy for BIN resolution (Geoclient credential issues):
  1. Query SODA dataset kqwi-7ncn directly — the dataset already contains BINs
     for every building it has complaint records for. No auth required beyond
     the app token. This is the primary path.
  2. Fall back to GeoSearch (NYC Planning Labs) — no credentials required at all.
  3. Skip the building with a warning if both fail.

Geoclient is never called by this command. That service's credential issues
do not affect this workflow.

Usage:
    uv run python manage.py seed_pilot_buildings
    uv run python manage.py seed_pilot_buildings --dry-run
"""

import os
from typing import Any, Optional

import requests
from django.core.management.base import BaseCommand

from buildings_app.logic import ConsensusManager
from buildings_app.models import Building
from services.soda import SODAService

# Six highest-priority pilot buildings — confirmed via fresh SODA analysis
# (April 2025 – April 2026, codes 6S/6M). Council district assignments inferred
# from community board geography; geocode-confirm before citing in briefings.
PILOT_BUILDINGS = [
    {
        "label": "341 East 162 St — Morrisania, Bronx (D16, Althea Stevens)",
        "soda_address": "341 EAST 162 ST",
        "house_number": "341",
        "street": "East 162 Street",
        "borough": "Bronx",
        "soda_borough": "BRONX",
        "city_council_district": "16",
        "complaint_count_12mo": 20,
    },
    {
        "label": "150 Lefferts Ave — Crown Heights, Brooklyn (D35, Crystal Hudson)",
        "soda_address": "150 LEFFERTS AVE",
        "house_number": "150",
        "street": "Lefferts Avenue",
        "borough": "Brooklyn",
        "soda_borough": "BROOKLYN",
        "city_council_district": "35",
        "complaint_count_12mo": 16,
    },
    {
        "label": "1150 Tiffany St — Hunts Point, Bronx (D17, Justin Sanchez)",
        "soda_address": "1150 TIFFANY ST",
        "house_number": "1150",
        "street": "Tiffany Street",
        "borough": "Bronx",
        "soda_borough": "BRONX",
        "city_council_district": "17",
        "complaint_count_12mo": 12,
    },
    {
        "label": "2045 Story Ave — Parkchester, Bronx (D18, Amanda Farías)",
        "soda_address": "2045 STORY AVE",
        "house_number": "2045",
        "street": "Story Avenue",
        "borough": "Bronx",
        "soda_borough": "BRONX",
        "city_council_district": "18",
        "complaint_count_12mo": 8,
    },
    {
        "label": "509 West 155 St — Washington Heights, Manhattan (D10, Carmen De La Rosa)",
        "soda_address": "509 WEST 155 ST",
        "house_number": "509",
        "street": "West 155 Street",
        "borough": "Manhattan",
        "soda_borough": "MANHATTAN",
        "city_council_district": "10",
        "complaint_count_12mo": 8,
    },
    {
        "label": "33 Saratoga Ave — Brownsville, Brooklyn (D42, Chris Banks)",
        "soda_address": "33 SARATOGA AVE",
        "house_number": "33",
        "street": "Saratoga Avenue",
        "borough": "Brooklyn",
        "soda_borough": "BROOKLYN",
        "city_council_district": "42",
        "complaint_count_12mo": 8,
    },
]

SODA_BASE_URL = "https://data.cityofnewyork.us/resource/kqwi-7ncn.json"
GEOSEARCH_BASE_URL = "https://geosearch.planninglabs.nyc/v2/search"


class Command(BaseCommand):
    help = (
        "Pre-loads the six highest-priority pilot buildings onto the map. "
        "Uses SODA for BIN resolution — does not call Geoclient."
    )

    def add_arguments(self, parser):  # type: ignore[override]
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would be seeded without writing to the database.",
        )

    def handle(self, *args: object, **options: object) -> None:
        dry_run: bool = bool(options["dry_run"])
        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN — no changes will be written.")
            )

        app_token = os.getenv("SODA_APP_TOKEN")
        soda = SODAService(app_token=app_token)
        manager = ConsensusManager()

        seeded = 0
        for spec in PILOT_BUILDINGS:
            self.stdout.write(f"\n→ {spec['label']}")

            # Step 1: resolve BIN from SODA
            bin_result = self._get_bin_from_soda(spec, app_token)

            # Step 2: fall back to GeoSearch for coordinates (and BIN if SODA missed)
            coords: dict[str, Any] = {}
            if not bin_result.get("bin") or not bin_result.get("latitude"):
                coords = self._get_coords_from_geosearch(spec)
                if not bin_result.get("bin"):
                    bin_result["bin"] = coords.get("bin")

            if not bin_result.get("bin"):
                self.stdout.write(
                    self.style.ERROR(
                        "  Could not resolve BIN from SODA or GeoSearch. Skipping."
                    )
                )
                continue

            building_bin: str = bin_result["bin"]
            latitude = bin_result.get("latitude") or coords.get("latitude")
            longitude = bin_result.get("longitude") or coords.get("longitude")
            address = f"{spec['house_number']} {str(spec['street']).title()}"

            self.stdout.write(f"  BIN: {building_bin}")

            if dry_run:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  Would create: {address}, {spec['borough']} "
                        f"(D{spec['city_council_district']})"
                    )
                )
                seeded += 1
                continue

            building, created = Building.objects.get_or_create(
                bin=building_bin,
                defaults={
                    "address": address,
                    "borough": spec["borough"],
                    "latitude": float(latitude) if latitude else None,
                    "longitude": float(longitude) if longitude else None,
                    "city_council_district": spec["city_council_district"],
                },
            )

            if not created:
                # Update district data if it was missing
                if not building.city_council_district:
                    building.city_council_district = str(spec["city_council_district"])
                    building.save(update_fields=["city_council_district"])
                self.stdout.write(f"  Already exists: {building.address}")
            else:
                self.stdout.write(self.style.SUCCESS(f"  Created: {building.address}"))

            # Step 3: sync SODA complaint history
            complaints = soda.get_elevator_complaints(building_bin, limit=50)
            if complaints:
                manager.sync_soda_reports(building, complaints)
                self.stdout.write(
                    self.style.SUCCESS(f"  Synced {len(complaints)} SODA complaint(s).")
                )
            else:
                self.stdout.write("  No SODA records found for this BIN.")

            seeded += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n{'Would seed' if dry_run else 'Seeded'} {seeded}/{len(PILOT_BUILDINGS)} pilot buildings."
            )
        )

    def _get_bin_from_soda(
        self, spec: dict[str, Any], app_token: Optional[str]
    ) -> dict[str, Any]:
        """
        Queries the SODA complaint dataset for a BIN matching this address.
        The dataset stores BINs on every complaint record — no Geoclient needed.
        """
        # Derive house_street from soda_address by stripping the house number prefix.
        # e.g. "341 EAST 162 ST" → house_number="341", house_street="EAST 162 ST"
        house_number = str(spec["house_number"])
        house_street = str(spec["soda_address"]).split(" ", 1)[1]
        # Build URL manually — requests.get(params=) encodes '$' as '%24',
        # which SODA rejects. Raw string keeps literal $where=.
        qs = (
            f"$where=house_number='{house_number}' AND house_street='{house_street}'"
            f"&$select=bin,house_number,house_street,latitude,longitude"
            f"&$limit=1"
        )
        if app_token:
            qs += f"&$$app_token={app_token}"

        try:
            response = requests.get(SODA_BASE_URL + "?" + qs, timeout=10)
            response.raise_for_status()
            records = response.json()
            if records:
                rec = records[0]
                return {
                    "bin": rec.get("bin"),
                    "latitude": rec.get("latitude"),
                    "longitude": rec.get("longitude"),
                }
        except requests.RequestException as e:
            self.stdout.write(f"  SODA BIN lookup failed: {e}")

        return {}

    def _get_coords_from_geosearch(self, spec: dict[str, Any]) -> dict[str, Any]:
        """
        Falls back to NYC Planning Labs GeoSearch for lat/lon (and BIN if SODA missed).
        No credentials required.
        """
        query = f"{spec['house_number']} {spec['street']}, {spec['borough']}, NY"
        try:
            response = requests.get(
                GEOSEARCH_BASE_URL,
                params={"text": query, "size": "1"},
                timeout=10,
            )
            response.raise_for_status()
            features = response.json().get("features", [])
            if features:
                props = features[0].get("properties", {})
                coords = features[0].get("geometry", {}).get("coordinates", [])
                bin_id = props.get("addendum", {}).get("pad", {}).get("bin")
                if coords:
                    return {
                        "bin": str(bin_id) if bin_id else None,
                        "latitude": str(coords[1]),
                        "longitude": str(coords[0]),
                    }
        except requests.RequestException as e:
            self.stdout.write(f"  GeoSearch fallback failed: {e}")

        return {}
