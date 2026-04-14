# NYC Tenant Elevator Advocacy Platform

I am building this platform to empower NYC tenants with the data and tools they need to address elevator mismanagement. By cross-referencing real-time tenant reports with official NYC Department of Buildings (DOB) records, I provide a clear, quantified view of building maintenance performance and a guided workflow for advocacy.

## Core Mission
I aim to close the information gap between residents and property owners. This tool provides:
- **Verified Transparency**: Tenant reports require multi-user consensus within a specific time window to ensure data integrity.
- **Quantified Advocacy**: I calculate a "Loss of Service" metric to help tenants present hard data in housing court or to the media.
- **Automated Intelligence**: A custom multi-agent system analyzes building history and suggests specific legal or community organizing steps.

## Tech Stack
I selected these technologies to ensure a decoupled, performant, and type-safe environment:
- **Backend**: Django 6.0, Django REST Framework, PostgreSQL.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
- **Package Management**: `uv` for Python, `npm` for JavaScript.
- **Type Safety**: `django-stubs` with `django-stubs-ext` for full generic support in Django 6.0.
- **Orchestration**: Custom Python-based multi-agent system using Gemini 2.5 Flash.

## Getting Started

### Prerequisites
- Python 3.12+ 
- `uv` (Installed via `curl -LsSf https://astral.sh/uv/install.sh`)
- Node.js 20+

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create and sync the environment: `uv sync`
3. Set up your environment variables: `cp .env.example .env` (Add your NYC Open Data, SerpAPI, and Gemini API keys).
4. Run migrations: `uv run python manage.py migrate`
5. Start the server: `uv run python manage.py runserver`
6. **Validation**: Run `./scripts/pre_flight.sh` to ensure Ruff, Mypy, and Pytest are all passing.

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Run linting and type-checks: `npm run lint` and `npm run build`
5. Run E2E tests: `npm run test:e2e`

## Testing & Validation

### Automated Checks
I use a multi-layered validation strategy:
- **Unit Tests**: `uv run pytest` (Runs fast, local-only tests).
- **E2E Tests**: `npm run test:e2e` (Runs Playwright browser tests).
- **Pre-Flight**: `backend/scripts/pre_flight.sh` (Runs the full suite: Ruff + Mypy + System Check + Pytest).

### Smoke Tests (Credentialed)
I have standalone scripts for verifying live API integrations. These require active API keys in your `.env`:
- **SODA Sync**: `uv run test_soda.py`
- **AI Orchestration**: `uv run test_ai_orchestration.py`
- **Full System**: `uv run smoke_test.py`

## Core Domain Logic
- **The 2-Hour Consensus Rule**: An elevator outage is only marked as "Verified" once two different users report the same status within a rolling 2-hour window.
- **Advocacy Workflow**: Residents can generate an AI-powered 311 script or use the **"Email Representative"** feature. This tool automatically maps the building to its NYC Council District and drafts an email to the correct member (e.g., Christopher Marte) including the building's specific "Loss of Service" data.
- **SODA Pipeline**: I query the NYC Open Data Socrata API for category 81 (Elevator Danger/Inoperative) and category 63 (Failed Test) complaints.
- **Agentic Analysis**: I use a Supervisor-Worker pattern to analyze data. The "Advocacy Strategist" agent maps building violations against NYC housing laws to provide specific "Next Step" workflows.

## Architecture & API Workflow
The platform acts as a **synthesis engine**, correlating disparate official data sources with real-time resident observations to produce a quantified "Loss of Service" metric. 

```mermaid
graph TD
    A[Resident Enters Address] --> B{Geocoding Service}
    B -->|Primary| C[NYC Geoclient v2 API]
    B -->|Fallback| D[NYC Planning GeoSearch]
    
    C --> E[BIN, Coordinates, Political Districts]
    D --> E
    
    E --> F[Data Collection Pipeline]
    
    subgraph "External Data Fetching"
        F --> G[NYC Open Data: SODA API]
        F --> H[SerpAPI: Local News Search]
        F --> I[NYC Council Data: District Mapping]
    end
    
    G --> J[Consensus Manager]
    H --> K[Gemini 2.5 Flash: AI Extraction]
    I --> L[Representative Service]
    
    J --> M[Verified Status & Loss of Service %]
    K --> N[Executive Summary & Media Mentions]
    L --> O[Personalized Advocacy Actions]
    
    M --> P[Advocacy Dashboard]
    N --> P
    O --> P
    
    P --> Q[Resident Files 311/Email Rep]
```

### The Data Synthesis Engine
1.  **Identity Resolution**: I first resolve a street address into a unique Building Identification Number (BIN) and capture political district IDs. This ensures all subsequent data is pinned to the correct physical structure.
2.  **Multimodal Collection**: I pull official complaint history from the **SODA API** and perform a targeted local news search via **SerpAPI**.
3.  **AI Orchestration**: I use **Gemini 2.5 Flash** as a "Reasoning Layer" to extract structured facts from unstructured news snippets and to generate the "Advocacy Strategist" scripts tailored to the building's specific legal standing.
4.  **Actionable Output**: The resident receives a unified dashboard that converts raw data into high-impact tools, such as the "Email Representative" button that automatically includes the building's calculated "Loss of Service" stats.

## Development Standards
I maintain high professional standards for this codebase:
- **Strict Linting**: I use **Ruff** for PEP-8 compliance and import sorting.
- **Full Type-Hints**: Every Python function requires `mypy --strict` coverage (via `django-stubs`).
- **Validation**: Every commit must pass the `pre_flight.sh` validation suite.
- **Documentation**: I use Google-style docstrings for all services and models.
- **UI/UX**: I use intentional empty states and visual pulsing for unverified data. No raw 0s are displayed for empty datasets.


For detailed developer instructions, please refer to [GEMINI.md](./GEMINI.md) and [project_spec.md](./project_spec.md).