// 招待のQRコード・リンク
// QRコードには「kajimaru://join?code=ABC123」を入れる。
// カジまるを入れたスマホのカメラで読み取るとアプリが開き、招待コードが入った状態で参加の画面になる。
import { normalizeCode } from '@/lib/family';

export function inviteLink(code: string) {
  return `kajimaru://join?code=${normalizeCode(code)}`;
}

/** QRコードや貼り付けた文字から、招待コード（6文字）を取り出す。見つからなければ null */
export function parseInviteCode(text: string) {
  const fromLink = text.match(/[?&]code=([A-Za-z0-9-]+)/);
  const code = normalizeCode(fromLink ? fromLink[1] : text);
  return code.length === 6 ? code : null;
}

// 招待のリンクからアプリを開いたが、まだログインしていないときに、コードを覚えておく
let pendingCode: string | null = null;

export function setPendingInviteCode(code: string | null) {
  pendingCode = code;
}

/** 覚えておいたコードを取り出す（1回取り出したら消す） */
export function takePendingInviteCode() {
  const code = pendingCode;
  pendingCode = null;
  return code;
}
