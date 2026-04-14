# Proposal: Local News & Media Integration (The "Action Center" Intelligence) [Completed]

## Objective
Automatically augment building profiles with local news reports and media mentions regarding elevator outages and safety issues. This provides residents with a broader context of their building's public record.

## Technical Milestones

### 1. Data Retrieval: News Search Engine
- **Search Query:** `"{address}" NYC elevator issues` or `"{address}" elevator complaint news`.
- **Sources:** Targeted search against NYC local outlets (*The City*, *Gothamist*, *NY Post*, *NY Daily News*).
- **Implementation:** Use a search API (e.g., SerpAPI, Google Custom Search, or a scraper) to retrieve top 10 relevant links.

### 2. AI Integration: `google-genai` + `instructor`
- **Model:** Gemini 2.5 Flash (via `google-genai`).
- **Parsing:** Use the `instructor` library to enforce a structured Pydantic schema on search results.
- **Schema:**
    ```python
    class NewsArticle(BaseModel):
        title: str
        url: str
        source: str
        published_date: Optional[date]
        summary: str
        relevance_score: float # 0-1 score on how relevant it is to this specific building's elevator issues
    ```
- **Validation:** Ensure the AI only extracts articles that explicitly mention elevator failures or building safety.

### 3. Backend: Async Signal Pipeline
- **Django Signal:** Hook into the `post_save` signal of the `Building` model.
- **Background Task:** Use Django 6.0's native `django.contrib.tasks` to trigger the search and AI analysis.
- **Persistence:** Save results to a new `BuildingNews` model linked to the BIN.

### 4. Frontend: Media Timeline
- **Action Center Update:** Add a "Media & News" section to the `BuildingDetail` component.
- **Visuals:** Use card-style snippets with external links to the original articles.

## Dependencies to Add
- `google-genai`: The modern Google AI Python SDK.
- `instructor`: Structured data extraction for LLMs.
- `serpapi` (or similar): For reliable search result retrieval.

## Why this matters?
Buildings often have a "public history" that isn't captured in DOB complaint logs. Highlighting news stories empowers residents to hold management accountable during community board meetings or legal actions.
