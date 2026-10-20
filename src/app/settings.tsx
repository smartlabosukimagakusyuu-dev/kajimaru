import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { AdBanner } from '@/components/ad-banner';
import { Avatar, Button, Card, Field, Screen, SectionTitle } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { authErrorMessage, deleteAccount, signOut } from '@/lib/auth';
import { useApp } from '@/store/app-store';

export default function SettingsScreen() {
  const {
    members,
    viewerId,
    renameViewer,
    setViewerPhoto,
    notificationsOn,
    setNotificationsOn,
    showToast,
    user,
  } = useApp();
  const me = members.find((m) => m.id === viewerId);
  const [name, setName] = useState(me?.name ?? '');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    setViewerPhoto(result.assets[0].uri);
    showToast('アイコンを変更しました');
  };

  const logout = async () => {
    await signOut();
    router.replace('/login');
  };

  const leave = async () => {
    try {
      await deleteAccount();
      router.replace('/login');
    } catch (e) {
      showToast(authErrorMessage(e));
    }
  };

  return (
    <Screen footer={<AdBanner />} edges={['bottom']}>
      <SectionTitle>アイコン</SectionTitle>
      <Card style={styles.iconCard}>
        <Avatar name={me?.name ?? '?'} color={me?.color ?? Colors.primary} photoUri={me?.photoUri} size={88} />
        <View style={{ flex: 1, gap: 8 }}>
          <Button label="写真を選ぶ" small onPress={pickPhoto} />
          {me?.photoUri ? (
            <Button
              label="写真をはずす"
              small
              variant="ghost"
              onPress={() => {
                setViewerPhoto(undefined);
                showToast('アイコンを元に戻しました');
              }}
            />
          ) : null}
        </View>
      </Card>

      <SectionTitle>表示名</SectionTitle>
      <Card>
        <Field value={name} onChangeText={setName} />
        <Button
          label="保存"
          small
          disabled={!name.trim() || name === me?.name}
          style={{ alignSelf: 'flex-end' }}
          onPress={() => {
            renameViewer(name.trim());
            showToast('表示名を変更しました');
          }}
        />
      </Card>

      <SectionTitle>通知</SectionTitle>
      <Card>
        <View style={styles.row}>
          <Text style={styles.label}>通知を受け取る</Text>
          <Switch
            value={notificationsOn}
            onValueChange={setNotificationsOn}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      <SectionTitle>アカウント</SectionTitle>
      <Card>
        {user?.email ? <Text style={styles.account}>{user.email} でログイン中</Text> : null}
        <Button label="ログアウト" variant="secondary" onPress={logout} />
        {confirmLeave ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.warn}>
              退会すると、あなたのデータは消えて元に戻せません。本当に退会しますか？
            </Text>
            <Button label="退会する" variant="danger" onPress={leave} />
            <Button label="やめる" variant="ghost" onPress={() => setConfirmLeave(false)} />
          </View>
        ) : (
          <Button label="退会" variant="ghost" onPress={() => setConfirmLeave(true)} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, color: Colors.text },
  warn: { fontSize: 13, color: Colors.danger, lineHeight: 20 },
  account: { fontSize: 13, color: Colors.subText },
});
