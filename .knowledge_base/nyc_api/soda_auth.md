# SODA Rate Limits & Auth (Lead: Kiran)

The NYC SODA API (Socrata) provides public access to data, but authentication is required for higher rate limits and reliable production access.

## Authentication
The project uses a Socrata App Token to bypass the standard throttles.

### 1. Token Acquisition
Obtain an App Token from the [Socrata Developer Portal](https://dev.socrata.com/docs/app-tokens/).

### 2. Configuration
The token is stored in the `.env` file and accessed via:
- **Environment Variable:** `SODA_APP_TOKEN`
- **Parameter:** `$$app_token` (passed in the query string).

## Rate Limits
- **Unauthenticated:** Low limits (highly discouraged for production).
- **Authenticated (App Token):** Significantly higher limits, suitable for the platform's background syncing tasks.

## Error Handling
The `SODAService` wrapper (in `backend/services/soda.py`) captures `requests.RequestException` and returns an empty list to prevent application crashes during SODA outages.
