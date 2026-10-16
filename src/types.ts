// 仕様書「4. データの設計（Firestore）」に合わせた型。
// いまは見本データで動かし、あとでFirestoreに置き換える。

export type Member = {
  id: string;
  name: string;
  color: string;
  /** アイコンの写真。なければ名前の1文字目を表示する */
  photoUri?: string;
};

export type AssignMode = 'fixed' | 'rotation' | 'anyone';

export type Chore = {
  id: string;
  name: string;
  assignMode: AssignMode;
  /** 担当者（固定・交代制のとき）。交代制はこの順番で回る */
  assignees: string[];
  rotationIndex: number;
  /** 0=日曜 〜 6=土曜 */
  days: number[];
  notifyTime: string;
  lastDoneAt?: string;
  lastDoneBy?: string;
  /** 完了したときの記録のID（取り消すときに記録も消すため） */
  lastActivityId?: string;
};

export type GarbageRule =
  | { type: 'weekly'; days: number[] }
  | { type: 'nth'; weeks: number[]; day: number };

export type Garbage = {
  id: string;
  kind: string;
  rule: GarbageRule;
  /** 前日に通知する時間 */
  notifyTime: string;
  notifyTo: 'all' | 'duty';
};

export type RequestStatus = 'waiting' | 'ok' | 'maybe' | 'done';

export type HouseRequest = {
  id: string;
  text: string;
  /** 場所のメモ（例：駅前のスーパー）。なくてもよい */
  place?: string;
  from: string;
  to: string;
  due: string;
  notifyTime: string;
  status: RequestStatus;
  remindCount: number;
};

export type ShoppingItem = {
  id: string;
  name: string;
  store: string;
  addedBy: string;
  bought: boolean;
};

export type Activity = {
  id: string;
  by: string;
  text: string;
  at: string;
  thankedBy?: string;
};
