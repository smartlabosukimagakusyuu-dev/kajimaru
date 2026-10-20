// ブラウザ版のGoogleログイン：Googleのログイン用の小さい窓を開く（スマホ版は google-sign-in.native.ts）
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '@/lib/firebase';

export async function googleSignIn() {
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function googleSignOut() {
  // ブラウザ版はFirebaseのログアウトだけでよい
}
