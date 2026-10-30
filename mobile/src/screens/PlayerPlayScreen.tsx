import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PlayerView } from '../../../engine/runtime.ts';
import type { Seat } from '../../../engine/session.ts';
import { ClueCard } from '../ui/ClueCard';
import { CodeLock } from '../ui/CodeLock';
import { Body, Chip, Divider, GhostButton, Screen, Title } from '../ui/primitives';
import { TimerBar } from '../ui/Timer';
import { F, playerTheme, space } from '../theme/tokens';

type Tab = 'desk' | 'bag' | 'locks' | 'team';

export function PlayerPlayScreen({
  view,
  seat,
  onLeave,
  rejectToken,
}: {
  view: PlayerView;
  seat: Seat;
  onLeave: () => void;
  rejectToken: number;
}) {
  const [tab, setTab] = useState<Tab>('desk');
  const [clueOpen, setClueOpen] = useState<(typeof view.clues)[0] | null>(null);

  const availableLocks = useMemo(
    () => view.locks.filter(l => l.status === 'available'),
    [view.locks],
  );

  return (
    <Screen tone="player">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.chapter}>{view.chapterTitle}</Text>
            <Text style={styles.role}>{view.roleName}</Text>
          </View>
          <TimerBar msLeft={view.timerMsLeft} />
        </View>

        <View style={styles.tabs}>
          {(
            [
              ['desk', 'Desk'],
              ['bag', 'Bag'],
              ['locks', 'Locks'],
              ['team', 'Team'],
            ] as const
          ).map(([id, label]) => (
            <Chip
              key={id}
              label={label}
              active={tab === id}
              onPress={() => setTab(id)}
            />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {tab === 'desk' && (
            <View style={styles.section}>
              {view.clues.length === 0 ? (
                <Body muted>No clues yet. Listen to the GM briefing and your teammates.</Body>
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
            <View style={styles.section}>
              <Body muted>
                {view.bag.length
                  ? view.bag.join(', ')
                  : 'Your bag is empty. Items you collect in the room will appear here.'}
              </Body>
            </View>
          )}

          {tab === 'locks' && (
            <View style={styles.section}>
              {availableLocks.length === 0 ? (
                <Body muted>No locks ready on your phone yet. Keep talking — another clue may unlock one.</Body>
              ) : (
                availableLocks.map(lock => (
                  <View key={lock.id} style={{ gap: space.sm }}>
                    <CodeLock
                      label={lock.label}
                      rejectToken={rejectToken}
                      onSubmit={code => seat.submitCode(lock.id, code)}
                    />
                    <GhostButton
                      label="Request hint"
                      onPress={() => seat.hintRequest(lock.id)}
                    />
                  </View>
                ))
              )}
              <Divider />
              <Body muted>
                Solved:{' '}
                {view.locks
                  .filter(l => l.status === 'solved')
                  .map(l => l.label)
                  .join(' · ') || 'none yet'}
              </Body>
            </View>
          )}

          {tab === 'team' && (
            <View style={styles.section}>
              {view.team.map(m => (
                <View key={m.seat} style={styles.teamRow}>
                  <Text style={styles.teamName}>{m.name}</Text>
                  <Text style={styles.teamRole}>{m.roleName}</Text>
                </View>
              ))}
              <Body muted>Talk out loud — this tab never shows secrets.</Body>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <GhostButton label="Leave session" onPress={onLeave} />
        </View>
      </SafeAreaView>

      <Modal visible={!!clueOpen} animationType="slide" onRequestClose={() => setClueOpen(null)}>
        <Screen tone="player">
          <SafeAreaView style={[styles.safe, styles.modal]}>
            <Title>{clueOpen?.title}</Title>
            <ScrollView>
              <Body>{clueOpen?.body}</Body>
            </ScrollView>
            <GhostButton label="Close" onPress={() => setClueOpen(null)} />
          </SafeAreaView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: space.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  chapter: {
    fontFamily: F.medium,
    fontSize: 13,
    color: playerTheme.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  role: {
    fontFamily: F.semibold,
    fontSize: 20,
    color: playerTheme.text,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.sm,
  },
  scroll: { paddingBottom: space.xl, gap: space.md },
  section: { gap: space.md },
  footer: { paddingVertical: space.sm },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: playerTheme.line,
  },
  teamName: { fontFamily: F.medium, fontSize: 16, color: playerTheme.text },
  teamRole: { fontFamily: F.regular, fontSize: 14, color: playerTheme.muted },
  modal: { padding: space.lg, gap: space.md },
});
