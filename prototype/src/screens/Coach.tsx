import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { doseText, getExercise } from '../lib/exercises';
import { routineMinutes } from '../lib/routine';
import type { DayLog, Exercise, Routine } from '../types';
import { KIND_LABELS } from '../types';

interface Props {
  routine: Routine | null;
  todayLog: DayLog | null;
  streak: number;
  activeDays: number; // 최근 7일 중 운동한 날
  onToggleDone: (exerciseId: string) => void;
  onAnalyze: () => void;
}

export function Coach({ routine, todayLog, streak, activeDays, onToggleDone, onAnalyze }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!routine) {
    return (
      <div className="screen fade-in">
        <div className="section stack">
          <p className="label">Coaching</p>
          <h1 className="title">
            측정이 끝나면
            <br />
            루틴이 만들어집니다
          </h1>
          <p className="body-text">
            자세를 측정하면 가장 약한 영역을 찾아 하루 10분 안팎의 교정 운동 루틴을
            구성해 드립니다. 이완, 가동성 회복, 강화가 균형 있게 들어갑니다.
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
    .filter((ex): ex is Exercise => ex !== null);
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

  return (
    <div className="screen fade-in">
      <div className="section">
        <p className="label">Coaching</p>
        <h1 className="title">오늘의 루틴</h1>
        <p className="body-text">
          집중 영역 — {routine.focusLabel} · 약 {routineMinutes(routine)}분
        </p>
      </div>

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

      {allDone && (
        <div className="notice-done">
          <Icon name="check" size={18} />
          오늘 루틴을 모두 마쳤습니다. 자세는 누적이 전부예요 — 내일 또 만나요.
        </div>
      )}

      <div className="section">
        <p className="label">운동 목록</p>
        <div className="item-list">
          {exercises.map((ex, i) => {
            const isDone = doneIds.includes(ex.id);
            return (
              <button key={ex.id} className="exercise-row" onClick={() => setOpenId(ex.id)}>
                <span className={`exercise-check${isDone ? ' done' : ''}`}>
                  {isDone ? <Icon name="check" size={15} /> : <span className="num">{i + 1}</span>}
                </span>
                <span className="exercise-info">
                  <span className={`heading${isDone ? ' struck' : ''}`}>{ex.name}</span>
                  <span className="caption">
                    {KIND_LABELS[ex.kind]} · {doseText(ex)}
                  </span>
                </span>
                <Icon name="chevron" size={16} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="section stack">
        <p className="caption">
          루틴은 최근 측정 결과를 기준으로 구성됩니다. 다시 측정하면 새 루틴으로 바꿀 수
          있습니다.
        </p>
        <button className="btn btn-secondary" onClick={onAnalyze}>
          다시 측정하고 루틴 갱신하기
        </button>
      </div>
    </div>
  );
}

/* ---------- 운동 플레이어 ---------- */

interface PlayerProps {
  exercise: Exercise;
  done: boolean;
  onToggleDone: () => void;
  onClose: () => void;
}

function ExercisePlayer({ exercise, done, onToggleDone, onClose }: PlayerProps) {
  const [setIndex, setSetIndex] = useState(0); // 완료한 세트 수
  const [remain, setRemain] = useState(exercise.hold ?? 0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const isHold = exercise.hold !== undefined;
  const totalSets = exercise.sets * (exercise.perSide ? 2 : 1);

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setRemain((r) => {
        if (r <= 1) {
          setRunning(false);
          setSetIndex((s) => Math.min(s + 1, totalSets));
          return exercise.hold ?? 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, exercise.hold, totalSets]);

  function completeSet() {
    setSetIndex((s) => Math.min(s + 1, totalSets));
  }

  const setsComplete = setIndex >= totalSets;

  return (
    <div className="screen fade-in">
      <div className="player-head">
        <button className="icon-btn" onClick={onClose} aria-label="뒤로">
          <Icon name="back" size={22} />
        </button>
        <span className="caption">{KIND_LABELS[exercise.kind]}</span>
      </div>

      <div className="section">
        <h1 className="title">{exercise.name}</h1>
        <p className="caption">{exercise.english} · {doseText(exercise)}</p>
      </div>

      {/* 세트 진행 */}
      <div className="section player-center">
        {isHold ? (
          <>
            <p className="player-timer num">{remain}</p>
            <p className="caption">초 남음</p>
            <div className="player-controls">
              <button className="icon-btn-lg" onClick={() => setRunning((r) => !r)} aria-label="시작/일시정지">
                <Icon name={running ? 'pause' : 'play'} size={26} />
              </button>
              <button
                className="icon-btn-lg"
                onClick={() => {
                  setRunning(false);
                  setRemain(exercise.hold ?? 0);
                }}
                aria-label="초기화"
              >
                <Icon name="refresh" size={22} />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="player-timer num">{exercise.reps}</p>
            <p className="caption">회 반복</p>
            <button className="btn btn-secondary" onClick={completeSet} disabled={setsComplete}>
              세트 완료
            </button>
          </>
        )}
        <div className="set-dots">
          {Array.from({ length: totalSets }, (_, i) => (
            <span key={i} className={`set-dot${i < setIndex ? ' filled' : ''}`} />
          ))}
        </div>
        <p className="caption num">
          {exercise.perSide ? '좌우 번갈아 · ' : ''}
          {Math.min(setIndex + 1, totalSets)}/{totalSets} 세트
        </p>
      </div>

      <div className="section stack">
        <p className="label">수행 방법</p>
        <ol className="steps-list">
          {exercise.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <p className="tip-box">{exercise.tip}</p>
        {exercise.caution && <p className="caution-box">{exercise.caution}</p>}
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
