// 当番と「家族の完了状況（記録）」のFirestoreでの読み書き
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Activity, Chore } from '@/types';

const choresCol = (householdId: string) => collection(db, 'households', householdId, 'chores');
const activityCol = (householdId: string) => collection(db, 'households', householdId, 'activity');

/** Firestoreの日時を、画面で使っている文字列（ISO形式）にする */
function toIso(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined;
}

function toChore(id: string, data: DocumentData): Chore {
  return {
    id,
    name: data.name,
    assignMode: data.assignMode,
    assignees: data.assignees ?? [],
    rotationIndex: data.rotationIndex ?? 0,
    days: data.days ?? [],
    notifyTime: data.notifyTime,
    lastDoneAt: toIso(data.lastDoneAt),
    lastDoneBy: data.lastDoneBy,
    lastActivityId: data.lastActivityId,
  };
}

export function subscribeChores(householdId: string, onChange: (chores: Chore[]) => void) {
  return onSnapshot(query(choresCol(householdId), orderBy('createdAt')), (snap) =>
    onChange(
      snap.docs.map((d) => toChore(d.id, d.data({ serverTimestamps: 'estimate' }))),
    ),
  );
}

export async function addChore(
  householdId: string,
  chore: Omit<Chore, 'id' | 'rotationIndex' | 'lastDoneAt' | 'lastDoneBy' | 'lastActivityId'>,
) {
  await addDoc(choresCol(householdId), { ...chore, rotationIndex: 0, createdAt: serverTimestamp() });
}

export async function deleteChore(householdId: string, choreId: string) {
  await deleteDoc(doc(choresCol(householdId), choreId));
}

/** 当番を完了にして、家族の完了状況にも記録する（交代制なら次の人へ交代） */
export async function completeChore(householdId: string, chore: Chore, uid: string) {
  const activityRef = doc(activityCol(householdId));
  const batch = writeBatch(db);
  batch.set(activityRef, { by: uid, text: chore.name, at: serverTimestamp() });
  batch.update(doc(choresCol(householdId), chore.id), {
    lastDoneAt: serverTimestamp(),
    lastDoneBy: uid,
    lastActivityId: activityRef.id,
    ...(chore.assignMode === 'rotation' ? { rotationIndex: increment(1) } : {}),
  });
  await batch.commit();
}

/** 完了を取り消す（記録も消し、交代制なら担当を戻す） */
export async function undoChore(householdId: string, chore: Chore) {
  const batch = writeBatch(db);
  batch.update(doc(choresCol(householdId), chore.id), {
    lastDoneAt: deleteField(),
    lastDoneBy: deleteField(),
    lastActivityId: deleteField(),
    ...(chore.assignMode === 'rotation' && chore.rotationIndex > 0
      ? { rotationIndex: increment(-1) }
      : {}),
  });
  if (chore.lastActivityId) batch.delete(doc(activityCol(householdId), chore.lastActivityId));
  await batch.commit();
}

export function subscribeActivities(householdId: string, onChange: (list: Activity[]) => void) {
  return onSnapshot(query(activityCol(householdId), orderBy('at', 'desc'), limit(20)), (snap) =>
    onChange(
      snap.docs.map((d) => {
        const data = d.data({ serverTimestamps: 'estimate' });
        return {
          id: d.id,
          by: data.by,
          text: data.text,
          at: toIso(data.at) ?? new Date().toISOString(),
          thankedBy: data.thankedBy,
        };
      }),
    ),
  );
}

export async function addActivity(householdId: string, uid: string, text: string) {
  await addDoc(activityCol(householdId), { by: uid, text, at: serverTimestamp() });
}

export async function thankActivity(householdId: string, activityId: string, uid: string) {
  await updateDoc(doc(activityCol(householdId), activityId), { thankedBy: uid });
}
