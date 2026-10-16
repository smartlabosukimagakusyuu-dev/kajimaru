// 画面のイメージ確認用の見本データ。Firebaseにつないだら使わなくなる。
import { addDays } from '@/lib/date';
import type { Garbage, HouseRequest, ShoppingItem } from '@/types';

export const ME = 'u1';
export const PARTNER = 'u2';

const now = new Date();

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
