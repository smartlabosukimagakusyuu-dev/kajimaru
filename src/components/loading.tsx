import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/colors';

export function Loading() {
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
}
