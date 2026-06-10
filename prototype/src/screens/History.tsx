import { TrendChart } from '../components/TrendChart';
import type { AnalysisRecord, ItemKey } from '../types';
import { ITEM_LABELS } from '../types';

const ITEM_ORDER: ItemKey[] = ['shoulder', 'pelvis', 'spine', 'neck', 'balance'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface Props {
  /** 최신순 기록 */
  records: AnalysisRecord[];
  onClear: () => void;
  onAnalyze: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function History({ records, onClear, onAnalyze }: Props) {
  if (records.length === 0) {
    return (
      <div className="screen fade-in">
        <div className="section stack">
          <p className="label">History</p>
          <h1 className="title">아직 기록이 없습니다</h1>
          <p className="body-text">첫 분석을 마치면 점수 추이가 여기에 쌓입니다.</p>
          <button className="btn btn-primary" onClick={onAnalyze}>
            분석 시작하기
          </button>
        </div>
      </div>
    );
  }

  const best = Math.max(...records.map((r) => r.overallScore));
  const recent = records.filter((r) => Date.now() - new Date(r.createdAt).getTime() < WEEK_MS);
  const weeklyAvg =
    recent.length > 0
      ? Math.round(recent.reduce((sum, r) => sum + r.overallScore, 0) / recent.length)
      : null;

  // 항목별 평균 점수 — 가장 낮은 항목을 강조한다
  const averages = ITEM_ORDER.map((key) => ({
    key,
    avg: Math.round(records.reduce((sum, r) => sum + r.items[key].score, 0) / records.length),
  }));
  const lowestKey = averages.reduce((min, a) => (a.avg < min.avg ? a : min)).key;

  function handleClear() {
    if (window.confirm('모든 분석 기록을 삭제할까요? 되돌릴 수 없습니다.')) onClear();
  }

  return (
    <div className="screen fade-in">
      <div className="section">
        <p className="label">History</p>
        <h1 className="title">개선 추이</h1>
      </div>

      <div className="stat-row">
        <div className="stat">
          <p className="caption">총 분석</p>
          <p className="stat-value num">{records.length}회</p>
        </div>
        <div className="stat">
          <p className="caption">최고 점수</p>
          <p className="stat-value num">{best}점</p>
        </div>
        <div className="stat">
          <p className="caption">최근 7일 평균</p>
          <p className="stat-value num">{weeklyAvg === null ? '–' : `${weeklyAvg}점`}</p>
        </div>
      </div>

      <div className="section">
        <p className="label">Score Trend — 점수 추이</p>
        <TrendChart records={[...records].reverse()} />
      </div>

      <div className="section">
        <p className="label">Item Average — 항목별 평균</p>
        <div className="stack">
          {averages.map(({ key, avg }) => (
            <div className="avg-row" key={key}>
              <span className="avg-label">
                {ITEM_LABELS[key]}
                {key === lowestKey && <span className="tag tag-bad">가장 낮음</span>}
              </span>
              <div className="avg-bar">
                <div className="avg-bar-fill" style={{ width: `${avg}%` }} />
              </div>
              <span className="avg-value num">{avg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <p className="label">Records — 분석 기록</p>
        <div className="item-list">
          {records.map((record, i) => {
            const older = records[i + 1];
            const diff = older ? record.overallScore - older.overallScore : null;
            return (
              <div className="item-row" key={record.id}>
                <div>
                  <p className="num">{formatDate(record.createdAt)}</p>
                  <p className="caption">{record.direction === 'front' ? '정면' : '측면'}</p>
                </div>
                <div className="item-row-right">
                  {diff !== null && (
                    <span className="caption num">
                      {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '±0'}
                    </span>
                  )}
                  <span className="item-score num">{record.overallScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section stack">
        <button className="btn btn-primary" onClick={onAnalyze}>
          새로 분석하기
        </button>
        <button className="btn-text danger" onClick={handleClear}>
          전체 기록 삭제
        </button>
      </div>
    </div>
  );
}
