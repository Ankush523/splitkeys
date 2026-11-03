import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GmView } from '../../../engine/runtime';
import type { Host } from '../../../engine/session';
import {
  Body,
  Card,
  Chip,
  Eyebrow,
  GhostButton,
  PrimaryButton,
  Screen,
  SectionHeader,
  Title,
} from '../ui/primitives';
import { GlassPanel } from '../ui/GlassPanel';
import { TimerBar } from '../ui/Timer';
import { F, gmTheme, radius, space } from '../theme/tokens';

export function GmDashboardScreen({
  view,
  host,
  onClose,
  live,
  localSeatTaken,
  onClaimLocalSeat,
  onOpenLocalPlay,
  safeAreaEdges,
}: {
  view: GmView;
  host: Host;
  onClose: () => void;
  live: boolean;
  localSeatTaken: boolean;
  onClaimLocalSeat: () => void;
  onOpenLocalPlay?: () => void;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const seated = view.seats.filter(Boolean).length;
  const canOpen = seated >= host.pack.meta.minSeats;
  const edges = safeAreaEdges ?? ['top', 'bottom'];
  const solved = view.checklist.filter(c => c.solved).length;

  return (
    <Screen tone="gm">
      <SafeAreaView style={styles.safe} edges={edges}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Eyebrow tone="gm">Game master</Eyebrow>
            <Title tone="gm">{view.chapterTitle || 'Lobby'}</Title>
            <Text style={styles.subtitle}>{view.packTitle}</Text>
          </View>
          {live ? <TimerBar msLeft={view.timerMsLeft} tone="gm" /> : null}
        </View>

        {view.phase === 'lobby' ? (
          <Card tone="gm" style={styles.block}>
            <Text style={styles.lobbyStat}>
              {seated} / {host.pack.meta.minSeats} players seated
            </Text>
            <Body tone="gm" muted>
              Two phones? Take a seat on this device, then have your partner join nearby.
            </Body>
            {!localSeatTaken ? (
              <PrimaryButton tone="gm" label="Take a seat on this phone" onPress={onClaimLocalSeat} />
            ) : (
              <GhostButton
                tone="gm"
                label="Open my clues"
                onPress={() => onOpenLocalPlay?.()}
              />
            )}
            <PrimaryButton
              tone="gm"
              label="Open briefing"
              onPress={() => host.start()}
              disabled={!canOpen}
            />
          </Card>
        ) : null}

        {view.phase === 'briefing' ? (
          <Card tone="gm" style={styles.block}>
            <Body tone="gm" muted>
              Players are reading the dossier. When everyone is ready in the room, start the clock.
            </Body>
            <PrimaryButton tone="gm" label="Start timer" onPress={() => host.beginPlay()} />
          </Card>
        ) : null}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SectionHeader tone="gm" title={`Puzzles · ${solved}/${view.checklist.length}`} />
          <View style={styles.checklist}>
            {view.checklist.map(item => (
              <View key={item.id} style={styles.checkRow}>
                <View style={[styles.checkDot, item.solved && styles.checkDotDone]} />
                <Text style={[styles.checkLabel, item.solved && styles.checkLabelDone]}>
                  {item.label}
                </Text>
                <Chip tone="gm" label={item.solved ? 'Done' : 'Open'} active={item.solved} />
              </View>
            ))}
          </View>

          <SectionHeader tone="gm" title="Seats" />
          {view.seats.map(seat => (
            <GlassPanel
              key={seat.seat}
              tone="gm"
              blur={12}
              style={styles.seatCardWrap}
              contentStyle={styles.seatCard}
            >
              <View style={styles.seatTop}>
                <View>
                  <Text style={styles.seatName}>{seat.name}</Text>
                  <Text style={styles.seatRole}>{seat.roleName}</Text>
                </View>
                <View style={[styles.statusPill, seat.connected ? styles.online : styles.offline]}>
                  <Text style={styles.statusText}>{seat.connected ? 'In range' : 'Away'}</Text>
                </View>
              </View>
              {(seat.stuck || seat.hintsUsed > 0) && (
                <Text style={styles.seatMeta}>
                  {seat.stuck ? 'May need a nudge · ' : ''}
                  {seat.hintsUsed ? `${seat.hintsUsed} hints sent` : ''}
                </Text>
              )}
              {seat.hintRequested ? (
                <View style={styles.hintRow}>
                  <Body tone="gm">Hint requested · {seat.hintRequested}</Body>
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
            </GlassPanel>
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
  headerMain: { flex: 1, minWidth: 0 },
  scrollView: { flex: 1 },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: gmTheme.muted,
    marginTop: 4,
  },
  block: { marginBottom: space.lg },
  lobbyStat: {
    fontFamily: F.semibold,
    fontSize: 18,
    color: gmTheme.text,
  },
  scroll: { paddingBottom: space.xxl, gap: space.sm },
  checklist: { gap: space.sm, marginBottom: space.lg },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: gmTheme.lineSoft,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: gmTheme.dim,
  },
  checkDotDone: { backgroundColor: gmTheme.success },
  checkLabel: { flex: 1, fontFamily: F.regular, fontSize: 16, color: gmTheme.text },
  checkLabelDone: { color: gmTheme.muted, textDecorationLine: 'line-through' },
  seatCardWrap: { marginBottom: space.sm },
  seatCard: { gap: space.sm },
  seatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  seatName: { fontFamily: F.semibold, fontSize: 17, color: gmTheme.text },
  seatRole: { fontFamily: F.regular, fontSize: 13, color: gmTheme.muted, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  online: { backgroundColor: 'rgba(107, 196, 154, 0.15)' },
  offline: { backgroundColor: 'rgba(224, 112, 112, 0.12)' },
  statusText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: gmTheme.muted,
  },
  seatMeta: { fontFamily: F.regular, fontSize: 13, color: gmTheme.dim },
  hintRow: { gap: space.sm, marginTop: space.sm },
  footer: { paddingVertical: space.sm },
});
