import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = '@myprox_theme';

interface AppState {
  isLoading: boolean;
  globalError: string | null;
  themeMode: ThemeMode;

  setLoading: (loading: boolean) => void;
  setGlobalError: (error: string | null) => void;
  clearError: () => void;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  globalError: null,
  themeMode: 'system',

  setLoading: (loading) => set({ isLoading: loading }),
  setGlobalError: (error) => set({ globalError: error }),
  clearError: () => set({ globalError: null }),

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch {}
  },

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        set({ themeMode: saved });
      }
    } catch {}
  },
}));
