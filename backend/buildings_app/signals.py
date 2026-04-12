from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Building
from .tasks import fetch_building_news

@receiver(post_save, sender=Building)
def trigger_news_search(sender, instance, created, **kwargs):
    """
    Triggers the news search background task when a new building is created.
    """
    if created:
        fetch_building_news.enqueue(bin=instance.bin)
