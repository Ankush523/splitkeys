import { memo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { F, gmTheme, playerTheme, radius, space } from '../theme/tokens';

type Tone = 'player' | 'gm';

const themeOf = (tone: Tone) => (tone === 'player' ? playerTheme : gmTheme);

export const Title = memo(function Title({
  children,
  tone = 'player',
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const c = themeOf(tone);
  return <Text style={[styles.title, { color: c.text }]}>{children}</Text>;
});

export const Body = memo(function Body({
  children,
  tone = 'player',
  muted,
}: {
  children: ReactNode;
  tone?: Tone;
  muted?: boolean;
}) {
  const c = themeOf(tone);
  return (
    <Text style={[styles.body, { color: muted ? c.muted : c.text }]}>{children}</Text>
  );
});

export function Screen({
  tone = 'player',
  children,
  style,
}: {
  tone?: Tone;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const c = themeOf(tone);
  return <View style={[styles.screen, { backgroundColor: c.bg }, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  tone = 'player',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  loading?: boolean;
}) {
  const c = themeOf(tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: c.accent,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.accentInk} />
      ) : (
        <Text style={[styles.btnLabel, { color: c.accentInk }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  tone = 'player',
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
}) {
  const c = themeOf(tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghost,
        { borderColor: c.line, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[styles.ghostLabel, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  tone = 'player',
  onPress,
}: {
  label: string;
  active?: boolean;
  tone?: Tone;
  onPress?: () => void;
}) {
  const c = themeOf(tone);
  const inner = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: active ? c.accentSoft : c.bgElevated,
          borderColor: active ? c.accent : c.line,
        },
      ]}
    >
      <Text style={[styles.chipLabel, { color: active ? c.accent : c.muted }]}>{label}</Text>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {inner}
    </Pressable>
  );
}

export function Divider({ tone = 'player' }: { tone?: Tone }) {
  const c = themeOf(tone);
  return <View style={[styles.divider, { backgroundColor: c.line }]} />;
}

export function LogoMark({ tone = 'player' }: { tone?: Tone }) {
  const c = themeOf(tone);
  return (
    <View style={styles.logoRow}>
      <View style={[styles.logoKey, { borderColor: c.accent }]}>
        <View style={[styles.logoTeeth, { backgroundColor: c.accent }]} />
      </View>
      <Text style={[styles.logoText, { color: c.text }]}>Split Keys</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: {
    fontFamily: F.semibold,
    fontSize: 28,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  body: {
    fontFamily: F.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  btn: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  btnLabel: {
    fontFamily: F.semibold,
    fontSize: 16,
  },
  ghost: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  ghostLabel: { fontFamily: F.medium, fontSize: 15 },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipLabel: { fontFamily: F.medium, fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoKey: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTeeth: { width: 10, height: 10, borderRadius: 2 },
  logoText: { fontFamily: F.semibold, fontSize: 22, letterSpacing: -0.5 },
});
