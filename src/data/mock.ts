// 画面のイメージ確認用の見本データ。Firebaseにつないだら使わなくなる。
import { addDays } from '@/lib/date';
import type { Activity, Chore, Garbage, HouseRequest, Member, ShoppingItem } from '@/types';

export const ME = 'u1';
export const PARTNER = 'u2';

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

export const mockMembers: Member[] = [
  { id: ME, name: 'わたし', color: '#F28C28' },
  { id: PARTNER, name: 'パートナー', color: '#3B9C8F' },
];

export const mockChores: Chore[] = [
  {
    id: 'c1',
    name: 'お風呂掃除',
    assignMode: 'rotation',
    assignees: [ME, PARTNER],
    rotationIndex: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    notifyTime: '19:00',
  },
  {
    id: 'c2',
    name: '食器洗い',
    assignMode: 'fixed',
    assignees: [PARTNER],
    rotationIndex: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    notifyTime: '20:30',
  },
  {
    id: 'c3',
    name: '洗濯',
    assignMode: 'anyone',
    assignees: [],
    rotationIndex: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    notifyTime: '08:00',
    lastDoneAt: minutesAgo(90),
    lastDoneBy: PARTNER,
  },
  {
    id: 'c4',
    name: '掃除機がけ',
    assignMode: 'fixed',
    assignees: [ME],
    rotationIndex: 0,
    days: [3, 6],
    notifyTime: '10:00',
  },
];

const tomorrow = addDays(now, 1);

export const mockGarbage: Garbage[] = [
  {
    id: 'g1',
    kind: '燃えるゴミ',
    // 見本では必ず「明日」が含まれるようにしておく
    rule: { type: 'weekly', days: [...new Set([tomorrow.getDay(), 1, 4])] },
    notifyTime: '21:00',
    notifyTo: 'all',
  },
  {
    id: 'g2',
    kind: '資源ゴミ',
    rule: { type: 'nth', weeks: [2, 4], day: 3 },
    notifyTime: '21:00',
    notifyTo: 'duty',
  },
];

export const mockRequests: HouseRequest[] = [
  {
    id: 'r1',
    text: '牛乳を買う',
    place: '駅前のスーパー',
    from: PARTNER,
    to: ME,
    due: now.toISOString(),
    notifyTime: '17:00',
    status: 'waiting',
    remindCount: 0,
  },
  {
    id: 'r2',
    text: '保育園の連絡帳を書く',
    from: PARTNER,
    to: ME,
    due: addDays(now, 1).toISOString(),
    notifyTime: '21:00',
    status: 'ok',
    remindCount: 0,
  },
  {
    id: 'r3',
    text: 'クリーニングを受け取る',
    place: '本町のクリーニング店',
    from: ME,
    to: PARTNER,
    due: addDays(now, 1).toISOString(),
    notifyTime: '18:00',
    status: 'waiting',
    remindCount: 1,
  },
];

export const mockShopping: ShoppingItem[] = [
  { id: 's1', name: '牛乳', store: 'スーパー', addedBy: PARTNER, bought: false },
  { id: 's2', name: 'たまご', store: 'スーパー', addedBy: ME, bought: false },
  { id: 's3', name: '洗濯洗剤', store: 'ドラッグストア', addedBy: PARTNER, bought: false },
  { id: 's4', name: 'トイレットペーパー', store: 'ドラッグストア', addedBy: ME, bought: true },
];

export const mockActivities: Activity[] = [
  { id: 'a1', by: PARTNER, text: '洗濯', at: minutesAgo(90) },
  { id: 'a2', by: ME, text: 'ゴミ出し', at: minutesAgo(60 * 10), thankedBy: PARTNER },
];
