import axios from "axios";
import { getAccessToken, saveAuth, clearAuth } from "../utils/authUtils";

const API_BASE =
  process.env.NODE_ENV === "production"
    ? window.location.origin
    : "http://localhost:5000";

const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (config?.skipAuth) return config;

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

function processQueue(error, token = null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!error.response) return Promise.reject(error);

    if (original?.url?.includes("/api/auth/refresh")) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (original?.skipAuth) {
      return Promise.reject(error);
    }

    const hadAuthHeader = !!original?.headers?.Authorization;
    const hasTokenNow = !!getAccessToken();
    const shouldTryRefresh = status === 401 && !original._retry && (hadAuthHeader || hasTokenNow);

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await http.post("/api/auth/refresh");
      saveAuth(data);
      processQueue(null, data.accessToken);

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return http(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);

      clearAuth();

      const path = window.location.pathname;
      const isProtectedRoute =
        path.startsWith("/admin") ||
        path.startsWith("/profile") ||
        path.startsWith("/orders") ||
        path.startsWith("/checkout");

      if (isProtectedRoute) {
        window.location.href = `/signin?redirect=${encodeURIComponent(path)}`;
      }

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default http;
