export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** その月の第何週目の曜日か（1日〜7日が第1週） */
export function nthWeekOfMonth(date: Date) {
  return Math.ceil(date.getDate() / 7);
}

export function formatDaysLabel(days: number[]) {
  if (days.length === 7) return '毎日';
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAYS[d])
    .join('・');
}

export function formatDue(iso: string) {
  const due = new Date(iso);
  const today = new Date();
  if (isSameDay(due, today)) return '今日中';
  if (isSameDay(due, addDays(today, 1))) return '明日まで';
  return `${due.getMonth() + 1}/${due.getDate()}（${WEEKDAYS[due.getDay()]}）まで`;
}

export function formatTimeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}
