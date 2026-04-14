# Django 6.0 Environment Requirements (Lead: Elias)

The project requires a modern Python environment and Django 6.0 features.

## Python Version
- **Requirement:** `Python 3.12+`
- **Current Support:** Managed via `uv` (check `.python-version`).

## Django Version
- **Framework:** `Django ~=6.0` (Django 6.0)
- **Status:** Decoupled dependencies, emphasizing performance and ORM flexibility.

## Core Environment Setup
- **Environment Management:** [Astral `uv`](../dev_tools/uv_mgmt.md)
- **Database:** PostgreSQL (via `psycopg[binary]`)
- **Web Servers:**
    - `Gunicorn` (for WSGI)
    - `Uvicorn` (for ASGI support)
- **Static Assets:** `Whitenoise` (for efficient serving)

## Configuration Highlights
- **Settings:** `config.settings` (configured via `DJANGO_SETTINGS_MODULE`).
- **Secret Management:** `.env` (via `python-dotenv`).
