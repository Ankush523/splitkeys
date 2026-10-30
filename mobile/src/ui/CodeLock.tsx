import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { F, playerTheme, radius, space } from '../theme/tokens';
import { GhostButton, PrimaryButton } from './primitives';

export function CodeLock({
  label,
  disabled,
  rejectToken,
  onSubmit,
}: {
  label: string;
  disabled?: boolean;
  /** Increment to play a wrong-code shake. */
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
      style={[
        styles.box,
        {
          transform: [
            {
              translateX: shake.interpolate({
                inputRange: [-1, 1],
                outputRange: [-8, 8],
              }),
            },
          ],
        },
      ]}
    >
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
        <GhostButton
          label="Clear"
          onPress={() => setCode('')}
        />
        <PrimaryButton
          label="Try lock"
          disabled={disabled || !code.trim()}
          onPress={() => onSubmit(code.trim())}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: playerTheme.bgElevated,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: playerTheme.line,
    padding: space.md,
    gap: space.md,
  },
  label: {
    fontFamily: F.semibold,
    fontSize: 16,
    color: playerTheme.text,
  },
  input: {
    fontFamily: F.mono,
    fontSize: 22,
    letterSpacing: 4,
    color: playerTheme.text,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: playerTheme.bg,
    borderWidth: 1,
    borderColor: playerTheme.line,
    minHeight: 48,
  },
  row: { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
});
