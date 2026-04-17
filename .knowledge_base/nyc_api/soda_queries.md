# SoQL Query Parameters (Lead: Kiran)

The project queries the NYC SODA API (Dataset `kqwi-7ncn`) using Socrata Query Language (SoQL).

## Dataset Information
- **ID:** `kqwi-7ncn` (Elevator Complaints)
- **Base URL:** `https://data.cityofnewyork.us/resource/kqwi-7ncn.json`

## Elevator-Specific Filters
To ensure we only track relevant elevator issues, we filter by `complaint_category`:
- **`6S`**: Elevator complaints (active, 2018–present)
- **`6M`**: Elevator/escalator complaints (active, 2018–present)

> **Do not use** codes `81` (retired 2007) or `63` (retired 2016) — they return no results on current data.

## Common Query Patterns

### 1. Fetching by BIN
Used to retrieve history for a specific building.
```python
where_clause = "bin='{bin}' AND complaint_category IN ('6S', '6M')"
params = {
    "$where": where_clause,
    "$limit": 50,
    "$$app_token": self.app_token,
}
```

### 2. Fetching Recent Outages (Last 24 Hours)
Used for the global "Loss of Service" dashboard and real-time alerts.
```python
limit_date = "2026-04-13T10:00:00" # Example timestamp
where_clause = f"complaint_category IN ('6S', '6M') AND date_entered > '{limit_date}'"
params = {
    "$where": where_clause,
    "$$app_token": self.app_token,
}
```

### 3. Ordering
Results are typically ordered by `date_entered DESC` to show the most recent complaints first.
