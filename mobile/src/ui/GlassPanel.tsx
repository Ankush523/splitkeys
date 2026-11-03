import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { radius, space, themeOf, type Tone } from '../theme/tokens';

type Props = {
  tone?: Tone;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  /** 0 = tint-only (no native blur). Use for nested controls to avoid layout glitches. */
  blur?: number;
  padded?: boolean;
};

export function GlassPanel({
  tone = 'player',
  children,
  style,
  contentStyle,
  radius: corner = radius.lg,
  blur = Platform.OS === 'ios' ? 24 : 18,
  padded = true,
}: Props) {
  const c = themeOf(tone);
  const useBlur = blur > 0;

  return (
    <View
      collapsable={false}
      style={[styles.shell, { borderRadius: corner, borderColor: c.glassStroke }, style]}
    >
      {useBlur ? (
        <BlurView
          style={[StyleSheet.absoluteFillObject, { borderRadius: corner }]}
          blurType="dark"
          blurAmount={blur}
          reducedTransparencyFallbackColor={c.bgCard}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: corner,
            backgroundColor: useBlur ? c.glassTint : c.glassFill,
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    zIndex: 1,
  },
});
