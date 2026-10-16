import { Redirect } from 'expo-router';

import { useApp } from '@/store/app-store';

export default function Index() {
  const { loggedIn, onboarded } = useApp();
  if (!loggedIn) return <Redirect href="/login" />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/home" />;
}
