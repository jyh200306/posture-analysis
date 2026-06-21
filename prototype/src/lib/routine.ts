import type { AnalysisResult, MetricKey, Routine } from '../types';
import { METRIC_LABELS } from '../types';
import { BASE_PROGRAM, METRIC_PROGRAMS, getExercise } from './exercises';

const MAX_EXERCISES = 5;

export function buildRoutine(result: AnalysisResult): Routine {
  const weak = (Object.keys(result.metrics) as MetricKey[])
    .map((key) => ({ key, metric: result.metrics[key]! }))
    .filter(({ metric }) => metric.level !== 'good')
    .sort((a, b) => a.metric.score - b.metric.score)
    .slice(0, 2)
    .map(({ key }) => key);

  const exerciseIds: string[] = [];
  if (weak.length === 0) {
    exerciseIds.push(...BASE_PROGRAM);
  } else {
    const programs = weak.map((key) => METRIC_PROGRAMS[key]);
    for (let i = 0; exerciseIds.length < MAX_EXERCISES; i++) {
      const program = programs[i % programs.length];
      const next = program.find((id) => !exerciseIds.includes(id));
      if (next) exerciseIds.push(next);
      if (programs.every((p) => p.every((id) => exerciseIds.includes(id)))) break;
    }
  }

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    basedOnId: weak.length > 0 ? result.id : null,
    focus: weak,
    focusLabel:
      weak.length > 0
        ? weak.map((key) => METRIC_LABELS[key]).join(' · ')
        : '바른 자세 유지',
    exerciseIds: exerciseIds.filter((id) => getExercise(id) !== null),
  };
}

export function routineMinutes(routine: Routine): number {
  return routine.exerciseIds.reduce((sum, id) => sum + (getExercise(id)?.minutes ?? 0), 0);
}
