import axios from "axios";

const baseURL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export const http = axios.create({ baseURL });

http.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;


