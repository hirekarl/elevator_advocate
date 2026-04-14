from typing import Any

import requests


class GeoSearchService:
    """
    Geocoder backed by the NYC Planning Labs GeoSearch API.

    No authentication required. Used as a fallback when the NYC Geoclient
    subscription key is not yet active. Returns the same shape as
    GeoclientService so the two are interchangeable at the call site.

    Reference: https://geosearch.planninglabs.nyc/v2
    """

    BASE_URL = "https://geosearch.planninglabs.nyc/v2/search"

    # GeoSearch uses Pelias borough names; map our app's values to its expectation.
    BOROUGH_ALIASES: dict[str, str] = {
        "manhattan": "Manhattan",
        "brooklyn": "Brooklyn",
        "queens": "Queens",
        "bronx": "Bronx",
        "staten island": "Staten Island",
        "staten_island": "Staten Island",
    }

    def get_bin_with_coordinates(
        self, house_number: str, street: str, borough: str
    ) -> dict[str, Any]:
        """
        Geocodes a street address and returns the BIN and lat/lon.

        Builds a free-text query from the address components and hits the
        GeoSearch `/search` endpoint, then extracts the BIN from the PAD
        addendum on the first result.
        """
        borough_display = self.BOROUGH_ALIASES.get(borough.lower(), borough)
        query = f"{house_number} {street}, {borough_display}, NY"

        try:
            response = requests.get(
                self.BASE_URL,
                params={"text": query, "size": "1"},
                timeout=10,
            )
            response.raise_for_status()
            features = response.json().get("features", [])

            if not features:
                return {}

            feature = features[0]
            props = feature.get("properties", {})
            coords = feature.get("geometry", {}).get("coordinates", [])
            bin_id = props.get("addendum", {}).get("pad", {}).get("bin")

            if not bin_id or not coords:
                return {}

            return {
                "bin": str(bin_id),
                "latitude": str(coords[1]),
                "longitude": str(coords[0]),
            }

        except (requests.RequestException, KeyError, IndexError) as exc:
            print(f"GeoSearch Error: {exc}")
            return {}

    def get_address_details(self, bin_id: str) -> dict[str, Any]:
        """
        GeoSearch does not support BIN-based reverse lookup, so this returns
        an empty dict. The field is only used by ancillary tooling, not the
        core request flow.
        """
        return {}
