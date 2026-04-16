import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../utils/theme';
import { t } from '../utils/i18n';

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();
  const colors = useTheme();

  // FadeIn + SlideUp animation on mount
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(32)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert(t('error_title'), t('auth_error_fields'));
      return;
    }
    try {
      setLoading(true);
      if (isSignUp) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || t('error_generic');
      Alert.alert(t('error_title'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.inner, { opacity, transform: [{ translateY }] }]}>
        <Text style={[styles.logo, { color: colors.accent }]}>MyProx</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('auth_tagline')}</Text>

        <TextInput
          style={[styles.input, {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border,
          }]}
          placeholder={t('auth_email')}
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={[styles.input, {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border,
          }]}
          placeholder={t('auth_password')}
          placeholderTextColor={colors.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isSignUp ? t('auth_register') : t('auth_login')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} disabled={loading}>
          <Text style={[styles.toggleText, { color: colors.accent }]}>
            {isSignUp ? t('auth_switch_login') : t('auth_switch_register')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 40 },
  input: {
    borderWidth: 1, padding: 14,
    marginBottom: 16, borderRadius: 10, fontSize: 16,
  },
  button: { padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggleText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
});
