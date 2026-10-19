// スマホ版：通知の準備と、通知のボタン（完了・OKなど）が押されたときの処理
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { ACTION, registerForPushAsync } from '@/lib/push';
import { useApp } from '@/store/app-store';

type PushData = { type?: 'chore' | 'request' | 'garbage'; id?: string };

export function PushSetup() {
  const app = useApp();
  const { user, onboarded, notificationsOn, chores, requests } = app;
  const uid = user?.uid;

  // 家族に入っていて通知がオンなら、このスマホを通知の送り先として登録する
  useEffect(() => {
    if (!uid || !onboarded || !notificationsOn) return;
    registerForPushAsync(uid).catch(() => {
      // 電波が悪いときなどは、次にアプリを開いたときにもう一度試す
    });
  }, [uid, onboarded, notificationsOn]);

  // 通知が押されたら、その内容に合わせて完了・返事をしたり、画面を開いたりする
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!response || !onboarded) return;
    const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
    if (handled.current === key) return;

    const data = response.notification.request.content.data as PushData;
    const action = response.actionIdentifier;

    if (data.type === 'chore') {
      if (action === ACTION.complete) {
        // アプリを開いた直後は当番の読み込みが終わっていないので、読み込めてから完了にする
        if (!chores.some((c) => c.id === data.id)) return;
        app.completeChore(data.id!);
      }
      router.navigate('/home');
    } else if (data.type === 'request') {
      if (action === ACTION.ok || action === ACTION.done || action === ACTION.later) {
        if (!requests.some((r) => r.id === data.id)) return;
        if (action === ACTION.later) app.snoozeRequest(data.id!);
        else app.setRequestStatus(data.id!, action);
      }
      router.navigate('/requests');
    } else {
      router.navigate('/home');
    }

    handled.current = key;
    Notifications.clearLastNotificationResponseAsync();
  }, [response, onboarded, chores, requests, app]);

  return null;
}
