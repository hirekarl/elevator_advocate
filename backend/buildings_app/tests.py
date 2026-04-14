from datetime import timedelta
from unittest.mock import MagicMock

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from services.geoclient import GeoclientService

from .logic import ConsensusManager
from .models import Building, ElevatorReport


class ConsensusManagerTests(TestCase):
    """
    Unit tests for the 120-minute consensus logic.
    """

    def setUp(self):
        # Mock Geoclient to avoid external API calls
        self.mock_geoclient = MagicMock(spec=GeoclientService)
        self.manager = ConsensusManager(geoclient=self.mock_geoclient)

        self.building = Building.objects.create(
            bin="1234567", address="123 Broadway", borough="Manhattan"
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
            building=self.building, user=self.user1, status="DOWN", reported_at=old_time
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


class BuildingViewSetTests(APITestCase):
    """
    Integration tests for BuildingViewSet actions.
    """

    def setUp(self) -> None:
        self.user = User.objects.create_user(username="testuser", password="password")
        self.building = Building.objects.create(
            bin="1234567", address="123 Broadway", borough="Manhattan"
        )
        self.client.force_authenticate(user=self.user)

    def test_report_status_action_success(self) -> None:
        """
        The report_status action should successfully create an ElevatorReport.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/buildings/{self.building.bin}/report_status/",
            {"status": "DOWN"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ElevatorReport.objects.count(), 1)
        report = ElevatorReport.objects.first()
        assert report is not None
        self.assertEqual(report.status, "DOWN")

    def test_report_status_action_invalid_status(self) -> None:
        """
        The report_status action should return 400 for an invalid status.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/buildings/{self.building.bin}/report_status/",
            {"status": "INVALID"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        assert isinstance(response.data, dict)
        self.assertIn("Invalid status", response.data["error"])

    def test_report_status_action_unauthenticated(self) -> None:
        """
        The report_status action should require authentication.
        """
        self.client.force_authenticate(user=None)
        response = self.client.post(
            f"/api/buildings/{self.building.bin}/report_status/",
            {"status": "DOWN"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
