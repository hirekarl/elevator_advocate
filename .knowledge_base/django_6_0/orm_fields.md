# Django 6.0: ORM Generated Fields & Defaults (Leaf)

## Implementation Pattern
Used for metrics and automatic timestamps as required by Elias.

### Database Defaults (`db_default`)
Allows setting defaults at the database level rather than the Python level.
```python
from django.db import models
from django.db.models.functions import Now

class ElevatorReport(models.Model):
    created_at = models.DateTimeField(db_default=Now())
```

### Generated Fields (`GeneratedField`)
Perfect for calculating metrics like "Loss of Service" directly in the database.
```python
from django.db import models

class ElevatorOutage(models.Model):
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.GeneratedField(
        expression=models.F('end_time') - models.F('start_time'),
        output_field=models.DurationField(),
        db_persist=True
    )
```

## Constraints
- **Persistence:** `db_persist=True` is required for indexing and fast queries.
- **Backend Support:** Full support in PostgreSQL (our target DB).
