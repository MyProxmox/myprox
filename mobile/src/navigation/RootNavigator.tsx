import React, { useEffect } from 'react';
import { useColorScheme, TouchableOpacity } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthScreen } from '../screens/AuthScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { VMListScreen } from '../screens/VMListScreen';
import { VMDetailsScreen } from '../screens/VMDetailsScreen';
import { ServerSettingsScreen } from '../screens/ServerSettingsScreen';
import { VncScreen } from '../screens/VncScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { t } from '../utils/i18n';
import { useTheme, dark, light } from '../utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Custom nav themes ────────────────────────────────────────────────────────
const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: light.background,
    card: light.headerBg,
    text: light.text,
    border: light.border,
    primary: light.accent,
    notification: light.accent,
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: dark.background,
    card: dark.headerBg,
    text: dark.text,
    border: dark.border,
    primary: dark.accent,
    notification: dark.accent,
  },
};

// ── Dashboard + nested screens ───────────────────────────────────────────────
const DashboardStack = ({ navigation }: any) => {
  const colors = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{ headerShown: false, title: t('dashboard_title') }}
      />
      <Stack.Screen
        name="OnboardingScreen"
        component={OnboardingScreen}
        options={{ title: t('onboarding_title') }}
      />
      <Stack.Screen
        name="VMListScreen"
        component={VMListScreen}
        options={({ navigation, route }: any) => ({
          title: (route.params?.serverName as string) || t('vms_tab'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ServerSettingsScreen', {
                  serverId: route.params?.serverId,
                  serverName: route.params?.serverName,
                })
              }
              activeOpacity={0.5}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <Ionicons name="settings-outline" size={22} color="#0A84FF" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="VMDetailsScreen"
        component={VMDetailsScreen}
        options={{ title: t('vm_details_title') }}
      />
      <Stack.Screen
        name="ServerSettingsScreen"
        component={ServerSettingsScreen}
        options={{ title: 'Nœud & Système' }}
      />
      <Stack.Screen
        name="VncScreen"
        component={VncScreen}
        options={{ title: 'Console', headerBackTitle: '' }}
      />
    </Stack.Navigator>
  );
};

// ── Tab navigator ────────────────────────────────────────────────────────────
const AppTabs = () => {
  const colors = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: t('nav_servers'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="server-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings_title'),
          tabBarLabel: t('nav_settings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          headerShown: true,
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
    </Tab.Navigator>
  );
};

// ── Auth stack ────────────────────────────────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AuthScreen" component={AuthScreen} />
  </Stack.Navigator>
);

// ── Root navigator ────────────────────────────────────────────────────────────
export const RootNavigator = () => {
  const { isLoggedIn, restoreToken } = useAuthStore();
  const { themeMode, loadTheme } = useAppStore();
  const systemScheme = useColorScheme();
  const resolvedScheme = themeMode === 'system' ? (systemScheme ?? 'light') : themeMode;

  useEffect(() => {
    restoreToken();
    loadTheme();
  }, []);

  return (
    <NavigationContainer theme={resolvedScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
      {isLoggedIn ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};
