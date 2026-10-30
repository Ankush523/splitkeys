import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StoryPack } from '../../../engine/pack';
import { getDefaultPack, getStoryPacks, type PackCatalog } from '../content/packs';
import { Body, GhostButton, LogoMark, PrimaryButton, Screen, Title } from '../ui/primitives';
import { F, playerTheme, space } from '../theme/tokens';

type Props = {
  name: string;
  setName: (n: string) => void;
  catalog: PackCatalog;
  onHost: (pack: StoryPack) => void;
  onJoin: () => void;
};

export function HomeScreen({ name, setName, catalog, onHost, onJoin }: Props) {
  const packs = catalog.packs.length ? catalog.packs : [getDefaultPack()];
  const [packId, setPackId] = useState(getDefaultPack().meta.id);
  const pack = useMemo(() => packs.find(p => p.meta.id === packId) ?? packs[0], [packId, packs]);

  return (
    <Screen tone="player">
      <SafeAreaView style={styles.home} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.homeScroll} keyboardShouldPersistTaps="handled">
          <LogoMark />
          <Title>Escape room night, no Wi‑Fi</Title>
          <Body muted>
            One phone runs the room. Everyone else gets private clues. Talk in real life — phones stay in character.
          </Body>

          {catalog.error ? <Text style={styles.error}>Story packs: {catalog.error}</Text> : null}

          <Text style={styles.label}>Your name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={playerTheme.dim}
          />

          <Text style={styles.label}>Story pack (GM)</Text>
          <View style={styles.packRow}>
            {packs.map(p => (
              <Pressable
                key={p.meta.id}
                onPress={() => setPackId(p.meta.id)}
                style={[
                  styles.poster,
                  packId === p.meta.id && styles.posterActive,
                  { borderColor: p.meta.accent },
                ]}
              >
                <Text style={[styles.posterTitle, { color: p.meta.accent }]}>{p.meta.title}</Text>
                <Text style={styles.posterMeta}>
                  {p.meta.durationMinutes} min · {p.meta.minSeats}–{p.meta.maxSeats} players
                </Text>
              </Pressable>
            ))}
          </View>

          <PrimaryButton label="Host as GM" onPress={() => onHost(pack)} />
          <GhostButton label="Join nearby room" onPress={onJoin} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  home: { flex: 1, paddingHorizontal: space.lg },
  homeScroll: { gap: space.md, paddingBottom: space.xxl },
  label: {
    fontFamily: F.medium,
    fontSize: 13,
    color: playerTheme.muted,
    marginTop: space.sm,
  },
  input: {
    fontFamily: F.regular,
    fontSize: 16,
    color: playerTheme.text,
    borderWidth: 1,
    borderColor: playerTheme.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: playerTheme.bgElevated,
    minHeight: 48,
  },
  packRow: { gap: space.sm },
  poster: {
    borderWidth: 1,
    borderRadius: 14,
    padding: space.md,
    backgroundColor: playerTheme.bgElevated,
  },
  posterActive: { backgroundColor: 'rgba(201,162,39,0.08)' },
  posterTitle: { fontFamily: F.semibold, fontSize: 18 },
  posterMeta: { fontFamily: F.regular, fontSize: 13, color: playerTheme.muted, marginTop: 4 },
  error: { color: playerTheme.danger, fontFamily: F.regular },
});
