import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, Text,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useServerStore } from '../store/serverStore';
import { useTheme } from '../utils/theme';
import { t } from '../utils/i18n';
import { TrialModal } from '../components/TrialModal';

// HTTP status codes / error keywords that indicate a plan limit hit
const isPlanLimitError = (error: any): boolean => {
  const status = error?.response?.status;
  const msg: string = (error?.response?.data?.error || error?.message || '').toLowerCase();
  return status === 403 || msg.includes('limit') || msg.includes('plan') || msg.includes('quota');
};

export const OnboardingScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [username, setUsername] = useState('root@pam');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'local' | 'cloud'>('local');
  const [loading, setLoading] = useState(false);
  const [showTrial, setShowTrial] = useState(false);

  const { addServer } = useServerStore();
  const colors = useTheme();

  const handleAddServer = async () => {
    if (!name || !ip || !username || !password) {
      Alert.alert(t('error_title'), t('auth_error_fields'));
      return;
    }

    try {
      setLoading(true);
      const agentToken = await addServer(name, ip, username, password, mode);

      if (mode === 'cloud' && agentToken) {
        Alert.alert(
          'Server added — Cloud mode',
          `Copy this token and configure your local agent:\n\n${agentToken}`,
          [
            {
              text: 'Copy token',
              onPress: async () => {
                await Clipboard.setStringAsync(agentToken);
                navigation.goBack();
              },
            },
            { text: 'OK', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        Alert.alert(t('success_title'), 'Server added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      if (isPlanLimitError(error)) {
        // Show trial upsell instead of generic error
        setShowTrial(true);
      } else {
        const msg = error.response?.data?.error || error.message || 'Could not add server';
        Alert.alert(t('error_title'), msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = () => {
    setShowTrial(false);
    // Open Stripe checkout — deeplink back after payment
    Linking.openURL('https://api.myprox.app/api/v1/stripe/checkout').catch(() => {
      Alert.alert('Premium', 'Unable to open payment page. Please try again from Settings.');
    });
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>{t('onboarding_title')}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {mode === 'local'
              ? 'Direct connection on your local network.'
              : 'Remote access via MyProx relay. Requires the local agent.'}
          </Text>

          {/* Mode selector */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Connection mode</Text>
          <View style={[styles.modeRow, { borderColor: colors.accent }]}>
            {(['local', 'cloud'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.modeBtn,
                  { backgroundColor: mode === m ? colors.accent : colors.surface },
                ]}
                onPress={() => setMode(m)}
              >
                <Text style={[
                  styles.modeBtnText,
                  { color: mode === m ? '#fff' : colors.accent },
                ]}>
                  {m === 'local' ? t('onboarding_mode_local') : t('onboarding_mode_cloud')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          {[
            { label: t('onboarding_name'),     value: name,     setter: setName,     placeholder: 'HomeServer', kb: 'default' },
            { label: t('onboarding_ip'),       value: ip,       setter: setIp,       placeholder: '192.168.1.100', kb: 'numeric' },
            { label: t('onboarding_user'),     value: username, setter: setUsername, placeholder: 'root@pam', kb: 'default' },
          ].map((field) => (
            <React.Fragment key={field.label}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{field.label}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textTertiary}
                value={field.value}
                onChangeText={field.setter}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={field.kb as any}
                editable={!loading}
              />
            </React.Fragment>
          ))}

          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('onboarding_password')}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            placeholder={t('onboarding_password')}
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
            onPress={handleAddServer}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.buttonText}>{t('onboarding_adding')}</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{t('onboarding_add')}</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Connection will be tested before saving
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Plan limit upsell modal */}
      <TrialModal
        visible={showTrial}
        onClose={() => setShowTrial(false)}
        onStartTrial={handleStartTrial}
      />
    </>
  );
};

const styles = StyleSheet.create({
  content:      { padding: 24 },
  title:        { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  description:  { fontSize: 14, marginBottom: 28 },
  label:        { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1, padding: 14, marginBottom: 18,
    borderRadius: 10, fontSize: 16,
  },
  modeRow: {
    flexDirection: 'row', marginBottom: 20, borderRadius: 10,
    overflow: 'hidden', borderWidth: 1,
  },
  modeBtn:     { flex: 1, paddingVertical: 11, alignItems: 'center' },
  modeBtnText: { fontSize: 15, fontWeight: '600' },
  button:      { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint:        { textAlign: 'center', marginTop: 16, fontSize: 12 },
});
