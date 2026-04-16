import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/appStore';

// ── Design tokens ────────────────────────────────────────────────────────────
const light = {
  background:     '#f2f2f7',
  surface:        '#ffffff',
  surfaceAlt:     '#f0f0f5',
  border:         '#e5e5ea',
  text:           '#1c1c1e',
  textSecondary:  '#6c6c70',
  textTertiary:   '#aeaeb2',
  accent:         '#007AFF',
  accentMuted:    '#e3f0ff',
  tabBar:         '#ffffff',
  tabBarBorder:   '#e5e5ea',
  card:           '#ffffff',
  separator:      '#e5e5ea',
  danger:         '#f44336',
  error:          '#f44336',
  success:        '#4CAF50',
  warning:        '#FF9800',
  headerBg:       '#ffffff',
  statusBar:      'dark' as const,
};

const dark = {
  background:     '#0d0d0f',
  surface:        '#1c1c1e',
  surfaceAlt:     '#2c2c2e',
  border:         '#38383a',
  text:           '#f2f2f7',
  textSecondary:  '#aeaeb2',
  textTertiary:   '#636366',
  accent:         '#0A84FF',
  accentMuted:    '#0a3a6e',
  tabBar:         '#1c1c1e',
  tabBarBorder:   '#38383a',
  card:           '#1c1c1e',
  separator:      '#38383a',
  danger:         '#ff453a',
  error:          '#ff453a',
  success:        '#30d158',
  warning:        '#ff9f0a',
  headerBg:       '#1c1c1e',
  statusBar:      'light' as const,
};

export type Theme = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentMuted: string;
  tabBar: string;
  tabBarBorder: string;
  card: string;
  separator: string;
  danger: string;
  error: string;
  success: string;
  warning: string;
  headerBg: string;
  statusBar: 'dark' | 'light';
};

/**
 * Returns the active theme tokens based on:
 * - User preference (light/dark) stored in appStore, OR
 * - System color scheme when preference is 'system'
 */
export function useTheme(): Theme {
  const themeMode = useAppStore((s) => s.themeMode);
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null

  const resolved =
    themeMode === 'system'
      ? (systemScheme ?? 'light')
      : themeMode;

  return resolved === 'dark' ? dark : light;
}

export { light, dark };
