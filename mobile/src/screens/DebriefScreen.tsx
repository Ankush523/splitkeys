import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Card, Eyebrow, PrimaryButton, Screen, Title } from '../ui/primitives';
import { F, playerTheme, space } from '../theme/tokens';

export function DebriefScreen({
  escaped,
  hintsUsed,
  onHome,
}: {
  escaped: boolean;
  hintsUsed: number;
  onHome: () => void;
}) {
  return (
    <Screen tone="player">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Eyebrow>{escaped ? 'Chapter closed' : 'Time expired'}</Eyebrow>
          <Text style={[styles.status, escaped ? styles.win : styles.lose]}>
            {escaped ? 'ESCAPED' : "TIME'S UP"}
          </Text>
          <Title>{escaped ? 'The room releases you' : 'The study keeps its secrets'}</Title>
          <Body muted>
            {escaped
              ? 'Compare notes out loud — the best debriefs happen without the phones.'
              : 'Ask your game master to extend time or run the room again.'}
          </Body>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Hints used</Text>
            <Text style={styles.statValue}>{hintsUsed}</Text>
          </Card>
        </View>
        <PrimaryButton label="Return home" onPress={onHome} />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: space.lg, justifyContent: 'space-between' },
  center: { gap: space.md, marginTop: space.xxl, alignItems: 'flex-start' },
  status: {
    fontFamily: F.mono,
    fontSize: 13,
    letterSpacing: 4,
    marginTop: space.sm,
  },
  win: { color: playerTheme.success },
  lose: { color: playerTheme.danger },
  statCard: { width: '100%', marginTop: space.lg, alignItems: 'center' },
  statLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: playerTheme.muted,
  },
  statValue: {
    fontFamily: F.mono,
    fontSize: 36,
    color: playerTheme.text,
    marginTop: 4,
  },
});
