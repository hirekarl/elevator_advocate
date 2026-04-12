# SerpAPI Python Client (v1.0.2+)

## Overview
The modernized `serpapi` library (not `google-search-results`) uses a centralized `Client` class.

## Usage: Google Search
Used for discovering building-specific news.

```python
import serpapi
import os

client = serpapi.Client(api_key=os.getenv("SERPAPI_KEY"))
results = client.search({
    "engine": "google",
    "q": "query string",
    "location": "New York, New York, United States",
})

# Access results
organic = results.get("organic_results", [])
```

## Specialist Assignment
- **Kiran:** Manages search query logic and discovery pipelines.
