import os
from datetime import timedelta
from django.db.models import Count, Q
from django.utils import timezone
from .models import Building, ElevatorReport
from services.geoclient import GeoclientService
from services.geoclient_mock import MockGeoclientService
from typing import Optional, List, Dict, Any

class ConsensusManager:
    """
    Logic engine for the 2-hour consensus window and data synchronization.
    """

    CONSENSUS_WINDOW_MINUTES = 120

    def __init__(self, geoclient: Optional[Any] = None):
        if geoclient:
            self.geoclient = geoclient
        elif os.getenv("USE_MOCK_GEOCLIENT", "False") == "True":
            self.geoclient = MockGeoclientService()
        else:
            self.geoclient = GeoclientService()

    def get_or_create_building(self, house_number: str, street: str, borough: str) -> Optional[Building]:
        """
        Retrieves a building by BIN, creating it via Geoclient if it doesn't exist.
        """
        bin_id = self.geoclient.get_bin(house_number, street, borough)
        if not bin_id:
            return None

        building, created = Building.objects.get_or_create(
            bin=bin_id,
            defaults={
                'address': f"{house_number} {street}",
                'borough': borough
            }
        )
        return building

    def report_status(self, building: Building, user_id: str, status: str) -> ElevatorReport:
        """
        Logs a new user report and triggers the consensus check.
        """
        return ElevatorReport.objects.create(
            building=building,
            user_id=user_id,
            status=status
        )

    def get_verified_status(self, building: Building) -> str:
        """
        Determines the current consensus status for a building's elevators.
        Status is 'Verified' if 2+ independent users report the same status within 2 hours.
        """
        window_start = timezone.now() - timedelta(minutes=self.CONSENSUS_WINDOW_MINUTES)
        
        # Aggregate reports within the window
        reports = ElevatorReport.objects.filter(
            building=building,
            reported_at__gte=window_start
        ).values('status').annotate(
            unique_users=Count('user_id', distinct=True)
        )

        for report in reports:
            if report['unique_users'] >= 2:
                return report['status']

        return "UNVERIFIED"

    def get_loss_of_service_percentage(self, building: Building, days: int = 30) -> float:
        """
        Calculates the Loss of Service % = (Total Down Time / Total Period Time) * 100.
        Uses a rolling window of N days.
        """
        now = timezone.now()
        start_date = now - timedelta(days=days)
        total_period_seconds = days * 24 * 60 * 60

        down_reports = ElevatorReport.objects.filter(
            building=building,
            status='DOWN',
            reported_at__gte=start_date
        )

        if not down_reports.exists():
            return 0.0

        unique_outages = down_reports.values('reported_at').distinct().count()
        total_down_seconds = unique_outages * (self.CONSENSUS_WINDOW_MINUTES * 60)
        
        percentage = (total_down_seconds / total_period_seconds) * 100
        return round(min(percentage, 100.0), 2)

    def sync_soda_reports(self, building: Building, soda_reports: List[Dict[str, Any]]):
        """
        Synchronizes official SODA reports into our local database.
        """
        for report in soda_reports:
            status = 'DOWN'
            unique_key = report.get('unique_key')
            
            ElevatorReport.objects.get_or_create(
                soda_unique_key=unique_key,
                defaults={
                    'building': building,
                    'user_id': 'NYC_SODA_API',
                    'status': status,
                    'is_official': True,
                    'reported_at': report.get('created_date', timezone.now())
                }
            )
