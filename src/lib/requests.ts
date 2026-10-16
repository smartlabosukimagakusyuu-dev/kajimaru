// 頼みごとのFirestoreでの読み書き
import {
  addDoc,
  collection,
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

export async function addRequest(
  householdId: string,
  from: string,
  req: { to: string; text: string; place?: string; due: string; notifyTime: string },
) {
  await addDoc(requestsCol(householdId), {
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
  await updateDoc(doc(requestsCol(householdId), id), { status, updatedAt: serverTimestamp() });
}

/** 「あとで」：30分後にもう一度お知らせする（実際の通知はNo.7でサーバーから送る） */
export async function snoozeRequest(householdId: string, id: string) {
  await updateDoc(doc(requestsCol(householdId), id), {
    snoozeUntil: Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000)),
    remindCount: increment(1),
  });
}
