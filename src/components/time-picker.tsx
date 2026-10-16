import { Chip, ChipRow } from '@/components/ui';

const DEFAULT_TIMES = ['07:00', '08:00', '10:00', '12:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

/** 通知時間を選ぶ（いまはよく使う時間から選ぶだけの簡単な形） */
export function TimePicker({
  value,
  onChange,
  times = DEFAULT_TIMES,
}: {
  value: string;
  onChange: (time: string) => void;
  times?: string[];
}) {
  return (
    <ChipRow>
      {times.map((t) => (
        <Chip key={t} label={t} selected={value === t} onPress={() => onChange(t)} />
      ))}
    </ChipRow>
  );
}
