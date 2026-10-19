// スマホ版：アプリを閉じてもログイン状態が残るよう、端末の中に保存する
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  // スマホ用の機能のため、ブラウザ用の型定義には含まれていない
  // @ts-expect-error getReactNativePersistence は React Native 版の firebase/auth にだけある
  getReactNativePersistence,
} from 'firebase/auth';

export function createAuth(app: FirebaseApp) {
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}
