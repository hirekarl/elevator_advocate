"""
Backfills city_council_district (and state district fields) for any building
that was created via the GeoSearch fallback, which does not return district data.

Safe to run repeatedly — only touches buildings with a null city_council_district.
Runs on every deploy via render_build.sh after migrations.

Usage:
    uv run python manage.py backfill_council_districts
"""

from django.core.management.base import BaseCommand

from buildings_app.models import Building
from services.geoclient import GeoclientService


class Command(BaseCommand):
    help = "Backfills council district data for buildings missing it."

    def handle(self, *args: object, **options: object) -> None:
        buildings = Building.objects.filter(city_council_district__isnull=True)

        if not buildings.exists():
            self.stdout.write(
                "All buildings already have district data — nothing to do."
            )
            return

        geoclient = GeoclientService()

        for building in buildings:
            # Address is stored as "{house_number} {street}" — split on first space.
            parts = building.address.split(" ", 1)
            if len(parts) != 2:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Could not parse address '{building.address}' — skipping."
                    )
                )
                continue

            house_number, street = parts
            self.stdout.write(
                f"  Backfilling {building.address} (BIN {building.bin})..."
            )

            try:
                geo_data = geoclient.get_bin_with_coordinates(
                    house_number, street, building.borough
                )
                district = geo_data.get("city_council_district")

                if district:
                    building.city_council_district = district
                    building.state_assembly_district = geo_data.get(
                        "state_assembly_district"
                    )
                    building.state_senate_district = geo_data.get(
                        "state_senate_district"
                    )
                    building.save(
                        update_fields=[
                            "city_council_district",
                            "state_assembly_district",
                            "state_senate_district",
                        ]
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f"    District {district} — saved.")
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            "    Geoclient returned no district (key inactive or GeoSearch fallback) — skipping."
                        )
                    )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"    Error: {e}"))

        self.stdout.write(self.style.SUCCESS("District backfill complete."))
