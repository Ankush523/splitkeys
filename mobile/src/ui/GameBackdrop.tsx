import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { gmTheme, playerTheme, type Tone } from '../theme/tokens';

export function GameBackdrop({
  tone = 'player',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const c = tone === 'player' ? playerTheme : gmTheme;
  const blobA = tone === 'player' ? c.accent : '#5e6ad2';
  const blobB = tone === 'player' ? '#8b6914' : c.accent;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="baseWash" x1="0" y1="0" x2="0.2" y2="1">
            <Stop offset="0" stopColor="#121018" stopOpacity={1} />
            <Stop offset="0.55" stopColor={c.bg} stopOpacity={1} />
            <Stop offset="1" stopColor="#000000" stopOpacity={1} />
          </LinearGradient>
          <RadialGradient id="blobA" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={blobA} stopOpacity={0.22} />
            <Stop offset="1" stopColor={blobA} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blobB" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={blobB} stopOpacity={0.16} />
            <Stop offset="1" stopColor={blobB} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#baseWash)" />
        <Circle cx="85%" cy="8%" r="120" fill="url(#blobA)" />
        <Circle cx="10%" cy="42%" r="160" fill="url(#blobB)" />
        <Circle cx="70%" cy="88%" r="140" fill="url(#blobA)" opacity={0.7} />
      </Svg>
      <View style={styles.noiseLine} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  noiseLine: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.04)',
  },
});
