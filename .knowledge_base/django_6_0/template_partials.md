# Django 6.0 Template Partials (Lead: Elias)

Django 6.0 supports native template partials, allowing you to render a specific part of a template instead of the entire page.

## Use Case: Dynamic Updates
- **HTMX/Turbo Integration**: Efficiently update UI fragments without full page reloads.
- **Email Templates**: Use common base partials (e.g., headers/footers) for transactional emails.

## Usage Pattern
```html
{% partialdef my_fragment %}
  <div id="elevator-status-card">
    <p>Status: {{ building.verified_status }}</p>
  </div>
{% endpartialdef %}
```

### Rendering via View
```python
from django.shortcuts import render

def status_update(request, bin):
    # Render only the specific 'my_fragment' partial
    return render(request, "status.html#my_fragment", context)
```

## Status in this Project
Currently, the project is a headless DRF API. Template partials are prioritized for future server-rendered components or advanced email generation (e.g., confirmation emails).
