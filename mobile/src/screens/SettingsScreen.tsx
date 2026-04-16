import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useAppStore, ThemeMode } from '../store/appStore';
import { useTheme } from '../utils/theme';
import { t } from '../utils/i18n';
import apiClient from '../api/client';

interface PlanLimits {
  plan: string;
  limits: {
    localServers: number | null;
    cloudServers: number | null;
    bandwidthGB: number | null;
  } | null;
}

export const SettingsScreen = () => {
  const { logout, user } = useAuthStore();
  const [planInfo, setPlanInfo] = useState<PlanLimits | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const colors = useTheme();
  const { themeMode, setThemeMode } = useAppStore();

  useEffect(() => {
    apiClient
      .get<PlanLimits>('/api/v1/subscriptions/plan')
      .then((res) => setPlanInfo(res.data))
      .catch(() => {})
      .finally(() => setLoadingPlan(false));
  }, []);

  const handleLogout = () => {
    Alert.alert(t('settings_logout'), 'Confirmer ?', [
      { text: t('error_title') === 'Error' ? 'Cancel' : 'Annuler', style: 'cancel' },
      { text: t('settings_logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const isPremium = planInfo?.plan === 'premium';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Compte ───────────────────────────────────── */}
      <Section title={t('settings_account')} colors={colors}>
        <Row label="Email" value={user?.email || '-'} colors={colors} />
        <Row
          label={t('settings_plan')}
          last
          colors={colors}
          rightNode={
            <View style={[
              styles.planBadge,
              { backgroundColor: isPremium ? '#ffd700' + '30' : colors.surfaceAlt },
            ]}>
              <Text style={[styles.planBadgeText, { color: isPremium ? '#b8860b' : colors.textSecondary }]}>
                {isPremium ? `⭐ ${t('settings_plan_premium')}` : t('settings_plan_free')}
              </Text>
            </View>
          }
        />
      </Section>

      {/* ── Limites ───────────────────────────────────── */}
      <Section title={t('settings_limits')} colors={colors}>
        {loadingPlan ? (
          <ActivityIndicator style={{ padding: 16 }} color={colors.accent} />
        ) : planInfo ? (
          <>
            <Row
              label={t('settings_servers_used')}
              value={isPremium ? '∞' : `max ${planInfo.limits?.localServers}`}
              colors={colors}
            />
            <Row
              label={t('settings_cloud_servers')}
              value={isPremium ? '∞' : `max ${planInfo.limits?.cloudServers}`}
              colors={colors}
              last
            />
          </>
        ) : (
          <Row label="—" value={t('error_generic')} last colors={colors} />
        )}
      </Section>

      {/* ── Apparence ─────────────────────────────────── */}
      <Section title="Appearance" colors={colors}>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Theme</Text>
          <View style={styles.themeSelector}>
            {([
              { mode: 'system' as ThemeMode, icon: 'phone-portrait-outline', label: 'Auto' },
              { mode: 'light'  as ThemeMode, icon: 'sunny',                  label: 'Light' },
              { mode: 'dark'   as ThemeMode, icon: 'moon',                   label: 'Dark' },
            ] as const).map(({ mode, icon, label }) => {
              const active = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeOption,
                    { borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accentMuted : colors.surfaceAlt },
                  ]}
                  onPress={() => setThemeMode(mode)}
                >
                  <Ionicons
                    name={icon as any}
                    size={16}
                    color={active ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[
                    styles.themeOptionText,
                    { color: active ? colors.accent : colors.textSecondary },
                  ]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Section>

      {/* ── Application ───────────────────────────────── */}
      <Section title="App" colors={colors}>
        <Row label="Version" value="1.0.0" colors={colors} last />
      </Section>

      {/* ── Abonnement ────────────────────────────────── */}
      {!isPremium && (
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
          onPress={() => Alert.alert('Premium', t('settings_upgrade'))}
        >
          <Ionicons name="flash" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.upgradeText}>{t('settings_upgrade')}</Text>
        </TouchableOpacity>
      )}

      {isPremium && (
        <TouchableOpacity
          style={[styles.manageButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => Alert.alert('Portal', t('settings_manage'))}
        >
          <Text style={[styles.manageText, { color: colors.textSecondary }]}>{t('settings_manage')}</Text>
        </TouchableOpacity>
      )}

      {/* ── Déconnexion ───────────────────────────────── */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.danger }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={16} color={colors.danger} style={{ marginRight: 8 }} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>{t('settings_logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ── Sub-components ───────────────────────────────────────────────────────────
const Section = ({
  title, children, colors,
}: { title: string; children: React.ReactNode; colors: ReturnType<typeof useTheme> }) => (
  <View style={[styles.section, { backgroundColor: colors.surface }]}>
    <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>
    {children}
  </View>
);

const Row = ({
  label, value, last, rightNode, colors,
}: {
  label: string;
  value?: string;
  last?: boolean;
  rightNode?: React.ReactNode;
  colors: ReturnType<typeof useTheme>;
}) => (
  <View style={[
    styles.row,
    { borderBottomColor: colors.separator },
    last && { borderBottomWidth: 0 },
  ]}>
    <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
    {rightNode || <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text>}
  </View>
);

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    marginTop: 20, marginHorizontal: 16, borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 13, borderBottomWidth: 1,
  },
  rowLabel: { fontSize: 16 },
  rowValue: { fontSize: 16 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  planBadgeText: { fontSize: 13, fontWeight: '700' },
  themeSelector: { flexDirection: 'row', gap: 6 },
  themeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  themeOptionText: { fontSize: 12, fontWeight: '700' },
  upgradeButton: {
    marginHorizontal: 16, marginTop: 24, paddingVertical: 15,
    borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  upgradeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  manageButton: {
    marginHorizontal: 16, marginTop: 16, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', borderWidth: 1,
  },
  manageText: { fontSize: 15, fontWeight: '500' },
  logoutButton: {
    marginHorizontal: 16, marginTop: 16, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', borderWidth: 1,
    flexDirection: 'row', justifyContent: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
