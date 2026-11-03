import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

export function IconDesk({ size = 22, color = '#d4af37' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="14" rx="2" stroke={color} strokeWidth={1.6} />
      <Path d="M8 20h8" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconBag({ size = 22, color = '#d4af37' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 8V7a5 5 0 0 1 10 0v1"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Rect x="5" y="8" width="14" height="13" rx="2" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function IconLock({ size = 22, color = '#d4af37' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth={1.6} />
      <Path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconTeam({ size = 22, color = '#d4af37' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="9" r="3" stroke={color} strokeWidth={1.6} />
      <Circle cx="16" cy="10" r="2.5" stroke={color} strokeWidth={1.6} />
      <Path
        d="M4 19c0-2.5 2.2-4 5-4s5 1.5 5 4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path d="M14 19c0-1.8 1.4-3 3.5-3" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevron({ size = 20, color = '#9a9488' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconKeyMark({ size = 32, color = '#d4af37' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x="4" y="4" width="24" height="24" rx="6" stroke={color} strokeWidth={2} />
      <Path
        d="M11 16h10M16 11v10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx="16" cy="16" r="3" fill={color} fillOpacity={0.25} />
    </Svg>
  );
}
