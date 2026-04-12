from django.core.management.base import BaseCommand
from buildings_app.logic import ConsensusManager
from services.soda import SODAService
from buildings_app.models import Building

class Command(BaseCommand):
    help = "Polls NYC Open Data (SODA) for recent elevator complaints and syncs them to the local database."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("🚀 Starting SODA synchronization..."))
        
        soda = SODAService()
        manager = ConsensusManager()
        
        # Fetch complaints from the last 24 hours
        recent_complaints = soda.get_recent_outages(hours=24)
        self.stdout.write(f"Found {len(recent_complaints)} recent elevator complaints in SODA.")

        synced_count = 0
        for report in recent_complaints:
            bin_id = report.get('bin')
            if not bin_id:
                continue

            # Ensure the building exists in our DB
            building, created = Building.objects.get_or_create(
                bin=bin_id,
                defaults={
                    'address': report.get('incident_address', 'Unknown Address'),
                    'borough': report.get('borough', 'Unknown')
                }
            )
            
            # Sync the report via the ConsensusManager logic
            # Official reports are marked 'is_official=True' inside sync_soda_reports
            manager.sync_soda_reports(building, [report])
            synced_count += 1

        self.stdout.write(self.style.SUCCESS(f"✅ Successfully processed {synced_count} reports."))
