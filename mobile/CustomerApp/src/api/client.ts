import axios, { AxiosInstance } from "axios";
import { useAuthStore } from "../store/auth.store";
import { getServerBaseUrl } from "../store/server.store";

export const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = getServerBaseUrl();
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const apiClient: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "ar",
  },
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = `${getServerBaseUrl()}/api/v1`;
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refresh_token: refreshToken });
        const { accessToken, refreshToken: newRefresh } = response.data.data;
        useAuthStore.getState().setTokens(accessToken, newRefresh);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  },
);
