from django.contrib import admin

from .models import Activity, Task, Project, TeamMember


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "assignee")
    search_fields = ("title",)
    list_filter = ("status",)


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("id", "type", "user", "created_at")
    list_filter = ("type",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "status", "priority", "due_date")
    search_fields = ("name", "description")
    list_filter = ("status", "priority")


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "role", "department", "status")
    search_fields = ("name", "email", "department")
    list_filter = ("role", "department", "status")

