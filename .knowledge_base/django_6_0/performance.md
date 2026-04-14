# Django 6.0 Performance & Pooling (Lead: Elias)

Django 6.0 introduces improved defaults and built-in features for database connection management and performance optimization.

## Database Connection Pooling
The project leverages Django 6.0's native support for connection pooling and health checks, configured in `settings.py`:

```python
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,           # Keep connections alive for 10 minutes
        conn_health_checks=True,    # Verify connection health before use
    )
}
```

### Key Benefits
- **`conn_max_age`**: Reduces the overhead of establishing new connections by reusing existing ones.
- **`conn_health_checks`**: Ensures that stale or dropped connections are detected and replaced before they cause request failures.

## Query Optimization
- **`db_default`**: Offloads default value generation to the database (e.g., `Now()`), reducing Python-level overhead and ensuring consistency.
- **`GeneratedField`**: (To be implemented) Use for persistent calculations like `Loss of Service` metrics to avoid expensive runtime aggregation.

## Caching Strategies
(Future implementation: WhiteNoise handles static file compression and caching effectively for the prototype).
