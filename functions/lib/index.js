"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyRequestReply = exports.sendScheduledNotifications = void 0;
// カジまるのサーバー側の処理（Cloud Functions）
// - 1分ごとに、当番・ゴミ出し・頼みごとの「お知らせする時間」になったものを探して通知を送る
// - 頼みごとに返事・完了があったら、頼んだ人へすぐ通知を送る
// 通知は Expo のプッシュ通知サービス経由で、各スマホに届ける。
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const firestore_2 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// Firestore（東京）と同じ場所で動かす
const REGION = 'asia-northeast1';
const TIME_ZONE = 'Asia/Tokyo';
// ---------- 日本時間の計算 ----------
const JST_OFFSET = 9 * 60 * 60 * 1000;
/** 日本時間での年月日・曜日・時刻（日本は夏時間がないので、9時間ずらすだけでよい） */
function jst(date) {
    const d = new Date(date.getTime() + JST_OFFSET);
    const pad = (n) => String(n).padStart(2, '0');
    return {
        dateKey: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
        day: d.getUTCDate(),
        weekday: d.getUTCDay(),
        time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    };
}
async function getMembers(householdId) {
    const household = await db.doc(`households/${householdId}`).get();
    const memberIds = household.get('memberIds') ?? [];
    const users = await Promise.all(memberIds.map((uid) => db.doc(`users/${uid}`).get()));
    return users.map((u) => ({
        uid: u.id,
        name: u.get('displayName') ?? '家族',
        // 通知をオフにしている人には送らない
        token: u.get('notificationsOn') === false ? undefined : u.get('expoPushToken'),
    }));
}
async function sendPush(recipients, message) {
    const messages = recipients
        .filter((m) => !!m.token)
        .map((m) => ({ ...message, to: m.token }));
    if (messages.length === 0)
        return;
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages.map((m) => ({ ...m, sound: 'default', channelId: 'default' }))),
    });
    const result = await res.json();
    firebase_functions_1.logger.info('push sent', { title: message.title, count: messages.length, result });
}
// ---------- 当番 ----------
function isDoneToday(lastDoneAt, todayKey) {
    return lastDoneAt instanceof firestore_1.Timestamp && jst(lastDoneAt.toDate()).dateKey === todayKey;
}
function currentAssignee(chore) {
    const assignees = chore.assignees ?? [];
    if (chore.assignMode === 'anyone' || assignees.length === 0)
        return null;
    if (chore.assignMode === 'fixed')
        return assignees[0];
    return assignees[(chore.rotationIndex ?? 0) % assignees.length];
}
/** 家族のIDを、サブコレクションの書類の場所（households/{id}/...）から取り出す */
const householdIdOf = (ref) => ref.parent.parent.id;
async function notifyChores(now) {
    const today = jst(now);
    const snap = await db.collectionGroup('chores').where('notifyTime', '==', today.time).get();
    for (const doc of snap.docs) {
        const chore = doc.data();
        if (!(chore.days ?? []).includes(today.weekday))
            continue;
        if (isDoneToday(chore.lastDoneAt, today.dateKey))
            continue;
        const members = await getMembers(householdIdOf(doc.ref));
        const assignee = currentAssignee(chore);
        const recipients = assignee ? members.filter((m) => m.uid === assignee) : members;
        await sendPush(recipients, {
            title: '今日の当番',
            body: assignee
                ? `今日の${chore.name}はあなたの担当です`
                : `今日の${chore.name}、できる人お願いします`,
            data: { type: 'chore', id: doc.id },
            categoryId: 'chore',
        });
    }
}
// ---------- ゴミ出し ----------
function isGarbageDay(rule, date) {
    if (rule.type === 'weekly')
        return (rule.days ?? []).includes(date.weekday);
    return rule.day === date.weekday && (rule.weeks ?? []).includes(Math.ceil(date.day / 7));
}
async function notifyGarbage(now) {
    const today = jst(now);
    const tomorrow = jst(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    const snap = await db.collectionGroup('garbage').where('notifyTime', '==', today.time).get();
    for (const doc of snap.docs) {
        const garbage = doc.data();
        if (!isGarbageDay(garbage.rule, tomorrow))
            continue;
        const householdId = householdIdOf(doc.ref);
        const members = await getMembers(householdId);
        let recipients = members;
        if (garbage.notifyTo === 'duty') {
            // 「当番の人」：名前に「ゴミ」が入った当番があれば、その担当の人へ
            const chores = await db.collection(`households/${householdId}/chores`).get();
            const garbageChore = chores.docs.find((c) => String(c.get('name')).includes('ゴミ'));
            const assignee = garbageChore ? currentAssignee(garbageChore.data()) : null;
            if (assignee)
                recipients = members.filter((m) => m.uid === assignee);
        }
        await sendPush(recipients, {
            title: 'ゴミ出し',
            body: `明日は${garbage.kind}の日です`,
            data: { type: 'garbage', id: doc.id },
        });
    }
}
// ---------- 頼みごと ----------
async function notifyRequests(now) {
    const snap = await db
        .collectionGroup('requests')
        .where('nextNotifyAt', '<=', firestore_1.Timestamp.fromDate(now))
        .get();
    for (const doc of snap.docs) {
        const req = doc.data();
        const clear = { nextNotifyAt: firestore_1.FieldValue.delete(), nextNotifyKind: firestore_1.FieldValue.delete() };
        if (req.status === 'done') {
            await doc.ref.update(clear);
            continue;
        }
        const members = await getMembers(householdIdOf(doc.ref));
        const fromName = members.find((m) => m.uid === req.from)?.name ?? '家族';
        const recipients = members.filter((m) => m.uid === req.to);
        const place = req.place ? `（${req.place}）` : '';
        if (req.nextNotifyKind === 'request') {
            await sendPush(recipients, {
                title: `${fromName}さんからのお願い`,
                body: `「${req.text}」${place}のお願いが届いています`,
                data: { type: 'request', id: doc.id },
                categoryId: 'request',
            });
        }
        else {
            // 再通知（期限の少し前・「あとで」）
            await sendPush(recipients, {
                title: 'お願いのお知らせ',
                body: `${req.text}のお願い、覚えてる？`,
                data: { type: 'request', id: doc.id },
                categoryId: 'request',
            });
        }
        // 次のお知らせ：期限の少し前の再通知がまだなら、それを予約。なければおしまい
        const remindAt = req.remindAt ?? null;
        const remindPending = req.nextNotifyKind !== 'remind' && remindAt && remindAt.toMillis() > now.getTime();
        await doc.ref.update(remindPending ? { nextNotifyAt: remindAt, nextNotifyKind: 'remind' } : clear);
    }
}
// ---------- 定期実行：1分ごと ----------
exports.sendScheduledNotifications = (0, scheduler_1.onSchedule)({ schedule: 'every 1 minutes', timeZone: TIME_ZONE, region: REGION }, async () => {
    const now = new Date();
    const results = await Promise.allSettled([
        notifyChores(now),
        notifyGarbage(now),
        notifyRequests(now),
    ]);
    results
        .filter((r) => r.status === 'rejected')
        .forEach((r) => firebase_functions_1.logger.error('notification failed', r.reason));
});
// ---------- 返事・完了をすぐ知らせる ----------
const STATUS_MESSAGE = {
    ok: (name, text) => `${name}さんが「${text}」をOKしました`,
    maybe: (name, text) => `${name}さんから「${text}」は無理かも、と返事がありました`,
    done: (name, text) => `「${text}」が完了しました（${name}さん）`,
};
exports.notifyRequestReply = (0, firestore_2.onDocumentUpdated)({ document: 'households/{householdId}/requests/{requestId}', region: REGION }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after || before.status === after.status)
        return;
    const makeBody = STATUS_MESSAGE[after.status];
    if (!makeBody)
        return;
    const members = await getMembers(event.params.householdId);
    const toName = members.find((m) => m.uid === after.to)?.name ?? '家族';
    await sendPush(members.filter((m) => m.uid === after.from), {
        title: '頼みごとの返事',
        body: makeBody(toName, after.text),
        data: { type: 'request', id: event.params.requestId },
    });
});
//# sourceMappingURL=index.js.map