import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VMItem, VMAction, vmsApi } from '../api/vms';
import { vmStatsApi, RRDPoint } from '../api/nodes';
import { formatCPU, formatBytes, formatUptime, getStatusColor } from '../utils/formatting';
import { useTheme } from '../utils/theme';
import { t } from '../utils/i18n';

// ── Action config ────────────────────────────────────────────────────────────
const ACTIONS: { action: VMAction | 'console'; icon: string; label: () => string; color: string; glow: string }[] = [
  { action: 'start',   icon: 'play-circle',      label: () => t('vm_action_start'),   color: '#30d158', glow: '#30d15820' },
  { action: 'stop',    icon: 'stop-circle',       label: () => t('vm_action_stop'),    color: '#ff453a', glow: '#ff453a20' },
  { action: 'restart', icon: 'refresh-circle',    label: () => t('vm_action_restart'), color: '#ffa040', glow: '#ffa04020' },
  { action: 'console', icon: 'desktop-outline',   label: () => 'Console',              color: '#0a84ff', glow: '#0a84ff20' },
];

export const VMDetailsScreen = ({ route, navigation }: any) => {
  const { serverId, vm: initialVm } = route.params;
  const [vm] = useState<VMItem>(initialVm);
  const [actionLoading, setActionLoading] = useState<VMAction | 'console' | null>(null);
  const [stats, setStats] = useState<RRDPoint[]>([]);
  const colors = useTheme();

  const handleAction = async (action: VMAction | 'console') => {
    if (action === 'console') {
      navigation.navigate('VncScreen', { serverId, node: vm.node, vmid: vm.vmid, type: vm.type });
      return;
    }

    Alert.alert(
      'Confirmation',
      `${action === 'start' ? t('vm_action_start') : action === 'stop' ? t('vm_action_stop') : t('vm_action_restart')} ?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'stop' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setActionLoading(action);
              await vmsApi.action(serverId, vm.vmid, action, vm.type, vm.node);
              Alert.alert(t('success_title'), `${action} launched`);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert(t('error_title'), error.response?.data?.error || t('vm_action_error'));
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };


  useEffect(() => {
    if (vm.status !== 'running') return;
    vmStatsApi.get(serverId, vm.vmid, vm.node, vm.type)
      .then(({ data }) => setStats(data.stats ?? []))
      .catch(() => {});
  }, [vm.vmid]);

    const statusColor = getStatusColor(vm.status);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Status header ─────────────────────────────── */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.vmName, { color: colors.text }]}>{vm.name || `VM ${vm.vmid}`}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{vm.status}</Text>
          </View>
        </View>
        <Text style={[styles.vmMeta, { color: colors.textSecondary }]}>
          {vm.type === 'qemu' ? 'Virtual Machine' : 'LXC Container'} · #{vm.vmid}
        </Text>
      </View>

      {/* ── Action buttons ─────────────────────────────── */}
      <View style={styles.actionsRow}>
        {ACTIONS.map(({ action, icon, label, color, glow }) => {
          const isLoading = actionLoading === action;
          const disabled = !!actionLoading;
          return (
            <TouchableOpacity
              key={action}
              style={[
                styles.actionBtn,
                { backgroundColor: glow, borderColor: disabled ? 'transparent' : color },
                disabled && styles.actionBtnDisabled,
              ]}
              onPress={() => handleAction(action)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color={color} size="small" />
              ) : (
                <Ionicons name={icon as any} size={26} color={color} />
              )}
              <Text style={[styles.actionBtnLabel, { color }]}>{label()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Info ──────────────────────────────────────── */}
      <Section title={t('vm_details_status')} colors={colors}>
        <InfoRow label={t('vm_details_node')}   value={vm.node}                                colors={colors} />
        {vm.uptime !== undefined && (
          <InfoRow label={t('vm_details_uptime')} value={formatUptime(vm.uptime)}              colors={colors} />
        )}
        <InfoRow label={t('vm_details_type')}   value={vm.type === 'qemu' ? 'VM' : 'LXC'}     colors={colors} last />
      </Section>

      {/* ── Resources ─────────────────────────────────── */}
      {(vm.cpu !== undefined || vm.mem !== undefined) && (
        <Section title="Resources" colors={colors}>
          {vm.cpu !== undefined && (
            <InfoRow label={t('vm_details_cpu')} value={formatCPU(vm.cpu)} colors={colors} />
          )}
          {vm.mem !== undefined && vm.maxmem !== undefined && (
            <InfoRow
              label={t('vm_details_ram')}
              value={`${formatBytes(vm.mem)} / ${formatBytes(vm.maxmem)}`}
              colors={colors}
            />
          )}
          {vm.disk !== undefined && vm.maxdisk !== undefined && (
            <InfoRow
              label="Disk"
              value={`${formatBytes(vm.disk)} / ${formatBytes(vm.maxdisk)}`}
              colors={colors}
            />
          )}
          {vm.maxcpu !== undefined && (
            <InfoRow label="vCPUs" value={String(vm.maxcpu)} colors={colors} last />
          )}
        </Section>
      )}

      {/* ── RRD Stats ─────────────────────────────────── */}
      {stats.length > 0 && (
        <Section title="Monitoring" colors={colors}>
          <View style={{ padding: 16 }}>
            <MiniChart
              data={stats.map((p) => (p.cpu ?? 0) * 100)}
              color="#0a84ff"
              label="CPU %"
              max={100}
              format={(v) => `${v.toFixed(1)}%`}
            />
            <MiniChart
              data={stats.map((p) => p.maxmem ? (p.mem ?? 0) / p.maxmem * 100 : 0)}
              color="#30d158"
              label="RAM %"
              max={100}
              format={(v) => `${v.toFixed(1)}%`}
            />
          </View>
        </Section>
      )}
    </ScrollView>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const MiniChart = ({ data, color, label, max, format }: {
  data: number[]; color: string; label: string; max: number; format: (v: number) => string;
}) => {
  const last = data[data.length - 1] ?? 0;
  const BARS = 20;
  const slice = data.slice(-BARS);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: '#888', fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 12, color, fontWeight: '700' }}>{format(last)}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 28, gap: 2 }}>
        {slice.map((v, i) => (
          <View
            key={i}
            style={{
              flex: 1, borderRadius: 2,
              height: Math.max(2, Math.round((v / (max || 1)) * 28)),
              backgroundColor: i === slice.length - 1 ? color : color + '60',
            }}
          />
        ))}
      </View>
    </View>
  );
};

const Section = ({
  title, children, colors,
}: { title: string; children: React.ReactNode; colors: ReturnType<typeof useTheme> }) => (
  <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title.toUpperCase()}</Text>
    {children}
  </View>
);

const InfoRow = ({
  label, value, last, colors,
}: { label: string; value: string; last?: boolean; colors: ReturnType<typeof useTheme> }) => (
  <View style={[styles.infoRow, { borderTopColor: colors.separator }, last && { borderBottomWidth: 0 }]}>
    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: {
    margin: 16, marginBottom: 8,
    padding: 18, borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  vmName: { fontSize: 20, fontWeight: '700', flex: 1 },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  statusPillText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  vmMeta: { fontSize: 13 },

  // ── Action buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // ── Info sections
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 15, fontWeight: '600' },
});
