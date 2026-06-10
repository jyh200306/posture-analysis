import type { Level } from '../types';
import { LEVEL_LABELS } from '../types';

/** 양호/주의/불균형 상태 태그 — 색 대신 채움 강도로 구분 (DESIGN.md 5장) */
export function LevelTag({ level }: { level: Level }) {
  return <span className={`tag tag-${level}`}>{LEVEL_LABELS[level]}</span>;
}
