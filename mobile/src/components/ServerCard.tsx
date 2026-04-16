import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Server } from '../api/servers';

interface Props {
  server: Server;
  onPress: () => void;
}

export const ServerCard = ({ server, onPress }: Props) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.top}>
      <Text style={styles.name}>{server.name}</Text>
      <View style={[styles.badge, server.verified ? styles.badgeOk : styles.badgeWarn]}>
        <Text style={styles.badgeText}>{server.verified ? '✓ Vérifié' : 'Non vérifié'}</Text>
      </View>
    </View>
    <Text style={styles.ip}>{server.local_ip}</Text>
    <View style={styles.footer}>
      <View style={[styles.modeBadge, server.mode === 'cloud' ? styles.modeCloud : styles.modeLocal]}>
        <Text style={styles.modeText}>{server.mode === 'cloud' ? '☁ Cloud' : '⌂ Local'}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: { fontSize: 17, fontWeight: '600', color: '#1c1c1e', flex: 1 },
  ip: { fontSize: 14, color: '#666', marginBottom: 8 },
  footer: { flexDirection: 'row' },
  modeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  modeLocal: { backgroundColor: '#e8f5e9' },
  modeCloud: { backgroundColor: '#e3f2fd' },
  modeText: { fontSize: 11, fontWeight: '600', color: '#333' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeOk: { backgroundColor: '#e8f5e9' },
  badgeWarn: { backgroundColor: '#fff3e0' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#333' },
});
