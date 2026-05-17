import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'auth-storage' });

interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: 'customer';
  avatar_url: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  login: (data: { accessToken: string; refreshToken: string; user: User }) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: (accessToken, refreshToken) => {
    storage.set('accessToken', accessToken);
    storage.set('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => {
    storage.set('user', JSON.stringify(user));
    set({ user });
  },

  login: ({ accessToken, refreshToken, user }) => {
    storage.set('accessToken', accessToken);
    storage.set('refreshToken', refreshToken);
    storage.set('user', JSON.stringify(user));
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    storage.clearAll();
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  hydrate: () => {
    const accessToken = storage.getString('accessToken') || null;
    const refreshToken = storage.getString('refreshToken') || null;
    const userStr = storage.getString('user');
    const user = userStr ? JSON.parse(userStr) : null;
    set({ accessToken, refreshToken, user, isAuthenticated: !!accessToken, isLoading: false });
  },
}));
