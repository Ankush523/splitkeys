import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, GhostButton, Screen, Title } from './primitives';
import { F, playerTheme, radius, space } from '../theme/tokens';

export function ClueCard({
  title,
  body,
  kind,
  onPress,
}: {
  title: string;
  body: string;
  kind: string;
  onPress?: () => void;
}) {
  const hint = kind === 'hint';
  const content = (
    <View style={[styles.card, hint && styles.hintCard]}>
      <Text style={styles.kicker}>{hint ? 'Hint' : 'Evidence'}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body} numberOfLines={onPress ? 3 : undefined}>
        {body}
      </Text>
      {onPress ? <Text style={styles.more}>Open</Text> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      {content}
    </Pressable>
  );
}

export function ClueDetailModal({
  visible,
  title,
  body,
  kind,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  kind: string;
  onClose: () => void;
}) {
  const hint = kind === 'hint';
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen tone="player">
        <SafeAreaView style={detailStyles.safe} edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={detailStyles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <Text style={detailStyles.kicker}>{hint ? 'Hint' : 'Evidence'}</Text>
            <Title>{title}</Title>
            <Body>{body}</Body>
          </ScrollView>
          <View style={detailStyles.footer}>
            <GhostButton label="Close" onPress={onClose} />
          </View>
        </SafeAreaView>
      </Screen>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: space.lg },
  scroll: {
    flexGrow: 1,
    paddingTop: space.md,
    paddingBottom: space.xl,
    gap: space.md,
  },
  footer: { paddingVertical: space.sm },
  kicker: {
    fontFamily: F.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: playerTheme.muted,
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: playerTheme.bgElevated,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: playerTheme.line,
    padding: space.md,
    gap: space.sm,
  },
  hintCard: {
    borderColor: playerTheme.accent,
    backgroundColor: playerTheme.accentSoft,
  },
  kicker: {
    fontFamily: F.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: playerTheme.muted,
  },
  title: {
    fontFamily: F.semibold,
    fontSize: 18,
    color: playerTheme.text,
  },
  body: {
    fontFamily: F.regular,
    fontSize: 15,
    lineHeight: 22,
    color: playerTheme.muted,
  },
  more: {
    fontFamily: F.medium,
    fontSize: 13,
    color: playerTheme.accent,
    marginTop: 4,
  },
});
