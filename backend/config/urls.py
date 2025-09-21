from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from core.views import ActivityViewSet, TaskViewSet, UserViewSet, ProjectViewSet, TeamMemberViewSet, RecentWorkView, RecentViewsView, RecentSearchView

router = routers.DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"tasks", TaskViewSet)
router.register(r"activities", ActivityViewSet)
router.register(r"projects", ProjectViewSet)
router.register(r"team-members", TeamMemberViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include(router.urls)),
    path("api/recent/work", RecentWorkView.as_view(), name="recent_work"),
    path("api/recent/views", RecentViewsView.as_view(), name="recent_views"),
    path("api/recent/search", RecentSearchView.as_view(), name="recent_search"),
]


