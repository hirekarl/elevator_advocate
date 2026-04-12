from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import MagicMock
from django.contrib.auth.models import User
from .models import Building, ElevatorReport
from .logic import ConsensusManager
from services.geoclient import GeoclientService

class ConsensusManagerTests(TestCase):
    """
    Unit tests for the 120-minute consensus logic.
    """

    def setUp(self):
        # Mock Geoclient to avoid external API calls
        self.mock_geoclient = MagicMock(spec=GeoclientService)
        self.manager = ConsensusManager(geoclient=self.mock_geoclient)
        
        self.building = Building.objects.create(
            bin="1234567",
            address="123 Broadway",
            borough="Manhattan"
        )
        
        # Create test users
        self.user1 = User.objects.create_user(username="user1")
        self.user2 = User.objects.create_user(username="user2")
        self.user3 = User.objects.create_user(username="user3")

    def test_single_report_is_unverified(self):
        """
        A single report should result in UNVERIFIED status.
        """
        self.manager.report_status(self.building, self.user1, "DOWN")
        status = self.manager.get_verified_status(self.building)
        self.assertEqual(status, "UNVERIFIED")

    def test_two_reports_same_user_is_unverified(self):
        """
        Two reports from the same user should result in UNVERIFIED status.
        """
        self.manager.report_status(self.building, self.user1, "DOWN")
        self.manager.report_status(self.building, self.user1, "DOWN")
        status = self.manager.get_verified_status(self.building)
        self.assertEqual(status, "UNVERIFIED")

    def test_two_reports_different_users_within_window_is_verified(self):
        """
        Two reports from different users within 2 hours should result in VERIFIED status.
        """
        self.manager.report_status(self.building, self.user1, "DOWN")
        self.manager.report_status(self.building, self.user2, "DOWN")
        status = self.manager.get_verified_status(self.building)
        self.assertEqual(status, "DOWN")

    def test_two_reports_outside_window_is_unverified(self):
        """
        Two reports from different users more than 2 hours apart should result in UNVERIFIED status.
        """
        # Create an old report
        old_time = timezone.now() - timedelta(minutes=130)
        ElevatorReport.objects.create(
            building=self.building,
            user=self.user1,
            status="DOWN",
            reported_at=old_time
        )
        
        # Create a new report
        self.manager.report_status(self.building, self.user2, "DOWN")
        
        status = self.manager.get_verified_status(self.building)
        self.assertEqual(status, "UNVERIFIED")

    def test_conflicting_reports_require_two_of_one_type(self):
        """
        If user1 reports UP and user2 reports DOWN, it remains UNVERIFIED.
        If user3 then reports DOWN, it becomes DOWN.
        """
        self.manager.report_status(self.building, self.user1, "UP")
        self.manager.report_status(self.building, self.user2, "DOWN")
        self.assertEqual(self.manager.get_verified_status(self.building), "UNVERIFIED")
        
        self.manager.report_status(self.building, self.user3, "DOWN")
        self.assertEqual(self.manager.get_verified_status(self.building), "DOWN")
