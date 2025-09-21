const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type JwtPair = {
  access: string;
  refresh: string;
};

export async function login(username: string, password: string): Promise<JwtPair> {
  const resp = await fetch(`${API_BASE_URL}/api/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Login failed (${resp.status})`);
  }
  return resp.json();
}

export async function fetchWithAuth<T = unknown>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Request failed (${resp.status})`);
  }
  return resp.json();
}

export type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type Task = {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  assignee: User | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: number;
  type: "comment" | "status_change" | "assignment";
  message: string;
  user: User;
  task: Task | null;
  created_at: string;
};

export const api = {
  tasks: (token: string) => fetchWithAuth<Task[]>(`/api/tasks/`, token),
  activities: (token: string) => fetchWithAuth<Activity[]>(`/api/activities/`, token),
  users: (token: string) => fetchWithAuth<User[]>(`/api/users/`, token),
};


