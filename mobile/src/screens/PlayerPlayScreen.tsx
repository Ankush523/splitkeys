import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PlayerView } from '../../../engine/runtime';
import { ClueCard, ClueDetailModal } from '../ui/ClueCard';
import { CodeLock } from '../ui/CodeLock';
import { IconBag, IconDesk, IconLock, IconTeam } from '../ui/icons';
import { GlassPanel } from '../ui/GlassPanel';
import { PressableScale } from '../ui/PressableScale';
import { Body, Card, Divider, GhostButton, Screen } from '../ui/primitives';
import { TimerBar } from '../ui/Timer';
import { F, playerTheme, radius, space } from '../theme/tokens';

export type PlayerSeatActions = {
  submitCode: (puzzleId: string, code: string) => void;
  hintRequest: (puzzleId: string) => void;
};

type Tab = 'desk' | 'bag' | 'locks' | 'team';

const TABS: { id: Tab; label: string; Icon: typeof IconDesk }[] = [
  { id: 'desk', label: 'Desk', Icon: IconDesk },
  { id: 'bag', label: 'Bag', Icon: IconBag },
  { id: 'locks', label: 'Locks', Icon: IconLock },
  { id: 'team', label: 'Team', Icon: IconTeam },
];

export function PlayerPlayScreen({
  view,
  seat,
  onLeave,
  rejectToken,
  safeAreaEdges,
}: {
  view: PlayerView;
  seat: PlayerSeatActions;
  onLeave: () => void;
  rejectToken: number;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const edges = safeAreaEdges ?? ['top', 'bottom'];
  const [tab, setTab] = useState<Tab>('desk');
  const [clueOpen, setClueOpen] = useState<(typeof view.clues)[0] | null>(null);

  const availableLocks = useMemo(
    () => view.locks.filter(l => l.status === 'available'),
    [view.locks],
  );

  const solvedCount = view.locks.filter(l => l.status === 'solved').length;

  return (
    <Screen tone="player">
      <SafeAreaView style={styles.safe} edges={edges}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Text style={styles.chapter}>{view.chapterTitle || view.packTitle}</Text>
            <View style={styles.roleRow}>
              <Text style={styles.role}>{view.roleName}</Text>
              <View style={styles.progressPill}>
                <Text style={styles.progressText}>
                  {solvedCount}/{view.locks.length} locks
                </Text>
              </View>
            </View>
          </View>
          <TimerBar msLeft={view.timerMsLeft} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tab === 'desk' && (
            <View style={styles.section}>
              {view.clues.length === 0 ? (
                <Card>
                  <Body muted>
                    No evidence yet. Listen to the briefing and compare notes with your team out loud.
                  </Body>
                </Card>
              ) : (
                view.clues.map(c => (
                  <ClueCard
                    key={c.id}
                    title={c.title}
                    body={c.body}
                    kind={c.kind}
                    onPress={() => setClueOpen(c)}
                  />
                ))
              )}
            </View>
          )}

          {tab === 'bag' && (
            <Card>
              <Body muted>
                {view.bag.length
                  ? view.bag.join(', ')
                  : 'Your bag is empty. Objects you collect in the room will appear here.'}
              </Body>
            </Card>
          )}

          {tab === 'locks' && (
            <View style={styles.section}>
              {availableLocks.length === 0 ? (
                <Card>
                  <Body muted>
                    No locks are ready on your phone. Keep talking — a teammate’s discovery may unlock yours.
                  </Body>
                </Card>
              ) : (
                availableLocks.map(lock => (
                  <View key={lock.id} style={{ gap: space.sm }}>
                    <CodeLock
                      label={lock.label}
                      rejectToken={rejectToken}
                      onSubmit={code => seat.submitCode(lock.id, code)}
                    />
                    <GhostButton label="Request hint from GM" onPress={() => seat.hintRequest(lock.id)} />
                  </View>
                ))
              )}
              <Divider />
              <Text style={styles.solvedLabel}>Solved</Text>
              <Body muted>
                {view.locks
                  .filter(l => l.status === 'solved')
                  .map(l => l.label)
                  .join(' · ') || 'None yet'}
              </Body>
            </View>
          )}

          {tab === 'team' && (
            <View style={styles.section}>
              {view.team.map(m => (
                <View key={m.seat} style={styles.teamRow}>
                  <View>
                    <Text style={styles.teamName}>{m.name}</Text>
                    <Text style={styles.teamRole}>{m.roleName}</Text>
                  </View>
                  <View style={styles.teamBadge}>
                    <Text style={styles.teamBadgeText}>Seat {m.seat + 1}</Text>
                  </View>
                </View>
              ))}
              <Body muted small>
                This tab never shows secrets — coordinate in the real room.
              </Body>
            </View>
          )}
        </ScrollView>

        <View style={styles.footerStack}>
          <GlassPanel tone="player" radius={radius.xl} blur={16} padded={false} contentStyle={styles.bottomBar}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <PressableScale
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  haptic={false}
                  onPress={() => setTab(id)}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                >
                  <Icon size={22} color={active ? playerTheme.accentBright : playerTheme.dim} />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
                </PressableScale>
              );
            })}
          </GlassPanel>
          <GhostButton label="Leave session" compact onPress={onLeave} />
        </View>
      </SafeAreaView>

      <ClueDetailModal
        visible={!!clueOpen}
        title={clueOpen?.title ?? ''}
        body={clueOpen?.body ?? ''}
        kind={clueOpen?.kind ?? 'text'}
        onClose={() => setClueOpen(null)}
      />
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
  chapter: {
    fontFamily: F.medium,
    fontSize: 12,
    color: playerTheme.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  role: {
    fontFamily: F.semibold,
    fontSize: 22,
    color: playerTheme.text,
    letterSpacing: -0.3,
  },
  progressPill: {
    backgroundColor: playerTheme.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: playerTheme.lineSoft,
  },
  progressText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: playerTheme.accentBright,
  },
  scrollView: { flex: 1 },
  scroll: { paddingBottom: space.md, gap: space.md },
  section: { gap: space.md },
  solvedLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: playerTheme.muted,
  },
  footerStack: {
    gap: space.sm,
    marginTop: space.sm,
    paddingTop: space.xs,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    gap: 4,
    borderRadius: radius.lg,
  },
  tabBtnActive: {
    backgroundColor: playerTheme.accentSoft,
  },
  tabLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    color: playerTheme.dim,
  },
  tabLabelActive: {
    color: playerTheme.accentBright,
    fontFamily: F.semibold,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: space.md,
    backgroundColor: playerTheme.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: playerTheme.lineSoft,
  },
  teamName: { fontFamily: F.semibold, fontSize: 16, color: playerTheme.text },
  teamRole: { fontFamily: F.regular, fontSize: 13, color: playerTheme.muted, marginTop: 2 },
  teamBadge: {
    backgroundColor: playerTheme.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  teamBadgeText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: playerTheme.muted,
  },
});
