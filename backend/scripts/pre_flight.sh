#!/usr/bin/env bash

# backend/scripts/pre_flight.sh

# Comprehensive validation for the Elevator Advocacy Platform



set -e # Exit on any error



echo "--- 🛠️ Starting Pre-Flight Validation ---"



# 1. Formatting & Linting

echo "Step 1: Running Ruff (Format & Lint)..."

uv run ruff format . --quiet

uv run ruff check . --fix --ignore E501,E402



# 2. Type Checking

echo "Step 2: Running Mypy..."

uv run mypy . --ignore-missing-imports --disable-error-code import-untyped --no-error-summary



# 3. Django System Integrity

echo "Step 3: Running Django System Check..."

# We use a dummy key for the check to ensure it works even if .env is missing production keys

DJANGO_SECRET_KEY=preflight_key DJANGO_DEBUG=True uv run python manage.py check



# 4. Automated Tests

echo "Step 4: Running Pytest Suite..."

uv run pytest



echo "--- ✨ Pre-Flight Passed: System is structurally sound! ---"