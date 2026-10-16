// ゴミ出しのFirestoreでの読み書き
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Garbage } from '@/types';

const garbageCol = (householdId: string) => collection(db, 'households', householdId, 'garbage');

export function subscribeGarbage(householdId: string, onChange: (list: Garbage[]) => void) {
  return onSnapshot(query(garbageCol(householdId), orderBy('createdAt')), (snap) =>
    onChange(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          kind: data.kind,
          rule: data.rule,
          notifyTime: data.notifyTime,
          notifyTo: data.notifyTo,
        };
      }),
    ),
  );
}

export async function addGarbage(householdId: string, item: Omit<Garbage, 'id'>) {
  await addDoc(garbageCol(householdId), { ...item, createdAt: serverTimestamp() });
}

export async function deleteGarbage(householdId: string, id: string) {
  await deleteDoc(doc(garbageCol(householdId), id));
}
