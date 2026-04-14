# NYC Tenant Elevator Advocacy Platform
## "Dignity Through Data"

Hi, I’m **Karl Johnson**, a resident of District 17 in the Bronx. I am building this platform as a gift of service to my community—born from the daily reality of watching my neighbors, many of whom are seniors or rely on wheelchairs, rendered immobile and oppressed by failing elevators.

In my building, a broken elevator is more than a maintenance delay—it's a crisis that strips people of their mobility and dignity. I’ve seen neighbors trapped on their floors for weeks at a time. This project, started during my AI-Native fellowship at **Pursuit**, is my response. We are turning these daily frustrations into the hard data needed for collective advocacy and survival.

---

## ✊ The Mission
The goal is simple: **Close the information gap between residents and property owners.** 

Currently, the city's 311 system is slow, and official NYC Open Data (SODA) often lags behind reality. This platform helps residents by providing:

- **Real-time Verification**: Outages are "Verified" only when multiple residents report them within two hours, creating a record that landlords can't ignore.
- **Service Metrics**: We calculate a **"Loss of Service" (LoS) %**—turning downtime into the kind of data used in Housing Court or legislative briefings.
- **Direct Advocacy**: We map buildings to NYC Council Districts and provide residents with AI-powered 311 scripts and direct email links to their representatives.
- **Support Networks**: Status updates help family members and care providers know if their loved ones can actually get in and out of their building.

## 🛠️ How It Works: The Data Synthesis Engine
The platform acts as a reasoning layer that correlates real-time tenant observations with official city records.

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

### Core Logic
1.  **The 2-Hour Consensus Rule**: To cut through the noise, an outage is "Verified" only after two different residents report it within a two-hour window.
2.  **Identity Resolution**: We link every report to a specific physical building (using its Building Identification Number) so our data holds up in court or a council meeting.
3.  **Agentic Analysis**: We use a supervisor-worker pattern (Gemini 2.5 Flash) to cross-reference building history with NYC housing law and suggest specific legal or organizing steps.

---

## ♿ Accessibility & Inclusive Design: The "Martha-First" Protocol
Accessibility isn't a checklist—it's the reason this exists. To make sure the platform works for the seniors and residents with mobility impairments who need it most, we design for **"Martha."** She is a 72-year-old neighbor with limited mobility who uses a walker and an older smartphone. If it doesn't work for her, it doesn't work at all.

- **Martha-First UX**: We prioritize high-contrast text, large touch targets, and full screen-reader support (WCAG 2.2).
- **Plain-Language Alerts**: We translate technical data like "SODA API Lags" into clear status blocks (e.g., *"Elevator is NOT WORKING. 3 neighbors have confirmed this."*).
- **Stable Performance**: We use React 19 features like `useOptimistic()` and `Suspense` so the app stays fast and responsive even on slow mobile networks.
- **Automated Testing**: Our CI/CD pipeline runs **"Martha's Journey"**—a specialized test suite that uses **Playwright + Axe-Core** to verify that critical paths like reporting an outage are fully accessible.
- **Spanish Internationalization**: A significant portion of residents in District 17 speak Spanish at home. We are providing full Spanish localization to ensure that every neighbor can use these tools with dignity. We are currently seeking qualified volunteers or consultants to audit our translations for idiomatic accuracy and technical clarity.

---

## 💻 Tech Stack
I chose these tools to keep the platform fast, secure, and easy to maintain:

- **Backend**: Django 6.0, DRF, PostgreSQL.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
- **Orchestration**: Custom Python multi-agent system (Gemini 2.5 Flash).
- **Package Management**: `uv` for fast, reproducible Python environments.
- **Standards**: Strict PEP-8 compliance via **Ruff** and full type-safety.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+ 
- `uv` (Installed via `curl -LsSf https://astral.sh/uv/install.sh`)
- Node.js 20+

### Quick Setup
1. **Backend**:
   ```bash
   cd backend
   uv sync
   cp .env.example .env # Add your NYC Open Data & Gemini keys
   uv run python manage.py migrate
   uv run python manage.py runserver
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Validation**:
   Run `./backend/scripts/pre_flight.sh` to ensure the full suite (Ruff + Mypy + Pytest) is passing.

---

## 📈 Strategic Path Forward
Our goal is to build a **Power Block** for tenants by turning personal stories into the kind of evidence that forces action:
- **Direct Briefings**: We provide Councilmembers with Loss of Service reports to trigger DOB inquiries.
- **Legal Weight**: We are working to ensure our data is admissible in court through partnerships like **Mobilization for Justice**.
- **Grassroots Organizing**: We align with groups like **CASA** to put data directly into the hands of tenant unions.

**Data is power.** When we move from anecdotes to evidence, we make sure landlords treat accessibility as a fundamental right, not a suggestion.

---
*For detailed architectural documentation, see [docs/spec.md](./docs/spec.md) and [GEMINI.md](./GEMINI.md).*
