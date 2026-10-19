import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PushSetup } from '@/components/push-setup';
import { Colors } from '@/constants/colors';
import { AppProvider, useApp } from '@/store/app-store';

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={styles.toastWrap}>
      <Text style={styles.toast}>{toast}</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
            headerBackTitle: '戻る',
            contentStyle: { backgroundColor: Colors.background },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="garbage" options={{ headerShown: true, title: 'ゴミ出し設定' }} />
          <Stack.Screen name="family" options={{ headerShown: true, title: '家族' }} />
          <Stack.Screen name="settings" options={{ headerShown: true, title: '設定' }} />
          <Stack.Screen
            name="chore-new"
            options={{ headerShown: true, title: '当番を作る', presentation: 'modal' }}
          />
          <Stack.Screen
            name="request-new"
            options={{ headerShown: true, title: '頼みごとをする', presentation: 'modal' }}
          />
        </Stack>
        <Toast />
        <PushSetup />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 16, right: 16, bottom: 96, alignItems: 'center' },
  toast: {
    backgroundColor: 'rgba(58,46,38,0.92)',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    fontSize: 14,
    overflow: 'hidden',
  },
});
