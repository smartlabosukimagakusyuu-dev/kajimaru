// アプリ全体のデータ置き場。
// ログイン・家族・当番・完了の記録はFirebase。
// 頼みごと・買いたいもの・ゴミ出しはまだ見本データをメモリ上で動かしている（No.5・6で置き換える）。
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { ME, mockGarbage, mockRequests, mockShopping, PARTNER } from '@/data/mock';
import * as choresApi from '@/lib/chores';
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

  const viewerId = uid ?? '';
  const partnerId = household?.memberIds.find((id) => id !== uid);
  const members: Member[] = (household?.memberIds ?? [])
    .filter((id) => memberProfiles[id])
    .map((id) => ({
      id,
      name: memberProfiles[id].displayName,
      color: memberProfiles[id].color,
      photoUri: id === uid ? photoUri : undefined,
    }));

  // 当番と完了の記録（Firestore）
  const [choresSnap, setChoresSnap] = useState<{ hid: string; items: Chore[] }>();
  const [activitySnap, setActivitySnap] = useState<{ hid: string; items: Activity[] }>();
  useEffect(() => {
    if (!householdId) return;
    const offChores = choresApi.subscribeChores(householdId, (items) =>
      setChoresSnap({ hid: householdId, items }),
    );
    const offActivity = choresApi.subscribeActivities(householdId, (items) =>
      setActivitySnap({ hid: householdId, items }),
    );
    return () => {
      offChores();
      offActivity();
    };
  }, [householdId]);
  const chores = choresSnap && choresSnap.hid === householdId ? choresSnap.items : [];
  const activities = activitySnap && activitySnap.hid === householdId ? activitySnap.items : [];

  // まだ見本データのもの。見本の「自分(ME)／相手(PARTNER)」を本物のIDに読みかえて使う
  const realId = (id: string) => (id === ME ? viewerId : id === PARTNER ? (partnerId ?? PARTNER) : id);
  const [garbage, setGarbage] = useState<Garbage[]>(mockGarbage);
  const [mockRequestList, setRequests] = useState<HouseRequest[]>(mockRequests);
  const [mockShoppingList, setShopping] = useState<ShoppingItem[]>(mockShopping);
  const requests = mockRequestList.map((r) => ({ ...r, from: realId(r.from), to: realId(r.to) }));
  const shopping = mockShoppingList.map((s) => ({ ...s, addedBy: realId(s.addedBy) }));

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const memberName = (id: string | null | undefined) =>
    members.find((m) => m.id === id)?.name ?? (id === PARTNER ? 'パートナー' : 'だれか');

  /** Firestoreへの書き込みを行い、失敗したらお知らせする */
  const save = async (action: (hid: string, uid: string) => Promise<void>, done?: string) => {
    if (!householdId || !uid) return;
    try {
      await action(householdId, uid);
      if (done) showToast(done);
    } catch {
      showToast('保存できませんでした。インターネットの接続を確認してください');
    }
  };

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

    addChore: (chore: Pick<Chore, 'name' | 'assignMode' | 'assignees' | 'days' | 'notifyTime'>) =>
      save((hid) => choresApi.addChore(hid, chore), `「${chore.name}」を当番に追加しました`),
    removeChore: (id: string) => save((hid) => choresApi.deleteChore(hid, id)),
    completeChore: (id: string) => {
      const chore = chores.find((c) => c.id === id);
      if (!chore) return;
      return save(
        (hid, me) => choresApi.completeChore(hid, chore, me),
        `お疲れさま！「${chore.name}」の完了を家族に知らせました`,
      );
    },
    undoChore: (id: string) => {
      const chore = chores.find((c) => c.id === id);
      if (!chore) return;
      return save((hid) => choresApi.undoChore(hid, chore));
    },

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
      if (status === 'done') save((hid, me) => choresApi.addActivity(hid, me, req.text));
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

    thank: (activityId: string) =>
      save((hid, me) => choresApi.thankActivity(hid, activityId, me), '「ありがとう」を送りました'),

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
