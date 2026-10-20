// 招待のQRコード（kajimaru://join?code=...）からアプリが開かれたときの画面
import { Redirect, useLocalSearchParams } from 'expo-router';

import { Loading } from '@/components/loading';
import { parseInviteCode, setPendingInviteCode } from '@/lib/invite-link';
import { useApp } from '@/store/app-store';

export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { authReady, loggedIn, profileReady, onboarded } = useApp();

  // ログインや「はじめの設定」のあとでも使えるよう、コードを覚えておく
  setPendingInviteCode(code ? parseInviteCode(code) : null);

  if (!authReady) return <Loading />;
  if (!loggedIn) return <Redirect href="/login" />;
  if (!profileReady) return <Loading />;
  return <Redirect href={onboarded ? '/family' : '/onboarding'} />;
}
