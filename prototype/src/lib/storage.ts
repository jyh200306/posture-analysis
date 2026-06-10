import type { AnalysisRecord } from '../types';

const RECORDS_KEY = 'posture.records';
const AGREED_KEY = 'posture.agreedAt';
const MAX_RECORDS = 30; // PRD F-005: 초과 시 가장 오래된 항목 삭제

/** 저장된 분석 기록을 최신순으로 반환한다. */
export function listRecords(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const records = JSON.parse(raw) as AnalysisRecord[];
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function saveRecord(record: AnalysisRecord): void {
  const records = [record, ...listRecords()].slice(0, MAX_RECORDS);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function latestRecord(): AnalysisRecord | null {
  return listRecords()[0] ?? null;
}

export function clearRecords(): void {
  localStorage.removeItem(RECORDS_KEY);
}

export function hasAgreed(): boolean {
  return localStorage.getItem(AGREED_KEY) !== null;
}

export function agree(): void {
  localStorage.setItem(AGREED_KEY, new Date().toISOString());
}
