import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { currentAssignee, isChoreDoneOn } from '@/lib/logic';
import { useApp } from '@/store/app-store';
import type { Chore } from '@/types';

/** 今日の当番1件分（完了ボタンつき） */
export function ChoreRow({ chore }: { chore: Chore }) {
  const { viewerId, memberName, assigneeName, completeChore, undoChore } = useApp();
  const done = isChoreDoneOn(chore, new Date());
  const assignee = currentAssignee(chore);
  const isMine = assignee === viewerId;

  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.name, done && styles.doneText]}>
          {done ? '✅ ' : ''}
          {chore.name}
        </Text>
        <Text style={styles.sub}>
          {done
            ? `${memberName(chore.lastDoneBy)}さんが完了`
            : isMine
              ? `あなたの担当・${chore.notifyTime}にお知らせ`
              : `担当：${assigneeName(chore)}`}
        </Text>
      </View>
      {done ? (
        <Button label="取り消す" small variant="ghost" onPress={() => undoChore(chore.id)} />
      ) : (
        <Button
          label="完了"
          small
          variant={isMine || !assignee ? 'primary' : 'secondary'}
          onPress={() => completeChore(chore.id)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text },
  doneText: { color: Colors.done },
  sub: { fontSize: 12, color: Colors.subText },
});
