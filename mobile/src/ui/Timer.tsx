import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { F, playerTheme } from '../theme/tokens';

function formatMs(ms: number | null): string {
  if (ms === null) return '—:—';
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TimerBar({ msLeft, urgentAtMs = 5 * 60 * 1000 }: { msLeft: number | null; urgentAtMs?: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (msLeft === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [msLeft]);

  const urgent = msLeft !== null && msLeft <= urgentAtMs;
  return (
    <View style={[styles.wrap, urgent && styles.urgentWrap]}>
      <Text style={[styles.label, urgent && styles.urgent]} accessibilityLabel="Time remaining">
        {formatMs(msLeft)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: playerTheme.bgElevated,
  },
  urgentWrap: { backgroundColor: 'rgba(212, 92, 92, 0.15)' },
  label: {
    fontFamily: F.mono,
    fontSize: 18,
    color: playerTheme.text,
    fontVariant: ['tabular-nums'],
  },
  urgent: { color: playerTheme.danger },
});
