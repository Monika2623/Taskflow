import http from "./http";

// API response type (snake_case fields)
export type TeamMemberApi = {
  id: number;
  name: string;
  email: string;
  role: "Employee" | "Scrum Master" | "Manager";
  department: string;
  project: number | null;
  project_name?: string | null;
  status: "Active" | "Inactive";
  total_tasks: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
};

export type CreateTeamMemberPayload = {
  name: string;
  email: string;
  role: TeamMemberApi["role"];
  department: string;
  project_id?: number | null;
  status: TeamMemberApi["status"];
  total_tasks: number;
  completed_tasks: number;
};

export type UpdateTeamMemberPayload = Partial<CreateTeamMemberPayload>;

export async function listTeamMembers(params?: { project?: number; status?: TeamMemberApi["status"]; role?: TeamMemberApi["role"] }): Promise<TeamMemberApi[]> {
  const { data } = await http.get("/api/team-members/", { params });
  return data;
}

export async function createTeamMember(payload: CreateTeamMemberPayload): Promise<TeamMemberApi> {
  const { data } = await http.post("/api/team-members/", payload);
  return data;
}

export async function updateTeamMember(id: number, payload: UpdateTeamMemberPayload): Promise<TeamMemberApi> {
  const { data } = await http.patch(`/api/team-members/${id}/`, payload);
  return data;
}

export async function deleteTeamMember(id: number): Promise<void> {
  await http.delete(`/api/team-members/${id}/`);
}
