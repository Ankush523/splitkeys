import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { playerTheme, space } from '../theme/tokens';
import { PrimaryButton } from './primitives';

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Split Keys hit a snag</Text>
        <ScrollView style={styles.scroll}>
          <Text style={styles.msg}>{this.state.error.message}</Text>
        </ScrollView>
        <PrimaryButton label="Try again" onPress={() => this.setState({ error: null })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: playerTheme.bg, padding: space.lg, gap: space.md },
  title: { color: playerTheme.text, fontSize: 20, fontWeight: '600' },
  scroll: { flex: 1 },
  msg: { color: playerTheme.muted, fontSize: 14, fontFamily: 'Menlo' },
});
