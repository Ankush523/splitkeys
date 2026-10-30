import { useEffect, useReducer, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwake, deactivateKeepAwake } from '@sayem314/react-native-keep-awake';
import type { GmView } from '../../engine/runtime';
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
import { Body, GhostButton, PrimaryButton, Screen, Title } from './ui/primitives';
import { F, playerTheme, space } from './theme/tokens';

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
      const bridge = createGmBridge(send, start.pack, me(), setGmView, room.peers.map(p => p.id));
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
      body = (
        <GmDashboardScreen
          view={gmView}
          host={mode.bridge.host}
          live={live}
          onClose={() =>
            Alert.alert('End session?', 'Players will be disconnected.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'End',
                style: 'destructive',
                onPress: () => {
                  mode.bridge.host.close();
                  void leaveAll();
                },
              },
            ])
          }
        />
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
        <SafeAreaView style={styles.wait}>
          <Title>Starting…</Title>
          <Body muted>
            {room.error || (room.status === 'starting' ? 'Bluetooth and mesh are waking up…' : 'One moment…')}
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
  if (!hosts.length) {
    return (
      <View style={styles.sheet}>
        <Body muted>Searching for GM phones nearby… Keep the host app open within a few metres.</Body>
      </View>
    );
  }
  return (
    <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>Nearby rooms</Text>
      <FlatList
        data={hosts}
        keyExtractor={h => h.id}
        renderItem={({ item }) => (
          <Pressable style={styles.hostRow} onPress={() => onPick(item.id)}>
            <Text style={styles.hostName}>{item.name}</Text>
            <Text style={styles.hostJoin}>Join</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function WaitingRoom({ hostLost, onCancel }: { hostLost: boolean; onCancel: () => void }) {
  return (
    <Screen tone="player">
      <SafeAreaView style={styles.wait}>
        <Title>Connecting</Title>
        <Body muted>
          {hostLost
            ? 'Lost the GM link — walk closer. Reconnecting…'
            : 'Waiting for seat assignment from the GM…'}
        </Body>
        <GhostButton label="Cancel" onPress={onCancel} />
      </SafeAreaView>
    </Screen>
  );
}

function Briefing({ text, role, onContinue }: { text: string; role: string; onContinue: () => void }) {
  return (
    <Screen tone="player">
      <SafeAreaView style={[styles.wait, { gap: space.lg }]}>
        <Text style={styles.briefKicker}>Briefing · {role}</Text>
        <Title>Dossier</Title>
        <ScrollView>
          <Body>{text}</Body>
        </ScrollView>
        <PrimaryButton label="Enter the room" onPress={onContinue} />
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wait: { flex: 1, paddingHorizontal: space.lg, gap: space.md },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: playerTheme.bgElevated,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: space.lg,
    maxHeight: '45%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: playerTheme.line,
  },
  sheetTitle: { fontFamily: F.semibold, fontSize: 16, color: playerTheme.text, marginBottom: space.sm },
  hostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: playerTheme.line,
  },
  hostName: { fontFamily: F.medium, fontSize: 16, color: playerTheme.text },
  hostJoin: { fontFamily: F.semibold, fontSize: 15, color: playerTheme.accent },
  briefKicker: {
    fontFamily: F.medium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: playerTheme.muted,
  },
});
