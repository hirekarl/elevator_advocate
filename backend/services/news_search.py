import os
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
import instructor
from google import genai
import serpapi

class NewsArticleSchema(BaseModel):
    """
    Structured schema for news articles extracted via AI.
    """
    title: str
    url: str
    source: str
    published_date: Optional[date]
    summary: str
    relevance_score: float # 0-1 score

class NewsSearchService:
    """
    Kiran's News Service: Searches for local news regarding elevator outages
    and extracts structured data using Gemini 2.0 Flash.
    """

    def __init__(self):
        self.serp_api_key = os.getenv("SERPAPI_KEY")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        
        if self.gemini_api_key:
            # Patching for instructor (using OpenAI compatibility layer for Gemini)
            self.instructor_client = instructor.from_openai(
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                api_key=self.gemini_api_key,
                model="gemini-2.0-flash"
            )

    def search_and_extract(self, address: str) -> List[NewsArticleSchema]:
        """
        Performs the search and extraction pipeline.
        """
        if not self.serp_api_key or not self.gemini_api_key:
            return self.get_mock_results(address)

        # 1. Search via SerpAPI (New Client Syntax)
        client = serpapi.Client(api_key=self.serp_api_key)
        results = client.search({
            "engine": "google",
            "q": f'"{address}" NYC elevator outage complaint news',
            "location": "New York, New York, United States",
        })
        organic_results = results.get("organic_results", [])[:5]

        # 2. Extract and Validate via Gemini + Instructor
        articles = []
        for res in organic_results:
            try:
                article = self.instructor_client.chat.completions.create(
                    model="gemini-2.0-flash",
                    response_model=NewsArticleSchema,
                    messages=[
                        {"role": "system", "content": "Extract elevator-related news from this snippet. Score relevance 0-1."},
                        {"role": "user", "content": f"Title: {res.get('title')}\nSnippet: {res.get('snippet')}\nURL: {res.get('link')}"}
                    ]
                )
                articles.append(article)
            except Exception as e:
                print(f"Extraction Error: {e}")

        return articles

    def get_mock_results(self, address: str) -> List[NewsArticleSchema]:
        """
        Provides realistic mock data if API keys are missing.
        """
        return [
            NewsArticleSchema(
                title=f"Elevator Outage at {address} Leaves Seniors Stranded",
                url="https://gothamist.com/news/mock-elevator-story-1",
                source="Gothamist",
                published_date=date(2025, 12, 10),
                summary="Residents of the building reported consistent failures across all three elevators over a 48-hour period.",
                relevance_score=0.95
            ),
            NewsArticleSchema(
                title=f"NYC DOB Issues Multiple Violations for {address}",
                url="https://thecity.nyc/2026/01/building-violations-mock",
                source="The City",
                published_date=date(2026, 1, 15),
                summary="The Department of Buildings identified failed safety tests in the building's elevator shafts.",
                relevance_score=0.85
            )
        ]
