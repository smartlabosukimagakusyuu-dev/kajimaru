import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { TimePicker } from '@/components/time-picker';
import { Button, Chip, ChipRow, Field, Label, Screen, Segmented } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { WEEKDAYS } from '@/lib/date';
import { useApp } from '@/store/app-store';
import type { AssignMode } from '@/types';

const TEMPLATES = ['お風呂掃除', '食器洗い', '洗濯', '洗濯物たたみ', '掃除機がけ', '料理', 'トイレ掃除', '植物の水やり'];

export default function ChoreNewScreen() {
  const { members, addChore } = useApp();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<AssignMode>('rotation');
  const [assignees, setAssignees] = useState<string[]>(members.map((m) => m.id));
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [time, setTime] = useState('19:00');

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const changeMode = (next: AssignMode) => {
    setMode(next);
    // 固定は1人だけ選ぶ
    if (next === 'fixed') setAssignees((list) => list.slice(0, 1));
    if (next === 'rotation') setAssignees(members.map((m) => m.id));
  };

  const canSave =
    name.trim() && days.length > 0 && (mode === 'anyone' || assignees.length > 0);

  const save = () => {
    addChore({
      name: name.trim(),
      assignMode: mode,
      assignees: mode === 'anyone' ? [] : assignees,
      days,
      notifyTime: time,
    });
    router.back();
  };

  return (
    <Screen edges={['bottom']}>
      <Label>家事を選ぶ</Label>
      <ChipRow>
        {TEMPLATES.map((t) => (
          <Chip key={t} label={t} selected={name === t} onPress={() => setName(t)} />
        ))}
      </ChipRow>
      <Field value={name} onChangeText={setName} placeholder="自由に入力もできます" />

      <Label>担当の決め方</Label>
      <Segmented
        value={mode}
        onChange={changeMode}
        options={[
          { value: 'fixed', label: '固定' },
          { value: 'rotation', label: '交代制' },
          { value: 'anyone', label: 'できる人' },
        ]}
      />
      <Text style={{ fontSize: 13, color: Colors.subText }}>
        {
          {
            fixed: 'いつも同じ人が担当します',
            rotation: '完了するたびに、次の人へ担当が交代します',
            anyone: '担当を決めず、できる人がやります（全員にお知らせ）',
          }[mode]
        }
      </Text>
      {mode !== 'anyone' && (
        <ChipRow>
          {members.map((m) => (
            <Chip
              key={m.id}
              label={m.name}
              selected={assignees.includes(m.id)}
              onPress={() => setAssignees(mode === 'fixed' ? [m.id] : toggle(assignees, m.id))}
            />
          ))}
        </ChipRow>
      )}

      <Label>曜日</Label>
      <ChipRow>
        {WEEKDAYS.map((w, i) => (
          <Chip key={w} label={w} selected={days.includes(i)} onPress={() => setDays(toggle(days, i))} />
        ))}
      </ChipRow>

      <Label>お知らせする時間（当日・担当の人へ）</Label>
      <TimePicker value={time} onChange={setTime} />

      <Button label="この内容で作る" disabled={!canSave} onPress={save} />
    </Screen>
  );
}
