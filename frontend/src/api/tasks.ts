import http from "./http";

export type ApiUser = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

export type ApiTask = {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  assignee: ApiUser | null;
  start_date: string | null;
  due_date: string | null;
  project?: number | null;
  priority: "low" | "medium" | "high";
  story_points: number;
  created_at: string;
  updated_at: string;
};

export async function listTasks(): Promise<ApiTask[]> {
  const { data } = await http.get("/api/tasks/");
  return data;
}

export async function updateTask(id: number, patch: Partial<ApiTask> & { assignee_id?: number | null; project_id?: number | null }): Promise<ApiTask> {
  const { data } = await http.patch(`/api/tasks/${id}/`, patch);
  return data;
}

export async function createTask(payload: Partial<ApiTask> & { assignee_id?: number | null; project_id?: number | null }): Promise<ApiTask> {
  const { data } = await http.post(`/api/tasks/`, payload);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await http.delete(`/api/tasks/${id}/`);
}


