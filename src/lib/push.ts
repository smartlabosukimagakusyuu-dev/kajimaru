// プッシュ通知（スマホ版のみ）。通知の許可・通知用トークンの保存・通知のボタンの準備をする
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { updateProfile } from '@/lib/family';

/** 通知のボタンの種類（サーバーから送る通知の categoryId と同じ名前にする） */
export const CATEGORY = { chore: 'chore', request: 'request' } as const;
export const ACTION = { complete: 'complete', ok: 'ok', done: 'done', later: 'later' } as const;

// アプリを開いている最中に届いた通知も、画面の上に表示する
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const pushSupported = Platform.OS !== 'web';

/**
 * 通知の準備をして、このスマホの通知用トークンをFirestoreに保存する。
 * 許可されなかったときや、ブラウザ・エミュレーターでは何もしない。
 */
export async function registerForPushAsync(uid: string) {
  if (!pushSupported || !Device.isDevice) return;

  // Android 13以降は、チャンネルを作ってからでないと許可の確認が出ない
  await Notifications.setNotificationChannelAsync('default', {
    name: 'カジまるのお知らせ',
    // AndroidImportance は別ファイルからまとめて公開されていて、ESLintが見つけられないため
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.HIGH,
  });
  // 通知から、アプリを開かずにワンタップで返事できるボタン
  await Notifications.setNotificationCategoryAsync(CATEGORY.chore, [
    { identifier: ACTION.complete, buttonTitle: '完了', options: { opensAppToForeground: true } },
  ]);
  await Notifications.setNotificationCategoryAsync(CATEGORY.request, [
    { identifier: ACTION.ok, buttonTitle: 'OK', options: { opensAppToForeground: true } },
    { identifier: ACTION.done, buttonTitle: '完了', options: { opensAppToForeground: true } },
    { identifier: ACTION.later, buttonTitle: 'あとで', options: { opensAppToForeground: true } },
  ]);

  const current = await Notifications.getPermissionsAsync();
  const status = current.granted ? 'granted' : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await updateProfile(uid, { expoPushToken: token });
}
