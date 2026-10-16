import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { TimePicker } from '@/components/time-picker';
import { Button, Chip, ChipRow, Field, Label, Screen } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { addDays } from '@/lib/date';
import { useApp } from '@/store/app-store';

const SUGGESTIONS = ['牛乳を買う', '洗濯物を取り込む', '保育園のお迎え', 'ゴミを出す', '書類にサインする'];

const PLACES = ['スーパー', 'コンビニ', 'ドラッグストア', '駅前', '保育園・学校', '家'];

const DUE_OPTIONS = [
  { label: '今日中', days: 0 },
  { label: '明日まで', days: 1 },
  { label: '3日以内', days: 3 },
  { label: '1週間以内', days: 7 },
];

export default function RequestNewScreen() {
  const { members, viewerId, partnerId, addRequest } = useApp();
  const [to, setTo] = useState(partnerId ?? '');
  const [text, setText] = useState('');
  const [place, setPlace] = useState('');
  const [dueDays, setDueDays] = useState(0);
  const [time, setTime] = useState('17:00');

  const others = members.filter((m) => m.id !== viewerId);

  const save = () => {
    addRequest({
      to,
      text: text.trim(),
      place: place.trim() || undefined,
      due: addDays(new Date(), dueDays).toISOString(),
      notifyTime: time,
    });
    router.back();
  };

  return (
    <Screen edges={['bottom']}>
      <Label>誰に</Label>
      <ChipRow>
        {others.map((m) => (
          <Chip key={m.id} label={m.name} selected={to === m.id} onPress={() => setTo(m.id)} />
        ))}
        {others.length === 0 && (
          <Text style={{ fontSize: 13, color: Colors.subText }}>
            まだ家族がいません。「その他 → 家族・招待」からパートナーを招待してください。
          </Text>
        )}
      </ChipRow>

      <Label>何を</Label>
      <ChipRow>
        {SUGGESTIONS.map((s) => (
          <Chip key={s} label={s} selected={text === s} onPress={() => setText(s)} />
        ))}
      </ChipRow>
      <Field value={text} onChangeText={setText} placeholder="例：牛乳を買ってきてほしい" />

      <Label>どこで（なくてもOK）</Label>
      <ChipRow>
        {PLACES.map((p) => (
          <Chip key={p} label={p} selected={place === p} onPress={() => setPlace(place === p ? '' : p)} />
        ))}
      </ChipRow>
      <Field value={place} onChangeText={setPlace} placeholder="例：駅前のスーパー" />

      <Label>いつまでに</Label>
      <ChipRow>
        {DUE_OPTIONS.map((o) => (
          <Chip key={o.label} label={o.label} selected={dueDays === o.days} onPress={() => setDueDays(o.days)} />
        ))}
      </ChipRow>

      <Label>相手にお知らせする時間</Label>
      <TimePicker value={time} onChange={setTime} />
      <Text style={{ fontSize: 13, color: Colors.subText, lineHeight: 19 }}>
        終わっていなければ、期限の少し前に1回だけ「覚えてる？」とお知らせします。
      </Text>

      <Button label="お願いを送る" disabled={!to || !text.trim()} onPress={save} />
    </Screen>
  );
}
