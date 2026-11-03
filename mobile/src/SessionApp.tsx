import { useEffect, useReducer, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import type { GmView, PlayerView } from '../../engine/runtime';
import type { StoryPack } from '../../engine/pack';
import { useNearbyRoom } from './mesh/useNearbyRoom';
import {
  APP_ID,
  createGmBridge,
  createPlayerBridge,
  meshSend,
  type GmBridge,
  type PlayerBridge,
} from './session/bridge';
import { DebriefScreen } from './screens/DebriefScreen';
import { GmDashboardScreen } from './screens/GmDashboardScreen';
import { PlayerPlayScreen } from './screens/PlayerPlayScreen';
import { IconChevron } from './ui/icons';
import { SegmentedControl } from './ui/SegmentedControl';
import {
  Body,
  Card,
  Eyebrow,
  GhostButton,
  PrimaryButton,
  Screen,
  Title,
} from './ui/primitives';
import { GlassPanel } from './ui/GlassPanel';
import { F, playerTheme, radius, space } from './theme/tokens';

export type SessionStart =
  | { kind: 'gm'; pack: StoryPack }
  | { kind: 'player' };

type Mode =
  | { k: 'gm'; bridge: GmBridge; pack: StoryPack }
  | { k: 'player'; bridge: PlayerBridge }
  | { k: 'debrief'; escaped: boolean; hints: number };

type Props = {
  name: string;
  start: SessionStart;
  onHome: () => void;
};

export default function SessionApp({ name, start, onHome }: Props) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [gmView, setGmView] = useState<GmView | null>(null);
  const [localView, setLocalView] = useState<PlayerView | null>(null);
  const [gmPanel, setGmPanel] = useState<'gm' | 'play'>('gm');
  const [rejectToken, setRejectToken] = useState(0);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const prevSolved = useRef(0);
  const started = useRef(false);

  const bridgeRef = useRef<{ gm?: GmBridge; player?: PlayerBridge }>({});

  useEffect(() => {
    const gmLive = mode?.k === 'gm' && gmView && gmView.phase !== 'won' && gmView.phase !== 'lost';
    if (!gmLive) return;
    try {
      activateKeepAwake();
    } catch {
      /* optional native module */
    }
    return () => {
      try {
        deactivateKeepAwake();
      } catch {
        /* ignore */
      }
    };
  }, [mode, gmView]);

  const room = useNearbyRoom({
    appId: APP_ID,
    onMessage: (from, data) => {
      bridgeRef.current.gm?.onMessage(from, data);
      bridgeRef.current.player?.onMessage(from, data);
    },
    onPeerJoined: peer => {
      bridgeRef.current.gm?.onPeerJoined(peer.id);
      bridgeRef.current.player?.onPeerJoined(peer.id);
    },
    onPeerLeft: peer => {
      bridgeRef.current.gm?.onPeerLeft(peer.id);
      bridgeRef.current.player?.onPeerLeft(peer.id);
    },
  });

  const me = () => ({ id: room.localId, name: name.trim() || 'Guest' });

  useEffect(() => {
    const view = bridgeRef.current.player?.seat.view;
    if (!view) return;
    const solved = view.locks.filter(l => l.status === 'solved').length;
    if (solved < prevSolved.current) prevSolved.current = solved;
    if (solved === prevSolved.current) return;
    prevSolved.current = solved;
  }, [mode, rejectToken, bump]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (start.kind === 'gm') {
      const send = meshSend(room.send);
      const bridge = createGmBridge(
        send,
        start.pack,
        me(),
        setGmView,
        room.peers.map(p => p.id),
        setLocalView,
      );
      bridgeRef.current = { gm: bridge };
      setGmView(bridge.host.view);
      setMode({ k: 'gm', bridge, pack: start.pack });
      void room.host(start.pack.meta.title);
    } else {
      const send = meshSend(room.send);
      const bridge = createPlayerBridge(send, me(), bump, room.peers.map(p => p.id));
      bridgeRef.current = { player: bridge };
      setMode({ k: 'player', bridge });
      void room.discover();
    }
  }, [name, room, start]);

  const leaveAll = async () => {
    bridgeRef.current.gm?.dispose();
    bridgeRef.current.gm = undefined;
    bridgeRef.current.player = undefined;
    await room.leave();
    setGmView(null);
    onHome();
  };

  let body: React.ReactNode;

  if (mode?.k === 'debrief') {
    body = (
      <DebriefScreen escaped={mode.escaped} hintsUsed={mode.hints} onHome={() => void leaveAll()} />
    );
  } else if (mode?.k === 'gm' && gmView) {
    const live = gmView.phase === 'active';
    if (gmView.phase === 'won' || gmView.phase === 'lost') {
      body = (
        <DebriefScreen
          escaped={gmView.escaped}
          hintsUsed={gmView.hintsUsed}
          onHome={() => {
            mode.bridge.host.close();
            void leaveAll();
          }}
        />
      );
    } else {
      const host = mode.bridge.host;
      const localTaken = host.localSeatIndex() >= 0;
      const localSeat = {
        submitCode: (puzzleId: string, code: string) => host.submitLocalCode(puzzleId, code),
        hintRequest: (puzzleId: string) => host.requestLocalHint(puzzleId),
      };

      const gmPlayBody =
        gmPanel === 'play' && localView ? (
          localView.phase === 'briefing' ? (
            <Briefing
              text={localView.briefing}
              role={localView.roleName}
              onContinue={() => setGmPanel('play')}
              safeAreaEdges={['bottom']}
            />
          ) : (
            <PlayerPlayScreen
              view={localView}
              seat={localSeat}
              rejectToken={rejectToken}
              onLeave={() => setGmPanel('gm')}
              safeAreaEdges={['bottom']}
            />
          )
        ) : (
          <GmDashboardScreen
            view={gmView}
            host={host}
            live={live}
            localSeatTaken={localTaken}
            safeAreaEdges={localTaken ? ['bottom'] : undefined}
            onClaimLocalSeat={() => {
              host.claimLocalSeat(name.trim() || 'Host');
              setGmPanel('play');
            }}
            onOpenLocalPlay={() => setGmPanel('play')}
            onClose={() =>
              Alert.alert('End session?', 'Players will be disconnected.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'End',
                  style: 'destructive',
                  onPress: () => {
                    host.close();
                    void leaveAll();
                  },
                },
              ])
            }
          />
        );

      body = localTaken ? (
        <SafeAreaView style={styles.gmShell} edges={['top']}>
          <View style={styles.gmTabs}>
            <SegmentedControl
              tone={gmPanel === 'gm' ? 'gm' : 'player'}
              options={[
                { id: 'gm' as const, label: 'GM table' },
                { id: 'play' as const, label: 'My clues' },
              ]}
              value={gmPanel}
              onChange={setGmPanel}
            />
          </View>
          <View style={styles.gmShellBody}>{gmPlayBody}</View>
        </SafeAreaView>
      ) : (
        gmPlayBody
      );
    }
  } else if (mode?.k === 'player') {
    const seat = mode.bridge.seat;
    const view = seat.view;
    if (seat.closed || seat.full) {
      body = (
        <DebriefScreen escaped={false} hintsUsed={0} onHome={() => void leaveAll()} />
      );
    } else if (!view) {
      body = <WaitingRoom hostLost={seat.hostLost} onCancel={() => void leaveAll()} />;
    } else if (view.phase === 'won' || view.phase === 'lost') {
      body = (
        <DebriefScreen
          escaped={view.escaped}
          hintsUsed={view.hintsUsed}
          onHome={() => void leaveAll()}
        />
      );
    } else if (view.phase === 'briefing') {
      body = (
        <Briefing text={view.briefing} role={view.roleName} onContinue={() => bump()} />
      );
    } else {
      body = (
        <PlayerPlayScreen
          view={view}
          seat={seat}
          rejectToken={rejectToken}
          onLeave={() =>
            Alert.alert('Leave room?', undefined, [
              { text: 'Stay', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: () => void leaveAll() },
            ])
          }
        />
      );
    }
  } else {
    body = (
      <Screen tone="player">
        <SafeAreaView style={styles.wait} edges={['top', 'bottom']}>
          <Eyebrow>Connecting</Eyebrow>
          <Title>Preparing the room</Title>
          <Body muted>
            {room.error ||
              (room.status === 'starting'
                ? 'Bluetooth and mesh are waking up…'
                : 'One moment…')}
          </Body>
          <GhostButton label="Cancel" onPress={() => void leaveAll()} />
        </SafeAreaView>
      </Screen>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={playerTheme.bg} />
      {body}
      {mode?.k === 'player' &&
      (room.status === 'discovering' || room.status === 'joining') &&
      !mode.bridge.seat.view ? (
        <JoinSheet
          hosts={room.hosts}
          onPick={hostId => {
            mode.bridge.seat.join(hostId);
            void room.join(hostId, name.trim() || 'Guest');
          }}
        />
      ) : null}
    </>
  );
}

function JoinSheet({
  hosts,
  onPick,
}: {
  hosts: { id: string; name: string }[];
  onPick: (id: string) => void;
}) {
  return (
    <>
      <View style={styles.scrim} accessibilityElementsHidden importantForAccessibility="no" />
      <SafeAreaView style={styles.sheetWrap} edges={['bottom']}>
        <GlassPanel tone="player" radius={radius.xl} blur={20} style={styles.sheet} contentStyle={styles.sheetInner}>
          <Text style={styles.sheetTitle}>{hosts.length ? 'Nearby rooms' : 'Searching…'}</Text>
          {!hosts.length ? (
            <Body muted>Keep the host app open within a few metres. Bluetooth must stay on.</Body>
          ) : (
            <ScrollView style={styles.hostList} keyboardShouldPersistTaps="handled">
              {hosts.map(item => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.hostRow, pressed && { opacity: 0.85 }]}
                  onPress={() => onPick(item.id)}
                >
                  <View style={styles.hostTextCol}>
                    <Text style={styles.hostName}>{item.name}</Text>
                    <Text style={styles.hostMeta}>Tap to join</Text>
                  </View>
                  <IconChevron color={playerTheme.accentBright} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </GlassPanel>
      </SafeAreaView>
    </>
  );
}

function WaitingRoom({ hostLost, onCancel }: { hostLost: boolean; onCancel: () => void }) {
  return (
    <Screen tone="player">
      <SafeAreaView style={styles.wait} edges={['top', 'bottom']}>
        <Eyebrow>{hostLost ? 'Reconnecting' : 'Lobby'}</Eyebrow>
        <Title>{hostLost ? 'Link lost' : 'Waiting for your seat'}</Title>
        <Card>
          <Body muted>
            {hostLost
              ? 'Walk closer to the game master. The room will reconnect automatically.'
              : 'The GM will assign your role shortly. Stay in the physical room with your team.'}
          </Body>
        </Card>
        <GhostButton label="Cancel" onPress={onCancel} />
      </SafeAreaView>
    </Screen>
  );
}

function Briefing({
  text,
  role,
  onContinue,
  safeAreaEdges,
}: {
  text: string;
  role: string;
  onContinue: () => void;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const edges = safeAreaEdges ?? ['top', 'bottom'];
  return (
    <Screen tone="player">
      <SafeAreaView style={[styles.wait, { gap: space.lg }]} edges={edges}>
        <Eyebrow>Briefing · {role}</Eyebrow>
        <Title>Dossier</Title>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.lg }}>
          <Card>
            <Body>{text}</Body>
          </Card>
        </ScrollView>
        <PrimaryButton label="Enter the room" onPress={onContinue} />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gmShell: { flex: 1 },
  gmShellBody: { flex: 1, minHeight: 0 },
  gmTabs: {
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  wait: { flex: 1, paddingHorizontal: space.lg, gap: space.md },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: playerTheme.scrim,
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.sm,
  },
  sheet: {
    maxHeight: '46%',
  },
  sheetInner: {
    padding: space.lg,
    maxHeight: 360,
  },
  hostList: {
    maxHeight: 220,
  },
  hostTextCol: { flex: 1, minWidth: 0, paddingRight: space.sm },
  sheetTitle: {
    fontFamily: F.semibold,
    fontSize: 18,
    color: playerTheme.text,
    marginBottom: space.md,
  },
  hostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: playerTheme.lineSoft,
  },
  hostName: { fontFamily: F.semibold, fontSize: 17, color: playerTheme.text },
  hostMeta: {
    fontFamily: F.regular,
    fontSize: 13,
    color: playerTheme.muted,
    marginTop: 2,
  },
});
