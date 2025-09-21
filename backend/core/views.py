from django.contrib.auth.models import User
from rest_framework import permissions, viewsets, filters
from rest_framework.generics import ListAPIView
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from .models import Activity, Task, Project, TeamMember
from .serializers import ActivitySerializer, TaskSerializer, UserSerializer, ProjectSerializer, TeamMemberSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related("assignee").all().order_by("-created_at")
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "assignee", "project"]
    search_fields = ["title", "description", "assignee__username"]
    ordering_fields = ["created_at", "updated_at", "due_date", "start_date"]


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.select_related("user", "task").all().order_by("-created_at")
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["type"]
    search_fields = ["message", "user__username", "task__title"]
    ordering_fields = ["created_at"]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-created_at")
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["starred", "status", "priority"]
    search_fields = ["name", "description", "category", "priority"]
    ordering_fields = ["created_at", "updated_at", "due_date", "start_date"]


class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all().order_by("name")
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["role", "department", "status", "project"]


class RecentWorkView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActivitySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["message", "user__username", "task__title"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        return Activity.objects.select_related("user", "task").filter(type="work_done").order_by("-created_at")


class RecentViewsView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActivitySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["message", "user__username", "task__title"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        return Activity.objects.select_related("user", "task").filter(type="view").order_by("-created_at")


class RecentSearchView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActivitySerializer

    def get_queryset(self):
        query = self.request.query_params.get("query", "").strip()
        qs = Activity.objects.select_related("user", "task").filter(type__in=["work_done", "view"]).order_by("-created_at")
        if query:
            qs = qs.filter(
                Q(message__icontains=query)
                | Q(user__username__icontains=query)
                | Q(task__title__icontains=query)
            )
        return qs


