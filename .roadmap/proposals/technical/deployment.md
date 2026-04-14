# Proposal: Phase 4 - Production Deployment Infrastructure [Completed]

## Objective
Establish the infrastructure required to deploy the Elevator Advocacy Platform to a cloud provider (Render, Fly.io, or AWS). This includes production-grade web servers, database configuration (PostgreSQL), and static file handling.

## Technical Milestones

### 1. [Elias] Production Web Server & Static Files
- **WSGI/ASGI:** Add `gunicorn` and `uvicorn` for production serving.
- **Static Assets:** Integrate `whitenoise` for serving frontend/static assets directly through Django.
- **Environment:** Transition from `ImmediateBackend` to a persistent `DatabaseBackend` for tasks in production.

### 2. [Kiran] Database Transition (SQLite -> PostgreSQL)
- **Adapter:** Add `psycopg[binary]` to backend dependencies.
- **Config:** Update `settings.py` to use `dj-database-url` for dynamic database configuration via environment variables.

### 3. [Sol] Deployment Configuration (Render/Heroku/Blueprint)
- **Procfile:** Define processes for the web server and the Django 6.0 task worker (`python manage.py runworker`).
- **Render YAML:** Create `render.yaml` (Blueprint) for one-click deployment of the full stack.

### 4. [Blythe] Security & Hardening
- **Checklist:** Run `python manage.py check --deploy`.
- **Headers:** Ensure `django-cors-headers` and `CSP` (Native Django 6.0) are strictly configured for the production domain.

## Dependencies to Add
- `gunicorn`: Production WSGI server.
- `whitenoise`: Static file serving.
- `psycopg[binary]`: PostgreSQL adapter.
- `dj-database-url`: Database URL parsing.

## Roadmap & Sprints
- **Sprint 4 (Infrastructure):** Production dependencies and PostgreSQL configuration.
- **Sprint 5 (CI/CD):** Render Blueprints and automated deployment via GitHub Actions.
