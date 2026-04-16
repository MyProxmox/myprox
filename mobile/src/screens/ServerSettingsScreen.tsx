import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { nodesApi, NodeStatus, AptPackage, ClusterLogEntry } from '../api/nodes';

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

const StatBar = ({ label, used, total, warn = 0.8 }: { label: string; used: number; total: number; warn?: number }) => {
  const pct = total > 0 ? used / total : 0;
  const color = pct >= 0.9 ? '#f44336' : pct >= warn ? '#FF9800' : '#4CAF50';
  return (
    <View style={styles.statRow}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{formatBytes(used)} / {formatBytes(total)}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
};

export const ServerSettingsScreen = ({ route }: any) => {
  const { serverId, serverName } = route.params;

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
      '⚠️ Mise à jour système',
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
              Alert.alert('Upgrade lancé', 'Surveillez la progression dans l\'interface Proxmox.');
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement du nœud…</Text>
      </View>
    );
  }

  const s = nodeStatus?.status;

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabs}>
        {(['status', 'updates', 'logs'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'status' ? 'Statut' : t === 'updates' ? `Mises à jour ${updates.length > 0 ? `(${updates.length})` : ''}` : 'Logs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#007AFF" />}
      >
        {tab === 'status' && s && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nœud : {nodeStatus?.node}</Text>

            <View style={styles.row}>
              <View style={styles.chip}><Text style={styles.chipLabel}>CPU</Text><Text style={styles.chipValue}>{Math.round(s.cpu * 100)}%</Text></View>
              <View style={styles.chip}><Text style={styles.chipLabel}>Uptime</Text><Text style={styles.chipValue}>{formatUptime(s.uptime)}</Text></View>
              <View style={styles.chip}><Text style={styles.chipLabel}>Load</Text><Text style={styles.chipValue}>{s.loadavg?.[0]?.toFixed(2) ?? '—'}</Text></View>
            </View>

            <StatBar label="RAM" used={s.memory.used} total={s.memory.total} />
            <StatBar label="SWAP" used={s.swap.used} total={s.swap.total} />

            {nodeStatus?.storage?.map((st) => (
              <StatBar key={st.storage} label={`💾 ${st.storage} (${st.type})`} used={st.used} total={st.total} warn={0.85} />
            ))}

            <Text style={styles.meta}>{s.pveversion} — {s.kversion}</Text>
          </View>
        )}

        {tab === 'updates' && (
          <View style={styles.section}>
            <View style={styles.updateHeader}>
              <Text style={styles.sectionTitle}>{updates.length} paquet{updates.length !== 1 ? 's' : ''} disponible{updates.length !== 1 ? 's' : ''}</Text>
              {updates.length > 0 && (
                <TouchableOpacity
                  style={[styles.upgradeBtn, upgrading && styles.upgradeBtnDisabled]}
                  onPress={handleUpgrade}
                  disabled={upgrading}
                >
                  {upgrading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.upgradeBtnText}>Mettre à jour</Text>}
                </TouchableOpacity>
              )}
            </View>

            {updates.length === 0 ? (
              <Text style={styles.empty}>Système à jour ✓</Text>
            ) : (
              updates.map((pkg) => (
                <View key={pkg.Package} style={styles.pkgRow}>
                  <Text style={styles.pkgName}>{pkg.Package}</Text>
                  <Text style={styles.pkgVersion}>{pkg.OldVersion} → {pkg.Version}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'logs' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Logs récents du cluster</Text>
            {logs.length === 0 ? (
              <Text style={styles.empty}>Aucun log</Text>
            ) : (
              logs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <View style={[styles.logSeverity, { backgroundColor: log.severity === 'err' ? '#f4433620' : '#ffffff10' }]}>
                    <Text style={[styles.logSeverityText, { color: log.severity === 'err' ? '#f44336' : '#999' }]}>{log.severity}</Text>
                  </View>
                  <View style={styles.logContent}>
                    <Text style={styles.logNode}>{log.node}</Text>
                    <Text style={styles.logMsg}>{log.msg}</Text>
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
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 13, color: '#999', fontWeight: '500' },
  tabTextActive: { color: '#007AFF', fontWeight: '600' },
  scroll: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1c1c1e', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chip: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  chipLabel: { fontSize: 11, color: '#999', fontWeight: '500', marginBottom: 4 },
  chipValue: { fontSize: 18, fontWeight: '700', color: '#1c1c1e' },
  statRow: { marginBottom: 14 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  statValue: { fontSize: 12, color: '#888' },
  barBg: { height: 8, backgroundColor: '#e5e5ea', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  meta: { marginTop: 12, fontSize: 11, color: '#aaa', textAlign: 'center' },
  updateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  upgradeBtn: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  upgradeBtnDisabled: { opacity: 0.5 },
  upgradeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  pkgRow: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  pkgName: { fontSize: 14, fontWeight: '600', color: '#1c1c1e' },
  pkgVersion: { fontSize: 12, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  logRow: { flexDirection: 'row', marginBottom: 8, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  logSeverity: { width: 40, justifyContent: 'center', alignItems: 'center', padding: 8 },
  logSeverityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  logContent: { flex: 1, padding: 10 },
  logNode: { fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 2 },
  logMsg: { fontSize: 13, color: '#333' },
});
