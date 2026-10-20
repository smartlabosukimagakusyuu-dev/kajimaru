import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdBanner } from '@/components/ad-banner';
import { Button, Card, Chip, ChipRow, Empty, Field, Screen, SectionTitle, Title } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { useApp } from '@/store/app-store';

const STORES = ['スーパー', 'ドラッグストア', '100円ショップ', 'ネット', 'その他'];

export default function ShoppingScreen() {
  const { shopping, addShopping, toggleShopping, clearBought, memberName } = useApp();
  const [name, setName] = useState('');
  const [store, setStore] = useState(STORES[0]);

  const add = () => {
    if (!name.trim()) return;
    addShopping(name.trim(), store);
    setName('');
  };

  const stores = STORES.filter((s) => shopping.some((i) => i.store === s));
  const hasBought = shopping.some((i) => i.bought);

  return (
    <Screen footer={<AdBanner />}>
      <Title sub="家族の誰でも追加できます">買いたいもの</Title>

      <Card>
        <Field
          value={name}
          onChangeText={setName}
          placeholder="例：牛乳"
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <ChipRow>
          {STORES.map((s) => (
            <Chip key={s} label={s} selected={store === s} onPress={() => setStore(s)} />
          ))}
        </ChipRow>
        <Button label="追加する" disabled={!name.trim()} onPress={add} />
      </Card>

      {stores.length === 0 && (
        <Card>
          <Empty>買いたいものはありません</Empty>
        </Card>
      )}

      {stores.map((s) => (
        <View key={s} style={{ gap: 8 }}>
          <SectionTitle>{s}</SectionTitle>
          <Card style={{ gap: 0, paddingVertical: 4 }}>
            {shopping
              .filter((i) => i.store === s)
              .map((i) => (
                <Pressable key={i.id} style={styles.item} onPress={() => toggleShopping(i.id)}>
                  <View style={[styles.check, i.bought && styles.checked]}>
                    {i.bought && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={[styles.itemName, i.bought && styles.bought]}>{i.name}</Text>
                  <Text style={styles.addedBy}>{memberName(i.addedBy)}</Text>
                </Pressable>
              ))}
          </Card>
        </View>
      ))}

      {hasBought && <Button label="購入済みを消す" variant="ghost" onPress={clearBought} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 14 },
  itemName: { flex: 1, fontSize: 16, color: Colors.text },
  bought: { color: Colors.done, textDecorationLine: 'line-through' },
  addedBy: { fontSize: 12, color: Colors.subText },
});
