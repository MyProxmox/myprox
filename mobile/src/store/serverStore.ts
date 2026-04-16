import { create } from 'zustand';
import { serversApi, Server } from '../api/servers';

interface ServerState {
  servers: Server[];
  loading: boolean;
  fetchServers: () => Promise<void>;
  addServer: (name: string, ip: string, username: string, password: string, mode?: 'local' | 'cloud') => Promise<string | undefined>;
  deleteServer: (id: string) => Promise<void>;
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  loading: false,

  fetchServers: async () => {
    try {
      set({ loading: true });
      const response = await serversApi.list();
      set({ servers: response.data });
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      set({ loading: false });
    }
  },

  addServer: async (name, ip, username, password, mode = 'local') => {
    const response = await serversApi.add({ name, ip, username, password, mode });
    set((state) => ({ servers: [...state.servers, response.data.server] }));
    return response.data.agentToken;
  },

  deleteServer: async (id) => {
    await serversApi.delete(id);
    set((state) => ({ servers: state.servers.filter((s) => s.id !== id) }));
  },
}));
