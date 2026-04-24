"""
Exports a district advocacy data snapshot to CSV.

Outputs all buildings in the district. Chronic offenders (passing the
dual-window filter) carry their complaint counts and AI headline.
Non-chronic buildings are marked Nominal and omitted from the AI headline.

Usage:
    uv run python manage.py export_district_csv --district 17
    uv run python manage.py export_district_csv --district 17 --output /path/to/file.csv
    uv run python manage.py export_district_csv --district 17 --chronic-only
"""

import csv
import os
from typing import Optional

from django.core.management.base import BaseCommand

from buildings_app.logic import ConsensusManager
from buildings_app.models import Building, CouncilDistrict


class Command(BaseCommand):
    help = "Exports a district advocacy data snapshot to CSV."

    def add_arguments(self, parser):
        parser.add_argument("--district", type=str, required=True)
        parser.add_argument(
            "--output",
            type=str,
            default=None,
            help="Output path. Defaults to docs/advocacy/districts/district_<id>/district_<id>_data_snapshot.csv",
        )
        parser.add_argument(
            "--chronic-only",
            action="store_true",
            help="Only include buildings that pass the dual-window chronic filter.",
        )

    def handle(self, *args, **options):
        district_id = options["district"]
        chronic_only = options["chronic_only"]

        try:
            CouncilDistrict.objects.get(district_id=district_id)
        except CouncilDistrict.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"District {district_id} not found."))
            return

        output_path: Optional[str] = options["output"]
        if not output_path:
            base = os.path.join(
                os.path.dirname(__file__),
                "..",
                "..",
                "..",
                "..",
                "docs",
                "advocacy",
                "districts",
                f"district_{district_id}",
                f"district_{district_id}_data_snapshot.csv",
            )
            output_path = os.path.normpath(base)

        buildings = Building.objects.filter(city_council_district=district_id).order_by(
            "address"
        )

        manager = ConsensusManager()
        fieldnames = [
            "BIN",
            "Address",
            "Borough",
            "Legal Owner (MapPLUTO)",
            "Complaints (12mo)",
            "Complaints (3yr)",
            "Loss of Service % (30d)",
            "Risk Level",
            "AI Headline",
        ]

        rows_written = 0
        chronic_count = 0

        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for building in buildings:
                counts = manager.get_chronic_offender_data(building)
                is_chronic = counts is not None

                if chronic_only and not is_chronic:
                    continue

                los = manager.get_loss_of_service_percentage(building)

                summary = building.cached_executive_summary
                en_summary = summary.get("en", {}) if summary else {}
                headline = en_summary.get(
                    "headline", "No recent complaint activity recorded."
                )
                risk_level = en_summary.get("risk_level", "Nominal")

                writer.writerow(
                    {
                        "BIN": building.bin,
                        "Address": building.address,
                        "Borough": building.borough,
                        "Legal Owner (MapPLUTO)": building.owner_name
                        or "UNAVAILABLE OWNER",
                        "Complaints (12mo)": counts["complaints_12mo"]
                        if is_chronic
                        else 0,
                        "Complaints (3yr)": counts["complaints_3yr"]
                        if is_chronic
                        else 0,
                        "Loss of Service % (30d)": f"{los:.2f}%",
                        "Risk Level": risk_level,
                        "AI Headline": headline,
                    }
                )
                rows_written += 1
                if is_chronic:
                    chronic_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Exported {rows_written} buildings ({chronic_count} chronic) to {output_path}"
            )
        )
