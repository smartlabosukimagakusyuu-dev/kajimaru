// アイコンの写真：Firebase Storage に保存し、家族の画面にも表示できるようにする
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { db, storage } from '@/lib/firebase';

const avatarRef = (uid: string) => ref(storage, `users/${uid}/avatar.jpg`);

/** 端末の写真（file:// や blob: のアドレス）を、アップロードできる形（Blob）にする */
function toBlob(uri: string): Promise<Blob> {
  // スマホ版では fetch().blob() が不安定なため、XMLHttpRequest を使う
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('写真を読み込めませんでした'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send();
  });
}

export async function uploadAvatar(uid: string, localUri: string) {
  const blob = await toBlob(localUri);
  const fileRef = avatarRef(uid);
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(fileRef);
  await updateDoc(doc(db, 'users', uid), { photoUrl: url });
}

export async function removeAvatar(uid: string) {
  await deleteObject(avatarRef(uid)).catch(() => {
    // もともと写真がない場合などは、そのまま進める
  });
  await updateDoc(doc(db, 'users', uid), { photoUrl: deleteField() });
}
