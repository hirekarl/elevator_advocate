# Project Configuration (`pyproject.toml`)

The project uses `pyproject.toml` as the single source of truth for backend configuration, managed by [Astral `uv`](uv_mgmt.md).

## Project Metadata
- **Name:** `backend`
- **Version:** `0.1.0`
- **Python Requirement:** `>=3.12`

## Key Dependencies
- **Framework:** `django~=6.0` (Django 6.0)
- **API:** `djangorestframework`
- **Database:** `psycopg[binary]`, `dj-database-url` (PostgreSQL)
- **AI/ML:** `google-genai`, `instructor`, `serpapi`
- **Static/Serving:** `gunicorn`, `uvicorn`, `whitenoise`

## Tooling Integration
The `pyproject.toml` file also configures:
- **Pytest:** `tool.pytest.ini_options` (Settings module, test discovery)
- **Ruff:** `tool.ruff` (Linting and formatting)
- **Mypy:** `tool.mypy` (Static type checking)
- **Django Stubs:** `tool.django-stubs` (Type hints for Django)

## Dependency Groups
Development dependencies are managed in the `[dependency-groups]` section:
- `dev`: Includes `ruff`, `mypy`, `pytest`, `pytest-django`, and type stubs.
