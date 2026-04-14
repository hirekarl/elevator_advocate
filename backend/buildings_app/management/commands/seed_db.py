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
        "label": "Grand Street Guild (Manhattan)",
        "house_number": "131",
        "street": "Broome Street",
        "borough": "manhattan",
    },
    {
        "label": "Anthony Avenue (Bronx)",
        "house_number": "1853",
        "street": "Anthony Avenue",
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
    help = (
        "Nuclear reset: wipes the DB and populates it with real buildings "
        "and test users."
    )

    def handle(self, *args, **options) -> None:
        self.stdout.write(self.style.WARNING("Flushing database..."))
        call_command("flush", "--no-input")
        self.stdout.write(self.style.SUCCESS("Database cleared."))

        buildings = self._seed_buildings()
        if len(buildings) < 2:
            self.stdout.write(
                self.style.ERROR(
                    "Could not geocode both buildings. Aborting — "
                    "check GeoSearch connectivity."
                )
            )
            return

        self._seed_soda_history(buildings)
        users = self._seed_users(buildings)
        self._seed_recent_reports(buildings, users)
        self._seed_advocacy_logs(buildings, users)
        self._seed_building_news(buildings)
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
        Building A: two TRAPPED reports from different users within the 2-hour
        window → VERIFIED TRAPPED (red badge).

        Building B: mixed reports from two different users within the window
        → UNVERIFIED (amber badge, countdown timer visible).
        """
        now = timezone.now()

        # Building A — VERIFIED TRAPPED
        building_a = buildings[0]
        ElevatorReport.objects.create(
            building=building_a,
            user=users["martha_rivera"],
            status="TRAPPED",
            reported_at=now - timedelta(minutes=15),
        )
        ElevatorReport.objects.create(
            building=building_a,
            user=users["yolanda_chen"],
            status="TRAPPED",
            reported_at=now - timedelta(minutes=10),
        )
        # Add some historical DOWN reports too
        ElevatorReport.objects.create(
            building=building_a,
            user=users["carlos_mendez"],
            status="DOWN",
            reported_at=now - timedelta(hours=4),
        )
        self.stdout.write(
            self.style.SUCCESS(f"  Seeded: {building_a.address} → VERIFIED TRAPPED")
        )

        # Building B — UNVERIFIED (mixed reports)
        building_b = buildings[1]
        ElevatorReport.objects.create(
            building=building_b,
            user=users["james_okafor"],
            status="SLOW",
            reported_at=now - timedelta(minutes=45),
        )
        ElevatorReport.objects.create(
            building=building_b,
            user=users["priya_singh"],
            status="DOWN",
            reported_at=now - timedelta(minutes=12),
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"  Seeded: {building_b.address} → UNVERIFIED (mixed: SLOW, DOWN)"
            )
        )

    # ------------------------------------------------------------------
    # Advocacy Logs
    # ------------------------------------------------------------------

    def _seed_advocacy_logs(
        self, buildings: list[Building], users: dict[str, User]
    ) -> None:
        from buildings_app.models import AdvocacyLog

        building_a = buildings[0]
        AdvocacyLog.objects.create(
            building=building_a,
            user=users["martha_rivera"],
            sr_number="311-123456",
            description=(
                "Elevator B is jumping and making loud grinding noises. "
                "Third call this week."
            ),
            outcome="In Progress",
        )
        AdvocacyLog.objects.create(
            building=building_a,
            user=users["carlos_mendez"],
            sr_number="311-654321",
            description=(
                "Inspector came yesterday but the elevator stopped working "
                "again this morning."
            ),
            outcome="Closed - No Violation Found (Challenged)",
        )

        building_b = buildings[1]
        AdvocacyLog.objects.create(
            building=building_b,
            user=users["james_okafor"],
            sr_number="311-987654",
            description=(
                "Main elevator doors won't open on the 10th floor. "
                "Seniors are stuck in their units."
            ),
            outcome="Pending Inspection",
        )
        self.stdout.write(self.style.SUCCESS("  Seeded 3 Advocacy Logs."))

    # ------------------------------------------------------------------
    # Building News
    # ------------------------------------------------------------------

    def _seed_building_news(self, buildings: list[Building]) -> None:
        from buildings_app.models import BuildingNews
        from services.news_search import NewsSearchService

        for building in buildings:
            self.stdout.write(f"Fetching live news for {building.address}...")
            try:
                service = NewsSearchService()
                articles = service.search_and_extract(building.address)
                added_count = 0
                for art in articles:
                    if (
                        art.relevance_score >= 0.7
                        and art.summary.lower() != "irrelevant"
                    ):
                        _, created = BuildingNews.objects.get_or_create(
                            url=art.url,
                            defaults={
                                "building": building,
                                "title": art.title,
                                "source": art.source,
                                "published_date": art.published_date,
                                "summary": art.summary,
                                "relevance_score": art.relevance_score,
                            },
                        )
                        if created:
                            added_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  Successfully processed {len(articles)} articles "
                        f"({added_count} new) for {building.address}."
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Live news fetch failed for {building.address}: {e}."
                    )
                )

        self.stdout.write(
            self.style.SUCCESS("  News seeding complete (Live search only).")
        )

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def _print_summary(self, buildings: list[Building], users: dict[str, User]) -> None:
        from buildings_app.models import AdvocacyLog, BuildingNews

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

        # Building A Stats
        logs_a = AdvocacyLog.objects.filter(building=building_a).count()
        news_a = BuildingNews.objects.filter(building=building_a).count()
        lines += [
            f"  Building A — {building_a.address} (BIN {building_a.bin})",
            "  Expected status: VERIFIED TRAPPED (red badge)",
            f"  Features: {logs_a} Advocacy Logs, {news_a} News Articles",
            "",
        ]
        for username, _, password, _, bidx in USERS_TO_SEED:
            if bidx == 0:
                lines.append(f"    {username:<20} pw: {password}")
        lines.append("")

        # Building B Stats
        logs_b = AdvocacyLog.objects.filter(building=building_b).count()
        news_b = BuildingNews.objects.filter(building=building_b).count()
        lines += [
            f"  Building B — {building_b.address} (BIN {building_b.bin})",
            "  Expected status: UNVERIFIED (amber badge)",
            f"  Features: {logs_b} Advocacy Logs, {news_b} News Articles",
            "",
        ]
        for username, _, password, _, bidx in USERS_TO_SEED:
            if bidx == 1:
                lines.append(f"    {username:<20} pw: {password}")
        lines += ["", "=" * 60, ""]

        for line in lines:
            self.stdout.write(line)
