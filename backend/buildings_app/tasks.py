from typing import List

import requests
from django.tasks import task

from services.news_search import NewsArticleSchema, NewsSearchService

from .models import Building, BuildingNews, CouncilDistrict


@task
def sync_council_members() -> str:
    """
    Kiran's Task: Periodically syncs NYC Council members from the Councilmatic API.
    """
    url = "https://councilmatic.org/api/nyc/members/"
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])

        synced_count = 0
        for member in results:
            district_id = member.get("district")
            if not district_id:
                continue

            CouncilDistrict.objects.update_or_create(
                district_id=str(district_id),
                defaults={
                    "member_name": member.get("name"),
                    "email": member.get("email"),
                    "phone": member.get("phone"),
                },
            )
            synced_count += 1

        return f"Successfully synced {synced_count} Council Districts."
    except Exception as e:
        return f"Error syncing Council members: {e}"


@task
def fetch_building_news(bin: str) -> str:
    """
    Kiran's Task: Asynchronously fetches and parses news articles for a building.
    Uses the new Django 6.0 Tasks framework.
    """
    try:
        building = Building.objects.get(bin=bin)
    except Building.DoesNotExist:
        return f"Building {bin} not found."

    service = NewsSearchService()
    articles: List[NewsArticleSchema] = service.search_and_extract(building.address)

    for art in articles:
        # Strict relevance threshold: skip if score < 0.7 or summary indicates irrelevance
        if art.relevance_score < 0.7 or art.summary.lower() == "irrelevant":
            continue

        BuildingNews.objects.get_or_create(
            url=art.url,
            defaults={
                "building": building,
                "title": art.title,
                "source": art.source,
                "published_date": art.published_date,
                "summary": art.summary,
                "relevance_score": art.relevance_score,
            },
        )

    return (
        f"Successfully processed {len(articles)} news articles for {building.address}."
    )
