#!/usr/bin/env bash
# exit on error
set -o errexit

# Install uv if not present or if the Render envwrapper shim is broken
if ! uv --version &> /dev/null
then
    echo "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

# Clear Render's injected VIRTUAL_ENV so uv resolves the project's own .venv.
unset VIRTUAL_ENV

# Build the backend
cd backend
uv sync --frozen
uv run python manage.py collectstatic --no-input
uv run python manage.py migrate

# Seed initial user accounts if credentials are configured
if [ -n "$SEED_ADMIN_PASSWORD" ] && [ -n "$SEED_USER_PASSWORD" ]; then
    echo "Seeding initial user accounts..."
    uv run python manage.py seed_users
else
    echo "Skipping seed_users — SEED_ADMIN_PASSWORD or SEED_USER_PASSWORD not set."
fi

# Load NYC Council member data
echo "Loading NYC Council district fixture..."
uv run python manage.py loaddata council_districts

# Backfill council district data for buildings created via GeoSearch fallback
echo "Backfilling council district data..."
uv run python manage.py backfill_council_districts

# Pre-load high-priority pilot buildings onto the map
echo "Seeding pilot buildings..."
uv run python manage.py seed_pilot_buildings

# Advocacy summaries are generated lazily on first request — no deploy step needed.
