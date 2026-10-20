import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ChoreRow } from '@/components/chore-row';
import { AdBanner } from '@/components/ad-banner';
import { Badge, Button, Card, Empty, Screen, SectionTitle, Title } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { formatDaysLabel } from '@/lib/date';
import { ASSIGN_MODE_LABEL, choresOn } from '@/lib/logic';
import { useApp } from '@/store/app-store';

export default function ChoresScreen() {
  const { chores, memberName, assigneeName, removeChore } = useApp();
  const todayChores = choresOn(chores, new Date());

  return (
    <Screen footer={<AdBanner />}>
      <Title sub="家事の担当と、お知らせする時間を決めます">当番</Title>
      <Button label="＋ 当番を作る" onPress={() => router.push('/chore-new')} />

      <SectionTitle>今日の当番</SectionTitle>
      <Card>
        {todayChores.length ? (
          todayChores.map((c) => <ChoreRow key={c.id} chore={c} />)
        ) : (
          <Empty>今日の当番はありません</Empty>
        )}
      </Card>

      <SectionTitle>すべての当番</SectionTitle>
      {chores.map((c) => (
        <Card key={c.id}>
          <View style={styles.head}>
            <Text style={styles.name}>{c.name}</Text>
            <Badge label={ASSIGN_MODE_LABEL[c.assignMode]} color={Colors.accent} bg={Colors.accentSoft} />
          </View>
          <Text style={styles.detail}>
            {c.assignMode === 'rotation'
              ? `順番：${c.assignees.map(memberName).join(' → ')}（次は${assigneeName(c)}さん）`
              : c.assignMode === 'fixed'
                ? `担当：${assigneeName(c)}さん`
                : '担当：できる人がやる'}
          </Text>
          <Text style={styles.detail}>
            {formatDaysLabel(c.days)}・{c.notifyTime}にお知らせ
          </Text>
          <Button
            label="削除"
            small
            variant="ghost"
            style={{ alignSelf: 'flex-end' }}
            onPress={() => removeChore(c.id)}
          />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '700', color: Colors.text },
  detail: { fontSize: 13, color: Colors.subText },
});
