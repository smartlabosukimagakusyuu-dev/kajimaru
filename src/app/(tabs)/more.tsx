import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, ChipRow, Screen, SectionTitle, Title } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useApp } from '@/store/app-store';

const MENU: { emoji: string; label: string; href: Href }[] = [
  { emoji: '🗑️', label: 'ゴミ出し設定', href: '/garbage' },
  { emoji: '👨‍👩‍👧', label: '家族・招待', href: '/family' },
  { emoji: '⚙️', label: '設定', href: '/settings' },
];

export default function MoreScreen() {
  const { members, viewerId, setViewerId, showToast } = useApp();

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

      <SectionTitle>お試し：だれの画面で見る？</SectionTitle>
      <Card style={styles.demo}>
        <Text style={styles.demoText}>
          見本の画面だけの機能です。切り替えると、パートナーのスマホではどう見えるかを確認できます。
        </Text>
        <ChipRow>
          {members.map((m) => (
            <Chip
              key={m.id}
              label={m.name}
              selected={viewerId === m.id}
              onPress={() => {
                setViewerId(m.id);
                showToast(`${m.name}さんの画面に切り替えました`);
              }}
            />
          ))}
        </ChipRow>
      </Card>
      <View />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  emoji: { fontSize: 20 },
  label: { flex: 1, fontSize: 16, color: Colors.text },
  arrow: { fontSize: 22, color: Colors.subText },
  demo: { backgroundColor: Colors.primarySoft, borderColor: Colors.primarySoft },
  demoText: { fontSize: 13, color: Colors.text, lineHeight: 20 },
});
