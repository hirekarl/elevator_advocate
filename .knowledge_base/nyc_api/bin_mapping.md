# BIN to SODA Mapping (Lead: Kiran)

The Building Identification Number (BIN) is the primary key for all data integration across the platform.

## Address to BIN Mapping
Geoclient maps raw street addresses to a unique 7-digit BIN.

### 1. Retrieval
- **Tool:** `GeoclientService` (via the `address.json` endpoint).
- **Field:** `buildingIdentificationNumber`

## BIN as Integration Key
All external data sources are joined using the BIN.

### 1. SODA (Elevator Complaints)
The SODA API for elevator complaints (`kqwi-7ncn`) is queried using the BIN as a filter:
- **Query:** `bin='{bin_id}'`

### 2. District Data
Political districts are also derived from the BIN via Geoclient, ensuring that elevator outages are mapped to the correct City Council, State Assembly, and State Senate districts.

## Data Normalization
The platform uses the BIN as the primary key for its local `Building` model, ensuring a stable and unique identifier regardless of street name variations (e.g., `57th St` vs `57 Street`).
