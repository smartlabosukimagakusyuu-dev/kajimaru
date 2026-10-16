import { isSameDay, nthWeekOfMonth } from '@/lib/date';
import type { Chore, Garbage } from '@/types';

export const ASSIGN_MODE_LABEL = {
  fixed: '固定',
  rotation: '交代制',
  anyone: 'できる人',
} as const;

export function isChoreDoneOn(chore: Chore, date: Date) {
  return !!chore.lastDoneAt && isSameDay(new Date(chore.lastDoneAt), date);
}

/** 今の担当者のID。「できる人」は null */
export function currentAssignee(chore: Chore): string | null {
  if (chore.assignMode === 'anyone' || chore.assignees.length === 0) return null;
  if (chore.assignMode === 'fixed') return chore.assignees[0];
  return chore.assignees[chore.rotationIndex % chore.assignees.length];
}

export function choresOn(chores: Chore[], date: Date) {
  return chores.filter((c) => c.days.includes(date.getDay()));
}

export function isGarbageDay(garbage: Garbage, date: Date) {
  if (garbage.rule.type === 'weekly') return garbage.rule.days.includes(date.getDay());
  return garbage.rule.day === date.getDay() && garbage.rule.weeks.includes(nthWeekOfMonth(date));
}
