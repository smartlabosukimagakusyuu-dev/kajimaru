import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Card, Screen, Title } from '@/components/ui';
import { Colors } from '@/constants/colors';

const MENU: { emoji: string; label: string; href: Href }[] = [
  { emoji: '🗑️', label: 'ゴミ出し設定', href: '/garbage' },
  { emoji: '👨‍👩‍👧', label: '家族・招待', href: '/family' },
  { emoji: '⚙️', label: '設定', href: '/settings' },
];

export default function MoreScreen() {
  return (
    <Screen>
      <Title>その他</Title>
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        {MENU.map((m, i) => (
          <Pressable
            key={m.label}
            onPress={() => router.push(m.href)}
            style={[styles.row, i > 0 && styles.rowBorder]}>
            <Text style={styles.emoji}>{m.emoji}</Text>
            <Text style={styles.label}>{m.label}</Text>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  emoji: { fontSize: 20 },
  label: { flex: 1, fontSize: 16, color: Colors.text },
  arrow: { fontSize: 22, color: Colors.subText },
});
