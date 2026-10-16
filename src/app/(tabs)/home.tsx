import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChoreRow } from '@/components/chore-row';
import { RequestCard } from '@/components/request-card';
import { AdBanner, Avatar, Button, Card, Empty, Screen, SectionTitle, Title } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { addDays, formatTimeAgo, WEEKDAYS } from '@/lib/date';
import { choresOn, isGarbageDay } from '@/lib/logic';
import { useApp } from '@/store/app-store';

export default function HomeScreen() {
  const { chores, garbage, requests, activities, members, viewerId, memberName, thank } = useApp();
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const todayChores = choresOn(chores, today);
  const tomorrowGarbage = garbage.filter((g) => isGarbageDay(g, tomorrow));
  const askedOfMe = requests.filter((r) => r.to === viewerId && r.status !== 'done');
  const me = members.find((m) => m.id === viewerId);

  return (
    <Screen footer={<AdBanner />}>
      <View style={styles.greeting}>
        <View style={{ flex: 1 }}>
          <Title sub={`${today.getMonth() + 1}月${today.getDate()}日（${WEEKDAYS[today.getDay()]}）`}>
            {me?.name}さん、こんにちは
          </Title>
        </View>
        <Pressable onPress={() => router.push('/settings')}>
          <Avatar
            name={me?.name ?? '?'}
            color={me?.color ?? Colors.primary}
            photoUri={me?.photoUri}
            size={48}
          />
        </Pressable>
      </View>

      <Card style={tomorrowGarbage.length ? styles.garbageCard : undefined}>
        <Text style={styles.cardLabel}>🗑️ 明日のゴミ出し</Text>
        {tomorrowGarbage.length ? (
          <Text style={styles.garbageText}>
            明日は{tomorrowGarbage.map((g) => g.kind).join('・')}の日です
          </Text>
        ) : (
          <Empty>明日はゴミの日ではありません</Empty>
        )}
      </Card>

      <SectionTitle>今日の当番</SectionTitle>
      <Card>
        {todayChores.length ? (
          todayChores.map((c) => <ChoreRow key={c.id} chore={c} />)
        ) : chores.length ? (
          <Empty>今日の当番はありません</Empty>
        ) : (
          <>
            <Empty>まだ当番がありません。お風呂掃除や食器洗いなど、家事の担当を決めましょう。</Empty>
            <Button label="＋ 当番を作る" small onPress={() => router.push('/chore-new')} />
          </>
        )}
      </Card>

      <SectionTitle>あなたが頼まれていること</SectionTitle>
      {askedOfMe.length ? (
        askedOfMe.map((r) => <RequestCard key={r.id} request={r} mode="received" />)
      ) : (
        <Card>
          <Empty>いまはありません</Empty>
        </Card>
      )}
      <Button label="＋ 頼みごとをする" variant="secondary" onPress={() => router.push('/request-new')} />

      <SectionTitle>家族の完了状況</SectionTitle>
      <Card>
        {activities.length ? (
          activities.slice(0, 5).map((a) => {
            const member = members.find((m) => m.id === a.by);
            const canThank = a.by !== viewerId && !a.thankedBy;
            return (
              <View key={a.id} style={styles.activityRow}>
                <Avatar
                  name={member?.name ?? '?'}
                  color={member?.color ?? Colors.done}
                  photoUri={member?.photoUri}
                  size={32}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}>
                    {memberName(a.by)}さんが「{a.text}」を完了
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatTimeAgo(a.at)}
                    {a.thankedBy ? `　💐 ${memberName(a.thankedBy)}さんがありがとう` : ''}
                  </Text>
                </View>
                {canThank && <Button label="ありがとう" small variant="secondary" onPress={() => thank(a.id)} />}
              </View>
            );
          })
        ) : (
          <Empty>まだ記録はありません</Empty>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  garbageCard: { backgroundColor: Colors.accentSoft, borderColor: Colors.accentSoft },
  cardLabel: { fontSize: 13, fontWeight: '700', color: Colors.subText },
  garbageText: { fontSize: 18, fontWeight: '800', color: Colors.text },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityText: { fontSize: 14, color: Colors.text },
  activityTime: { fontSize: 12, color: Colors.subText, marginTop: 2 },
});
