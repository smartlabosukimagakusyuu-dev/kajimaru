import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, Screen, Segmented } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { authErrorMessage, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/lib/auth';
import { useApp } from '@/store/app-store';

export default function LoginScreen() {
  const { loggedIn, onboarded } = useApp();
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ログインできたら、Firebaseからの知らせを受けて自動で次の画面へ進む
  if (loggedIn) return <Redirect href={onboarded ? '/home' : '/onboarding'} />;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🏠</Text>
        <Text style={styles.appName}>カジまる</Text>
        <Text style={styles.catch}>家事を、家族でまるっと共有。</Text>
      </View>

      <Card>
        <Button label="Googleでログイン" disabled={busy} onPress={() => run(signInWithGoogle)} />
        {showEmail ? (
          <View style={{ gap: 12 }}>
            <Segmented
              value={mode}
              onChange={(next) => {
                setMode(next);
                setError('');
              }}
              options={[
                { value: 'signIn', label: 'ログイン' },
                { value: 'signUp', label: '新しく登録' },
              ]}
            />
            <Field
              label="メールアドレス"
              value={email}
              onChangeText={setEmail}
              placeholder="example@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Field
              label="パスワード"
              value={password}
              onChangeText={setPassword}
              placeholder="6文字以上"
              secureTextEntry
              autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
            />
            <Button
              label={mode === 'signIn' ? 'メールでログイン' : 'この内容で登録する'}
              variant="secondary"
              disabled={busy || !email.trim() || !password}
              onPress={() =>
                run(() =>
                  mode === 'signIn'
                    ? signInWithEmail(email, password)
                    : signUpWithEmail(email, password),
                )
              }
            />
          </View>
        ) : (
          <Button
            label="メールアドレスでログイン"
            variant="secondary"
            disabled={busy}
            onPress={() => setShowEmail(true)}
          />
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 48, paddingBottom: 24, gap: 8 },
  logo: { fontSize: 64 },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.primaryDark },
  catch: { fontSize: 15, color: Colors.subText },
  error: { fontSize: 13, color: Colors.danger, lineHeight: 20 },
});
