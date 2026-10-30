import AsyncStorage from '@react-native-async-storage/async-storage';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { StoryPack } from '../engine/pack';
import { getStoryPacks } from './src/content/packs';
import { HomeScreen } from './src/screens/HomeScreen';
import type { SessionStart } from './src/SessionApp';
import { ErrorBoundary } from './src/ui/ErrorBoundary';
import { playerTheme } from './src/theme/tokens';

const SessionApp = lazy(() => import('./src/SessionApp'));

const NAME_KEY = 'splitkeys.displayName';

export default function App() {
  const [name, setName] = useState('');
  const [session, setSession] = useState<SessionStart | null>(null);
  const catalog = useMemo(() => {
    try {
      return getStoryPacks();
    } catch (e) {
      return { packs: [], error: e instanceof Error ? e.message : String(e) };
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(NAME_KEY)
      .then(stored => setName(stored ?? `Guest ${100 + Math.floor(Math.random() * 900)}`))
      .catch(() => setName('Guest'));
  }, []);

  useEffect(() => {
    if (name) AsyncStorage.setItem(NAME_KEY, name).catch(() => {});
  }, [name]);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar barStyle="light-content" backgroundColor={playerTheme.bg} />
        {session ? (
          <Suspense
            fallback={
              <View style={styles.boot}>
                <ActivityIndicator color={playerTheme.accent} />
              </View>
            }
          >
            <SessionApp
              name={name}
              start={session}
              onHome={() => setSession(null)}
            />
          </Suspense>
        ) : (
          <HomeScreen
            name={name}
            setName={setName}
            catalog={catalog}
            onHost={(pack: StoryPack) => setSession({ kind: 'gm', pack })}
            onJoin={() => setSession({ kind: 'player' })}
          />
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: playerTheme.bg },
});
