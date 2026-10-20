// スマホ版：画面下部のバナー広告（Google AdMob）
import { View } from 'react-native';
import mobileAds, { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { Colors } from '@/constants/colors';

// 広告の仕組みを、アプリの起動時に1回だけ準備する
mobileAds()
  .initialize()
  .catch(() => {
    // 準備に失敗しても、広告が出ないだけでアプリは使えるので何もしない
  });

// 開発中は必ずGoogleのテスト広告を使う（本物の広告を自分で押すと規約違反になるため）
const unitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? TestIds.ADAPTIVE_BANNER);

export function AdBanner() {
  return (
    <View style={{ alignItems: 'center', backgroundColor: Colors.background }}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}
