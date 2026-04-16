import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onStartTrial: () => void;
}

const PERKS = [
  { icon: 'infinite-outline',       text: 'Unlimited local & cloud servers' },
  { icon: 'cloud-outline',          text: 'Cloud relay access from anywhere' },
  { icon: 'shield-checkmark-outline', text: 'AES-256 encrypted tunnel' },
  { icon: 'flash-outline',          text: 'Real-time CPU & RAM monitoring' },
  { icon: 'headset-outline',        text: 'Priority support' },
];

export const TrialModal = ({ visible, onClose, onStartTrial }: Props) => {
  const colors = useTheme();
  const translateY = useRef(new Animated.Value(400)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity,     { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY,  { toValue: 0, speed: 14, bounciness: 5, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity,     { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY,  { toValue: 400, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#7C3AED20' }]}>
            <Text style={styles.iconEmoji}>⚡</Text>
          </View>
        </View>

        <Text style={[styles.headline, { color: colors.text }]}>
          You've reached your{'\n'}
          <Text style={styles.gradText}>free plan limit</Text>
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Unlock unlimited servers and all premium features with a{' '}
          <Text style={{ fontWeight: '700', color: colors.text }}>14-day free trial</Text>.
          {'\n'}No credit card required.
        </Text>

        {/* Perks */}
        <View style={[styles.perksBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          {PERKS.map((p, i) => (
            <View
              key={i}
              style={[
                styles.perkRow,
                i < PERKS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.perkIconWrap, { backgroundColor: '#7C3AED15' }]}>
                <Ionicons name={p.icon as any} size={16} color="#7C3AED" />
              </View>
              <Text style={[styles.perkText, { color: colors.text }]}>{p.text}</Text>
              <Ionicons name="checkmark" size={16} color={colors.success} />
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.trialBtn} onPress={onStartTrial} activeOpacity={0.85}>
          <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.trialBtnText}>Start my 14-day free trial</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.textTertiary }]}>
          Then €4.99/month · Cancel anytime
        </Text>
      </Animated.View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 20,
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  headerRow: { alignItems: 'center', marginBottom: 16 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  iconEmoji: { fontSize: 32 },
  headline: {
    fontSize: 24, fontWeight: '800', textAlign: 'center',
    lineHeight: 32, marginBottom: 10,
  },
  gradText: { color: '#7C3AED' },
  sub: {
    fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20,
  },
  perksBox: {
    borderRadius: 14, borderWidth: 1,
    overflow: 'hidden', marginBottom: 22,
  },
  perkRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 14, gap: 10,
  },
  perkIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  perkText: { flex: 1, fontSize: 13, fontWeight: '500' },
  trialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  trialBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 14 },
});
