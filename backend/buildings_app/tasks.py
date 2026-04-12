from django.tasks import task
from .models import Building, BuildingNews
from services.news_search import NewsSearchService, NewsArticleSchema
from typing import List

@task
def fetch_building_news(bin: str):
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
        BuildingNews.objects.get_or_create(
            url=art.url,
            defaults={
                'building': building,
                'title': art.title,
                'source': art.source,
                'published_date': art.published_date,
                'summary': art.summary,
                'relevance_score': art.relevance_score
            }
        )

    return f"Successfully processed {len(articles)} news articles for {building.address}."
