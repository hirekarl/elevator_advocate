# Multi-Agent Analysis (Supervisor-Worker)

## Architecture
The system uses a Supervisor agent to delegate research and strategy tasks to specialized workers.

### Workers
1. **SODAResearcher:** 
   - **Task:** Aggregates elevator complaint history from the NYC SODA API (Dataset `kqwi-7ncn`).
   - **Data Points:** Filters for active categories `'6S'` (elevator complaint) and `'6M'` (elevator/escalator). Codes `'81'` and `'63'` are retired and must not be used.
2. **CommunityReporter:** 
   - **Task:** Scans and aggregates local tenant logs and internal verification history.
3. **AdvocacyStrategist:** 
   - **Task:** Maps data against NYC housing law to suggest legal/organizing next steps.
   - **Output:** Generates 311 scripts and tenant association templates.

## Orchestration Flow
- **Input:** Building BIN or Address.
- **Supervisor:** Decomposes request into sub-tasks for SODAResearcher and CommunityReporter.
- **Synthesis:** AdvocacyStrategist processes the combined output to provide tenant-facing recommendations.
