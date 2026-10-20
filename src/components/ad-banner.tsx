// ブラウザ版：広告は出さず、広告が入る場所だけを表示する（スマホ版は ad-banner.native.tsx）
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

export function AdBanner() {
  return (
    <View style={styles.ad}>
      <Text style={styles.adText}>広告（バナー）はスマホ版で表示されます</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ad: {
    height: 56,
    backgroundColor: '#EDE7E1',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  adText: { color: Colors.subText, fontSize: 12 },
});
