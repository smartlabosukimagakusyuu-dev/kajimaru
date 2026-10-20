// 家族の作成・招待コードでの参加（Firestore）
import { FirebaseError } from 'firebase/app';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

export const MAX_MEMBERS = 2;
export const MEMBER_COLORS = ['#F28C28', '#3B9C8F'];

/** Firestoreの users/{uid} */
export type UserProfile = {
  displayName: string;
  color: string;
  householdId?: string;
  notificationsOn: boolean;
  /** このユーザーのスマホに通知を送るためのトークン（スマホ版でログインすると保存される） */
  expoPushToken?: string;
};

/** Firestoreの households/{householdId} */
export type Household = {
  id: string;
  name: string;
  createdBy: string;
  memberIds: string[];
  inviteCode: string;
  plan: 'free';
};

// 見間違えやすい文字（0とO、1とIなど）は使わない
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

/** 入力された招待コードを、保存している形（大文字・記号なし）にそろえる */
export function normalizeCode(input: string) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** 表示用に「ABC-123」の形にする */
export function formatCode(code: string) {
  return code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

export async function createHousehold(uid: string, displayName: string) {
  let code = randomCode();
  // ほぼ起きないが、同じコードがすでにあれば作り直す
  while ((await getDoc(doc(db, 'inviteCodes', code))).exists()) code = randomCode();

  const householdRef = doc(collection(db, 'households'));
  const batch = writeBatch(db);
  batch.set(householdRef, {
    name: `${displayName}の家族`,
    createdBy: uid,
    memberIds: [uid],
    inviteCode: code,
    plan: 'free',
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'inviteCodes', code), { householdId: householdRef.id });
  batch.set(
    doc(db, 'users', uid),
    { displayName, color: MEMBER_COLORS[0], householdId: householdRef.id, notificationsOn: true },
    { merge: true },
  );
  await batch.commit();
}

/**
 * 招待コードで家族に参加する。
 * すでに別の家族（自分ひとりで作った家族など）に入っている場合は、そこから抜けて移る。
 */
export async function joinHousehold(
  uid: string,
  displayName: string,
  input: string,
  currentHouseholdId?: string,
) {
  const code = normalizeCode(input);
  const invite = await getDoc(doc(db, 'inviteCodes', code));
  if (!invite.exists()) throw new Error('招待コードが見つかりません。もう一度確かめてください');
  const householdId = invite.data().householdId as string;
  if (householdId === currentHouseholdId) throw new Error('すでにこの家族に入っています');

  const batch = writeBatch(db);
  if (currentHouseholdId) {
    batch.update(doc(db, 'households', currentHouseholdId), { memberIds: arrayRemove(uid) });
  }
  batch.update(doc(db, 'households', householdId), {
    memberIds: arrayUnion(uid),
    lastJoinCode: code,
  });
  // merge：通知用トークンなど、ほかの項目は残す
  batch.set(
    doc(db, 'users', uid),
    { displayName, color: MEMBER_COLORS[1], householdId, notificationsOn: true },
    { merge: true },
  );
  try {
    await batch.commit();
  } catch (e) {
    if (e instanceof FirebaseError && e.code === 'permission-denied') {
      throw new Error(`この家族に参加できませんでした。無料版は${MAX_MEMBERS}人までです`);
    }
    throw e;
  }
}

/** 家族から抜ける（抜けたあとは「はじめの設定」で、家族を作るか参加し直す） */
export async function leaveHousehold(uid: string, householdId: string) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'households', householdId), { memberIds: arrayRemove(uid) });
  batch.update(doc(db, 'users', uid), { householdId: deleteField() });
  await batch.commit();
}

export async function updateProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', uid), data);
}
