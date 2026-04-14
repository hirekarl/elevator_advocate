# Structured Pydantic Extraction (Lead: Kiran)

The project uses Pydantic models to ensure that raw data from external sources (SODA, News, User Reports) is validated and structured before being processed by the AI engines.

## News Extraction Schema
Used by the `NewsSearchService` to extract structured data from SerpAPI results using Gemini 2.5 Flash.

```python
class NewsArticleSchema(BaseModel):
    title: str
    url: str
    source: str
    published_date: Optional[date]
    summary: str
    relevance_score: float  # 0-1 score
```

## Multi-Agent (Supervisor) Schemas
The Supervisor-Worker system (in `orchestration/schemas.py`) uses specialized schemas for each stage of analysis.

### 1. `SODAResearchResult`
Historical analysis of NYC Open Data.
- `historical_summary`: Narrative of past issues.
- `pattern_detected`: Identifying recurring failure modes.
- `reliability_rating`: 0.0 - 1.0 score.

### 2. `CommunitySentimentResult`
Analysis of local tenant logs and reports.
- `sentiment_summary`: Frustration levels and momentum.
- `key_complaints`: List of recurring resident issues.

### 3. `AdvocacyStrategyResult`
Actionable legal and strategic advice.
- `script`: 311 or management call script.
- `legal_reference`: Specific NYC Housing Code citations (e.g., §27-2005).

### 4. `ExecutiveSummary`
The final synthesized report presented to the user.
- `risk_level`: Critical, High, Moderate, Nominal.
- `confidence_score`: 0.0 - 1.0 based on data availability.

## Validation Mandate (Lead: Blythe)
All AI-generated content must pass through these schemas. If the AI output fails validation, the system must either retry with a refined prompt or return a graceful failure (e.g., "Irrelevant" for news).
