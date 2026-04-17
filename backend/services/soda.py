import os
from datetime import timedelta
from typing import Any, Dict, List, Optional

import requests
from django.utils import timezone


class SODAService:
    """
    Service wrapper for the NYC SODA API (Dataset kqwi-7ncn).
    Fetches elevator-specific complaints.
    """

    BASE_URL = "https://data.cityofnewyork.us/resource/kqwi-7ncn.json"

    def __init__(self, app_token: Optional[str] = None):
        self.app_token = app_token or os.getenv("SODA_APP_TOKEN")

    def get_elevator_complaints(
        self, bin: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Fetches complaints for a specific BIN, filtered by elevator-related categories.
        """
        # Active category codes as of 2018: '6S' (elevator complaints) and '6M' (elevator/escalator).
        # Codes '81' (retired 2007) and '63' (retired 2016) must not be used for current data.
        where_clause = f"bin='{bin}' AND complaint_category IN ('6S', '6M')"

        params: Dict[str, Any] = {
            "$where": where_clause,
            "$limit": limit,
            "$$app_token": self.app_token,
        }

        try:
            response = requests.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            if isinstance(data, list):
                return data
            return []
        except requests.RequestException as e:
            print(f"SODA Error: {e}")
            return []

    def get_recent_outages(self, hours: int = 24) -> List[Dict[str, Any]]:
        """
        Fetches all elevator-related outages across NYC from the last N hours.
        If hours=0, fetches the absolute most recent N outages regardless of time.
        """
        # SODA floating timestamp format: YYYY-MM-DDTHH:MM:SS
        if hours > 0:
            limit_date = (timezone.now() - timedelta(hours=hours)).strftime(
                "%Y-%m-%dT%H:%M:%S"
            )
            where_clause = (
                f"complaint_category IN ('6S', '6M') AND date_entered > '{limit_date}'"
            )
            params: Dict[str, Any] = {
                "$where": where_clause,
                "$$app_token": self.app_token,
            }
        else:
            where_clause = "complaint_category IN ('6S', '6M')"
            params = {
                "$where": where_clause,
                "$order": "date_entered DESC",
                "$limit": 1000,
                "$$app_token": self.app_token,
            }

        try:
            response = requests.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            if isinstance(data, list):
                return data
            return []
        except requests.RequestException as e:
            print(f"SODA Sync Error: {e}")
            return []
