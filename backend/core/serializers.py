from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Activity, Task, Project, TeamMember


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="assignee", write_only=True, allow_null=True, required=False
    )
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source="project", write_only=True, allow_null=True, required=False
    )
    project = serializers.IntegerField(source="project.id", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "status",
            "assignee",
            "assignee_id",
            "project",
            "project_id",
            "priority",
            "story_points",
            "start_date",
            "due_date",
            "created_at",
            "updated_at",
        ]


class ActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source="user", write_only=True, required=False, allow_null=True)
    task = TaskSerializer(read_only=True)
    task_id = serializers.PrimaryKeyRelatedField(queryset=Task.objects.all(), source="task", write_only=True, allow_null=True, required=False)

    class Meta:
        model = Activity
        fields = [
            "id",
            "type",
            "message",
            "user",
            "user_id",
            "task",
            "task_id",
            "created_at",
        ]


class ProjectSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "status",
            "priority",
            "category",
            "start_date",
            "due_date",
            "starred",
            "team",
            "progress",
            "created_at",
            "updated_at",
        ]

    def get_progress(self, obj: Project) -> float:
        # Progress includes partial credit for in-progress work.
        # Weights: done=1.0, in_progress=0.5, todo=0.
        qs = obj.tasks.all()
        total_sp = sum(t.story_points or 0 for t in qs)
        if total_sp > 0:
            done_sp = sum((t.story_points or 0) for t in qs if t.status == "done")
            inprog_sp = sum((t.story_points or 0) for t in qs if t.status == "in_progress")
            pct = ((done_sp + 0.5 * inprog_sp) / total_sp) * 100.0 if total_sp else 0.0
        else:
            total = qs.count()
            if total == 0:
                return 0.0
            done = qs.filter(status="done").count()
            inprog = qs.filter(status="in_progress").count()
            pct = ((done + 0.5 * inprog) / total) * 100.0
        return round(pct, 2)

    def to_representation(self, instance: Project):
        data = super().to_representation(instance)
        try:
            pct = self.get_progress(instance)
            current_status = data.get("status")
            if pct >= 100.0:
                data["status"] = "Completed"
            else:
                # If stored as Completed but progress < 100, surface as Active (unless On Hold)
                if current_status == "Completed":
                    data["status"] = "Active"
        except Exception:
            pass
        return data

    def validate(self, attrs):
        # Prevent setting status to Completed unless computed progress is 100
        requested_status = attrs.get("status")
        # Determine the project instance to compute progress on
        project = self.instance if hasattr(self, 'instance') else None
        if requested_status == "Completed":
            # If instance exists, compute progress from related tasks
            if project is not None:
                pct = self.get_progress(project)
                if pct < 100.0:
                    raise serializers.ValidationError({
                        "status": "Cannot set status to 'Completed' until progress reaches 100%."
                    })
        return attrs

    def create(self, validated_data):
        obj = super().create(validated_data)
        # Auto-set to Completed if computed progress is 100 after creation
        try:
            pct = self.get_progress(obj)
            if pct >= 100.0 and obj.status != "Completed":
                obj.status = "Completed"
                obj.save(update_fields=["status"])
        except Exception:
            pass
        return obj

    def update(self, instance, validated_data):
        obj = super().update(instance, validated_data)
        # Enforce consistency after update: if progress hits 100, ensure status is Completed
        try:
            pct = self.get_progress(obj)
            if pct >= 100.0 and obj.status != "Completed":
                obj.status = "Completed"
                obj.save(update_fields=["status"])
            # If progress falls below 100% and status is still Completed, revert to Active
            elif pct < 100.0 and obj.status == "Completed":
                # Respect explicit On Hold if client set it in this update
                requested_status = validated_data.get("status")
                if requested_status == "On Hold":
                    # leave as On Hold (but serializer already applied it above)
                    pass
                else:
                    obj.status = "Active"
                    obj.save(update_fields=["status"])
        except Exception:
            pass
        return obj


class TeamMemberSerializer(serializers.ModelSerializer):
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), source="project", write_only=True, allow_null=True, required=False
    )
    project = serializers.IntegerField(source="project.id", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    class Meta:
        model = TeamMember
        fields = [
            "id",
            "name",
            "email",
            "role",
            "department",
            "project",
            "project_id",
            "project_name",
            "status",
            "total_tasks",
            "completed_tasks",
            "created_at",
            "updated_at",
        ]

