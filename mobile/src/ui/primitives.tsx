import { memo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { GameBackdrop } from './GameBackdrop';
import { GlassPanel } from './GlassPanel';
import { IconKeyMark } from './icons';
import { PressableScale } from './PressableScale';
import {
  F,
  glowAccent,
  radius,
  space,
  themeOf,
  type,
  type Tone,
} from '../theme/tokens';

export const Title = memo(function Title({
  children,
  tone = 'player',
  size = 'title',
}: {
  children: ReactNode;
  tone?: Tone;
  size?: 'display' | 'title';
}) {
  const c = themeOf(tone);
  const t = size === 'display' ? type.display : type.title;
  return <Text style={[t, { color: c.text }]}>{children}</Text>;
});

export const Eyebrow = memo(function Eyebrow({
  children,
  tone = 'player',
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const c = themeOf(tone);
  return <Text style={[type.overline, { color: c.accentBright }]}>{children}</Text>;
});

export const Body = memo(function Body({
  children,
  tone = 'player',
  muted,
  small,
}: {
  children: ReactNode;
  tone?: Tone;
  muted?: boolean;
  small?: boolean;
}) {
  const c = themeOf(tone);
  return (
    <Text
      style={[
        small ? type.caption : type.body,
        { color: muted ? c.muted : c.text },
      ]}
    >
      {children}
    </Text>
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
  return (
    <GameBackdrop tone={tone}>
      <View style={[styles.screen, style]}>{children}</View>
    </GameBackdrop>
  );
}

export function Card({
  tone = 'player',
  children,
  style,
}: {
  tone?: Tone;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <GlassPanel tone={tone} style={[styles.cardLift, style]} contentStyle={styles.cardBody}>
      {children}
    </GlassPanel>
  );
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
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      haptic={!disabled}
      onPress={onPress}
      style={[
        styles.btn,
        glowAccent(tone),
        {
          backgroundColor: c.accent,
          opacity: disabled ? 0.38 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.accentInk} />
      ) : (
        <Text style={[styles.btnLabel, { color: c.accentInk }]}>{label}</Text>
      )}
    </PressableScale>
  );
}

export function GhostButton({
  label,
  onPress,
  tone = 'player',
  compact,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  compact?: boolean;
}) {
  const c = themeOf(tone);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.btnBlock}
    >
      <View
        style={[
          compact ? styles.ghostCompact : styles.ghost,
          {
            borderColor: c.glassStroke,
            backgroundColor: c.glassFill,
          },
        ]}
      >
        <Text style={[styles.ghostLabel, { color: c.text }]}>{label}</Text>
      </View>
    </PressableScale>
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
          backgroundColor: active ? c.accentSoft : c.glassFill,
          borderColor: active ? c.accentBright : c.glassStroke,
        },
      ]}
    >
      <Text style={[styles.chipLabel, { color: active ? c.accentBright : c.muted }]}>
        {label}
      </Text>
    </View>
  );
  if (!onPress) return inner;
  return (
    <PressableScale accessibilityRole="button" onPress={onPress} haptic={false}>
      {inner}
    </PressableScale>
  );
}

export function Divider({ tone = 'player' }: { tone?: Tone }) {
  const c = themeOf(tone);
  return <View style={[styles.divider, { backgroundColor: c.lineSoft }]} />;
}

export function LogoMark({ tone = 'player', large }: { tone?: Tone; large?: boolean }) {
  const c = themeOf(tone);
  return (
    <View style={styles.logoRow}>
      <View style={[styles.logoIcon, { borderColor: c.glassStroke, backgroundColor: c.glassFill }]}>
        <IconKeyMark size={large ? 32 : 26} color={c.accentBright} />
      </View>
      <View style={styles.logoTextCol}>
        <Text style={[type.overline, { color: c.muted }]}>Split Keys</Text>
        <Text
          style={[large ? type.headline : type.headline, { color: c.text }]}
          numberOfLines={2}
        >
          Offline escape
        </Text>
      </View>
    </View>
  );
}

export function SectionHeader({
  title,
  tone = 'player',
}: {
  title: string;
  tone?: Tone;
}) {
  const c = themeOf(tone);
  return (
    <Text style={[type.overline, styles.sectionHeader, { color: c.muted }]}>{title}</Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cardLift: { marginVertical: 2 },
  cardBody: { gap: space.sm },
  btnBlock: { alignSelf: 'stretch' },
  btn: {
    alignSelf: 'stretch',
    minHeight: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  btnLabel: {
    fontFamily: F.semibold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  ghost: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  ghostCompact: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  ghostLabel: { fontFamily: F.medium, fontSize: 15 },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipLabel: { fontFamily: F.medium, fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextCol: { flex: 1, flexShrink: 1 },
  sectionHeader: { marginBottom: space.xs },
});
