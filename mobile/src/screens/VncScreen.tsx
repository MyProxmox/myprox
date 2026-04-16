import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { vmsApi } from '../api/vms';
import { useTheme } from '../utils/theme';
import { t } from '../utils/i18n';

export const VncScreen = ({ route, navigation }: any) => {
  const { serverId, node, vmid, type } = route.params;
  const colors = useTheme();
  const [loading, setLoading] = useState(true);
  const [authData, setAuthData] = useState<{ host: string; ticket: string; csrf: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        const { data } = await vmsApi.getVncTicket(serverId);
        if (mounted) setAuthData(data);
      } catch (err: any) {
        if (mounted) setError(err.response?.data?.error || 'Failed to initialize VNC console');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    setup();

    return () => {
      mounted = false;
      ScreenOrientation.unlockAsync();
    };
  }, [serverId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading') || 'Loading...'}</Text>
      </View>
    );
  }

  if (error || !authData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error || 'Unknown error'}</Text>
      </View>
    );
  }

  // Construct standard Proxmox NoVNC URL injected with ticket. 
  // URL format: ?console=[kvm|lxc]&novnc=1&node=[node]&vmid=[vmid]
  const consoleType = type === 'qemu' ? 'kvm' : 'lxc';
  const url = `https://${authData.host}:8006/?console=${consoleType}&novnc=1&node=${node}&vmid=${vmid}`;

  // We must inject the PVEAuthCookie into the webview before it navigates
  // We use injectedJavaScriptBeforeContentLoaded to set document.cookie
  const injectCookieScript = `
    document.cookie = "PVEAuthCookie=${authData.ticket}; path=/; secure";
    true;
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        injectedJavaScriptBeforeContentLoaded={injectCookieScript}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        setIgnoreSSLErrors={true} // Needed for typical unverified Proxmox self-signed certs
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorText: { fontSize: 16, textAlign: 'center' },
});
