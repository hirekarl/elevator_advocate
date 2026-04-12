# Instructor: Structured Data Extraction

## Overview
Instructor uses Pydantic to enforce a specific schema on LLM outputs. For Gemini 2.0, we use the OpenAI-compatible endpoint.

## Pattern: News Extraction
Used in `services/news_search.py`.

```python
import instructor
from pydantic import BaseModel
from typing import Optional
from datetime import date

class NewsArticle(BaseModel):
    title: str
    url: str
    source: str
    published_date: Optional[date]
    summary: str
    relevance_score: float

client = instructor.from_openai(
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    api_key=os.getenv("GEMINI_API_KEY"),
    model="gemini-2.0-flash"
)

article = client.chat.completions.create(
    model="gemini-2.0-flash",
    response_model=NewsArticle,
    messages=[{"role": "user", "content": "..."}]
)
```

## Specialist Assignment
- **Kiran:** Maintains the extraction schemas and validation logic.
