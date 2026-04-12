from django.db import models
from django.db.models.functions import Now
from typing import Final

class Building(models.Model):
    """
    Represents an NYC Building mapped by its Building Identification Number (BIN).
    """
    bin = models.CharField(max_length=7, unique=True, primary_key=True)
    address = models.TextField()
    borough = models.CharField(max_length=20)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(db_default=Now())

    def __str__(self) -> str:
        return f"{self.address} (BIN: {self.bin})"

from django.contrib.auth.models import User

class ElevatorReport(models.Model):
    """
    User-submitted reports for elevator status.
    Implements the 2-hour consensus logic.
    """
    STATUS_CHOICES: Final = [
        ('UP', 'Back in Service'),
        ('DOWN', 'Out of Service / Inoperative'),
        ('TRAPPED', 'Entrapment (People inside)'),
        ('SLOW', 'Slow or Intermittent Operation'),
        ('UNSAFE', 'Unsafe (Doors, leveling, or noise)'),
    ]

    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='reports')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='elevator_reports')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    reported_at = models.DateTimeField(db_default=Now())
    
    # Metadata for SODA synchronization
    is_official = models.BooleanField(default=False)  # True if from SODA API
    soda_unique_key = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['building', 'reported_at', 'status']),
        ]

    def __str__(self) -> str:
        return f"{self.status} at {self.building.bin} by {self.user_id}"
