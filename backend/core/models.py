from django.contrib.auth import get_user_model
from django.db import models


User = get_user_model()


class Task(models.Model):
    STATUS_CHOICES = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("done", "Done"),
    ]
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="todo")
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    # Optional start date for the task (sprint start)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    # Link task to a project to enable project-level progress aggregation
    project = models.ForeignKey("Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    # Priority and story points for better planning and weighted progress
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default="medium")
    story_points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.title


class Activity(models.Model):
    TYPE_CHOICES = [
        ("comment", "Comment"),
        ("status_change", "Status Change"),
        ("assignment", "Assignment"),
        ("work_done", "Work Done"),
        ("view", "View"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activities")
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="activities", null=True, blank=True)
    type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    message = models.TextField()
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.type} by {self.user}"


class Project(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Completed", "Completed"),
        ("On Hold", "On Hold"),
    ]

    PRIORITY_CHOICES = [
        ("High", "High"),
        ("Medium", "Medium"),
        ("Low", "Low"),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="Active")
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default="Medium")
    category = models.CharField(max_length=128, blank=True)
    # Optional project start date
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    starred = models.BooleanField(default=False)
    team = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name


class TeamMember(models.Model):
    ROLE_CHOICES = [
        ("Employee", "Employee"),
        ("Scrum Master", "Scrum Master"),
        ("Manager", "Manager"),
    ]

    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Inactive", "Inactive"),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=64, choices=ROLE_CHOICES, default="Employee")
    department = models.CharField(max_length=128, blank=True)
    # Optional link to a Project for grouping/filtering in UI
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="team_members")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="Active")
    total_tasks = models.PositiveIntegerField(default=0)
    completed_tasks = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"

