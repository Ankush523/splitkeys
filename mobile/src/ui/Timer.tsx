import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { F, playerTheme, radius, type Tone, themeOf } from '../theme/tokens';

function formatMs(ms: number | null): string {
  if (ms === null) return '—:—';
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Tint-only chip — avoids nested blur beside headers. */
export function TimerBar({
  msLeft,
  urgentAtMs = 5 * 60 * 1000,
  tone = 'player',
}: {
  msLeft: number | null;
  urgentAtMs?: number;
  tone?: Tone;
}) {
  const c = themeOf(tone);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (msLeft === null) return;
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [msLeft]);

  const urgent = msLeft !== null && msLeft <= urgentAtMs;
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: c.glassFill,
          borderColor: urgent ? 'rgba(255, 123, 123, 0.4)' : c.glassStroke,
        },
      ]}
    >
      <Text style={[styles.caption, { color: c.muted }]}>Time</Text>
      <Text
        style={[styles.label, { color: urgent ? playerTheme.danger : c.text }]}
        accessibilityLabel="Time remaining"
      >
        {formatMs(msLeft)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'flex-end',
    minWidth: 72,
    flexShrink: 0,
  },
  caption: {
    fontFamily: F.medium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  label: {
    fontFamily: F.mono,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
});
