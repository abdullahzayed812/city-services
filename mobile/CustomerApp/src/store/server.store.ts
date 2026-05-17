import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'server-config' });

interface ServerState {
  ip: string | null;
  setIp: (ip: string) => void;
  clearIp: () => void;
  hydrate: () => void;
}

export const useServerStore = create<ServerState>((set) => ({
  ip: null,

  setIp: (ip) => {
    storage.set('server_ip', ip);
    set({ ip });
  },

  clearIp: () => {
    storage.delete('server_ip');
    set({ ip: null });
  },

  hydrate: () => {
    const ip = storage.getString('server_ip') ?? null;
    set({ ip });
  },
}));

export function getServerBaseUrl(): string {
  const ip = storage.getString('server_ip');
  return ip ? `http://${ip}:5000` : 'http://192.168.0.128:5000';
}
