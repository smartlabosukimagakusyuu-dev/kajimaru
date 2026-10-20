import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Loading } from '@/components/loading';
import { QrScanButton } from '@/components/qr-scan-button';
import { Button, Card, Field, Screen } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { createHousehold, formatCode, joinHousehold } from '@/lib/family';
import { takePendingInviteCode } from '@/lib/invite-link';
import { useApp } from '@/store/app-store';

type Step = 'name' | 'family' | 'join' | 'created' | 'notify';

export default function OnboardingScreen() {
  const { authReady, profileReady, onboarded, inviteCode, showToast, user, setNotificationsOn } =
    useApp();
  const [step, setStep] = useState<Step>('name');
  // Googleログインなら、Googleの名前をはじめから入れておく
  const [name, setName] = useState(user?.displayName ?? '');
  // 招待のQRコードからアプリを開いた場合は、そのコードを最初から入れておく
  const [pendingCode] = useState(takePendingInviteCode);
  const [code, setCode] = useState(pendingCode ? formatCode(pendingCode) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!authReady || (user && !profileReady)) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  // すでに家族に入っている人は、ホームへ
  if (onboarded && step === 'name') return <Redirect href="/home" />;

  const stepNumber = { name: 1, family: 2, join: 2, created: 2, notify: 3 }[step];

  const run = async (action: () => Promise<void>, next: Step) => {
    setBusy(true);
    setError('');
    try {
      await action();
      setStep(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'うまくいきませんでした。もう一度お試しください');
    } finally {
      setBusy(false);
    }
  };

  const finish = (notify: boolean) => {
    setNotificationsOn(notify);
    showToast(notify ? '準備ができました！' : '通知はあとから設定で変えられます');
    router.replace('/home');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Text style={styles.progress}>はじめの設定　{stepNumber} / 3</Text>

      {step === 'name' && (
        <>
          <Text style={styles.heading}>あなたの呼び名を教えてください</Text>
          <Text style={styles.desc}>家族の画面や通知に表示されます。あとから変えられます。</Text>
          <Field value={name} onChangeText={setName} placeholder="例：まさ、ママ、パパ" />
          <Button
            label="次へ"
            disabled={!name.trim()}
            onPress={() => setStep(pendingCode ? 'join' : 'family')}
          />
        </>
      )}

      {step === 'family' && (
        <>
          <Text style={styles.heading}>家族を作りますか？{'\n'}参加しますか？</Text>
          <Card>
            <Text style={styles.cardTitle}>はじめて使う</Text>
            <Text style={styles.desc}>
              新しく家族を作ります。できあがった招待コードを、パートナーに伝えてください。
            </Text>
            <Button
              label={busy ? '作成中…' : '家族を作る'}
              disabled={busy}
              onPress={() => run(() => createHousehold(user.uid, name.trim()), 'created')}
            />
          </Card>
          <Card>
            <Text style={styles.cardTitle}>招待された</Text>
            <Text style={styles.desc}>パートナーから届いた招待コードを入力して参加します。</Text>
            <Button
              label="招待コードで参加"
              variant="secondary"
              disabled={busy}
              onPress={() => setStep('join')}
            />
          </Card>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="戻る" variant="ghost" onPress={() => setStep('name')} />
        </>
      )}

      {step === 'join' && (
        <>
          <Text style={styles.heading}>招待コードを入力</Text>
          <Text style={styles.desc}>
            パートナーの「その他 → 家族・招待」に表示されているQRコードを読み取るか、6文字のコードを入力してください。
          </Text>
          <QrScanButton onScanned={(scanned) => setCode(formatCode(scanned))} />
          <Field
            value={code}
            onChangeText={setCode}
            placeholder="例：ABC-123"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={busy ? '参加中…' : '参加する'}
            disabled={busy || !code.trim()}
            onPress={() => run(() => joinHousehold(user.uid, name.trim(), code), 'notify')}
          />
          <Button
            label="戻る"
            variant="ghost"
            onPress={() => {
              setError('');
              setStep('family');
            }}
          />
        </>
      )}

      {step === 'created' && (
        <>
          <Text style={styles.heading}>家族ができました！</Text>
          <Card style={{ alignItems: 'center' }}>
            <Text style={styles.desc}>パートナーに、この招待コードを伝えてください</Text>
            <Text style={styles.code}>{inviteCode || '……'}</Text>
            <Text style={styles.small}>
              あとから「その他 → 家族・招待」でも確認できます。
            </Text>
          </Card>
          <Button label="次へ" onPress={() => setStep('notify')} />
        </>
      )}

      {step === 'notify' && (
        <>
          <Text style={styles.heading}>通知をオンにしましょう</Text>
          <Card>
            <View style={{ gap: 8 }}>
              <Text style={styles.desc}>カジまるは、こんなときにお知らせします。</Text>
              <Text style={styles.bullet}>🗑️ 明日はゴミの日です</Text>
              <Text style={styles.bullet}>🧽 今日の当番はあなたです</Text>
              <Text style={styles.bullet}>🙏 パートナーからお願いが届きました</Text>
            </View>
          </Card>
          <Text style={styles.small}>
            このあと、スマホから「通知を許可しますか？」と聞かれたら「許可」を押してください。
          </Text>
          <Button label="通知を許可する" onPress={() => finish(true)} />
          <Button label="あとで" variant="ghost" onPress={() => finish(false)} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { fontSize: 13, color: Colors.primaryDark, fontWeight: '700', marginTop: 24 },
  heading: { fontSize: 22, fontWeight: '800', color: Colors.text, lineHeight: 32 },
  desc: { fontSize: 14, color: Colors.subText, lineHeight: 21 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  bullet: { fontSize: 15, color: Colors.text },
  small: { fontSize: 13, color: Colors.subText, lineHeight: 20 },
  error: { fontSize: 13, color: Colors.danger, lineHeight: 20 },
  code: { fontSize: 32, fontWeight: '800', letterSpacing: 4, color: Colors.primaryDark },
});
