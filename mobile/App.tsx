import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useReducer, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import KeepAwake from '@sayem314/react-native-keep-awake';
import type { GmView } from '../engine/runtime.ts';
import type { StoryPack } from '../engine/pack.ts';
import { useNearbyRoom } from './src/mesh/useNearbyRoom';
import { DEFAULT_PACK, STORY_PACKS } from './src/content/packs';
import {
  APP_ID,
  createGmBridge,
  createPlayerBridge,
  meshSend,
  type GmBridge,
  type PlayerBridge,
} from './src/session/bridge';
import { DebriefScreen } from './src/screens/DebriefScreen';
import { GmDashboardScreen } from './src/screens/GmDashboardScreen';
import { PlayerPlayScreen } from './src/screens/PlayerPlayScreen';
import { Body, GhostButton, LogoMark, PrimaryButton, Screen, Title } from './src/ui/primitives';
import { F, playerTheme, space } from './src/theme/tokens';

type Mode =
  | { k: 'home' }
  | { k: 'gm'; bridge: GmBridge; pack: StoryPack }
  | { k: 'player'; bridge: PlayerBridge }
  | { k: 'debrief'; escaped: boolean; hints: number };

const NAME_KEY = 'splitkeys.displayName';

export default function App() {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>({ k: 'home' });
  const [gmView, setGmView] = useState<GmView | null>(null);
  const [rejectToken, setRejectToken] = useState(0);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const prevSolved = useRef(0);

  const bridgeRef = useRef<{ gm?: GmBridge; player?: PlayerBridge }>({});

  useEffect(() => {
    AsyncStorage.getItem(NAME_KEY)
      .then(stored => setName(stored ?? `Guest ${100 + Math.floor(Math.random() * 900)}`))
      .catch(() => setName('Guest'));
  }, []);

  useEffect(() => {
    if (name) AsyncStorage.setItem(NAME_KEY, name).catch(() => {});
  }, [name]);

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
  }, [bridgeRef.current.player?.seat.view]);

  const leaveAll = async () => {
    bridgeRef.current.gm?.dispose();
    bridgeRef.current.gm = undefined;
    bridgeRef.current.player = undefined;
    await room.leave();
    setGmView(null);
    setMode({ k: 'home' });
  };

  let body: React.ReactNode;

  if (mode.k === 'debrief') {
    body = (
      <DebriefScreen escaped={mode.escaped} hintsUsed={mode.hints} onHome={() => void leaveAll()} />
    );
  } else if (mode.k === 'gm' && gmView) {
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
        <>
          <KeepAwake />
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
        </>
      );
    }
  } else if (mode.k === 'player') {
    const seat = mode.bridge.seat;
    const view = seat.view;
    if (seat.closed || seat.full) {
      body = (
        <DebriefScreen
          escaped={false}
          hintsUsed={0}
          onHome={() => void leaveAll()}
        />
      );
    } else if (!view) {
      body = <WaitingRoom hostLost={seat.hostLost} hosts={seat.rooms} onCancel={() => void leaveAll()} />;
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
      <Home
        name={name}
        setName={setName}
        roomStatus={room.status}
        roomError={room.error}
        onHost={pack => {
          const send = meshSend(room.send);
          const bridge = createGmBridge(send, pack, me(), setGmView, room.peers.map(p => p.id));
          bridgeRef.current = { gm: bridge };
          setGmView(bridge.host.view);
          setMode({ k: 'gm', bridge, pack });
          void room.host(pack.meta.title);
        }}
        onJoin={() => {
          const send = meshSend(room.send);
          const bridge = createPlayerBridge(send, me(), bump, room.peers.map(p => p.id));
          bridgeRef.current = { player: bridge };
          setMode({ k: 'player', bridge });
          void room.discover();
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={playerTheme.bg} />
      {body}
      {mode.k === 'player' &&
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
    </SafeAreaProvider>
  );
}

function Home({
  name,
  setName,
  roomStatus,
  roomError,
  onHost,
  onJoin,
}: {
  name: string;
  setName: (n: string) => void;
  roomStatus: string;
  roomError: string;
  onHost: (pack: StoryPack) => void;
  onJoin: () => void;
}) {
  const [packId, setPackId] = useState(DEFAULT_PACK.meta.id);
  const pack = STORY_PACKS.find(p => p.meta.id === packId) ?? DEFAULT_PACK;

  return (
    <Screen tone="player">
      <SafeAreaView style={styles.home} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.homeScroll} keyboardShouldPersistTaps="handled">
          <LogoMark />
          <Title>Escape room night, no Wi‑Fi</Title>
          <Body muted>
            One phone runs the room. Everyone else gets private clues. Talk in real life — phones stay in character.
          </Body>

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
            {STORY_PACKS.map(p => (
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

          {roomError ? <Text style={styles.error}>{roomError}</Text> : null}
          {roomStatus === 'starting' ? <Body muted>Starting Bluetooth…</Body> : null}

          <PrimaryButton label="Host as GM" onPress={() => onHost(pack)} />
          <GhostButton label="Join nearby room" onPress={onJoin} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
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

function WaitingRoom({
  hostLost,
  onCancel,
}: {
  hostLost: boolean;
  hosts: Map<string, unknown>;
  onCancel: () => void;
}) {
  return (
    <Screen tone="player">
      <SafeAreaView style={styles.home}>
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
      <SafeAreaView style={[styles.home, { gap: space.lg }]}>
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
