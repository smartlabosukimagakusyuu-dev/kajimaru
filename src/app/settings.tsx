import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Avatar, Button, Card, Field, Screen, SectionTitle } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useApp } from '@/store/app-store';

export default function SettingsScreen() {
  const {
    members,
    viewerId,
    renameViewer,
    setViewerPhoto,
    notificationsOn,
    setNotificationsOn,
    logout,
    showToast,
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

  const signOut = () => {
    logout();
    router.replace('/login');
  };

  return (
    <Screen edges={['bottom']}>
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
        <Button label="ログアウト" variant="secondary" onPress={signOut} />
        {confirmLeave ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.warn}>
              退会すると、あなたのデータは消えて元に戻せません。本当に退会しますか？
            </Text>
            <Button label="退会する" variant="danger" onPress={signOut} />
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
});
