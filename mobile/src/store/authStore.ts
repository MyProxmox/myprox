import { create } from 'zustand';
import { authApi } from '../api/auth';
import { secureStorage } from '../utils/secureStorage';
import { tokenManager } from '../utils/tokenManager';

interface User {
  id: string;
  email: string;
  plan: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,

  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    tokenManager.setTokens(data.accessToken, data.refreshToken);
    await secureStorage.setTokens(data.accessToken, data.refreshToken);
    set({ isLoggedIn: true, user: data.user });
  },

  register: async (email, password) => {
    const { data } = await authApi.register(email, password);
    tokenManager.setTokens(data.accessToken, data.refreshToken);
    await secureStorage.setTokens(data.accessToken, data.refreshToken);
    set({ isLoggedIn: true, user: data.user });
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    tokenManager.clearTokens();
    await secureStorage.clearTokens();
    set({ isLoggedIn: false, user: null });
  },

  restoreToken: async () => {
    try {
      const accessToken = await secureStorage.getAccessToken();
      const refreshToken = await secureStorage.getRefreshToken();
      if (!accessToken) return;

      // Load into memory so apiClient can use it synchronously
      tokenManager.setTokens(accessToken, refreshToken ?? '');

      // Verify token is valid (auto-refresh if needed via interceptor)
      const { data: user } = await authApi.getProfile();
      set({ isLoggedIn: true, user });
    } catch {
      tokenManager.clearTokens();
      await secureStorage.clearTokens();
      set({ isLoggedIn: false, user: null });
    }
  },
}));
