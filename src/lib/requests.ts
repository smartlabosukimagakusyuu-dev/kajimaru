// 頼みごとのFirestoreでの読み書き
import {
  addDoc,
  collection,
  deleteField,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { HouseRequest, RequestStatus } from '@/types';

const requestsCol = (householdId: string) => collection(db, 'households', householdId, 'requests');

export function subscribeRequests(householdId: string, onChange: (list: HouseRequest[]) => void) {
  return onSnapshot(query(requestsCol(householdId), orderBy('createdAt', 'desc')), (snap) =>
    onChange(
      snap.docs.map((d) => {
        const data = d.data({ serverTimestamps: 'estimate' });
        return {
          id: d.id,
          text: data.text,
          place: data.place,
          from: data.from,
          to: data.to,
          due: (data.due as Timestamp).toDate().toISOString(),
          notifyTime: data.notifyTime,
          status: data.status,
          remindCount: data.remindCount ?? 0,
        };
      }),
    ),
  );
}

/** 期限の何時間前に「覚えてる？」と再通知するか */
const REMIND_HOURS_BEFORE_DUE = 3;

/**
 * 通知する日時を決める。
 * - はじめのお知らせ：今日の指定時間（もう過ぎていたら、すぐ）
 * - 再通知：期限の少し前に1回だけ（はじめのお知らせより後のときだけ）
 * 送るのはサーバー（Cloud Functions）で、nextNotifyAt になったら送る。
 */
function notifySchedule(notifyTime: string, due: Date) {
  const [hour, minute] = notifyTime.split(':').map(Number);
  const now = new Date();
  const notifyAt = new Date(now);
  notifyAt.setHours(hour, minute, 0, 0);
  if (notifyAt < now) notifyAt.setTime(now.getTime());
  const remindAt = new Date(due.getTime() - REMIND_HOURS_BEFORE_DUE * 60 * 60 * 1000);
  return {
    remindAt: remindAt > notifyAt ? Timestamp.fromDate(remindAt) : null,
    nextNotifyAt: Timestamp.fromDate(notifyAt),
    nextNotifyKind: 'request',
  };
}

export async function addRequest(
  householdId: string,
  from: string,
  req: { to: string; text: string; place?: string; due: string; notifyTime: string },
) {
  await addDoc(requestsCol(householdId), {
    ...notifySchedule(req.notifyTime, new Date(req.due)),
    to: req.to,
    text: req.text,
    // Firestoreは「値なし(undefined)」を保存できないので、場所がないときは項目ごと入れない
    ...(req.place ? { place: req.place } : {}),
    due: Timestamp.fromDate(new Date(req.due)),
    notifyTime: req.notifyTime,
    from,
    status: 'waiting',
    remindCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function setRequestStatus(householdId: string, id: string, status: RequestStatus) {
  await updateDoc(doc(requestsCol(householdId), id), {
    status,
    // 完了したら、この先のお知らせは送らない
    ...(status === 'done' ? { nextNotifyAt: deleteField(), nextNotifyKind: deleteField() } : {}),
    updatedAt: serverTimestamp(),
  });
}

/** 「あとで」：30分後にもう一度だけお知らせする（サーバーが送る） */
export async function snoozeRequest(householdId: string, id: string) {
  await updateDoc(doc(requestsCol(householdId), id), {
    nextNotifyAt: Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000)),
    nextNotifyKind: 'snooze',
    remindCount: increment(1),
  });
}
