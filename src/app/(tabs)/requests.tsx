import { router } from 'expo-router';
import { useState } from 'react';

import { RequestCard } from '@/components/request-card';
import { AdBanner } from '@/components/ad-banner';
import { Button, Card, Empty, Screen, Segmented, Title } from '@/components/ui';
import { useApp } from '@/store/app-store';

export default function RequestsScreen() {
  const { requests, viewerId } = useApp();
  const [tab, setTab] = useState<'received' | 'sent'>('received');

  const list = requests
    .filter((r) => (tab === 'received' ? r.to === viewerId : r.from === viewerId))
    // 完了したものは下へ
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));

  return (
    <Screen footer={<AdBanner />}>
      <Title sub="ちょっとしたお願いを、家族に送れます">頼みごと</Title>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'received', label: '頼まれた' },
          { value: 'sent', label: '頼んだ' },
        ]}
      />
      <Button label="＋ 頼みごとをする" onPress={() => router.push('/request-new')} />
      {list.length ? (
        list.map((r) => <RequestCard key={r.id} request={r} mode={tab} />)
      ) : (
        <Card>
          <Empty>{tab === 'received' ? '頼まれていることはありません' : 'まだ頼んでいません'}</Empty>
        </Card>
      )}
    </Screen>
  );
}
