import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, Screen } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useApp } from '@/store/app-store';

type Step = 'name' | 'family' | 'join' | 'notify';

export default function OnboardingScreen() {
  const { finishOnboarding, inviteCode, showToast } = useApp();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const stepNumber = { name: 1, family: 2, join: 2, notify: 3 }[step];

  const finish = (message: string) => {
    finishOnboarding(name);
    showToast(message);
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
          <Button label="次へ" disabled={!name.trim()} onPress={() => setStep('family')} />
        </>
      )}

      {step === 'family' && (
        <>
          <Text style={styles.heading}>家族を作りますか？{'\n'}参加しますか？</Text>
          <Card>
            <Text style={styles.cardTitle}>はじめて使う</Text>
            <Text style={styles.desc}>
              新しく家族を作ります。あとで招待コード（{inviteCode}）をパートナーに送ります。
            </Text>
            <Button label="家族を作る" onPress={() => setStep('notify')} />
          </Card>
          <Card>
            <Text style={styles.cardTitle}>招待された</Text>
            <Text style={styles.desc}>パートナーから届いた招待コードを入力して参加します。</Text>
            <Button label="招待コードで参加" variant="secondary" onPress={() => setStep('join')} />
          </Card>
        </>
      )}

      {step === 'join' && (
        <>
          <Text style={styles.heading}>招待コードを入力</Text>
          <Field
            value={code}
            onChangeText={setCode}
            placeholder="例：KJ-4821"
            autoCapitalize="characters"
          />
          <Button label="参加する" disabled={!code.trim()} onPress={() => setStep('notify')} />
          <Button label="戻る" variant="ghost" onPress={() => setStep('family')} />
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
          <Button label="通知を許可する" onPress={() => finish('準備ができました！')} />
          <Button
            label="あとで"
            variant="ghost"
            onPress={() => finish('通知はあとから設定で変えられます')}
          />
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
});
