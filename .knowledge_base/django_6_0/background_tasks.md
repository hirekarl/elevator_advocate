# Django 6.0: Native Background Tasks (Leaf)

## Implementation Pattern
The `tasks` framework allows executing logic outside the request cycle.

### Configuration
```python
# settings.py
INSTALLED_APPS = [
    ...,
    'django.contrib.tasks',
]

TASKS_BACKEND = {
    'default': {
        'BACKEND': 'django.core.tasks.backends.db.DatabaseBackend',
    }
}
```

### Defining a Task
```python
from django.tasks import task

@task
def verify_elevator_consensus(elevator_id: int):
    # Consensus logic for the 2-hour window
    pass
```

### Delaying Execution
```python
verify_elevator_consensus.delay(elevator_id=123)
```

## Constraints
- **Production Requirement:** Requires an external worker process (e.g., `python manage.py runworker`).
- **Database Backend:** The default DB backend is suitable for low-to-medium volumes.
