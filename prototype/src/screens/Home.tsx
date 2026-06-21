import { Icon } from '../components/Icon';
import { dailyTip } from '../lib/feedback';
import { gradeOf } from '../lib/scoring';
import { routineMinutes } from '../lib/routine';
import { getExercise } from '../lib/exercises';
import type { AnalysisRecord, DayLog, Profile, Routine } from '../types';
import { DIRECTION_LABELS } from '../types';

interface Props {
  profile: Profile;
  records: AnalysisRecord[]; // 최신순
  routine: Routine | null;
  todayLog: DayLog | null;
  streak: number;
  onAnalyze: () => void;
  onCoach: () => void;
  onHistory: () => void;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return '늦은 밤이네요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/** 최근 점수 미니 스파크라인 */
function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null;
  const w = 96;
  const h = 32;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = Math.max(max - min, 1);
  const pts = scores
    .map((s, i) => {
      const x = (i / (scores.length - 1)) * (w - 6) + 3;
      const y = h - 4 - ((s - min) / range) * (h - 8);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="sparkline" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Home({
  profile,
  records,
  routine,
  todayLog,
  streak,
  onAnalyze,
  onCoach,
  onHistory,
}: Props) {
  const latest = records[0] ?? null;
  const previous = records[1] ?? null;
  const delta = latest && previous ? latest.overallScore - previous.overallScore : null;
  const tip = dailyTip();
  const doneCount = todayLog?.doneIds.length ?? 0;
  const totalCount = routine?.exerciseIds.length ?? 0;
  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="screen fade-in">
      <div className="section">
        <p className="label">{today}</p>
        <h1 className="title">
          {greeting()}
          {profile.name ? `, ${profile.name}님` : ''}
        </h1>
      </div>

      {/* 최근 측정 */}
      {latest ? (
        <button className="card card-tappable" onClick={onHistory}>
          <div className="card-head">
            <span className="card-label">최근 측정</span>
            <span className="caption num">
              {daysSince(latest.createdAt) === 0
                ? '오늘'
                : `${daysSince(latest.createdAt)}일 전`}{' '}
              · {DIRECTION_LABELS[latest.direction]}
            </span>
          </div>
          <div className="score-row">
            <div>
              <p className="score-big num">
                {latest.overallScore}
                <span className="score-big-unit">점</span>
              </p>
              <p className="caption">
                {gradeOf(latest.overallScore).label} · {latest.pattern}
              </p>
            </div>
            <div className="score-row-right">
              <Sparkline scores={records.slice(0, 7).map((r) => r.overallScore).reverse()} />
              {delta !== null && (
                <span className="caption num">
                  {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '― 변화 없음'}
                </span>
              )}
            </div>
          </div>
        </button>
      ) : (
        <button className="card card-tappable" onClick={onAnalyze}>
          <div className="card-head">
            <span className="card-label">첫 측정</span>
            <Icon name="chevron" size={16} />
          </div>
          <p className="heading">아직 측정 기록이 없습니다</p>
          <p className="caption">
            전신 사진 한 장으로 1분 안에 내 자세 정렬 상태를 확인할 수 있습니다.
          </p>
        </button>
      )}

      {/* 오늘의 루틴 */}
      {routine && (
        <button className="card card-tappable" onClick={onCoach}>
          <div className="card-head">
            <span className="card-label">오늘의 스트레칭</span>
            {streak > 0 && (
              <span className="streak num">
                <Icon name="flame" size={15} />
                {streak}일 연속
              </span>
            )}
          </div>
          <p className="heading">{routine.focusLabel}</p>
          <p className="caption">
            운동 {totalCount}개 · 약 {routineMinutes(routine)}분
            {routine.exerciseIds[0] && ` · ${getExercise(routine.exerciseIds[0])?.name} 외`}
          </p>
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : 0 }}
            />
          </div>
          <p className="caption num">
            {doneCount === totalCount && totalCount > 0
              ? '오늘 루틴 완료 — 수고했어요'
              : `${doneCount}/${totalCount} 완료`}
          </p>
        </button>
      )}

      {/* 측정 CTA */}
      <button className="card card-cta" onClick={onAnalyze}>
        <div className="cta-icon">
          <Icon name="scan" size={26} />
        </div>
        <div className="cta-text">
          <p className="heading">자세 측정하기</p>
          <p className="caption">정면 또는 측면 · 약 1분 소요</p>
        </div>
        <Icon name="chevron" size={18} />
      </button>

      {/* 오늘의 팁 */}
      <div className="card">
        <div className="card-head">
          <span className="card-label">오늘의 자세 팁</span>
        </div>
        <p className="heading">{tip.title}</p>
        <p className="body-text">{tip.body}</p>
      </div>
    </div>
  );
}
