# Django 6.0 Content Security Policy (Lead: Elias)

Django 6.0 provides native support and improved middleware for managing Content Security Policy (CSP).

## Middleware Configuration
Ensure `SecurityMiddleware` is active in `settings.py` (which it is):

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # ... other middleware
]
```

## CSP Directives (Lead: Elias)
Mandated security settings for the Elevator Advocacy Platform:

- **`CSP_DEFAULT_SRC`**: `'none'` (Strict by default)
- **`CSP_SCRIPT_SRC`**: `'self'` (Allow scripts from our domain)
- **`CSP_STYLE_SRC`**: `'self'`, `'unsafe-inline'` (Tailwind CSS/Vite integration)
- **`CSP_IMG_SRC`**: `'self'`, `data:`, `https://api.nyc.gov` (For Geoclient/SODA data/maps)
- **`CSP_CONNECT_SRC`**: `'self'`, `https://api.nyc.gov` (For API requests)

## Nonces for Inline Scripts
Django 6.0 simplifies generating and applying nonces for inline `<script>` tags if needed:

```html
<script nonce="{{ request.csp_nonce }}">
  // Inline script here
</script>
```

## Future Implementation
As the project moves to production (e.g., Render), CSP will be strictly enforced to prevent cross-site scripting (XSS) and data injection.
