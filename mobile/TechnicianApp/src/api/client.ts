import axios from 'axios';
import {useAuthStore} from '@store/auth.store';
import {getServerBaseUrl} from '@store/server.store';

export const mediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = getServerBaseUrl();
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const apiClient = axios.create({
  timeout: 30000,
  headers: {'Content-Type': 'application/json'},
});

apiClient.interceptors.request.use(config => {
  config.baseURL = `${getServerBaseUrl()}/api/v1`;
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{resolve: (val: string) => void; reject: (err: unknown) => void}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  r => r,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject});
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const {refreshToken, setTokens, logout} = useAuthStore.getState();
      try {
        const res = await axios.post(`${getServerBaseUrl()}/api/v1/auth/refresh`, {refreshToken});
        const {accessToken, refreshToken: newRefresh} = res.data.data;
        setTokens(accessToken, newRefresh);
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch (err) {
        processQueue(err, null);
        logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);
