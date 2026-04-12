from django.core.management.base import BaseCommand
from buildings_app.models import Building
from buildings_app.tasks import fetch_building_news

class Command(BaseCommand):
    """
    Management command to refresh news data for all buildings.
    Can be run as a cron job to keep building media records up-to-date.
    """
    help = 'Enqueues news refresh tasks for all buildings in the system.'

    def handle(self, *args, **options):
        buildings = Building.objects.all()
        count = buildings.count()
        
        self.stdout.write(self.style.SUCCESS(f'Found {count} buildings. Enqueueing refresh tasks...'))
        
        for building in buildings:
            # Enqueue the task using Django 6.0 Task Framework
            fetch_building_news.enqueue(bin=building.bin)
            self.stdout.write(f'  -> Queued {building.address} (BIN {building.bin})')
            
        self.stdout.write(self.style.SUCCESS(f'Successfully queued news refresh for {count} buildings.'))
