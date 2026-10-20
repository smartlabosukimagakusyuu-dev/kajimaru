// ログインまわりの処理
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';

import { leaveHousehold } from '@/lib/family';
import { auth, db } from '@/lib/firebase';
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

/**
 * 退会：家族から抜け、プロフィールを消してから、ログイン情報を削除する。
 * 安全のため、最後にログインしてから時間がたっている場合は、先にログインし直してもらう。
 */
export async function deleteAccount(householdId?: string) {
  const user = auth.currentUser;
  if (!user) return;
  const lastSignIn = new Date(user.metadata.lastSignInTime ?? 0).getTime();
  if (Date.now() - lastSignIn > 5 * 60 * 1000) {
    throw new FirebaseError('auth/requires-recent-login', 'requires recent login');
  }
  if (householdId) await leaveHousehold(user.uid, householdId);
  await deleteDoc(doc(db, 'users', user.uid));
  await googleSignOut();
  await deleteUser(user);
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
