import http from "./http";

export type ApiProject = {
  id: number;
  name: string;
  description: string;
  status: "Active" | "Completed" | "On Hold";
  priority: "High" | "Medium" | "Low";
  category: string;
  start_date: string | null;
  due_date: string | null;
  starred: boolean;
  team: Array<{ name: string; email: string }>;
  progress: number; // percentage 0-100
  created_at: string;
  updated_at: string;
};

export async function listProjects(search?: string): Promise<ApiProject[]> {
  const { data } = await http.get("/api/projects/", { params: search ? { search } : undefined });
  return data;
}

export async function createProject(payload: Partial<ApiProject>): Promise<ApiProject> {
  const { data } = await http.post("/api/projects/", payload);
  return data;
}

export async function updateProject(id: number, patch: Partial<ApiProject>): Promise<ApiProject> {
  const { data } = await http.patch(`/api/projects/${id}/`, patch);
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await http.delete(`/api/projects/${id}/`);
}

export async function getStarredProjects(): Promise<ApiProject[]> {
  const { data } = await http.get("/api/projects/?starred=true");
  return data;
}

export async function toggleProjectStar(id: number, starred: boolean): Promise<ApiProject> {
  const { data } = await http.patch(`/api/projects/${id}/`, { starred });
  return data;
}


