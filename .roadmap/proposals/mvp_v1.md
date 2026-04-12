# Proposal: MVP v1 - The Verification Engine (Detailed)

## Objective
Deliver a functional prototype implementing the **2-Hour Consensus Window** for NYC elevator status verification, linking user reports with official SODA data via BIN mapping.

## Technical Milestones

### 1. [Kiran] Data Ingestion & Mapping
- **Geoclient Service:** Implement `Address -> BIN` mapping using the NYC Geoclient v2 API.
- **SODA Service:** Pull filtered reports from dataset `kqwi-7ncn` (Descriptors 81: Inoperative, 63: Failed Test).
- **BIN Synchronization:** Ensure all incoming reports are keyed by Building Identification Number (BIN) for cross-service consistency.

### 2. [Elias] The Consensus Engine (Django 6.0)
- **The 120-Minute Window:** Implement logic where an elevator's status is only "Verified" if two independent `user_id`s report the same `elevator_id` within 2 hours.
- **ORM Optimization:** Use `GeneratedField` to calculate "Verified" status at the database level.
- **API Endpoints:** Create REST endpoints for reporting outages and retrieving building-wide status.

### 3. [Maya] The Responsive UI (React 19)
- **Optimistic Reporting:** Use `useOptimistic` for "Syncing..." and instant UI updates.
- **Visual States:** Implement "Pulse Amber" animations for unverified reports and solid states for verified data.
- **Empty States:** Design intentional UI for "No reported outages" scenarios.

### 4. [Blythe] Quality & Standards
- **Strict Typing:** 100% `mypy` coverage on the consensus engine and data models.
- **Plain English:** Remove all jargon from UI labels and error messages.
- **Linting:** Enforce Ruff formatting across all new services.

## Roadmap & Sprints
- **Sprint 1 (Data):** Geoclient + SODA Service Wrappers (Kiran).
- **Sprint 2 (Engine):** Consensus Logic + Django 6.0 Models (Elias).
- **Sprint 3 (UI):** React 19 Components + Integration (Maya).
