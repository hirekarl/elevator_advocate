# Geoclient v2 Address Endpoint (Lead: Kiran)

The project uses the NYC Geoclient v2 API as the primary source for address validation and mapping street addresses to BINs.

## API Endpoint
- **Base URL:** `https://api.nyc.gov/geo/geoclient/v2/address.json`

## Configuration
- **API Key:** `NYC_API_KEY` (configured in `.env`).
- **Header:** `Ocp-Apim-Subscription-Key`.

## Parameters
- **`houseNumber`**: House number (e.g., `123`)
- **`street`**: Street name (e.g., `West 57th Street`)
- **`borough`**: Borough name (e.g., `Manhattan`)

## Fallback Strategy
A critical feature of the `GeoclientService` (in `backend/services/geoclient.py`) is the automatic fallback on a **401 Unauthorized** error.
- **Cause:** Typically occurs during the provisioning window after a new API key is issued.
- **Fallback:** Delegates to `GeoSearchService` (a secondary geocoder) to ensure continuous operation.

## Key Outputs
The Geoclient API returns the following fields essential for the platform:
- `buildingIdentificationNumber` (BIN)
- `latitude` / `longitude`
- `cityCouncilDistrict`
- `assemblyDistrict`
- `stateSenatorialDistrict`
