import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { formatDue } from '@/lib/date';
import { useApp } from '@/store/app-store';
import type { HouseRequest, RequestStatus } from '@/types';

const STATUS: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  waiting: { label: '返事待ち', color: Colors.primaryDark, bg: Colors.primarySoft },
  ok: { label: 'OK', color: Colors.accent, bg: Colors.accentSoft },
  maybe: { label: '無理かも', color: Colors.danger, bg: Colors.dangerSoft },
  done: { label: '完了', color: Colors.subText, bg: '#EEE8E3' },
};

/** 頼みごと1件分。received＝頼まれた側、sent＝頼んだ側 */
export function RequestCard({
  request,
  mode,
}: {
  request: HouseRequest;
  mode: 'received' | 'sent';
}) {
  const { memberName, setRequestStatus, snoozeRequest } = useApp();
  const status = STATUS[request.status];
  const done = request.status === 'done';

  return (
    <Card>
      <View style={styles.top}>
        <Badge {...status} />
        <Text style={styles.meta}>
          {mode === 'received'
            ? `${memberName(request.from)}さんから`
            : `${memberName(request.to)}さんへ`}
        </Text>
      </View>
      <Text style={[styles.text, done && { color: Colors.done }]}>{request.text}</Text>
      {request.place ? <Text style={styles.place}>📍 {request.place}</Text> : null}
      <Text style={styles.meta}>
        {formatDue(request.due)}・{request.notifyTime}にお知らせ
        {mode === 'sent' && request.remindCount > 0 ? `・再通知${request.remindCount}回` : ''}
      </Text>

      {mode === 'received' && !done && (
        <View style={styles.actions}>
          {request.status === 'waiting' && (
            <>
              <Button label="OK" small onPress={() => setRequestStatus(request.id, 'ok')} />
              <Button
                label="無理かも"
                small
                variant="secondary"
                onPress={() => setRequestStatus(request.id, 'maybe')}
              />
            </>
          )}
          <Button
            label="完了"
            small
            variant={request.status === 'waiting' ? 'secondary' : 'primary'}
            onPress={() => setRequestStatus(request.id, 'done')}
          />
          <Button label="あとで" small variant="ghost" onPress={() => snoozeRequest(request.id)} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 17, fontWeight: '700', color: Colors.text },
  meta: { fontSize: 12, color: Colors.subText },
  place: { fontSize: 14, color: Colors.text },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
