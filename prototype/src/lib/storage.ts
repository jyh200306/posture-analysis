import type { AnalysisRecord, DayLog, Profile, Routine } from '../types';

const KEYS = {
  profile: 'wm.profile',
  records: 'wm.records',
  routine: 'wm.routine',
  logs: 'wm.logs',
} as const;

const MAX_RECORDS = 60;
const MAX_LOGS = 120;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- 프로필 ---------- */

export function loadProfile(): Profile | null {
  return read<Profile>(KEYS.profile);
}

export function saveProfile(profile: Profile): void {
  write(KEYS.profile, profile);
}

/* ---------- 분석 기록 ---------- */

export function listRecords(): AnalysisRecord[] {
  const records = read<AnalysisRecord[]>(KEYS.records) ?? [];
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveRecord(record: AnalysisRecord): void {
  write(KEYS.records, [record, ...listRecords()].slice(0, MAX_RECORDS));
}

export function clearRecords(): void {
  localStorage.removeItem(KEYS.records);
}

/* ---------- 루틴 ---------- */

export function loadRoutine(): Routine | null {
  return read<Routine>(KEYS.routine);
}

export function saveRoutine(routine: Routine): void {
  write(KEYS.routine, routine);
}

export function clearRoutine(): void {
  localStorage.removeItem(KEYS.routine);
}

/* ---------- 운동 수행 기록 ---------- */

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function listLogs(): DayLog[] {
  return read<DayLog[]>(KEYS.logs) ?? [];
}

export function logOf(date: string): DayLog | null {
  return listLogs().find((log) => log.date === date) ?? null;
}

/** 오늘 운동 하나의 완료 상태를 켜고 끈다 */
export function toggleDone(exerciseId: string, total: number): DayLog {
  const date = todayKey();
  const logs = listLogs();
  const today = logs.find((log) => log.date === date) ?? { date, doneIds: [], total };
  const doneIds = today.doneIds.includes(exerciseId)
    ? today.doneIds.filter((id) => id !== exerciseId)
    : [...today.doneIds, exerciseId];
  const updated: DayLog = { date, doneIds, total };
  const rest = logs.filter((log) => log.date !== date);
  write(KEYS.logs, [updated, ...rest].slice(0, MAX_LOGS));
  return updated;
}

/** 루틴을 끝까지 마친 날 기준 연속 일수 (오늘 미완료면 어제까지 인정) */
export function streakDays(): number {
  const completed = new Set(
    listLogs()
      .filter((log) => log.total > 0 && log.doneIds.length >= log.total)
      .map((log) => log.date),
  );
  let streak = 0;
  const cursor = new Date();
  // 오늘 아직 안 했어도 스트릭은 끊지 않고 어제부터 센다
  if (!completed.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (completed.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** 최근 7일 중 운동을 1개 이상 수행한 날 수 */
export function activeDaysThisWeek(): number {
  const logs = listLogs();
  let count = 0;
  const cursor = new Date();
  for (let i = 0; i < 7; i++) {
    const key = todayKey(cursor);
    if (logs.some((log) => log.date === key && log.doneIds.length > 0)) count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

/* ---------- 전체 초기화 ---------- */

export function clearAll(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
