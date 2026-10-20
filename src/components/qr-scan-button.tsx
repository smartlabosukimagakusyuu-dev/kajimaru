// ブラウザ版：QRコードの読み取りはできないので、ボタンを出さない（スマホ版は qr-scan-button.native.tsx）
export function QrScanButton(_props: { onScanned: (code: string) => void }) {
  return null;
}
