import os
from datetime import date
from typing import List, Optional

import serpapi
from google import genai
from pydantic import BaseModel


class NewsArticleSchema(BaseModel):
    """
    Structured schema for news articles extracted via AI.
    """

    title: str
    url: str
    source: str
    published_date: Optional[date]
    summary: str
    relevance_score: float  # 0-1 score
    is_mocked: bool = False


class NewsSearchService:
    """
    Kiran's News Service: Searches for local news regarding elevator outages
    and extracts structured data using Gemini 2.5 Flash.
    """

    def __init__(self):
        self.serp_api_key = os.getenv("SERPAPI_KEY")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")

        if self.gemini_api_key:
            # Native Google GenAI Client
            self.client = genai.Client(api_key=self.gemini_api_key)

    def search_and_extract(self, address: str) -> List[NewsArticleSchema]:
        """
        Performs the search and extraction pipeline.
        Returns an empty list if no results are found or if API keys are missing.
        """
        if not self.gemini_api_key or not self.serp_api_key:
            print("Missing API keys for NewsSearchService. Returning empty list.")
            return []

        # 1. Search via SerpAPI
        try:
            serp_client = serpapi.Client(api_key=self.serp_api_key)
            results = serp_client.search(
                {
                    "engine": "google",
                    "q": f'"{address}" NYC elevator "outage" OR "broken" OR "stuck" news',
                    "location": "New York, New York, United States",
                }
            )
            organic_results = results.get("organic_results", [])[:5]
        except Exception as e:
            print(f"SerpAPI Search Error for {address}: {e}")
            return []

        # 2. Extract and Validate via Native Gemini SDK
        articles = []
        for res in organic_results:
            try:
                # Native Structured Output with Pydantic
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=(
                        f"You are a specialized investigator. EXTRACT ONLY news articles that explicitly "
                        f"mention elevator outages, repairs, or safety violations at the building "
                        f"address: {address}. If the snippet is about dispensaries, real estate ads, "
                        f"or general neighborhood news UNRELATED to elevators, set the relevance_score "
                        f"to 0.0 and summary to 'Irrelevant'.\n\n"
                        f"Title: {res.get('title')}\n"
                        f"Snippet: {res.get('snippet')}\n"
                        f"URL: {res.get('link')}"
                    ),
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": NewsArticleSchema,
                    },
                )

                # The SDK automatically parses JSON into the Pydantic model
                article = response.parsed
                if article:
                    articles.append(article)
            except Exception as e:
                print(f"Extraction Error for {res.get('title')}: {e}")

        return articles
