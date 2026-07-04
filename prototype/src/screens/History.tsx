import { useState } from 'react';
import { TrendChart } from '../components/TrendChart';
import { gradeOf } from '../lib/scoring';
import type { AnalysisRecord, Direction, MetricKey } from '../types';
import { DIRECTION_LABELS, METRIC_LABELS } from '../types';

interface Props {
  records: AnalysisRecord[]; // 최신순
  activeDays: number;
  onAnalyze: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function History({ records, activeDays, onAnalyze }: Props) {
  const [filter, setFilter] = useState<Direction | 'all'>('all');

  if (records.length === 0) {
    return (
      <div className="screen fade-in">
        <div className="section stack">
          <p className="label">History</p>
          <h1 className="title">아직 기록이 없습니다</h1>
          <p className="body-text">
            첫 측정을 마치면 점수 추이와 지표별 변화가 여기에 쌓입니다. 주 1–2회, 같은
            조건으로 측정하는 것이 가장 좋습니다.
          </p>
          <button className="btn btn-primary" onClick={onAnalyze}>
            측정 시작하기
          </button>
        </div>
      </div>
    );
  }

  const filtered = filter === 'all' ? records : records.filter((r) => r.direction === filter);

  // 지표별 평균 — 방향에 따라 측정 항목이 다르므로 해당 지표가 있는 기록만 집계
  const averages = (Object.keys(METRIC_LABELS) as MetricKey[]).flatMap((key) => {
    const scores = filtered
      .map((r) => r.metrics[key]?.score)
      .filter((s): s is number => s !== undefined);
    if (scores.length === 0) return [];
    return [{ key, avg: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) }];
  });
  const lowestKey =
    averages.length > 0 ? averages.reduce((min, a) => (a.avg < min.avg ? a : min)).key : null;

  return (
    <div className="screen fade-in">
      <div className="section">
        <p className="label">History</p>
        <h1 className="title">변화 기록</h1>
      </div>

      <div className="section">
        <div className="card-head">
          <p className="label">점수 추이</p>
          <div className="seg">
            {(['all', 'side', 'front'] as const).map((f) => (
              <button
                key={f}
                className={filter === f ? 'active' : ''}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '전체' : DIRECTION_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
        {filtered.length > 0 ? (
          <TrendChart records={[...filtered].reverse()} />
        ) : (
          <p className="caption">이 방향의 기록이 아직 없습니다.</p>
        )}
      </div>

      {averages.length > 0 && (
        <div className="section">
          <p className="label">지표별 평균</p>
          <div className="stack">
            {averages.map(({ key, avg }) => (
              <div className="avg-row" key={key}>
                <span className="avg-label">
                  {METRIC_LABELS[key]}
                  {key === lowestKey && <span className="tag tag-bad">집중 관리</span>}
                </span>
                <div className="avg-bar">
                  <div className="avg-bar-fill" style={{ width: `${avg}%` }} />
                </div>
                <span className="avg-value num">{avg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <p className="label">측정 기록 · 최근 7일 운동 {activeDays}일</p>
        <div className="item-list">
          {filtered.map((record, i) => {
            const older = filtered[i + 1];
            const diff = older ? record.overallScore - older.overallScore : null;
            return (
              <div className="item-row" key={record.id}>
                <div>
                  <p className="num">{formatDate(record.createdAt)}</p>
                  <p className="caption">
                    {DIRECTION_LABELS[record.direction]} · {record.pattern}
                  </p>
                </div>
                <div className="item-row-right">
                  {diff !== null && (
                    <span className="caption num">
                      {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '±0'}
                    </span>
                  )}
                  <span className="item-score num">{record.overallScore}</span>
                  <span className="caption">{gradeOf(record.overallScore).label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section stack">
        <button className="btn btn-primary" onClick={onAnalyze}>
          새로 측정하기
        </button>
      </div>
    </div>
  );
}
