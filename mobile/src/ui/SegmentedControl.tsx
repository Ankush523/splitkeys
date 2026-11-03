import { StyleSheet, Text } from 'react-native';
import { GlassPanel } from './GlassPanel';
import { PressableScale } from './PressableScale';
import { F, radius, space, themeOf, type Tone } from '../theme/tokens';

export function SegmentedControl<T extends string>({
  tone = 'player',
  options,
  value,
  onChange,
}: {
  tone?: Tone;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const c = themeOf(tone);
  return (
    <GlassPanel tone={tone} radius={radius.pill} blur={12} padded={false} contentStyle={styles.track}>
      {options.map(opt => {
        const active = opt.id === value;
        return (
          <PressableScale
            key={opt.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            haptic={false}
            onPress={() => onChange(opt.id)}
            style={[styles.segment, active && { backgroundColor: c.accentSoft }]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? c.accentBright : c.muted },
                active && styles.labelActive,
              ]}
            >
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  label: {
    fontFamily: F.medium,
    fontSize: 13,
  },
  labelActive: {
    fontFamily: F.semibold,
  },
});
