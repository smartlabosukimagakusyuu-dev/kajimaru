import { Redirect } from 'expo-router';

import { Loading } from '@/components/loading';
import { useApp } from '@/store/app-store';

export default function Index() {
  const { authReady, loggedIn, profileReady, onboarded } = useApp();
  if (!authReady) return <Loading />;
  if (!loggedIn) return <Redirect href="/login" />;
  if (!profileReady) return <Loading />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/home" />;
}
