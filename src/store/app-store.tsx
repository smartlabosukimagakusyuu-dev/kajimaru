// アプリ全体のデータ置き場。
// ログイン・自分の情報・家族はFirebase、当番などはまだ見本データをメモリ上で動かしている。
// No.4以降で、見本データの部分をFirestoreの読み書きに置き換える。
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import {
  ME,
  mockActivities,
  mockChores,
  mockGarbage,
  mockRequests,
  mockShopping,
  PARTNER,
} from '@/data/mock';
import { formatCode, updateProfile, type Household, type UserProfile } from '@/lib/family';
import { auth, db } from '@/lib/firebase';
import { currentAssignee } from '@/lib/logic';
import type {
  Activity,
  Chore,
  Garbage,
  HouseRequest,
  Member,
  RequestStatus,
  ShoppingItem,
} from '@/types';

let idCounter = 100;
const newId = (prefix: string) => `${prefix}${++idCounter}`;

function useAppState() {
  /** Firebaseのログイン中のユーザー。ログイン状態の確認が終わるまでは undefined */
  const [user, setUser] = useState<User | null | undefined>(undefined);
  // 読み込んだデータは「だれの／どの家族の」データかと一緒に持ち、
  // ログインし直したときに前の人のデータが混ざらないようにする
  const [profileSnap, setProfileSnap] = useState<{ uid: string; data: UserProfile | null }>();
  const [householdSnap, setHouseholdSnap] = useState<Household | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});
  /** アイコンの写真（いまはこの端末の中だけ。共有はあとで対応） */
  const [photo, setPhoto] = useState<{ uid: string; uri?: string }>();

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(db, 'users', uid),
      (snap) => setProfileSnap({ uid, data: snap.exists() ? (snap.data() as UserProfile) : null }),
      () => setProfileSnap({ uid, data: null }),
    );
  }, [uid]);
  /** Firestoreの自分の情報。読み込み中は undefined、まだ無ければ null */
  const profile = uid && profileSnap?.uid === uid ? profileSnap.data : undefined;
  const photoUri = photo?.uid === uid ? photo?.uri : undefined;

  const householdId = profile?.householdId;
  useEffect(() => {
    if (!householdId) return;
    return onSnapshot(doc(db, 'households', householdId), (snap) =>
      setHouseholdSnap(snap.exists() ? ({ id: snap.id, ...snap.data() } as Household) : null),
    );
  }, [householdId]);
  const household = householdSnap?.id === householdId ? householdSnap : null;

  const memberIdsKey = household?.memberIds.join(',') ?? '';
  useEffect(() => {
    if (!memberIdsKey) return;
    const unsubscribes = memberIdsKey.split(',').map((id) =>
      onSnapshot(doc(db, 'users', id), (snap) => {
        if (snap.exists()) {
          setMemberProfiles((all) => ({ ...all, [id]: snap.data() as UserProfile }));
        }
      }),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [memberIdsKey]);

  // 当番などはまだ見本データなので、画面の中では「自分＝ME」「相手＝PARTNER」として扱う。
  // 名前と色はFirestoreの本物を使う。（No.4以降で本物のIDに置き換える）
  const partnerUid = household?.memberIds.find((id) => id !== uid);
  const myProfile = uid ? (memberProfiles[uid] ?? profile ?? undefined) : undefined;
  const partnerProfile = partnerUid ? memberProfiles[partnerUid] : undefined;
  const members: Member[] = [];
  if (myProfile) {
    members.push({ id: ME, name: myProfile.displayName, color: myProfile.color, photoUri });
  }
  if (partnerProfile) {
    members.push({ id: PARTNER, name: partnerProfile.displayName, color: partnerProfile.color });
  }

  const viewerId = ME;
  const [chores, setChores] = useState<Chore[]>(mockChores);
  const [garbage, setGarbage] = useState<Garbage[]>(mockGarbage);
  const [requests, setRequests] = useState<HouseRequest[]>(mockRequests);
  const [shopping, setShopping] = useState<ShoppingItem[]>(mockShopping);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const partnerId = members.find((m) => m.id !== viewerId)?.id;

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const memberName = (id: string | null | undefined) =>
    members.find((m) => m.id === id)?.name ?? (id === PARTNER ? 'パートナー' : 'だれか');

  const addActivity = (text: string) =>
    setActivities((list) => [
      { id: newId('a'), by: viewerId, text, at: new Date().toISOString() },
      ...list,
    ]);

  return {
    authReady: user !== undefined,
    loggedIn: !!user,
    /** ログイン済みで、Firestoreの自分の情報の読み込みが終わったか */
    profileReady: !!user && profile !== undefined,
    user,
    onboarded: !!profile?.householdId,
    household,
    viewerId,
    partnerId,
    members,
    chores,
    garbage,
    requests,
    shopping,
    activities,
    notificationsOn: profile?.notificationsOn ?? true,
    toast,
    inviteCode: household ? formatCode(household.inviteCode) : '',
    memberName,
    showToast,

    renameViewer: async (name: string) => {
      if (uid) await updateProfile(uid, { displayName: name });
    },
    setViewerPhoto: (uri: string | undefined) => uid && setPhoto({ uid, uri }),
    setNotificationsOn: async (on: boolean) => {
      if (uid) await updateProfile(uid, { notificationsOn: on });
    },

    addChore: (chore: Omit<Chore, 'id' | 'rotationIndex'>) => {
      setChores((list) => [...list, { ...chore, id: newId('c'), rotationIndex: 0 }]);
      showToast(`「${chore.name}」を当番に追加しました`);
    },
    removeChore: (id: string) => setChores((list) => list.filter((c) => c.id !== id)),
    completeChore: (id: string) => {
      const chore = chores.find((c) => c.id === id);
      if (!chore) return;
      setChores((list) =>
        list.map((c) =>
          c.id === id
            ? {
                ...c,
                lastDoneAt: new Date().toISOString(),
                lastDoneBy: viewerId,
                rotationIndex: c.assignMode === 'rotation' ? c.rotationIndex + 1 : c.rotationIndex,
              }
            : c,
        ),
      );
      addActivity(chore.name);
      showToast(`お疲れさま！「${chore.name}」の完了を家族に知らせました`);
    },
    undoChore: (id: string) =>
      setChores((list) =>
        list.map((c) =>
          c.id === id
            ? {
                ...c,
                lastDoneAt: undefined,
                lastDoneBy: undefined,
                rotationIndex:
                  c.assignMode === 'rotation' ? Math.max(0, c.rotationIndex - 1) : c.rotationIndex,
              }
            : c,
        ),
      ),

    addGarbage: (item: Omit<Garbage, 'id'>) => {
      setGarbage((list) => [...list, { ...item, id: newId('g') }]);
      showToast(`「${item.kind}」を登録しました`);
    },
    removeGarbage: (id: string) => setGarbage((list) => list.filter((g) => g.id !== id)),

    addRequest: (req: Omit<HouseRequest, 'id' | 'from' | 'status' | 'remindCount'>) => {
      setRequests((list) => [
        { ...req, id: newId('r'), from: viewerId, status: 'waiting', remindCount: 0 },
        ...list,
      ]);
      showToast(`${memberName(req.to)}さんにお願いを送りました`);
    },
    setRequestStatus: (id: string, status: RequestStatus) => {
      const req = requests.find((r) => r.id === id);
      setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
      if (!req) return;
      if (status === 'done') addActivity(req.text);
      const label = { ok: 'OK', maybe: '無理かも', done: '完了', waiting: '' }[status];
      showToast(`${memberName(req.from)}さんに「${label}」と伝えました`);
    },
    snoozeRequest: (id: string) => {
      setRequests((list) =>
        list.map((r) => (r.id === id ? { ...r, remindCount: r.remindCount + 1 } : r)),
      );
      showToast('30分後にもう一度お知らせします');
    },

    addShopping: (name: string, store: string) => {
      setShopping((list) => [
        ...list,
        { id: newId('s'), name, store, addedBy: viewerId, bought: false },
      ]);
    },
    toggleShopping: (id: string) =>
      setShopping((list) => list.map((s) => (s.id === id ? { ...s, bought: !s.bought } : s))),
    clearBought: () => setShopping((list) => list.filter((s) => !s.bought)),

    thank: (activityId: string) => {
      setActivities((list) =>
        list.map((a) => (a.id === activityId ? { ...a, thankedBy: viewerId } : a)),
      );
      showToast('「ありがとう」を送りました');
    },

    assigneeName: (chore: Chore) => {
      const id = currentAssignee(chore);
      return id ? memberName(id) : 'できる人';
    },
  };
}

type AppState = ReturnType<typeof useAppState>;

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const state = useAppState();
  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp は AppProvider の中で使ってください');
  return ctx;
}
