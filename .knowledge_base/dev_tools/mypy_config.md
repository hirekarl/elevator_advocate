# Mypy (Static Type Checking)

Mypy is used for static type checking across the backend codebase, with specific support for Django and Django REST Framework.

## Configuration (in `pyproject.toml`)
- **Plugins:**
    - `mypy_django_plugin.main` (Django support)
    - `mypy_drf_plugin.main` (DRF support)
- **Settings:**
    - `ignore_missing_imports = true` (Graceful handling of untyped libraries)
    - `pretty = true` (Improved error reporting)

## Type Hints (Lead: Blythe)
Blythe mandates full type hinting for all new backend logic. Key areas include:
- **Models:** Full typing for Django models (via `django-stubs`).
- **Views & Serializers:** Ensuring correct return types for DRF endpoints.
- **AI Logic:** Using Pydantic models with `instructor` for validated data extraction.

## Usage
Mypy can be run via the `uv` CLI:
- **Check Types:** `uv run mypy .`
