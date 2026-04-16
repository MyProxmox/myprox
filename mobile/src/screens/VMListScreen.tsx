import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
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

  useEffect(() => {
    navigation.setOptions({
      title: serverName || t('vms_tab'),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('ServerSettingsScreen', { serverId, serverName })}
          style={{ marginRight: 4 }}
        >
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
  }, [serverName, serverId]);

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

  const handleVMPress = (vm: VMItem) => {
    navigation.navigate('VMDetailsScreen', { serverId, vm });
  };

  const displayData = activeTab === 'vms' ? vms : containers;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
              onPress={() => handleVMPress(item)}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
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
