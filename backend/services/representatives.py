from typing import Any, Dict

from buildings_app.models import CouncilDistrict


class RepresentativeService:
    """
    Service for fetching NYC Representative contact information.
    Uses the database-backed CouncilDistrict model for all 51 districts.
    """

    def get_representative_for_address(self, address: str) -> Dict[str, Any]:
        """
        Generic fallback if district is unknown.
        """
        return {
            "name": "NYC City Council",
            "title": "Representative",
            "email": "council@council.nyc.gov",
            "phone": "212-788-7100",
            "district": "NYC",
        }

    def get_member_by_district(self, district_id: str) -> Dict[str, Any]:
        """
        Fetches City Council member details by district ID from the database.
        """
        if not district_id:
            return self.get_representative_for_address("")

        # Clean the district ID (remove leading zeros)
        clean_id = (
            str(int(district_id))
            if district_id and district_id.isdigit()
            else district_id
        )

        try:
            district = CouncilDistrict.objects.get(district_id=clean_id)
            return {
                "name": district.member_name,
                "title": f"Council Member (District {clean_id})",
                "email": district.email,
                "phone": district.phone,
                "district": clean_id,
            }
        except CouncilDistrict.DoesNotExist:
            return self.get_representative_for_address("")
