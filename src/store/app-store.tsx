// アプリ全体のデータ置き場。ログインはFirebase、それ以外はまだ見本データをメモリ上で動かしている。
// No.3以降で、見本データの部分をFirestoreの読み書きに置き換える。
import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import {
  ME,
  mockActivities,
  mockChores,
  mockGarbage,
  mockMembers,
  mockRequests,
  mockShopping,
} from '@/data/mock';
import { auth } from '@/lib/firebase';
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
  const [onboarded, setOnboarded] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        if (!next) setOnboarded(false);
      }),
    [],
  );
  /** お試し用：「自分」と「パートナー」の画面を切り替える */
  const [viewerId, setViewerId] = useState(ME);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [chores, setChores] = useState<Chore[]>(mockChores);
  const [garbage, setGarbage] = useState<Garbage[]>(mockGarbage);
  const [requests, setRequests] = useState<HouseRequest[]>(mockRequests);
  const [shopping, setShopping] = useState<ShoppingItem[]>(mockShopping);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inviteCode = 'KJ-4821';
  const partnerId = members.find((m) => m.id !== viewerId)?.id;

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const memberName = (id: string | null | undefined) =>
    members.find((m) => m.id === id)?.name ?? 'だれか';

  const addActivity = (text: string) =>
    setActivities((list) => [
      { id: newId('a'), by: viewerId, text, at: new Date().toISOString() },
      ...list,
    ]);

  return {
    authReady: user !== undefined,
    loggedIn: !!user,
    user,
    onboarded,
    viewerId,
    partnerId,
    members,
    chores,
    garbage,
    requests,
    shopping,
    activities,
    notificationsOn,
    toast,
    inviteCode,
    memberName,
    showToast,

    finishOnboarding: (name: string) => {
      if (name.trim()) {
        setMembers((list) => list.map((m) => (m.id === ME ? { ...m, name: name.trim() } : m)));
      }
      setOnboarded(true);
    },
    renameViewer: (name: string) =>
      setMembers((list) => list.map((m) => (m.id === viewerId ? { ...m, name } : m))),
    setViewerPhoto: (photoUri: string | undefined) =>
      setMembers((list) => list.map((m) => (m.id === viewerId ? { ...m, photoUri } : m))),
    setViewerId,
    setNotificationsOn,

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
