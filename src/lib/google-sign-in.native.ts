// スマホ版のGoogleログイン：端末のGoogleアカウントを選んでもらい、その証明書でFirebaseにログインする
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

import { auth } from '@/lib/firebase';

GoogleSignin.configure({
  // FirebaseのGoogleログインと同じ「ウェブ用のクライアントID」（.env.local）
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export async function googleSignIn() {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) throw new Error('ログインがキャンセルされました');
    const { idToken } = response.data;
    if (!idToken) throw new Error('Googleから本人確認の情報を受け取れませんでした');
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.IN_PROGRESS) throw new Error('ログインの途中です。少しお待ちください');
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('このスマホではGoogle Play開発者サービスが使えません');
      }
    }
    throw e;
  }
}

/** 次にログインするとき、アカウントを選び直せるようにする */
export async function googleSignOut() {
  await GoogleSignin.signOut().catch(() => {});
}
