# Ruff (Linter & Formatter)

Ruff is used as a fast, all-in-one linter and formatter for the backend.

## Configuration (in `pyproject.toml`)
- **Line Length:** `88` (PEP 8 standard)
- **Output Format:** `concise`
- **Lint Selection:**
    - `E`: Error (pycodestyle)
    - `F`: Pyflakes
    - `I`: Isort (import sorting)

## Usage
Ruff can be invoked via the `uv` CLI:
- **Linting:** `uv run ruff check .`
- **Formatting:** `uv run ruff format .`
- **Fixing:** `uv run ruff check --fix .`

## Standards (Lead: Blythe)
Blythe ensures all code adheres to these standards, aiming for clean, jargon-free code and correct import ordering.
