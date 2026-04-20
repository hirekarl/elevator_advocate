from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AuthViewSet, BuildingViewSet, DataStoriesSSRView, DistrictViewSet, ReportViewSet

router = DefaultRouter()
router.register(r"buildings", BuildingViewSet, basename="building")
router.register(r"reports", ReportViewSet, basename="report")
router.register(r"districts", DistrictViewSet, basename="district")
router.register(r"auth", AuthViewSet, basename="auth")

urlpatterns = [
    path("", include(router.urls)),
    path("data-ssr/", DataStoriesSSRView.as_view(), name="data-stories-ssr"),
]
