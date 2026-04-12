from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Building, UserProfile
from .tasks import fetch_building_news

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=Building)
def trigger_news_search(sender, instance, created, **kwargs):
    """
    (Deprecated) Moved trigger to views.py to prevent searches for 
    invalid buildings or incomplete geocoding.
    """
    pass
