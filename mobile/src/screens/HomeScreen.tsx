import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StoryPack } from '../../../engine/pack';
import { getDefaultPack, getStoryPacks, type PackCatalog } from '../content/packs';
import {
  Body,
  Card,
  Eyebrow,
  GhostButton,
  LogoMark,
  PrimaryButton,
  Screen,
  SectionHeader,
  Title,
} from '../ui/primitives';
import { StoryPoster } from '../ui/StoryPoster';
import { F, playerTheme, radius, space } from '../theme/tokens';

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
        <ScrollView
          contentContainerStyle={styles.homeScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LogoMark large />
          <View style={styles.hero}>
            <Eyebrow>Private clues · real voices</Eyebrow>
            <Title>Every phone holds a different piece of the room.</Title>
            <Body muted>
              Host the story on one device. Everyone else joins nearby — no Wi‑Fi, no spoilers in chat.
            </Body>
          </View>

          {catalog.error ? <Text style={styles.error}>Story packs: {catalog.error}</Text> : null}

          <Card>
            <SectionHeader title="Your name" />
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="How the table knows you"
              placeholderTextColor={playerTheme.dim}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </Card>

          <SectionHeader title="Story for tonight" />
          <View style={styles.packRow}>
            {packs.map(p => (
              <StoryPoster
                key={p.meta.id}
                pack={p}
                selected={packId === p.meta.id}
                onPress={() => setPackId(p.meta.id)}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Host as game master" onPress={() => onHost(pack)} />
            <GhostButton label="Join a nearby room" onPress={onJoin} />
          </View>

          <Text style={styles.footerNote}>
            Two phones? After hosting, take a seat on the GM phone and join from the second device.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  home: { flex: 1, paddingHorizontal: space.lg },
  homeScroll: { gap: space.lg, paddingBottom: space.xxl },
  hero: { gap: space.sm, marginTop: space.md },
  input: {
    fontFamily: F.regular,
    fontSize: 17,
    color: playerTheme.text,
    borderWidth: 1,
    borderColor: playerTheme.glassStroke,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    minHeight: 52,
  },
  packRow: { gap: space.md },
  actions: { gap: space.sm, marginTop: space.sm },
  footerNote: {
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 18,
    color: playerTheme.muted,
    textAlign: 'center',
    paddingHorizontal: space.md,
  },
  error: { color: playerTheme.danger, fontFamily: F.regular },
});
