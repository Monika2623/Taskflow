import http from "./http";

export type RecentItem = {
  id: number;
  type: "work" | "view";
  title: string;
  message: string;
  created_at: string;
  // optional associations
  task?: { id: number; title: string } | null;
  project?: { id: number; name: string } | null;
};

export async function getRecentWork(params?: { search?: string }): Promise<RecentItem[]> {
  const { data } = await http.get("/api/recent/work", { params });
  // map backend ActivityApi -> RecentItem
  return data.map((a: any) => ({
    id: a.id,
    type: "work",
    title: a.task?.title || a.message,
    message: a.message,
    created_at: a.created_at,
    task: a.task ? { id: a.task.id, title: a.task.title } : null,
  }));
}

export async function getRecentViews(params?: { search?: string }): Promise<RecentItem[]> {
  const { data } = await http.get("/api/recent/views", { params });
  return data.map((a: any) => ({
    id: a.id,
    type: "view",
    title: a.task?.title || a.message,
    message: a.message,
    created_at: a.created_at,
    task: a.task ? { id: a.task.id, title: a.task.title } : null,
  }));
}

export async function searchRecent(query: string): Promise<RecentItem[]> {
  const { data } = await http.get("/api/recent/search", { params: { query } });
  return data.map((a: any) => ({
    id: a.id,
    type: a.type === "view" ? "view" : "work",
    title: a.task?.title || a.message,
    message: a.message,
    created_at: a.created_at,
    task: a.task ? { id: a.task.id, title: a.task.title } : null,
  }));
}
