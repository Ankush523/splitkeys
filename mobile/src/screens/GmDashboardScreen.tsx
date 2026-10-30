import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GmView } from '../../../engine/runtime';
import type { Host } from '../../../engine/session';
import { Body, Chip, GhostButton, PrimaryButton, Screen, Title } from '../ui/primitives';
import { TimerBar } from '../ui/Timer';
import { F, gmTheme, space } from '../theme/tokens';

export function GmDashboardScreen({
  view,
  host,
  onClose,
  live,
}: {
  view: GmView;
  host: Host;
  onClose: () => void;
  live: boolean;
}) {
  return (
    <Screen tone="gm">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>GM · {view.packTitle}</Text>
            <Title tone="gm">{view.chapterTitle || 'Lobby'}</Title>
          </View>
          {live ? <TimerBar msLeft={view.timerMsLeft} /> : null}
        </View>

        {view.phase === 'lobby' ? (
          <View style={styles.block}>
            <Body tone="gm" muted>
              {view.seats.filter(Boolean).length} players connected. Need at least{' '}
              {host.pack.meta.minSeats} to open the room.
            </Body>
            <PrimaryButton tone="gm" label="Open briefing" onPress={() => host.start()} />
          </View>
        ) : null}
        {view.phase === 'briefing' ? (
          <View style={styles.block}>
            <Body tone="gm" muted>
              Players see the dossier. When everyone is ready in the room, start the clock.
            </Body>
            <PrimaryButton tone="gm" label="Start timer" onPress={() => host.beginPlay()} />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Puzzle checklist</Text>
          <View style={styles.checklist}>
            {view.checklist.map(item => (
              <View key={item.id} style={styles.checkRow}>
                <Chip tone="gm" label={item.solved ? 'Done' : 'Open'} active={item.solved} />
                <Text style={styles.checkLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Seats</Text>
          {view.seats.map(seat => (
            <View key={seat.seat} style={styles.seatCard}>
              <View style={styles.seatTop}>
                <Text style={styles.seatName}>{seat.name}</Text>
                <Text style={styles.seatRole}>{seat.roleName}</Text>
              </View>
              <Text style={styles.seatMeta}>
                {seat.connected ? 'In range' : 'Out of range'}
                {seat.stuck ? ' · struggling' : ''}
                {seat.hintsUsed ? ` · ${seat.hintsUsed} hints` : ''}
              </Text>
              {seat.hintRequested ? (
                <View style={styles.hintRow}>
                  <Body tone="gm">Hint requested for {seat.hintRequested}</Body>
                  <PrimaryButton
                    tone="gm"
                    label="Send hint"
                    onPress={() =>
                      host.sendHint(
                        seat.seat,
                        seat.hintRequested!,
                        'Hint',
                        'Look again at the evidence you already have — compare dates and names aloud.',
                      )
                    }
                  />
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <GhostButton tone="gm" label="End session" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: space.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingVertical: space.md,
  },
  kicker: {
    fontFamily: F.medium,
    fontSize: 12,
    color: gmTheme.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  block: { gap: space.md, marginBottom: space.lg },
  scroll: { paddingBottom: space.xxl, gap: space.md },
  sectionTitle: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: gmTheme.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.md,
  },
  checklist: { gap: space.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  checkLabel: { fontFamily: F.regular, fontSize: 16, color: gmTheme.text },
  seatCard: {
    backgroundColor: gmTheme.bgElevated,
    borderRadius: 12,
    padding: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: gmTheme.line,
    gap: space.sm,
  },
  seatTop: { flexDirection: 'row', justifyContent: 'space-between' },
  seatName: { fontFamily: F.semibold, fontSize: 16, color: gmTheme.text },
  seatRole: { fontFamily: F.regular, fontSize: 14, color: gmTheme.muted },
  seatMeta: { fontFamily: F.regular, fontSize: 13, color: gmTheme.dim },
  hintRow: { gap: space.sm, marginTop: space.sm },
  footer: { paddingVertical: space.sm },
});
