# Django 6.0 Aggregates (Lead: Elias)

Django 6.0 adds new aggregation functions that simplify common SQL patterns, reducing the need for raw SQL or complex Python processing.

## `AnyValue`
Returns an arbitrary value from a group of rows. Useful when you need a representative value from a column that isn't part of the `GROUP BY` clause.

### Usage Pattern
```python
from django.db.models import AnyValue

# Example: Get a representative address for a group of reports
reports = ElevatorReport.objects.values('building_bin').annotate(
    representative_address=AnyValue('building__address')
)
```

## `StringAgg`
Concatenates values in a group into a single string, separated by a delimiter.

### Usage Pattern
```python
from django.contrib.postgres.aggregates import StringAgg # (PostgreSQL only)

# Example: Get all statuses reported for a building in one string
building_statuses = ElevatorReport.objects.values('building_bin').annotate(
    all_statuses=StringAgg('status', delimiter=', ')
)
```

## Use Case: Verification Engine
These aggregates are ideal for the `ConsensusManager` to group and summarize user reports within the 2-hour window.
