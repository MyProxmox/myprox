import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, RefreshControl, Animated, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useServerStore } from '../store/serverStore';
import { Server } from '../api/servers';
import { REFRESH_INTERVAL_MS } from '../utils/constants';
import { useTheme } from '../utils/theme';
import { t } from '../utils/i18n';

const AnimatedServerCard = ({
  server, index, onPress, onLongPress, isOffline, colors,
}: {
  server: Server;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
  isOffline: boolean;
  colors: ReturnType<typeof useTheme>;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 14, bounciness: 4, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const modeIconName = server.mode === 'cloud' ? 'cloud-outline' : 'home-outline';
  const modeColor = server.mode === 'cloud' ? colors.accent : colors.success;
  const modeLabel = server.mode === 'cloud' ? t('dashboard_mode_cloud') : t('dashboard_mode_local');
  const typeIconName = server.server_type === 'pbs' ? 'archive-outline' : 'desktop-outline';
  const typeLabel = server.server_type === 'pbs' ? 'PBS' : 'PVE';
  const typeColor = server.server_type === 'pbs' ? '#8B5CF6' : colors.textTertiary;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={[styles.modeIcon, { backgroundColor: modeColor + '20' }]}>
            <Ionicons name={modeIconName as any} size={22} color={modeColor} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]}>{server.name}</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{server.local_ip}</Text>
          </View>
          <View style={styles.badges}>
            {isOffline && (
              <View style={[styles.offlineBadge, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.offlineText, { color: colors.error }]}>Hors-ligne</Text>
              </View>
            )}
            <View style={[
              styles.verifiedBadge,
              { backgroundColor: server.verified ? colors.success + '20' : colors.warning + '20' },
            ]}>
              <Ionicons
                name={server.verified ? 'checkmark' : 'alert'}
                size={14}
                color={server.verified ? colors.success : colors.warning}
              />
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name={modeIconName as any} size={12} color={modeColor} />
              <Text style={[styles.modePill, { color: modeColor }]}>{modeLabel}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name={typeIconName as any} size={12} color={typeColor} />
              <Text style={[styles.typePill, { color: typeColor }]}>{typeLabel}</Text>
            </View>
          </View>
          {server.last_sync && (
            <Text style={[styles.syncText, { color: colors.textTertiary }]}>
              Sync {new Date(server.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const DashboardScreen = ({ navigation }: any) => {
  const { servers, loading, offlineServers, fetchServers, checkOnlineStatus, deleteServer } = useServerStore();
  const colors = useTheme();

  const screenOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    fetchServers().then(() => checkOnlineStatus());
    const interval = setInterval(() => {
      fetchServers();
      checkOnlineStatus();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleLongPress = useCallback((server: Server) => {
    Alert.alert(
      server.name,
      server.local_ip,
      [
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Supprimer ce serveur ?',
              `"${server.name}" sera retiré de l'application. Vos VMs ne seront pas affectées.`,
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: () => deleteServer(server.id),
                },
              ]
            ),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  }, [deleteServer]);

  const verifiedCount = servers.filter((s) => s.verified).length;
  const offlineCount = offlineServers.size;

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity, backgroundColor: colors.background }]}>
      <SafeAreaView>
        <View style={[styles.customHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.customHeaderTitle, { color: colors.text }]}>{t('dashboard_title')}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('OnboardingScreen')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.5}
            style={styles.addIconBtn}
          >
            <Ionicons name="add" size={30} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {servers.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="desktop-outline" size={56} color={colors.textTertiary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('dashboard_empty_title')}</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('dashboard_empty_sub')}</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('OnboardingScreen')}
          >
            <Text style={styles.addButtonText}>{t('dashboard_add')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              {servers.length} {servers.length > 1 ? t('dashboard_servers') : t('dashboard_server')}
            </Text>
            {offlineCount > 0 ? (
              <Text style={[styles.summaryText, { color: colors.error, fontWeight: '700' }]}>
                {offlineCount} hors-ligne
              </Text>
            ) : (
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {verifiedCount} {verifiedCount > 1 ? t('dashboard_verified_plural') : t('dashboard_verified')}
              </Text>
            )}
          </View>
          <FlatList
            data={servers}
            keyExtractor={(item: Server) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedServerCard
                server={item}
                index={index}
                colors={colors}
                isOffline={offlineServers.has(item.id)}
                onPress={() => navigation.navigate('VMListScreen', { serverId: item.id, serverName: item.name })}
                onLongPress={() => handleLongPress(item)}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => { fetchServers(); checkOnlineStatus(); }}
                tintColor={colors.accent}
              />
            }
          />
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  customHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  customHeaderTitle: { fontSize: 22, fontWeight: '700', letterSpacing: 0.2 },
  addIconBtn: { padding: 2 },
  summaryBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1,
  },
  summaryText: { fontSize: 13, fontWeight: '500' },
  list: { padding: 16 },
  card: {
    marginBottom: 14, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, borderWidth: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },

  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 13 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offlineBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  offlineText: { fontSize: 11, fontWeight: '700' },
  verifiedBadge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modePill: { fontSize: 12, fontWeight: '600' },
  typePill: { fontSize: 12, fontWeight: '600' },
  syncText: { fontSize: 11 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 15, marginBottom: 32, textAlign: 'center' },
  addButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
