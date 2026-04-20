import os
from datetime import timedelta
from typing import Any, Dict, List, Optional

from django.contrib.auth.models import User
from django.db.models import Count
from django.utils import timezone

from services.geosearch import GeoSearchService
from services.geosearch_mock import MockGeoSearchService

from .models import Building, ElevatorReport


class ConsensusManager:
    """
    Logic engine for the 2-hour consensus window and data synchronization.
    """

    CONSENSUS_WINDOW_MINUTES = 120

    def __init__(self, geocoder: Optional[Any] = None):
        if geocoder:
            self.geocoder = geocoder
        elif os.getenv("USE_MOCK_GEOCODER", "False") == "True":
            self.geocoder = MockGeoSearchService()
        else:
            self.geocoder = GeoSearchService()

    @property
    def is_mocked(self) -> bool:
        """Returns True if the underlying geocoder is a mock."""
        return getattr(self.geocoder, "is_mocked", False)

    def get_or_create_building(
        self, house_number: str, street: str, borough: str
    ) -> Optional[Building]:
        """
        Backward compatibility for legacy calls.
        """
        building, _ = self.get_or_create_building_with_status(
            house_number, street, borough
        )
        return building

    def get_or_create_building_with_status(
        self, house_number: str, street: str, borough: str
    ) -> tuple[Optional[Building], bool]:
        """
        Retrieves a building by BIN, creating it via GeoSearch if it doesn't exist.
        Returns a tuple (Building, created).
        """
        geo_data = self.geocoder.get_bin_with_coordinates(house_number, street, borough)
        bin_id = geo_data.get("bin")

        if not bin_id:
            return None, False

        building, created = Building.objects.get_or_create(
            bin=bin_id,
            defaults={
                "address": f"{house_number} {street}",
                "borough": borough,
                "latitude": geo_data.get("latitude"),
                "longitude": geo_data.get("longitude"),
                "city_council_district": geo_data.get("city_council_district"),
                "state_assembly_district": geo_data.get("state_assembly_district"),
                "state_senate_district": geo_data.get("state_senate_district"),
            },
        )

        # Backfill: if the building exists but was geocoded before district lookup
        # was added to GeoSearchService, populate it now.
        if not created and not building.city_council_district:
            if geo_data.get("city_council_district"):
                building.city_council_district = geo_data.get("city_council_district")
                building.state_assembly_district = geo_data.get(
                    "state_assembly_district"
                )
                building.state_senate_district = geo_data.get("state_senate_district")
                building.save(
                    update_fields=[
                        "city_council_district",
                        "state_assembly_district",
                        "state_senate_district",
                    ]
                )

        return building, created

    def report_status(
        self, building: Building, user: User, status: str
    ) -> ElevatorReport:
        """
        Logs a new user report and triggers the consensus check.
        """
        return ElevatorReport.objects.create(
            building=building, user=user, status=status
        )

    def get_verified_status(self, building: Building) -> str:
        """
        Determines the current consensus status for a building's elevators.
        Status is 'Verified' if:
        1. 2+ independent users report the same status within 2 hours.
        2. Any official SODA report is logged within the window.
        """
        window_start = timezone.now() - timedelta(minutes=self.CONSENSUS_WINDOW_MINUTES)

        # Check for official reports first
        official_report = ElevatorReport.objects.filter(
            building=building, is_official=True, reported_at__gte=window_start
        ).last()

        if official_report:
            return official_report.status

        # Aggregate user reports within the window
        reports = (
            ElevatorReport.objects.filter(
                building=building, is_official=False, reported_at__gte=window_start
            )
            .values("status")
            .annotate(
                unique_users=Count("user_id", distinct=True),
                last_reported=Count("reported_at"),
            )
            .order_by("-last_reported")
        )

        for report in reports:
            if int(report["unique_users"]) >= 2:
                return str(report["status"])

        return "UNVERIFIED"

    def get_verification_countdown(self, building: Building) -> int:
        """
        Calculates the minutes remaining until the current unverified report
        expires from the consensus window. Returns 0 if already verified
        or no reports exist.
        """
        if self.get_verified_status(building) != "UNVERIFIED":
            return 0

        window_start = timezone.now() - timedelta(minutes=self.CONSENSUS_WINDOW_MINUTES)
        last_report = (
            ElevatorReport.objects.filter(
                building=building, reported_at__gte=window_start
            )
            .order_by("-reported_at")
            .first()
        )

        if not last_report:
            return 0

        # Minutes remaining = (Window - (Now - ReportedAt))
        elapsed_minutes = (
            timezone.now() - last_report.reported_at
        ).total_seconds() / 60
        remaining = self.CONSENSUS_WINDOW_MINUTES - elapsed_minutes

        return max(int(remaining), 0)

    def get_loss_of_service_percentage(
        self, building: Building, days: int = 30
    ) -> float:
        """
        Calculates the Loss of Service % = (Total Down Time / Total Period Time) * 100.
        Uses a rolling window of N days.
        """
        now = timezone.now()
        start_date = now - timedelta(days=days)
        total_period_seconds = days * 24 * 60 * 60

        down_reports = ElevatorReport.objects.filter(
            building=building, status="DOWN", reported_at__gte=start_date
        )

        if not down_reports.exists():
            return 0.0

        unique_outages = down_reports.values("reported_at").distinct().count()
        total_down_seconds = unique_outages * (self.CONSENSUS_WINDOW_MINUTES * 60)

        percentage = (total_down_seconds / total_period_seconds) * 100
        return round(min(percentage, 100.0), 2)

    def sync_soda_reports(
        self, building: Building, soda_reports: List[Dict[str, Any]]
    ) -> None:
        """
        Synchronizes official SODA reports into our local database.
        """
        from datetime import datetime

        for report in soda_reports:
            unique_key = report.get("unique_key")
            if not unique_key:
                continue

            raw_date = report.get("date_entered")
            if raw_date:
                try:
                    reported_at = datetime.strptime(raw_date, "%m/%d/%Y").replace(
                        tzinfo=timezone.get_current_timezone()
                    )
                except ValueError:
                    reported_at = timezone.now()
            else:
                reported_at = timezone.now()

            if not ElevatorReport.objects.filter(soda_unique_key=unique_key).exists():
                ElevatorReport.objects.create(
                    soda_unique_key=unique_key,
                    building=building,
                    user=None,
                    status="DOWN",
                    is_official=True,
                    reported_at=reported_at,
                )

    def sync_citywide_soda_reports(
        self, soda_reports: List[Dict[str, Any]], target_district: Optional[str] = None
    ) -> int:
        """
        Ingests a batch of SODA reports from across the city.
        Creates buildings and geocodes them if they don't exist.
        STRICTLY bypasses fetch_building_news to conserve SerpAPI tokens.
        """
        from datetime import datetime
        from services.soda import SODAService

        synced_count = 0
        soda_service = SODAService()
        
        # Group reports by BIN
        reports_by_bin: Dict[str, List[Dict[str, Any]]] = {}
        for r in soda_reports:
            bin_id = r.get("bin")
            if bin_id:
                reports_by_bin.setdefault(bin_id, []).append(r)

        # 1. Pre-fetch existing buildings
        existing_bins = set(
            Building.objects.filter(bin__in=reports_by_bin.keys()).values_list("bin", flat=True)
        )

        for bin_id, reports in reports_by_bin.items():
            try:
                # 2. Get or create building
                building = Building.objects.filter(bin=bin_id).first()
                if not building:
                    first_report = reports[0]
                    house_num = first_report.get("house_number", "")
                    street = first_report.get("house_street", "")
                    cb = first_report.get("community_board", "")
                    borough_map = {
                        "1": "Manhattan",
                        "2": "Bronx",
                        "3": "Brooklyn",
                        "4": "Queens",
                        "5": "Staten Island",
                    }
                    borough_name = borough_map.get(cb[0] if cb else "", "")
                    
                    building, created = self.get_or_create_building_with_status(
                        house_number=house_num,
                        street=street,
                        borough=borough_name,
                    )
                
                if not building:
                    continue

                # 3. Filter by target district if specified
                if target_district and building.city_council_district != target_district:
                    continue

                # 4. Enrich with management data if missing
                if not building.management_company or not building.owner_name:
                    mgmt_data = soda_service.get_management_data(building.bin)
                    if mgmt_data["management_company"] or mgmt_data["owner_name"]:
                        building.management_company = mgmt_data["management_company"]
                        building.owner_name = mgmt_data["owner_name"]
                        building.save(update_fields=["management_company", "owner_name"])

                # 5. Sync reports (Batch check existence)
                existing_keys = set(
                    ElevatorReport.objects.filter(
                        building=building, soda_unique_key__isnull=False
                    ).values_list("soda_unique_key", flat=True)
                )

                new_reports = []
                for report in reports:
                    unique_key = report.get("unique_key")
                    if not unique_key or unique_key in existing_keys:
                        continue

                    raw_date = report.get("date_entered")
                    if raw_date:
                        try:
                            reported_at = datetime.strptime(
                                raw_date, "%m/%d/%Y"
                            ).replace(tzinfo=timezone.get_current_timezone())
                        except ValueError:
                            reported_at = timezone.now()
                    else:
                        reported_at = timezone.now()

                    new_reports.append(
                        ElevatorReport(
                            soda_unique_key=unique_key,
                            building=building,
                            user=None,
                            status="DOWN",
                            is_official=True,
                            reported_at=reported_at,
                        )
                    )
                
                if new_reports:
                    ElevatorReport.objects.bulk_create(new_reports)
                    synced_count += len(new_reports)

            except Exception as e:
                print(f"Error syncing reports for BIN {bin_id}: {e}")
                continue

        return synced_count
