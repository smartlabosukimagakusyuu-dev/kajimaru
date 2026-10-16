import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { useApp } from '@/store/app-store';

const icon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
  };

export default function TabLayout() {
  const { loggedIn, onboarded, requests, viewerId } = useApp();
  if (!loggedIn) return <Redirect href="/login" />;
  if (!onboarded) return <Redirect href="/onboarding" />;

  const waitingCount = requests.filter((r) => r.to === viewerId && r.status === 'waiting').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryDark,
        tabBarInactiveTintColor: Colors.subText,
        tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: Colors.background },
      }}>
      <Tabs.Screen name="home" options={{ title: 'ホーム', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="chores" options={{ title: '当番', tabBarIcon: icon('🧽') }} />
      <Tabs.Screen
        name="requests"
        options={{
          title: '頼みごと',
          tabBarIcon: icon('🙏'),
          tabBarBadge: waitingCount > 0 ? waitingCount : undefined,
        }}
      />
      <Tabs.Screen name="shopping" options={{ title: '買いたいもの', tabBarIcon: icon('🛒') }} />
      <Tabs.Screen name="more" options={{ title: 'その他', tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
