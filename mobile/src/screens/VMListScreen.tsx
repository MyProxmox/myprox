import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vmsApi, VMItem, VMAction } from '../api/vms';
import { VMCard } from '../components/VMCard';
import { REFRESH_INTERVAL_MS } from '../utils/constants';
import { useTheme } from '../utils/theme';
import { t } from '../utils/i18n';

export const VMListScreen = ({ route, navigation }: any) => {
  const { serverId, serverName } = route.params;
  const [vms, setVms] = useState<VMItem[]>([]);
  const [containers, setContainers] = useState<VMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vms' | 'containers'>('vms');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const colors = useTheme();

  const fetchVMs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await vmsApi.list(serverId);
      setVms(data.vms || []);
      setContainers(data.containers || []);
    } catch (error: any) {
      Alert.alert(t('error_title'), error.response?.data?.error || t('vm_load_error'));
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchVMs();
    const interval = setInterval(fetchVMs, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchVMs]);

  const handleAction = async (vm: VMItem, action: VMAction) => {
    const key = `${vm.node}-${vm.vmid}-${action}`;
    try {
      setActionLoading(key);
      await vmsApi.action(serverId, vm.vmid, action, vm.type, vm.node);
      Alert.alert(t('success_title'), t('vm_action_success'));
      setTimeout(fetchVMs, 2000);
    } catch (error: any) {
      Alert.alert(t('error_title'), error.response?.data?.error || t('vm_action_error'));
    } finally {
      setActionLoading(null);
    }
  };

  const displayData = activeTab === 'vms' ? vms : containers;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Custom header (no React Navigation header = no iOS bubble) ── */}
      <SafeAreaView>
        <View style={[styles.customHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.5}
            style={styles.headerBtn}
          >
            <Ionicons name="chevron-back" size={26} color={colors.accent} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {serverName}
          </Text>

          {/* Settings button — plain JSX, zero iOS wrapper */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ServerSettingsScreen', { serverId, serverName })}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.5}
            style={styles.headerBtn}
          >
            <Ionicons name="settings-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['vms', 'containers'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && [styles.activeTab, { borderBottomColor: colors.accent }]]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText, { color: colors.textSecondary },
              activeTab === tab && { color: colors.accent, fontWeight: '600' },
            ]}>
              {tab === 'vms'
                ? `${t('vms_tab')} (${vms.length})`
                : `${t('containers_tab')} (${containers.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      {loading && displayData.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : displayData.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {activeTab === 'vms' ? t('vms_empty') : t('containers_empty')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => `${item.node}-${item.vmid}`}
          renderItem={({ item }) => (
            <VMCard
              vm={item}
              actionLoading={actionLoading}
              onAction={handleAction}
              onPress={() => navigation.navigate('VMDetailsScreen', { serverId, vm: item })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchVMs} tintColor={colors.accent} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Custom header */
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 6 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  /* Tab bar */
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomWidth: 2 },
  tabText: { fontSize: 15, fontWeight: '500' },

  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16 },
});
