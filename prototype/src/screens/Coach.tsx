import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import {
  CATEGORY_LABELS,
  EXERCISES,
  doseText,
  getByCategory,
  getExercise,
} from '../lib/exercises';
import type { ExerciseCategory, ExerciseEx } from '../lib/exercises';
import { routineMinutes } from '../lib/routine';
import type { DayLog, Routine } from '../types';
import { KIND_LABELS } from '../types';

const CATEGORY_ORDER: ExerciseCategory[] = ['neck', 'shoulder', 'back', 'pelvis', 'posture'];

interface Props {
  routine: Routine | null;
  todayLog: DayLog | null;
  streak: number;
  activeDays: number;
  profileName: string;
  freshRoutine: boolean;
  onToggleDone: (exerciseId: string) => void;
  onAnalyze: () => void;
}

export function Coach({ routine, todayLog, streak, activeDays, profileName, freshRoutine, onToggleDone, onAnalyze }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  if (!routine) {
    return (
      <div className="screen fade-in">
        <div className="section stack">
          <p className="label">Coaching</p>
          <h1 className="title">
            측정이 끝나면<br />
            루틴이 만들어집니다
          </h1>
          <p className="body-text">
            자세를 측정하면 가장 약한 영역을 찾아
            하루 10분 안팎의 상체 스트레칭 루틴을
            구성해 드립니다.
          </p>
          <button className="btn btn-primary" onClick={onAnalyze}>
            자세 측정하러 가기
          </button>
        </div>
      </div>
    );
  }

  const exercises = routine.exerciseIds
    .map((id) => getExercise(id))
    .filter((ex): ex is ExerciseEx => ex !== null);
  const doneIds = todayLog?.doneIds ?? [];
  const doneCount = exercises.filter((ex) => doneIds.includes(ex.id)).length;
  const allDone = doneCount === exercises.length && exercises.length > 0;
  const open = openId ? getExercise(openId) : null;

  if (open) {
    return (
      <ExercisePlayer
        exercise={open}
        done={doneIds.includes(open.id)}
        onToggleDone={() => onToggleDone(open.id)}
        onClose={() => setOpenId(null)}
      />
    );
  }

  const progressPct = exercises.length > 0 ? (doneCount / exercises.length) * 100 : 0;

  return (
    <div className="screen fade-in">
      {freshRoutine && (
        <div className="fresh-routine-banner">
          <span className="fresh-routine-name">
            {profileName ? `${profileName}님` : '회원님'} 맞춤 추천 운동
          </span>
          <span className="caption">측정 결과를 반영해 구성했어요</span>
        </div>
      )}
      <div className="section">
        <p className="label">Coaching</p>
        <h1 className="title">오늘의 스트레칭</h1>
        <p className="body-text">
          상체 스트레칭 · {routine.focusLabel} · 약 {routineMinutes(routine)}분
        </p>
      </div>

      {/* 통계 */}
      <div className="stat-row">
        <div className="stat">
          <p className="caption">오늘 진행</p>
          <p className="stat-value num">
            {doneCount}<span className="stat-sub">/{exercises.length}</span>
          </p>
        </div>
        <div className="stat">
          <p className="caption">연속 완료</p>
          <p className="stat-value num">{streak}일</p>
        </div>
        <div className="stat">
          <p className="caption">최근 7일 활동</p>
          <p className="stat-value num">{activeDays}일</p>
        </div>
      </div>

      {/* 전체 진행률 */}
      <div className="routine-progress-wrap">
        <div className="routine-progress-bar">
          <div
            className="routine-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="caption num" style={{ marginTop: 6 }}>
          {allDone
            ? '오늘 스트레칭 완료 — 수고했어요'
            : `${doneCount} / ${exercises.length} 완료`}
        </p>
      </div>

      {allDone && (
        <div className="notice-done">
          <Icon name="check" size={18} />
          자세는 누적이 전부예요 — 내일 또 만나요.
        </div>
      )}

      {/* 운동 목록 */}
      <div className="section">
        <p className="label">운동 목록</p>
        <div className="item-list">
          {exercises.map((ex, i) => {
            const isDone = doneIds.includes(ex.id);
            return (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                index={i}
                isDone={isDone}
                onClick={() => setOpenId(ex.id)}
              />
            );
          })}
        </div>
      </div>

      <div className="section stack">
        <p className="caption">
          루틴은 최근 측정 결과를 기준으로 구성됩니다.
          다시 측정하면 새 루틴으로 바꿀 수 있습니다.
        </p>
        <button className="btn btn-secondary" onClick={onAnalyze}>
          다시 측정하고 루틴 갱신하기
        </button>
      </div>

      {/* 전체 자세 교정 프로그램 */}
      <FullProgram onStart={setOpenId} doneIds={doneIds} />
    </div>
  );
}

/* ---------- 전체 자세 교정 프로그램 ---------- */

interface FullProgramProps {
  onStart: (id: string) => void;
  doneIds: string[];
}

function FullProgram({ onStart, doneIds }: FullProgramProps) {
  const [openCat, setOpenCat] = useState<ExerciseCategory | null>(null);

  return (
    <div className="section">
      <p className="label">자세 교정 프로그램</p>
      <p className="caption" style={{ marginBottom: 14 }}>
        전체 {EXERCISES.length}개 동작을 카테고리별로 찾아볼 수 있어요.
      </p>
      <div className="fullprog-list">
        {CATEGORY_ORDER.map((cat) => {
          const items = getByCategory(cat);
          const isOpen = openCat === cat;
          return (
            <div key={cat} className="fullprog-block">
              <button
                className="fullprog-header"
                onClick={() => setOpenCat(isOpen ? null : cat)}
              >
                <span className="heading">{CATEGORY_LABELS[cat]}</span>
                <span className="fullprog-meta">
                  <span className="caption num">{items.length}개</span>
                  <span
                    className="ex-chevron"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
                  >
                    <Icon name="chevron" size={15} />
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="fullprog-items fade-in">
                  {items.map((ex) => {
                    const isDone = doneIds.includes(ex.id);
                    return (
                      <button
                        key={ex.id}
                        className={`fullprog-item${isDone ? ' ex-done' : ''}`}
                        onClick={() => onStart(ex.id)}
                      >
                        <span className="fullprog-item-info">
                          <span className={`heading${isDone ? ' struck' : ''}`}>
                            {ex.name}
                          </span>
                          <span className="caption">
                            {KIND_LABELS[ex.kind]} · {doseText(ex)}
                          </span>
                        </span>
                        {isDone
                          ? <Icon name="check" size={15} />
                          : <Icon name="chevron" size={15} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 운동 행 (아코디언 미리보기) ---------- */

interface RowProps {
  exercise: ExerciseEx;
  index: number;
  isDone: boolean;
  onClick: () => void;
}

function ExerciseRow({ exercise, index, isDone, onClick }: RowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`exercise-row-wrap${isDone ? ' ex-done' : ''}`}>
      <button
        className="exercise-row"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={`exercise-check${isDone ? ' done' : ''}`}>
          {isDone ? <Icon name="check" size={15} /> : <span className="num">{index + 1}</span>}
        </span>
        <span className="exercise-info">
          <span className={`heading${isDone ? ' struck' : ''}`}>{exercise.name}</span>
          <span className="caption">
            {KIND_LABELS[exercise.kind]} · {doseText(exercise)}
          </span>
          <span className="caption ex-category">
            {CATEGORY_LABELS[exercise.category]}
          </span>
        </span>
        <span
          className="ex-chevron"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
        >
          <Icon name="chevron" size={16} />
        </span>
      </button>

      {/* 아코디언 미리보기 */}
      {expanded && (
        <div className="ex-preview fade-in">
          <ol className="ex-preview-steps">
            {exercise.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {exercise.caution && (
            <p className="ex-preview-caution">⚠️ {exercise.caution}</p>
          )}
          <button className="btn btn-primary ex-start-btn" onClick={onClick}>
            시작하기
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- 운동 플레이어 ---------- */

interface PlayerProps {
  exercise: ExerciseEx;
  done: boolean;
  onToggleDone: () => void;
  onClose: () => void;
}

function ExercisePlayer({ exercise, done, onToggleDone, onClose }: PlayerProps) {
  return (
    <div className="screen fade-in">
      <div className="player-head">
        <button className="icon-btn" onClick={onClose} aria-label="뒤로">
          <Icon name="back" size={22} />
        </button>
        <span className="caption">{CATEGORY_LABELS[exercise.category]}</span>
      </div>

      <div className="section">
        <h1 className="title">{exercise.name}</h1>
        <p className="caption">{doseText(exercise)}</p>
      </div>

      <div className="section stack">
        <ol className="player-steps">
          {exercise.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        {exercise.tip && <p className="tip-box">{exercise.tip}</p>}
        {exercise.caution && (
          <p className="caution-box">⚠️ {exercise.caution}</p>
        )}
      </div>

      <div className="section stack">
        <button
          className={`btn ${done ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => {
            onToggleDone();
            onClose();
          }}
        >
          {done ? '완료 취소하기' : '이 운동 완료'}
        </button>
      </div>
    </div>
  );
}
