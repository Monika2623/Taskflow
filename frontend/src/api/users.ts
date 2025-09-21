import http from "./http";

export type ApiUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

export async function listUsers(): Promise<ApiUser[]> {
  const { data } = await http.get("/api/users/");
  return data;
}
