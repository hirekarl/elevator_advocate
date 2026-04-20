import logging
from django.core.management.base import BaseCommand
from services.soda import SODAService
from buildings_app.logic import ConsensusManager

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Syncs elevator complaints from SODA city-wide for the last 24 hours."

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours", type=int, default=24, help="Number of hours to look back (0 for all-time)."
        )
        parser.add_argument(
            "--district", type=str, default=None, help="Council District ID to focus on."
        )

    def handle(self, *args, **options):
        hours = options["hours"]
        district_id = options["district"]
        
        time_msg = f"last {hours} hours" if hours > 0 else "ALL-TIME"
        self.stdout.write(f"Fetching SODA reports for {time_msg}...")
        
        # Determine borough if district is provided
        borough_code = "2" if district_id == "17" else None
        
        soda = SODAService()
        reports = soda.get_recent_outages(hours=hours, borough_code=borough_code)
        
        if not reports:
            self.stdout.write(self.style.WARNING("No reports found in the specified window."))
            return

        self.stdout.write(f"Found {len(reports)} reports. Syncing to database...")
        
        manager = ConsensusManager()
        synced_count = manager.sync_citywide_soda_reports(reports, target_district=district_id)
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully synced {synced_count} new official reports.")
        )
