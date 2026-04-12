# Google GenAI SDK (Gemini 2.0 Flash)

## Initialization
Using the `google-genai` package (v1.72+).

```python
from google import genai
import os

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
```

## Prompting for Context
For the **Elevator Advocacy Platform**, focus on extraction rather than conversation.

```python
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Extract elevator outages from this snippet: ..."
)
```

## Specialist Assignment
- **Kiran:** Primary user for media extraction and risk analysis.
