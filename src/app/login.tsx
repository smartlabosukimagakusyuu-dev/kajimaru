import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, Screen } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useApp } from '@/store/app-store';

export default function LoginScreen() {
  const { login, onboarded } = useApp();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const next = () => {
    login();
    router.replace(onboarded ? '/home' : '/onboarding');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🏠</Text>
        <Text style={styles.appName}>カジまる</Text>
        <Text style={styles.catch}>家事を、家族でまるっと共有。</Text>
      </View>

      <Card>
        <Button label="Googleでログイン" onPress={next} />
        {showEmail ? (
          <View style={{ gap: 12 }}>
            <Field
              label="メールアドレス"
              value={email}
              onChangeText={setEmail}
              placeholder="example@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="パスワード"
              value={password}
              onChangeText={setPassword}
              placeholder="6文字以上"
              secureTextEntry
            />
            <Button label="メールでログイン" variant="secondary" onPress={next} />
          </View>
        ) : (
          <Button
            label="メールアドレスでログイン"
            variant="secondary"
            onPress={() => setShowEmail(true)}
          />
        )}
      </Card>

      <Text style={styles.note}>
        ※ いまは画面の見本です。どちらのボタンを押しても、ログインせずに次の画面へ進みます。
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 48, paddingBottom: 24, gap: 8 },
  logo: { fontSize: 64 },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.primaryDark },
  catch: { fontSize: 15, color: Colors.subText },
  note: { fontSize: 12, color: Colors.subText, textAlign: 'center', lineHeight: 18 },
});
