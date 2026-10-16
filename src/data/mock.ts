// 画面のイメージ確認用の見本データ。Firebaseにつないだら使わなくなる。
import { addDays } from '@/lib/date';
import type { Garbage, ShoppingItem } from '@/types';

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

export const mockShopping: ShoppingItem[] = [
  { id: 's1', name: '牛乳', store: 'スーパー', addedBy: PARTNER, bought: false },
  { id: 's2', name: 'たまご', store: 'スーパー', addedBy: ME, bought: false },
  { id: 's3', name: '洗濯洗剤', store: 'ドラッグストア', addedBy: PARTNER, bought: false },
  { id: 's4', name: 'トイレットペーパー', store: 'ドラッグストア', addedBy: ME, bought: true },
];
