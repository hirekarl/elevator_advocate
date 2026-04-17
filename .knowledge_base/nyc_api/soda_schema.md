# NYC API: SODA Dataset `kqwi-7ncn` (Leaf)

## Implementation Pattern
Surgical mapping for elevator complaint ingestion.

### Primary Endpoint
`https://data.cityofnewyork.us/resource/kqwi-7ncn.json`

### Field Mapping
| SODA Field | Internal Model | Logic |
| :--- | :--- | :--- |
| `unique_key` | `report_id` | Primary Key |
| `created_date` | `reported_at` | Consensus window start |
| `descriptor` | `outage_type` | Code 6S=Elevator complaint, 6M=Elevator/escalator (active 2018+) |
| `bin` | `building_id` | Linking key |

### Sample SoQL Query
```http
?$where=complaint_category IN ('6S', '6M') AND date_entered > '2026-01-01T00:00:00'
```
