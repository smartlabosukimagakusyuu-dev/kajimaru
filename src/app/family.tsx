import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Screen, SectionTitle } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useApp } from '@/store/app-store';

const MAX_MEMBERS = 2;

export default function FamilyScreen() {
  const { members, viewerId, inviteCode, showToast } = useApp();
  const full = members.length >= MAX_MEMBERS;

  return (
    <Screen edges={['bottom']}>
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
      </Card>

      <SectionTitle>家族を招待する</SectionTitle>
      <Card style={{ alignItems: 'center', gap: 14 }}>
        {full ? (
          <Text style={styles.note}>
            無料版は2人までです。いまは{MAX_MEMBERS}人そろっています。
          </Text>
        ) : null}
        <View style={styles.qr}>
          <Text style={styles.qrText}>QRコード</Text>
          <Text style={styles.qrSub}>（ここにQRコードが表示されます）</Text>
        </View>
        <Text style={styles.codeLabel}>招待コード</Text>
        <Text style={styles.code}>{inviteCode}</Text>
        <Button
          label="招待リンクを送る"
          style={{ alignSelf: 'stretch' }}
          disabled={full}
          onPress={() => showToast('LINEやメールで招待リンクを送れるようになります')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  member: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, color: Colors.text },
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
