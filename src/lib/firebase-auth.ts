// ブラウザ版：ログイン状態はブラウザが覚えておいてくれる
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export function createAuth(app: FirebaseApp) {
  return getAuth(app);
}
