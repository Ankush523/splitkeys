import { StyleSheet, Text, View } from 'react-native';
import type { StoryPack } from '../../../engine/pack';
import { GlassPanel } from './GlassPanel';
import { PressableScale } from './PressableScale';
import { F, playerTheme, space } from '../theme/tokens';

export function StoryPoster({
  pack,
  selected,
  onPress,
}: {
  pack: StoryPack;
  selected: boolean;
  onPress: () => void;
}) {
  const accent = pack.meta.accent || playerTheme.accent;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.wrap}
    >
      <GlassPanel
        tone="player"
        blur={selected ? 22 : 14}
        contentStyle={styles.poster}
        style={selected ? styles.selected : undefined}
      >
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <Text style={styles.title}>{pack.meta.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{pack.meta.durationMinutes} min</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>
            {pack.meta.minSeats}–{pack.meta.maxSeats} players
          </Text>
        </View>
        <Text style={styles.difficulty}>{pack.meta.difficulty}</Text>
        {selected ? <Text style={styles.selectedTag}>Selected</Text> : null}
      </GlassPanel>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  poster: {
    minHeight: 120,
    gap: space.sm,
  },
  selected: {
    borderColor: playerTheme.accentSoft,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.95,
  },
  title: {
    fontFamily: F.semibold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: playerTheme.text,
    marginTop: space.xs,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: {
    fontFamily: F.regular,
    fontSize: 13,
    color: playerTheme.muted,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: playerTheme.dim,
  },
  difficulty: {
    fontFamily: F.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: playerTheme.dim,
  },
  selectedTag: {
    fontFamily: F.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: playerTheme.accentBright,
    marginTop: 4,
  },
});
