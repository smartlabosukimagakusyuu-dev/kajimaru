import { router } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '@/components/ad-banner';
import QRCode from 'react-native-qrcode-svg';

import { QrScanButton } from '@/components/qr-scan-button';
import { Avatar, Button, Card, Field, Screen, SectionTitle } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { formatCode, joinHousehold, leaveHousehold, MAX_MEMBERS } from '@/lib/family';
import { inviteLink, takePendingInviteCode } from '@/lib/invite-link';
import { useApp } from '@/store/app-store';

export default function FamilyScreen() {
  const { members, viewerId, inviteCode, household, showToast } = useApp();
  const full = members.length >= MAX_MEMBERS;
  const me = members.find((m) => m.id === viewerId);

  // 招待のQRコードからアプリを開いた場合は、そのコードを最初から入れておく
  const [code, setCode] = useState(() => {
    const pending = takePendingInviteCode();
    return pending ? formatCode(pending) : '';
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const invite = async () => {
    const message = `家事共有アプリ「カジまる」で一緒に使おう！\nアプリを開いて「招待コードで参加」から、このコードを入力してね。\n招待コード：${inviteCode}`;
    try {
      await Share.share({ message });
    } catch {
      // 共有に対応していないブラウザでは、コードを伝えてもらう
      showToast(`招待コード ${inviteCode} をパートナーに伝えてください`);
    }
  };

  const join = async () => {
    if (!household || !me) return;
    setBusy(true);
    setError('');
    try {
      await joinHousehold(viewerId, me.name, code, household.id);
      setCode('');
      showToast('パートナーの家族に参加しました！');
      router.navigate('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'うまくいきませんでした。もう一度お試しください');
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!household) return;
    setBusy(true);
    try {
      await leaveHousehold(viewerId, household.id);
      // 家族がなくなったので、最初の画面から「はじめの設定」へ進む
      router.replace('/');
    } catch {
      showToast('抜けられませんでした。インターネットの接続を確認してください');
      setBusy(false);
    }
  };

  return (
    <Screen footer={<AdBanner />} edges={['bottom']}>
      {household ? <Text style={styles.familyName}>{household.name}</Text> : null}
      <SectionTitle>
        メンバー（{members.length} / {MAX_MEMBERS}人）
      </SectionTitle>
      <Card>
        {members.map((m) => (
          <View key={m.id} style={styles.member}>
            <Avatar name={m.name} color={m.color} photoUri={m.photoUri} />
            <Text style={styles.name}>
              {m.name}
              {m.id === viewerId ? '（あなた）' : ''}
            </Text>
          </View>
        ))}
        {!full ? <Text style={styles.waiting}>パートナーの参加を待っています…</Text> : null}
      </Card>

      {full ? (
        <Card>
          <Text style={styles.note}>
            無料版は{MAX_MEMBERS}人までです。いまは{MAX_MEMBERS}人そろっています。
          </Text>
        </Card>
      ) : (
        <>
          <SectionTitle>パートナーを招待する</SectionTitle>
          <Card style={{ alignItems: 'center', gap: 14 }}>
            <Text style={styles.desc}>
              このコードをパートナーに伝えてください。パートナーが先に自分の家族を作っていても、このコードで参加できます。
            </Text>
            {household ? (
              <View style={styles.qr}>
                <QRCode value={inviteLink(household.inviteCode)} size={180} color={Colors.text} />
              </View>
            ) : null}
            <Text style={styles.qrSub}>
              パートナーのカジまるの「QRコードを読み取る」で読み取ってもらうと、参加できます。
            </Text>
            <Text style={styles.codeLabel}>招待コード</Text>
            <Text style={styles.code}>{inviteCode}</Text>
            <Button label="招待コードを送る" style={{ alignSelf: 'stretch' }} onPress={invite} />
          </Card>

          <SectionTitle>パートナーの家族に参加する</SectionTitle>
          <Card>
            <Text style={styles.desc}>
              パートナーから招待コードをもらったときは、ここに入力してください。今の家族から、パートナーの家族へ移ります。
            </Text>
            <QrScanButton onScanned={(scanned) => setCode(formatCode(scanned))} />
            <Field
              value={code}
              onChangeText={setCode}
              placeholder="例：ABC-123"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.small}>
              ※ 今の家族に登録した当番や頼みごとは、移った先には引き継がれません。
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={busy ? '参加中…' : '参加する'}
              disabled={busy || !code.trim()}
              onPress={join}
            />
          </Card>
        </>
      )}

      <SectionTitle>家族から抜ける</SectionTitle>
      <Card>
        {confirmLeave ? (
          <>
            <Text style={styles.warn}>
              この家族から抜けると、家族の当番や頼みごとは見られなくなります。抜けたあとは、新しく家族を作るか、招待コードで参加し直せます。本当に抜けますか？
            </Text>
            <Button label="抜ける" variant="danger" disabled={busy} onPress={leave} />
            <Button label="やめる" variant="ghost" onPress={() => setConfirmLeave(false)} />
          </>
        ) : (
          <Button label="この家族から抜ける" variant="ghost" onPress={() => setConfirmLeave(true)} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  familyName: { fontSize: 20, fontWeight: '800', color: Colors.text },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, color: Colors.text },
  waiting: { fontSize: 13, color: Colors.subText },
  note: { fontSize: 13, color: Colors.subText, textAlign: 'center' },
  desc: { fontSize: 13, color: Colors.subText, lineHeight: 20 },
  small: { fontSize: 12, color: Colors.subText, lineHeight: 18 },
  error: { fontSize: 13, color: Colors.danger, lineHeight: 20 },
  warn: { fontSize: 13, color: Colors.danger, lineHeight: 20 },
  qr: { padding: 12, borderRadius: 12, backgroundColor: '#FFFFFF' },
  qrSub: { fontSize: 12, color: Colors.subText, textAlign: 'center', lineHeight: 18 },
  codeLabel: { fontSize: 13, color: Colors.subText },
  code: { fontSize: 28, fontWeight: '800', letterSpacing: 4, color: Colors.primaryDark },
});
