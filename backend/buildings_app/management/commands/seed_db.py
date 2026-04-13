"""
Seed command: full database reset + realistic test data.

Wipes all tables, geocodes two real NYC residential buildings via GeoSearch,
pulls live SODA complaint history for both, creates one superuser and five
tenant users, and seeds recent reports to produce distinct UI states on the
landing page.

Usage:
    uv run python manage.py seed_db
"""

from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from buildings_app.models import Building, ElevatorReport, UserProfile
from services.geoclient import GeoclientService
from services.soda import SODAService

BUILDINGS_TO_SEED = [
    {
        "label": "Building A (Manhattan)",
        "house_number": "2",
        "street": "Gold Street",
        "borough": "manhattan",
    },
    {
        "label": "Building B (Bronx)",
        "house_number": "1010",
        "street": "Grand Concourse",
        "borough": "bronx",
    },
]

USERS_TO_SEED = [
    # (username, email, password, first_name, building_key)
    # building_key 0 = Building A, 1 = Building B
    ("martha_rivera", "martha@example.com", "ElevatorUp1!", "Martha", 0),
    ("carlos_mendez", "carlos@example.com", "ElevatorUp1!", "Carlos", 0),
    ("yolanda_chen", "yolanda@example.com", "ElevatorUp1!", "Yolanda", 0),
    ("james_okafor", "james@example.com", "ElevatorUp1!", "James", 1),
    ("priya_singh", "priya@example.com", "ElevatorUp1!", "Priya", 1),
]

SUPERUSER = {
    "username": "admin",
    "email": "admin@elevatoradvocacy.com",
    "password": "Advocate2026!",
}


class Command(BaseCommand):
    help = "Nuclear reset: wipes the DB and populates it with real buildings and test users."

    def handle(self, *args, **options) -> None:
        self.stdout.write(self.style.WARNING("Flushing database..."))
        call_command("flush", "--no-input")
        self.stdout.write(self.style.SUCCESS("Database cleared."))

        buildings = self._seed_buildings()
        if len(buildings) < 2:
            self.stdout.write(
                self.style.ERROR(
                    "Could not geocode both buildings. Aborting — check GeoSearch connectivity."
                )
            )
            return

        self._seed_soda_history(buildings)
        users = self._seed_users(buildings)
        self._seed_recent_reports(buildings, users)
        self._print_summary(buildings, users)

    # ------------------------------------------------------------------
    # Buildings
    # ------------------------------------------------------------------

    def _seed_buildings(self) -> list[Building]:
        geoclient = GeoclientService()
        seeded: list[Building] = []

        for spec in BUILDINGS_TO_SEED:
            self.stdout.write(f"Geocoding {spec['label']}...")
            geo = geoclient.get_bin_with_coordinates(
                spec["house_number"], spec["street"], spec["borough"]
            )

            if not geo.get("bin"):
                self.stdout.write(
                    self.style.ERROR(
                        f"  Could not resolve BIN for {spec['label']}. Skipping."
                    )
                )
                continue

            address = f"{spec['house_number']} {spec['street'].title()}"
            building, created = Building.objects.get_or_create(
                bin=geo["bin"],
                defaults={
                    "address": address,
                    "borough": spec["borough"].title(),
                    "latitude": float(geo["latitude"]) if geo.get("latitude") else None,
                    "longitude": float(geo["longitude"])
                    if geo.get("longitude")
                    else None,
                },
            )
            action = "Created" if created else "Found"
            self.stdout.write(
                self.style.SUCCESS(
                    f"  {action}: {building.address} — BIN {building.bin}"
                )
            )
            seeded.append(building)

        return seeded

    # ------------------------------------------------------------------
    # SODA history
    # ------------------------------------------------------------------

    def _seed_soda_history(self, buildings: list[Building]) -> None:
        soda = SODAService()
        from buildings_app.logic import ConsensusManager

        manager = ConsensusManager()

        for building in buildings:
            self.stdout.write(f"Pulling SODA history for BIN {building.bin}...")
            complaints = soda.get_elevator_complaints(building.bin, limit=50)
            if complaints:
                manager.sync_soda_reports(building, complaints)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  Synced {len(complaints)} historical complaints."
                    )
                )
            else:
                self.stdout.write("  No SODA records found for this BIN.")

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------

    def _seed_users(self, buildings: list[Building]) -> dict[str, User]:
        self.stdout.write("Creating superuser...")
        superuser = User.objects.create_superuser(
            username=SUPERUSER["username"],
            email=SUPERUSER["email"],
            password=SUPERUSER["password"],
        )
        self.stdout.write(
            self.style.SUCCESS(f"  Created superuser: {superuser.username}")
        )

        users: dict[str, User] = {}
        for username, email, password, first_name, building_idx in USERS_TO_SEED:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                is_active=True,
            )
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.primary_building = buildings[building_idx]
            profile.save()
            users[username] = user
            self.stdout.write(
                self.style.SUCCESS(
                    f"  Created {username} → {buildings[building_idx].address}"
                )
            )

        return users

    # ------------------------------------------------------------------
    # Recent reports (drives the consensus UI states)
    # ------------------------------------------------------------------

    def _seed_recent_reports(
        self, buildings: list[Building], users: dict[str, User]
    ) -> None:
        """
        Building A: two DOWN reports from two different users within the 2-hour
        window → VERIFIED DOWN (red badge).

        Building B: one SLOW report from one user within the window
        → UNVERIFIED (amber badge, countdown timer visible).
        """
        now = timezone.now()

        # Building A — VERIFIED DOWN
        building_a = buildings[0]
        ElevatorReport.objects.create(
            building=building_a,
            user=users["martha_rivera"],
            status="DOWN",
            reported_at=now - timedelta(minutes=47),
        )
        ElevatorReport.objects.create(
            building=building_a,
            user=users["carlos_mendez"],
            status="DOWN",
            reported_at=now - timedelta(minutes=31),
        )
        self.stdout.write(
            self.style.SUCCESS(f"  Seeded: {building_a.address} → VERIFIED DOWN")
        )

        # Building B — UNVERIFIED (single report)
        building_b = buildings[1]
        ElevatorReport.objects.create(
            building=building_b,
            user=users["james_okafor"],
            status="SLOW",
            reported_at=now - timedelta(minutes=22),
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"  Seeded: {building_b.address} → UNVERIFIED (SLOW, 1 report)"
            )
        )

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def _print_summary(self, buildings: list[Building], users: dict[str, User]) -> None:
        lines = [
            "",
            "=" * 60,
            "  SEED COMPLETE — TEST CREDENTIALS",
            "=" * 60,
            "",
            "  Superuser",
            f"    Username : {SUPERUSER['username']}",
            f"    Password : {SUPERUSER['password']}",
            f"    Email    : {SUPERUSER['email']}",
            "",
        ]

        building_a, building_b = buildings[0], buildings[1]
        lines += [
            f"  Building A — {building_a.address} (BIN {building_a.bin})",
            "  Expected status: VERIFIED DOWN (red badge)",
            "",
        ]
        for username, _, password, _, bidx in USERS_TO_SEED:
            if bidx == 0:
                lines.append(f"    {username:<20} pw: {password}")
        lines.append("")

        lines += [
            f"  Building B — {building_b.address} (BIN {building_b.bin})",
            "  Expected status: UNVERIFIED (amber badge)",
            "",
        ]
        for username, _, password, _, bidx in USERS_TO_SEED:
            if bidx == 1:
                lines.append(f"    {username:<20} pw: {password}")
        lines += ["", "=" * 60, ""]

        for line in lines:
            self.stdout.write(line)
