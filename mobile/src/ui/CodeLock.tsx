import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { GlassPanel } from './GlassPanel';
import { GhostButton, PrimaryButton } from './primitives';
import { F, playerTheme, radius, space } from '../theme/tokens';

export function CodeLock({
  label,
  disabled,
  rejectToken,
  onSubmit,
}: {
  label: string;
  disabled?: boolean;
  rejectToken?: number;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState('');
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!rejectToken) return;
    ReactNativeHapticFeedback.trigger('notificationError');
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [rejectToken, shake]);

  return (
    <Animated.View
      style={{
        alignSelf: 'stretch',
        transform: [
          {
            translateX: shake.interpolate({
              inputRange: [-1, 1],
              outputRange: [-8, 8],
            }),
          },
        ],
      }}
    >
      <GlassPanel tone="player" blur={16} contentStyle={styles.box}>
        <Text style={styles.kicker}>Lock</Text>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          accessibilityLabel={`Code for ${label}`}
          editable={!disabled}
          value={code}
          onChangeText={setCode}
          placeholder="Enter code"
          placeholderTextColor={playerTheme.dim}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        <View style={styles.row}>
          <GhostButton label="Clear" compact onPress={() => setCode('')} />
          <View style={styles.primarySlot}>
            <PrimaryButton
              label="Try lock"
              disabled={disabled || !code.trim()}
              onPress={() => onSubmit(code.trim())}
            />
          </View>
        </View>
      </GlassPanel>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.sm },
  kicker: {
    fontFamily: F.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: playerTheme.accentBright,
  },
  label: {
    fontFamily: F.semibold,
    fontSize: 18,
    color: playerTheme.text,
  },
  input: {
    fontFamily: F.mono,
    fontSize: 22,
    letterSpacing: 4,
    textAlign: 'center',
    color: playerTheme.text,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: playerTheme.glassStroke,
    minHeight: 52,
  },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'stretch' },
  primarySlot: { flex: 1, minWidth: 0 },
});
