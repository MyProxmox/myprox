import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VMItem, VMAction } from '../api/vms';
import {
  formatCPU, formatBytes, getStatusColor,
  getCPUColor, getRAMColor, getCPUPercent, getRAMPercent,
} from '../utils/formatting';
import { useTheme } from '../utils/theme';
import { t } from '../utils/i18n';

const ACTION_CONFIG = {
  start:   { icon: 'play-circle',   color: '#30d158', glow: '#30d15818', label: () => t('vm_action_start')   },
  stop:    { icon: 'stop-circle',   color: '#ff453a', glow: '#ff453a18', label: () => t('vm_action_stop')    },
  restart: { icon: 'refresh-circle',color: '#ffa040', glow: '#ffa04018', label: () => t('vm_action_restart') },
} as const;

interface Props {
  vm: VMItem;
  actionLoading: string | null;
  onAction: (vm: VMItem, action: VMAction) => void;
  onPress: () => void;
}

const ProgressBar = ({
  percent, color, label, value,
}: { percent: number; color: string; label: string; value: string }) => (
  <View style={pb.row}>
    <Text style={pb.label}>{label}</Text>
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${Math.round(percent * 100)}%`, backgroundColor: color }]} />
    </View>
    <Text style={pb.value}>{value}</Text>
  </View>
);

const pb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  label: { width: 36, fontSize: 11, color: '#888', fontWeight: '600' },
  track: {
    flex: 1, height: 6, backgroundColor: '#f0f0f0',
    borderRadius: 3, marginHorizontal: 8, overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
  value: { width: 60, fontSize: 11, color: '#555', textAlign: 'right' },
});

export const VMCard = ({ vm, actionLoading, onAction, onPress }: Props) => {
  const scale = useRef(new Animated.Value(1)).current;
  const statusColor = getStatusColor(vm.status);
  const colors = useTheme();

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const cpuPercent = vm.cpu !== undefined ? getCPUPercent(vm.cpu) : null;
  const ramPercent = vm.mem !== undefined && vm.maxmem ? getRAMPercent(vm.mem, vm.maxmem) : null;
  const cpuColor = vm.cpu !== undefined ? getCPUColor(vm.cpu) : '#999';
  const ramColor = vm.mem !== undefined && vm.maxmem ? getRAMColor(vm.mem, vm.maxmem) : '#999';

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
      <Animated.View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: statusColor, transform: [{ scale }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.name, { color: colors.text }]}>{vm.name || `VM ${vm.vmid}`}</Text>
          </View>
          <Text style={[styles.status, { color: statusColor }]}>{vm.status}</Text>
        </View>

        {/* Meta */}
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          ID: {vm.vmid} · {vm.node} · {vm.type === 'qemu' ? 'VM' : 'CT'}
        </Text>

        {/* Progress bars (only when running) */}
        {vm.status === 'running' && (cpuPercent !== null || ramPercent !== null) && (
          <View style={styles.progressSection}>
            {cpuPercent !== null && (
              <ProgressBar
                percent={cpuPercent}
                color={cpuColor}
                label="CPU"
                value={formatCPU(vm.cpu!)}
              />
            )}
            {ramPercent !== null && vm.mem !== undefined && vm.maxmem !== undefined && (
              <ProgressBar
                percent={ramPercent}
                color={ramColor}
                label="RAM"
                value={`${formatBytes(vm.mem)}/${formatBytes(vm.maxmem)}`}
              />
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {(['start', 'stop', 'restart'] as VMAction[]).map((action) => {
            const key = `${vm.node}-${vm.vmid}-${action}`;
            const isLoading = actionLoading === key;
            const cfg = ACTION_CONFIG[action];
            return (
              <TouchableOpacity
                key={action}
                style={[
                  styles.btn,
                  { backgroundColor: cfg.glow, borderColor: cfg.color },
                  !!actionLoading && styles.btnDisabled,
                ]}
                onPress={() => onAction(vm, action)}
                disabled={!!actionLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={cfg.color} />
                ) : (
                  <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
                )}
                <Text style={[styles.btnText, { color: cfg.color }]}>
                  {cfg.label()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#ccc',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  name: { fontSize: 16, fontWeight: '600', color: '#1c1c1e', flex: 1 },
  status: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  meta: { fontSize: 12, color: '#888', marginBottom: 10 },
  progressSection: { marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 4 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 7, borderRadius: 10, borderWidth: 1, gap: 4,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});
