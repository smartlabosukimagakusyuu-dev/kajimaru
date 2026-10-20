// スマホ版：カメラで招待のQRコードを読み取るボタン
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { parseInviteCode } from '@/lib/invite-link';

export function QrScanButton({ onScanned }: { onScanned: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState('');
  // 同じQRコードを何度も読み取らないようにする
  const scanned = useRef(false);

  const start = async () => {
    setMessage('');
    const granted = permission?.granted || (await requestPermission()).granted;
    if (!granted) {
      setMessage('カメラが使えません。スマホの設定で、カジまるのカメラを許可してください');
      return;
    }
    scanned.current = false;
    setOpen(true);
  };

  return (
    <>
      <Button label="📷 QRコードを読み取る" variant="secondary" onPress={start} />
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.screen}>
          <Text style={styles.title}>パートナーの招待QRコードを、枠の中に写してください</Text>
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                if (scanned.current) return;
                const code = parseInviteCode(data);
                if (!code) return;
                scanned.current = true;
                setOpen(false);
                onScanned(code);
              }}
            />
          </View>
          <Button label="やめる" variant="secondary" onPress={() => setOpen(false)} />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, padding: 16, gap: 16 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center', marginTop: 16 },
  cameraWrap: {
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  message: { fontSize: 13, color: Colors.danger, lineHeight: 20 },
});
