import http from "./http";

export type ActivityType = "comment" | "status_change" | "assignment" | "work_done" | "view";

export type ActivityApi = {
  id: number;
  type: ActivityType;
  message: string;
  user: { id: number; username: string; first_name: string; last_name: string; email: string };
  task: null | {
    id: number;
    title: string;
    description: string;
    status: "todo" | "in_progress" | "done";
    due_date: string | null;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
};

export type CreateActivityPayload = {
  type: ActivityType;
  message: string;
  task_id?: number | null;
  user_id?: number | null; // optional; server will set current user
};

export async function listActivities(params?: { type?: ActivityType; search?: string; ordering?: "created_at" | "-created_at" }): Promise<ActivityApi[]> {
  const { data } = await http.get("/api/activities/", { params });
  return data;
}

export async function createActivity(payload: CreateActivityPayload): Promise<ActivityApi> {
  const { data } = await http.post("/api/activities/", payload);
  return data;
}
