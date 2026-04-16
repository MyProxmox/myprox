import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nodesApi, NodeStatus, AptPackage, ClusterLogEntry } from '../api/nodes';
import { useTheme } from '../utils/theme';

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// StatBar receives colors externally so it can be a pure component
const StatBar = ({
  label, used, total, warn = 0.8, colors,
}: {
  label: string; used: number; total: number; warn?: number;
  colors: ReturnType<typeof useTheme>;
}) => {
  const pct = total > 0 ? used / total : 0;
  const barColor = pct >= 0.9 ? colors.error : pct >= warn ? colors.warning : colors.success;
  return (
    <View style={styles.statRow}>
      <View style={styles.statHeader}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.statValue, { color: colors.textTertiary }]}>
          {formatBytes(used)} / {formatBytes(total)}
        </Text>
      </View>
      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
        <View
          style={[styles.barFill, {
            width: `${Math.round(pct * 100)}%` as any,
            backgroundColor: barColor,
          }]}
        />
      </View>
    </View>
  );
};

export const ServerSettingsScreen = ({ route }: any) => {
  const { serverId, serverName } = route.params;
  const colors = useTheme();

  const [nodeStatus, setNodeStatus] = useState<NodeStatus | null>(null);
  const [updates, setUpdates] = useState<AptPackage[]>([]);
  const [logs, setLogs] = useState<ClusterLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [tab, setTab] = useState<'status' | 'updates' | 'logs'>('status');

  const load = useCallback(async () => {
    try {
      const [statusRes, updatesRes, logsRes] = await Promise.allSettled([
        nodesApi.getStatus(serverId),
        nodesApi.getUpdates(serverId),
        nodesApi.getLogs(serverId, 30),
      ]);

      if (statusRes.status === 'fulfilled') setNodeStatus(statusRes.value.data);
      if (updatesRes.status === 'fulfilled') setUpdates(updatesRes.value.data.updates ?? []);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data.logs ?? []);
    } catch {
      // partial load is fine
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [serverId]);

  useEffect(() => { load(); }, [load]);

  const handleUpgrade = () => {
    Alert.alert(
      'Mise à jour système',
      `Cela va lancer apt dist-upgrade sur le nœud ${nodeStatus?.node}.\n\nCette opération peut prendre plusieurs minutes et nécessiter un redémarrage.\n\nContinuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Mettre à jour',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpgrading(true);
              await nodesApi.upgrade(serverId);
              Alert.alert('Upgrade lancé', "Surveillez la progression dans l'interface Proxmox.");
            } catch (e: any) {
              Alert.alert('Erreur', e.response?.data?.error || e.message);
            } finally {
              setUpgrading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement du nœud…</Text>
      </View>
    );
  }

  const s = nodeStatus?.status;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab bar */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['status', 'updates', 'logs'] as const).map((tabId) => (
          <TouchableOpacity
            key={tabId}
            style={[styles.tab, tab === tabId && [styles.tabActive, { borderBottomColor: colors.accent }]]}
            onPress={() => setTab(tabId)}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, tab === tabId && { color: colors.accent, fontWeight: '600' }]}>
              {tabId === 'status'
                ? 'Statut'
                : tabId === 'updates'
                  ? `Mises à jour${updates.length > 0 ? ` (${updates.length})` : ''}`
                  : 'Logs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.accent}
          />
        }
      >
        {/* ── Statut ── */}
        {tab === 'status' && s && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nœud : {nodeStatus?.node}</Text>

            <View style={styles.row}>
              {[
                { label: 'CPU',    value: `${Math.round(s.cpu * 100)}%` },
                { label: 'Uptime', value: formatUptime(s.uptime) },
                { label: 'Load',   value: s.loadavg?.[0] != null ? parseFloat(String(s.loadavg[0])).toFixed(2) : '—' },
              ].map((chip) => (
                <View key={chip.label} style={[styles.chip, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.chipLabel, { color: colors.textTertiary }]}>{chip.label}</Text>
                  <Text style={[styles.chipValue, { color: colors.text }]}>{chip.value}</Text>
                </View>
              ))}
            </View>

            <StatBar label="RAM"  used={s.memory.used} total={s.memory.total} colors={colors} />
            <StatBar label="SWAP" used={s.swap.used}   total={s.swap.total}   colors={colors} />

            {nodeStatus?.storage?.map((st) => (
              <StatBar
                key={st.storage}
                label={`${st.storage} (${st.type})`}
                used={st.used}
                total={st.total}
                warn={0.85}
                colors={colors}
              />
            ))}

            <Text style={[styles.meta, { color: colors.textTertiary }]}>{s.pveversion} — {s.kversion}</Text>
          </View>
        )}

        {/* ── Mises à jour ── */}
        {tab === 'updates' && (
          <View style={styles.section}>
            <View style={styles.updateHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {updates.length} paquet{updates.length !== 1 ? 's' : ''} disponible{updates.length !== 1 ? 's' : ''}
              </Text>
              {updates.length > 0 && (
                <TouchableOpacity
                  style={[styles.upgradeBtn, { backgroundColor: colors.accent }, upgrading && styles.upgradeBtnDisabled]}
                  onPress={handleUpgrade}
                  disabled={upgrading}
                >
                  {upgrading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.upgradeBtnText}>Mettre à jour</Text>
                  }
                </TouchableOpacity>
              )}
            </View>

            {updates.length === 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                <Text style={[styles.empty, { color: colors.textSecondary, marginTop: 0 }]}>Système à jour</Text>
              </View>
            ) : (
              updates.map((pkg) => (
                <View key={pkg.Package} style={[styles.pkgRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.pkgName, { color: colors.text }]}>{pkg.Package}</Text>
                  <Text style={[styles.pkgVersion, { color: colors.textSecondary }]}>
                    {pkg.OldVersion} → {pkg.Version}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Logs ── */}
        {tab === 'logs' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Logs récents du cluster</Text>
            {logs.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>Aucun log</Text>
            ) : (
              logs.map((log) => (
                <View key={log.id} style={[styles.logRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[
                    styles.logSeverity,
                    { backgroundColor: log.severity === 'err' ? colors.error + '20' : colors.border + '40' },
                  ]}>
                    <Text style={[
                      styles.logSeverityText,
                      { color: log.severity === 'err' ? colors.error : colors.textTertiary },
                    ]}>
                      {log.severity}
                    </Text>
                  </View>
                  <View style={styles.logContent}>
                    <Text style={[styles.logNode, { color: colors.textTertiary }]}>{log.node}</Text>
                    <Text style={[styles.logMsg, { color: colors.text }]}>{log.msg}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomWidth: 2 },
  tabText: { fontSize: 13, fontWeight: '500' },
  scroll: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chip: {
    flex: 1, borderRadius: 10, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  chipLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  chipValue: { fontSize: 18, fontWeight: '700' },
  statRow: { marginBottom: 14 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statLabel: { fontSize: 13, fontWeight: '500' },
  statValue: { fontSize: 12 },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  meta: { marginTop: 12, fontSize: 11, textAlign: 'center' },
  updateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  upgradeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  upgradeBtnDisabled: { opacity: 0.5 },
  upgradeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  pkgRow: { borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth },
  pkgName: { fontSize: 14, fontWeight: '600' },
  pkgVersion: { fontSize: 12, marginTop: 2 },
  empty: { color: '#999', marginTop: 40, fontSize: 15 },
  logRow: { flexDirection: 'row', marginBottom: 8, borderRadius: 8, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  logSeverity: { width: 40, justifyContent: 'center', alignItems: 'center', padding: 8 },
  logSeverityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  logContent: { flex: 1, padding: 10 },
  logNode: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  logMsg: { fontSize: 13 },
});
