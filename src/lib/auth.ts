// ログインまわりの処理
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { googleSignIn, googleSignOut } from '@/lib/google-sign-in';

export async function signInWithGoogle() {
  await googleSignIn();
}

export async function signInWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpWithEmail(email: string, password: string) {
  await createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function signOut() {
  await googleSignOut();
  await firebaseSignOut(auth);
}

export async function deleteAccount() {
  if (!auth.currentUser) return;
  await deleteUser(auth.currentUser);
}

/** Firebaseのエラーを、画面に出す日本語のメッセージにする */
export function authErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : 'うまくいきませんでした。もう一度お試しください';
  }
  switch (error.code) {
    case 'auth/invalid-email':
      return 'メールアドレスの形が正しくありません';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'メールアドレスかパスワードが違います。はじめての方は「新しく登録」を選んでください';
    case 'auth/email-already-in-use':
      return 'このメールアドレスはすでに登録されています。「ログイン」を選んでください';
    case 'auth/weak-password':
      return 'パスワードは6文字以上にしてください';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'ログインがキャンセルされました';
    case 'auth/popup-blocked':
      return 'ポップアップがブロックされました。ブラウザの設定でこのサイトのポップアップを許可してください';
    case 'auth/operation-not-allowed':
      return 'このログイン方法がFirebaseで有効になっていません';
    case 'auth/too-many-requests':
      return '回数が多すぎます。しばらく待ってからお試しください';
    case 'auth/network-request-failed':
      return 'インターネットにつながっていないようです';
    case 'auth/requires-recent-login':
      return '安全のため、もう一度ログインしてから退会してください';
    default:
      return `うまくいきませんでした（${error.code}）`;
  }
}
