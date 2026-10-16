// 買いたいものメモのFirestoreでの読み書き
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { ShoppingItem } from '@/types';

const shoppingCol = (householdId: string) => collection(db, 'households', householdId, 'shopping');

export function subscribeShopping(householdId: string, onChange: (list: ShoppingItem[]) => void) {
  return onSnapshot(query(shoppingCol(householdId), orderBy('createdAt')), (snap) =>
    onChange(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          store: data.store,
          addedBy: data.addedBy,
          bought: !!data.bought,
        };
      }),
    ),
  );
}

export async function addShopping(householdId: string, uid: string, name: string, store: string) {
  await addDoc(shoppingCol(householdId), {
    name,
    store,
    addedBy: uid,
    bought: false,
    createdAt: serverTimestamp(),
  });
}

export async function setBought(householdId: string, id: string, bought: boolean) {
  await updateDoc(doc(shoppingCol(householdId), id), { bought });
}

/** 購入済みのものをまとめて消す */
export async function clearBought(householdId: string, ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(shoppingCol(householdId), id)));
  await batch.commit();
}
