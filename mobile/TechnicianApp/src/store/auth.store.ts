import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';

const storage = new MMKV({id: 'technician-auth'});

interface User {
  id: number;
  phone: string;
  fullName: string;
  role: 'technician';
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  avatar?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  setTokens: (access, refresh) => {
    storage.set('accessToken', access);
    storage.set('refreshToken', refresh);
    set({accessToken: access, refreshToken: refresh, isAuthenticated: true});
  },

  setUser: (user) => {
    storage.set('user', JSON.stringify(user));
    set({user});
  },

  logout: () => {
    storage.delete('accessToken');
    storage.delete('refreshToken');
    storage.delete('user');
    set({accessToken: null, refreshToken: null, user: null, isAuthenticated: false});
  },

  hydrate: () => {
    const accessToken = storage.getString('accessToken') ?? null;
    const refreshToken = storage.getString('refreshToken') ?? null;
    const userStr = storage.getString('user');
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    set({accessToken, refreshToken, user, isAuthenticated: !!accessToken});
  },
}));
