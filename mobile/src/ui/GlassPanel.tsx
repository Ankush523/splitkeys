import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, space, themeOf, type Tone } from '../theme/tokens';

type Props = {
  tone?: Tone;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  /** Visual depth 0–32 (tint strength only; no native blur — RN 0.82 new-arch safe). */
  blur?: number;
  padded?: boolean;
};

export function GlassPanel({
  tone = 'player',
  children,
  style,
  contentStyle,
  radius: corner = radius.lg,
  blur = 20,
  padded = true,
}: Props) {
  const c = themeOf(tone);
  const depth = Math.min(32, Math.max(0, blur));
  const tintOpacity = 0.42 + depth / 80;
  const fillOpacity = 0.06 + depth / 200;

  return (
    <View
      collapsable={false}
      style={[styles.shell, { borderRadius: corner, borderColor: c.glassStroke }, style]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: corner,
            backgroundColor: c.bgCard,
            opacity: 0.35,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: corner,
            backgroundColor: c.glassTint,
            opacity: tintOpacity,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: corner,
            backgroundColor: 'rgba(255,255,255,1)',
            opacity: fillOpacity,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.specular,
          { borderTopLeftRadius: corner, borderTopRightRadius: corner },
        ]}
      />
      <View style={[styles.content, padded && styles.pad, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
  pad: {
    padding: space.md,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.14)',
    zIndex: 1,
  },
});
