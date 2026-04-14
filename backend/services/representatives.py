import json
import os
from typing import Dict, Any, Optional

class RepresentativeService:
    """
    Service for fetching NYC Representative contact information.
    Uses a local JSON mapping for all 51 City Council districts.
    """

    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(__file__), 'nyc_council_districts.json')
        self._mapping = {}
        self._load_mapping()

    def _load_mapping(self):
        try:
            with open(self.data_path, 'r') as f:
                self._mapping = json.load(f)
        except Exception as e:
            print(f"Error loading NYC Council mapping: {e}")

    def get_representative_for_address(self, address: str) -> Dict[str, Any]:
        """
        Generic fallback if district is unknown.
        """
        return {
            "name": "NYC City Council",
            "title": "Representative",
            "email": "council@council.nyc.gov",
            "phone": "212-788-7100",
            "district": "NYC"
        }

    def get_member_by_district(self, district_id: str) -> Dict[str, Any]:
        """
        Fetches City Council member details by district ID string.
        """
        # Clean the district ID (remove leading zeros)
        clean_id = str(int(district_id)) if district_id and district_id.isdigit() else district_id

        if clean_id in self._mapping:
            member = self._mapping[clean_id]
            return {
                "name": member.get("name"),
                "title": f"Council Member (District {clean_id})",
                "email": member.get("email"),
                "phone": member.get("phone"),
                "district": clean_id
            }

        return self.get_representative_for_address("")
