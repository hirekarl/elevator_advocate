from typing import Optional, Dict, Any

class MockGeoclientService:
    """
    Mock implementation of the NYC Geoclient v2 API.
    Provides realistic BINs for testing without external API calls.
    """

    # Real NYC Address -> BIN mappings for testing
    MOCK_DATA = {
        ("120", "Broadway", "Manhattan"): "1001145",
        ("1", "City Hall Park", "Manhattan"): "1000001",
        ("350", "5th Ave", "Manhattan"): "1015862", # Empire State Building
        ("200", "Eastern Pkwy", "Brooklyn"): "3028212", # Brooklyn Museum
    }

    def get_bin_with_coordinates(self, house_number: str, street: str, borough: str) -> Dict[str, Any]:
        """
        Returns a mock BIN and coordinates for common addresses.
        """
        key = (house_number.strip(), street.strip().title(), borough.strip().title())
        
        # Default mock coordinates for NYC (Manhattan City Hall area)
        lat = 40.7128 + (hash(key) % 1000) * 0.0001
        lon = -74.0060 + (hash(key) % 1000) * 0.0001

        if key in self.MOCK_DATA:
            return {
                "bin": self.MOCK_DATA[key],
                "latitude": lat,
                "longitude": lon
            }
        
        return {
            "bin": f"9{hash(key) % 1000000:06d}",
            "latitude": lat,
            "longitude": lon
        }

    def get_address_details(self, bin: str) -> Dict[str, Any]:
        """
        Returns mock address metadata.
        """
        return {
            "address": {
                "buildingIdentificationNumber": bin,
                "houseNumber": "120",
                "street": "Broadway",
                "borough": "Manhattan"
            }
        }
