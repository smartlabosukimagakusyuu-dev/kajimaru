import { Share, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Screen, SectionTitle } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { MAX_MEMBERS } from '@/lib/family';
import { useApp } from '@/store/app-store';

export default function FamilyScreen() {
  const { members, viewerId, inviteCode, household, showToast } = useApp();
  const full = members.length >= MAX_MEMBERS;

  const invite = async () => {
    const message = `家事共有アプリ「カジまる」で一緒に使おう！\nアプリを開いて「招待コードで参加」から、このコードを入力してね。\n招待コード：${inviteCode}`;
    try {
      await Share.share({ message });
    } catch {
      // 共有に対応していないブラウザでは、コードを伝えてもらう
      showToast(`招待コード ${inviteCode} をパートナーに伝えてください`);
    }
  };

  return (
    <Screen edges={['bottom']}>
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

      <SectionTitle>家族を招待する</SectionTitle>
      <Card style={{ alignItems: 'center', gap: 14 }}>
        {full ? (
          <Text style={styles.note}>
            無料版は{MAX_MEMBERS}人までです。いまは{MAX_MEMBERS}人そろっています。
          </Text>
        ) : (
          <>
            <View style={styles.qr}>
              <Text style={styles.qrText}>QRコード</Text>
              <Text style={styles.qrSub}>（あとで表示されます）</Text>
            </View>
            <Text style={styles.codeLabel}>招待コード</Text>
            <Text style={styles.code}>{inviteCode}</Text>
            <Button label="招待コードを送る" style={{ alignSelf: 'stretch' }} onPress={invite} />
          </>
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
  qr: {
    width: 160,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  qrText: { fontSize: 18, fontWeight: '700', color: Colors.subText },
  qrSub: { fontSize: 11, color: Colors.subText },
  codeLabel: { fontSize: 13, color: Colors.subText },
  code: { fontSize: 28, fontWeight: '800', letterSpacing: 4, color: Colors.primaryDark },
});
