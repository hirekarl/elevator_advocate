from typing import List

from django.tasks import task
from django.utils import timezone

from services.news_search import NewsArticleSchema, NewsSearchService

from .models import Building, BuildingNews


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

    building.last_news_refresh = timezone.now()
    building.save(update_fields=["last_news_refresh"])

    return (
        f"Successfully processed {len(articles)} news articles for {building.address}."
    )
