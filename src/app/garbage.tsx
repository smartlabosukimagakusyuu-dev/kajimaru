import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TimePicker } from '@/components/time-picker';
import {
  Badge,
  Button,
  Card,
  Chip,
  ChipRow,
  Empty,
  Field,
  Label,
  Screen,
  Segmented,
  SectionTitle,
} from '@/components/ui';
import { Colors } from '@/constants/colors';
import { formatDaysLabel, WEEKDAYS } from '@/lib/date';
import { useApp } from '@/store/app-store';
import type { Garbage } from '@/types';

const KINDS = ['燃えるゴミ', '燃えないゴミ', '資源ゴミ', 'プラスチック', 'ペットボトル', '缶・びん', '古紙'];

function ruleLabel(g: Garbage) {
  if (g.rule.type === 'weekly') return `毎週 ${formatDaysLabel(g.rule.days)}曜日`;
  return `第${[...g.rule.weeks].sort().join('・')} ${WEEKDAYS[g.rule.day]}曜日`;
}

export default function GarbageScreen() {
  const { garbage, addGarbage, removeGarbage } = useApp();
  const [kind, setKind] = useState('');
  const [ruleType, setRuleType] = useState<'weekly' | 'nth'>('weekly');
  const [days, setDays] = useState<number[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [day, setDay] = useState<number | null>(null);
  const [time, setTime] = useState('21:00');
  const [notifyTo, setNotifyTo] = useState<'all' | 'duty'>('all');

  const toggle = (list: number[], v: number) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const canSave =
    kind.trim() && (ruleType === 'weekly' ? days.length > 0 : weeks.length > 0 && day !== null);

  const save = () => {
    addGarbage({
      kind: kind.trim(),
      rule: ruleType === 'weekly' ? { type: 'weekly', days } : { type: 'nth', weeks, day: day ?? 0 },
      notifyTime: time,
      notifyTo,
    });
    setKind('');
    setDays([]);
    setWeeks([]);
    setDay(null);
  };

  return (
    <Screen edges={['bottom']}>
      <SectionTitle>登録しているゴミの日</SectionTitle>
      {garbage.length ? (
        garbage.map((g) => (
          <Card key={g.id}>
            <View style={styles.head}>
              <Text style={styles.kind}>{g.kind}</Text>
              <Badge
                label={g.notifyTo === 'all' ? '全員に通知' : '当番の人に通知'}
                color={Colors.accent}
                bg={Colors.accentSoft}
              />
            </View>
            <Text style={styles.detail}>
              {ruleLabel(g)}・前日の{g.notifyTime}にお知らせ
            </Text>
            <Button
              label="削除"
              small
              variant="ghost"
              style={{ alignSelf: 'flex-end' }}
              onPress={() => removeGarbage(g.id)}
            />
          </Card>
        ))
      ) : (
        <Card>
          <Empty>まだ登録がありません</Empty>
        </Card>
      )}

      <SectionTitle>ゴミの日を追加</SectionTitle>
      <Card style={{ gap: 14 }}>
        <Label>ゴミの種類</Label>
        <ChipRow>
          {KINDS.map((k) => (
            <Chip key={k} label={k} selected={kind === k} onPress={() => setKind(k)} />
          ))}
        </ChipRow>
        <Field value={kind} onChangeText={setKind} placeholder="自由に入力もできます" />

        <Label>出す日</Label>
        <Segmented
          value={ruleType}
          onChange={setRuleType}
          options={[
            { value: 'weekly', label: '毎週' },
            { value: 'nth', label: '第◯週' },
          ]}
        />
        {ruleType === 'nth' && (
          <ChipRow>
            {[1, 2, 3, 4, 5].map((w) => (
              <Chip key={w} label={`第${w}`} selected={weeks.includes(w)} onPress={() => setWeeks(toggle(weeks, w))} />
            ))}
          </ChipRow>
        )}
        <ChipRow>
          {WEEKDAYS.map((w, i) => (
            <Chip
              key={w}
              label={w}
              selected={ruleType === 'weekly' ? days.includes(i) : day === i}
              onPress={() => (ruleType === 'weekly' ? setDays(toggle(days, i)) : setDay(i))}
            />
          ))}
        </ChipRow>

        <Label>前日にお知らせする時間</Label>
        <TimePicker value={time} onChange={setTime} times={['18:00', '19:00', '20:00', '21:00', '22:00']} />

        <Label>だれにお知らせする？</Label>
        <Segmented
          value={notifyTo}
          onChange={setNotifyTo}
          options={[
            { value: 'all', label: '全員' },
            { value: 'duty', label: '当番の人' },
          ]}
        />

        <Button label="登録する" disabled={!canSave} onPress={save} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kind: { fontSize: 17, fontWeight: '700', color: Colors.text },
  detail: { fontSize: 13, color: Colors.subText },
});
