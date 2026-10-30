import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, PrimaryButton, Screen, Title } from '../ui/primitives';
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={[styles.status, escaped ? styles.win : styles.lose]}>
            {escaped ? 'ESCAPED' : 'TIME\'S UP'}
          </Text>
          <Title>{escaped ? 'The study yields' : 'The room holds you still'}</Title>
          <Body muted>
            {escaped
              ? `Hints used: ${hintsUsed}. Compare notes — debrief out loud.`
              : 'You can ask the GM to extend time or reset for another try.'}
          </Body>
        </View>
        <PrimaryButton label="Back to home" onPress={onHome} />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: space.lg, justifyContent: 'space-between' },
  center: { gap: space.md, marginTop: space.xxl },
  status: {
    fontFamily: F.mono,
    fontSize: 14,
    letterSpacing: 3,
  },
  win: { color: playerTheme.success },
  lose: { color: playerTheme.danger },
});
