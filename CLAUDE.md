# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NYC tenant elevator advocacy platform. Tenants search an address, get a BIN (Building Identification Number), see elevator complaint history from NYC Open Data, and submit status reports. Two independently-submitted matching reports within a 2-hour rolling window trigger "VERIFIED" status. Includes loss-of-service metrics, predictive failure risk scoring, and news intelligence.

## Tech Stack

- **Backend**: Django 6.0, Django REST Framework, Python 3.12+, `uv` package manager
- **Frontend**: React 19, TypeScript, Vite, React Bootstrap, Leaflet maps, i18next (EN/ES)
- **Database**: SQLite (dev), PostgreSQL (prod via Render.com)
- **External APIs**: NYC Geoclient v2, NYC SODA (`kqwi-7ncn`), Google Gemini, SerpAPI
- **Task Queue**: Django Tasks Framework (`ImmediateBackend` dev, `DatabaseBackend` prod)

## Development Commands

### Backend

```bash
cd backend
uv sync                                          # Install deps / create virtualenv
uv run python manage.py migrate                  # Apply migrations
uv run python manage.py runserver                # Dev server on :8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                                      # Vite dev server on :5173
```

Vite proxies `/api` → `localhost:8000`, so both servers must run concurrently.

## Testing

```bash
cd backend
uv run pytest                                    # All tests
uv run pytest buildings_app/tests.py             # Single file
uv run pytest buildings_app/tests.py::ClassName  # Single class
uv run pytest -v                                 # Verbose
```

Pytest config lives in `backend/pyproject.toml` (`[tool.pytest.ini_options]`). Set `USE_MOCK_GEOCLIENT=True` in `.env` to skip real Geoclient API calls in tests.

Frontend has no test runner configured.

## Linting & Type Checking

```bash
cd backend
uv run ruff format .           # Format
uv run ruff check . --fix      # Lint + auto-fix
uv run mypy . --ignore-missing-imports  # Type checking (must be clean)
```

```bash
cd frontend
npm run lint                   # ESLint, zero warnings allowed
```

All four checks (ruff, mypy, pytest, `manage.py check`) are bundled in `backend/scripts/pre_flight.sh`. Run it before committing.

## Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable | Purpose |
|---|---|
| `NYC_API_KEY` | NYC Geoclient v2 |
| `SODA_APP_TOKEN` | NYC Open Data (Socrata) |
| `GEMINI_API_KEY` | Google Gemini (news extraction) |
| `SERPAPI_KEY` | SerpAPI (Google Search) |
| `DJANGO_SECRET_KEY` | Django secret (`openssl rand -base64 32`) |
| `USE_MOCK_GEOCLIENT` | `True` to skip Geoclient in dev/test |
| `USE_MOCK_SERPAPI` | `True` to skip SerpAPI in dev |
| `DJANGO_TIME_ZONE` | Must be `America/New_York` (2-hour window logic depends on it) |

## Architecture

### Request Flow

```
HeroSearch (address input)
  → POST /api/buildings/lookup/       → Geoclient API → BIN
  → GET  /api/buildings/{bin}/        → BuildingViewSet → aggregated data
  → POST /api/reports/                → ReportViewSet → ConsensusManager
```

### Core Domain: Two-Hour Consensus (`buildings_app/logic.py`)

`ConsensusManager` enforces the fundamental business rule: elevator status only becomes `VERIFIED` when two **different** users submit the same status within a 2-hour rolling window. Single reports show as amber/unverified with a `verification_countdown`. This is intentional — do not simplify it away.

### Data Pipeline (`buildings_app/views.py`, `services/`)

1. **Geocoding** (`services/geoclient.py`): Address → BIN via NYC Geoclient
2. **SODA queries** (`services/soda.py`): Elevator complaints from dataset `kqwi-7ncn` (category 81 = inoperative, 63 = failed test)
3. **Predictive engine** (`buildings_app/ai_logic.py`): 7-day failure risk score using 180-day baseline vs. 14-day recent volatility
4. **News intelligence** (`services/news_search.py`): SerpAPI → Gemini extraction → relevance score (0–1); 24-hour refresh cooldown per building to protect API quotas

### Auth

Token-based (DRF `TokenAuthentication`). Token stored in localStorage on the frontend, sent as `Authorization: Token <token>`. User profiles extend `User` via OneToOne (`UserProfile.primary_building`). Advocacy logs are private to the owning user.

### Key Files

| File | Role |
|---|---|
| `backend/config/settings.py` | Django config |
| `backend/config/urls.py` | Root URL routing |
| `backend/buildings_app/urls.py` | API router (`DefaultRouter`) |
| `backend/buildings_app/models.py` | `Building`, `ElevatorReport`, `AdvocacyLog`, `BuildingNews` |
| `backend/buildings_app/views.py` | All API viewsets |
| `backend/buildings_app/logic.py` | `ConsensusManager` (2-hour rule) |
| `backend/buildings_app/ai_logic.py` | `PredictiveEngine` (failure risk) |
| `frontend/src/App.tsx` | Router + main dashboard |
| `frontend/src/i18n.ts` | All EN/ES translations |

## Code Standards

- **Full type annotations** on every Python function — mypy must pass clean
- **Google-style docstrings** on all services and models
- **No raw 0s** in UI: loss-of-service and risk scores show intentional empty states when data is absent
- `DJANGO_TIME_ZONE=America/New_York` is load-bearing; the 2-hour window logic uses timezone-aware datetimes
- CORS is open (`CORS_ALLOW_ALL_ORIGINS = True`) in dev; restrict in production

## Deployment

Render.com via `render.yaml`:
1. Django API service (Gunicorn)
2. Django task worker (`runworker`)
3. React frontend (static)

Build script: `render_build.sh` (runs migrations + `collectstatic`).
