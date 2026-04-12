# Dev Tools: `uv` CLI (Leaf)

## Implementation Pattern
Used for lightning-fast Python environment management.

### Creating Environment
```bash
uv venv --python 3.12
source .venv/bin/activate
```

### Installing Dependencies
```bash
uv pip install django~=6.0 djangorestframework ruff mypy
```

### Running Commands
```bash
uv run python manage.py runserver
```

## Constraints
- **Speed:** `uv` is significantly faster than standard `pip`.
- **Syncing:** Always use `uv pip compile` and `uv pip sync` for reproducible environments.
