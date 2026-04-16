import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, RefreshControl, Animated, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useServerStore } from '../store/serverStore';
import { Server } from '../api/servers';
import { REFRESH_INTERVAL_MS } from '../utils/constants';
import { useTheme } from '../utils/theme';
import { t } from '../utils/i18n';

// Animated server card wrapper
const AnimatedServerCard = ({
  server, index, onPress, colors,
}: { server: Server; index: number; onPress: () => void; colors: ReturnType<typeof useTheme> }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 350,
        delay: index * 80, useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0, speed: 14, bounciness: 4,
        delay: index * 80, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const modeIcon = server.mode === 'cloud' ? '☁' : '⌂';
  const modeColor = server.mode === 'cloud' ? colors.accent : colors.success;
  const modeLabel = server.mode === 'cloud' ? t('dashboard_mode_cloud') : t('dashboard_mode_local');

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={[styles.modeIcon, { backgroundColor: modeColor + '20' }]}>
            <Text style={[styles.modeEmoji, { color: modeColor }]}>{modeIcon}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]}>{server.name}</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{server.local_ip}</Text>
          </View>
          <View style={[
            styles.verifiedBadge,
            { backgroundColor: server.verified ? colors.success + '20' : colors.warning + '20' },
          ]}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: server.verified ? colors.success : colors.warning }}>
              {server.verified ? '✓' : '!'}
            </Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={[styles.modePill, { color: modeColor }]}>{modeLabel}</Text>
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
  const { servers, loading, fetchServers } = useServerStore();
  const colors = useTheme();

  const screenOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(screenOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const verifiedCount = servers.filter((s) => s.verified).length;

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity, backgroundColor: colors.background }]}>
      {/* ── Custom header (no native bubble) ── */}
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
          <Text style={styles.emptyIcon}>🖥️</Text>
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
          {/* Summary bar */}
          {servers.length > 0 && (
            <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {servers.length} {servers.length > 1 ? t('dashboard_servers') : t('dashboard_server')}
              </Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {verifiedCount} {verifiedCount > 1 ? t('dashboard_verified_plural') : t('dashboard_verified')}
              </Text>
            </View>
          )}
          <FlatList
            data={servers}
            keyExtractor={(item: Server) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedServerCard
                server={item}
                index={index}
                colors={colors}
                onPress={() => navigation.navigate('VMListScreen', {
                  serverId: item.id,
                  serverName: item.name,
                })}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchServers}
                tintColor={colors.accent}
              />
            }
          />
          {/* FAB removed — "+" is now in the NavigationHeader (see RootNavigator) */}
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  customHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  addIconBtn: {
    // No background, no border — pure icon
    padding: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  summaryText: { fontSize: 13, fontWeight: '500' },
  list: { padding: 16 },
  card: {
    marginBottom: 14,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modeIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  modeEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 13 },
  verifiedBadge: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modePill: { fontSize: 12, fontWeight: '600' },
  syncText: { fontSize: 11 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 15, marginBottom: 32, textAlign: 'center' },
  addButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
