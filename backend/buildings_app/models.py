from typing import Final

from django.db import models
from django.db.models.functions import Now


class Building(models.Model):
    """
    Represents an NYC Building mapped by its Building Identification Number (BIN).
    """

    bin = models.CharField(max_length=7, unique=True, primary_key=True)
    address = models.TextField()
    borough = models.CharField(max_length=20)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    city_council_district = models.CharField(max_length=10, null=True, blank=True)
    state_assembly_district = models.CharField(max_length=10, null=True, blank=True)
    state_senate_district = models.CharField(max_length=10, null=True, blank=True)
    last_news_refresh = models.DateTimeField(null=True, blank=True)
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
        ("UP", "Back in Service"),
        ("DOWN", "Out of Service / Inoperative"),
        ("TRAPPED", "Entrapment (People inside)"),
        ("SLOW", "Slow or Intermittent Operation"),
        ("UNSAFE", "Unsafe (Doors, leveling, or noise)"),
    ]

    building = models.ForeignKey(
        Building, on_delete=models.CASCADE, related_name="reports"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="elevator_reports",
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    reported_at = models.DateTimeField(db_default=Now())

    # Metadata for SODA synchronization
    is_official = models.BooleanField(default=False)  # True if from SODA API
    soda_unique_key = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["building", "reported_at", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.status} at {self.building.bin} by {self.user_id}"


class BuildingNews(models.Model):
    """
    Tracks local news reports and media mentions regarding elevator outages
    and safety issues for a specific building.
    """

    building = models.ForeignKey(
        Building, on_delete=models.CASCADE, related_name="news_articles"
    )
    title = models.CharField(max_length=500)
    url = models.URLField(max_length=1000, unique=True)
    source = models.CharField(max_length=200)
    published_date = models.DateField(null=True, blank=True)
    summary = models.TextField()
    relevance_score = models.FloatField(default=0.0)  # 0-1 scale
    created_at = models.DateTimeField(db_default=Now())

    class Meta:
        verbose_name_plural = "Building News"
        indexes = [
            models.Index(fields=["building", "relevance_score"]),
        ]

    def __str__(self) -> str:
        return f"News: {self.title} ({self.source})"


class UserProfile(models.Model):
    """
    Extends the base User to include a primary building association.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    primary_building = models.ForeignKey(
        Building,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="residents",
    )

    def __str__(self) -> str:
        return f"Profile for {self.user.username}"


class AdvocacyLog(models.Model):
    """
    Tracks 311 Service Requests (SR) and legal actions by users for a building.
    Creates a persistent "Paper Trail" for accountability.
    """

    building = models.ForeignKey(
        Building, on_delete=models.CASCADE, related_name="advocacy_logs"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="advocacy_logs"
    )
    sr_number = models.CharField(max_length=50, verbose_name="311 Service Request #")
    description = models.TextField(
        blank=True, help_text="Any extra notes Martha or her niece want to track."
    )
    outcome = models.CharField(
        max_length=200,
        blank=True,
        help_text="E.g., 'Inspected', 'Closed - No Violation Found'.",
    )
    created_at = models.DateTimeField(db_default=Now())
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Advocacy Logs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"SR {self.sr_number} at {self.building.address}"


class CouncilDistrict(models.Model):
    """
    Stores NYC Council District information and current member contact details.
    Populated via the council_districts fixture; update the fixture after each election cycle.
    """

    district_id = models.CharField(max_length=10, primary_key=True)
    member_name = models.CharField(max_length=100)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    last_synced = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Council District"
        verbose_name_plural = "Council Districts"
        ordering = ["district_id"]

    def __str__(self) -> str:
        return f"District {self.district_id}: {self.member_name}"
