import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { motion } from '../theme/tokens';

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

export function PressableScale({ children, style, haptic = true, onPress, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      onPress={e => {
        if (haptic) {
          try {
            ReactNativeHapticFeedback.trigger('impactLight');
          } catch {
            /* optional */
          }
        }
        onPress?.(e);
      }}
      style={({ pressed }) => [
        style,
        { transform: [{ scale: pressed ? motion.pressScale : 1 }] },
        pressed && { opacity: 0.92 },
      ]}
    >
      {children}
    </Pressable>
  );
}
