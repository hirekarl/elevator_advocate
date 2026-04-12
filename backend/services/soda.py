import os
from typing import List, Dict, Any, Optional
import requests
from datetime import datetime

class SODAService:
    """
    Service wrapper for the NYC SODA API (Dataset kqwi-7ncn).
    Fetches elevator-specific complaints.
    """

    BASE_URL = "https://data.cityofnewyork.us/resource/kqwi-7ncn.json"

    def __init__(self, app_token: Optional[str] = None):
        self.app_token = app_token or os.getenv("SODA_APP_TOKEN")

    def get_elevator_complaints(self, bin: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Fetches complaints for a specific BIN, filtered by elevator-related descriptors.
        """
        # Descriptor codes: '81' (Inoperative), '63' (Failed Test)
        where_clause = f"bin='{bin}' AND descriptor IN ('81', '63')"
        
        params = {
            "$where": where_clause,
            "$limit": limit,
            "$$app_token": self.app_token
        }

        try:
            response = requests.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"SODA Error: {e}")
            return []

    def get_recent_outages(self, hours: int = 24) -> List[Dict[str, Any]]:
        """
        Fetches all elevator-related outages across NYC from the last N hours.
        """
        # SODA floating timestamp format: YYYY-MM-DDTHH:MM:SS
        from datetime import datetime, timedelta
        limit_date = (datetime.now() - timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%S")
        
        where_clause = f"descriptor IN ('81', '63') AND created_date > '{limit_date}'"
        params = {"$where": where_clause, "$$app_token": self.app_token}

        try:
            response = requests.get(self.BASE_URL, params=params, timeout=15)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"SODA Sync Error: {e}")
            return []
