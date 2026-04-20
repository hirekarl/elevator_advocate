# Technical Handoff: District 17 Historical Sync & PLUTO Mapping

## Objective
To fulfill the promise of a policymaker-facing report for NYC District 17, providing full historical context and identifying building owners/management companies for advocacy targets.

## Status Summary
*   **Infrastructure**: Backend aggregation (`DistrictViewSet`) and Frontend dashboard (`DistrictReport`) are implemented.
*   **Data Pipeline**: The `SODAService` has been updated with a high-reliability owner discovery pipeline using MapPLUTO.
*   **Current State**: 132 buildings in District 17 have been geocoded and enriched with owner data, but a "Zero Reports" anomaly persisted during the final sync attempt.

## The owner Discovery Pipeline (Gold Standard)
We pivoted away from unreliable HPD dataset IDs to the official NYC Planning datasets:
1.  **Building Footprints (`5zhs-2jue`)**: Used to map a Building Identification Number (BIN) to its tax lot identifier (`mappluto_bbl`).
2.  **MapPLUTO (`64uk-42ks`)**: Used to lookup the `ownername` from the BBL. This is the legal entity responsible for the property.

## Technical Challenges & Learnings
### 1. The "Zero Reports" Mystery
Despite successful processing of 132 Bronx buildings, the targeted SODA query returned 0 complaints. 
*   **Action Required**: Manually verify a known offending BIN in `kqwi-7ncn` (Elevator Complaints) to confirm the JSON field name is indeed `bin` and not a case-sensitive variant.

### 2. SODA Sync Timeouts
The "All-Time" city-wide sync (50k+ records) times out because every unique building triggers three external API calls (Geoclient + Footprints + PLUTO).
*   **Resolution**: Implemented `sync_citywide_soda_reports` with `bulk_create` and defensive unique key checks.
*   **Optimization**: The sync command now supports a `--district` flag to focus processing only on buildings within the target boundary.

### 3. Data Integrity
Previous sync attempts introduced duplicate `ElevatorReport` records with empty or null `soda_unique_key` fields.
*   **Fix**: All sync methods now use `ElevatorReport.objects.filter(soda_unique_key=unique_key).exists()` checks and skip reports with missing keys.

## Next Steps
1.  **Debug SODA Payload**: Verify the SODA API response schema for complaints to ensure the BIN filter is working as expected.
2.  **Batch Processing**: Run the sync command in small batches of 50 buildings to stay within API timeout limits.
3.  **Owner Data Coverage**: Some older buildings may lack a `mappluto_bbl` in the footprints dataset; consider a fallback search by address in the PLUTO dataset.

---
**Date**: April 20, 2026
**Lead**: Sol (Orchestrator)
**Specialists**: Elias (Backend), Kiran (Data), Maya (Frontend)
