export type Direction = 'front' | 'side';
export type Level = 'good' | 'caution' | 'bad';

/**
 * 측정 지표 — 모든 값은 각도(°) 기반.
 * 길이 환산 없이 사진 크기와 무관하게 동일한 기준으로 측정된다.
 * 측면 지표는 운동학에서 쓰는 수직 정렬선(귀-어깨-골반-발목) 기준.
 */
export type MetricKey =
  | 'shoulderTilt' // 정면: 어깨 라인이 수평에서 기운 각도
  | 'pelvisTilt' //   정면: 골반 라인이 수평에서 기운 각도
  | 'headTilt' //     정면: 머리(귀 라인)가 수평에서 기운 각도
  | 'bodyLean' //     정면: 몸통 중심선이 수직에서 기운 각도
  | 'neckForward' //  측면: 귀가 어깨 수직선보다 앞으로 나간 각도 (전방머리자세)
  | 'roundedUpper' // 측면: 귀-어깨-골반 라인이 꺾인 각도 (굽은 등)
  | 'trunkLean' //    측면: 어깨-골반 라인이 수직에서 기운 각도
  | 'hipShift'; //    측면: 골반이 발목 수직선에서 벗어난 각도 (스웨이백)

export const DIRECTION_METRICS: Record<Direction, MetricKey[]> = {
  front: ['shoulderTilt', 'pelvisTilt', 'headTilt', 'bodyLean'],
  side: ['neckForward', 'roundedUpper', 'trunkLean', 'hipShift'],
};

export const DIRECTION_LABELS: Record<Direction, string> = {
  front: '정면',
  side: '측면',
};

export const METRIC_LABELS: Record<MetricKey, string> = {
  shoulderTilt: '어깨 수평',
  pelvisTilt: '골반 수평',
  headTilt: '머리 기울기',
  bodyLean: '몸통 중심',
  neckForward: '목 전방 정렬',
  roundedUpper: '상체 굽음',
  trunkLean: '몸통 기울기',
  hipShift: '골반 정렬',
};

/** 각 지표가 무엇을 재는지 — 결과 화면에서 측정의 근거를 보여준다 */
export const METRIC_DESC: Record<MetricKey, string> = {
  shoulderTilt: '좌우 어깨를 잇는 선이 수평에서 기운 각도',
  pelvisTilt: '좌우 골반을 잇는 선이 수평에서 기운 각도',
  headTilt: '좌우 귀를 잇는 선이 수평에서 기운 각도',
  bodyLean: '목-골반 중심선이 수직에서 기운 각도',
  neckForward: '귀가 어깨 수직선에서 앞으로 벗어난 각도',
  roundedUpper: '귀-어깨-골반 정렬선이 꺾인 각도',
  trunkLean: '어깨-골반 선이 수직에서 기운 각도',
  hipShift: '골반이 발목 수직선에서 벗어난 각도',
};

export const LEVEL_LABELS: Record<Level, string> = {
  good: '양호',
  caution: '주의',
  bad: '교정 필요',
};

export interface Keypoint {
  id: number;
  label: string;
  x: number; // 0–1 정규화 좌표
  y: number;
  confidence: number;
}

export interface MetricScore {
  score: number; // 0–100
  value: number; // 측정 각도(°)
  level: Level;
}

export interface AnalysisResult {
  id: string;
  createdAt: string; // ISO-8601
  direction: Direction;
  overallScore: number;
  pattern: string; // 자세 패턴 분류명 (예: 전방머리자세 패턴)
  metrics: Partial<Record<MetricKey, MetricScore>>;
  keypoints: Keypoint[];
}

/**
 * 저장용 — 사진(imageUrl)은 저장하지 않는다.
 * 키포인트·귀 위치·이미지 비율은 리포트에서 실제 자세 골격선을 그리기 위해 저장한다.
 * (구 기록에는 없을 수 있어 옵셔널)
 */
export interface AnalysisRecord {
  id: string;
  createdAt: string;
  direction: Direction;
  overallScore: number;
  pattern: string;
  metrics: Partial<Record<MetricKey, MetricScore>>;
  /** 17개 관절점 (정규화 좌표) — 골격선 렌더링용 */
  keypoints?: Keypoint[];
  /** 측면 정렬선용 귀 위치 */
  ear?: { x: number; y: number; confidence: number };
  /** 원본 이미지 픽셀 비율 (골격 가로세로 보정용) */
  imageWidth?: number;
  imageHeight?: number;
}

/* ---------- 코칭 ---------- */

export type ExerciseKind = 'stretch' | 'strength' | 'mobility';

export const KIND_LABELS: Record<ExerciseKind, string> = {
  stretch: '스트레칭',
  strength: '강화',
  mobility: '가동성',
};

export interface Exercise {
  id: string;
  name: string;
  english: string;
  kind: ExerciseKind;
  targets: MetricKey[];
  sets: number;
  reps?: number; //  횟수 기반 운동
  hold?: number; //  시간 기반 운동 (초)
  perSide?: boolean; // 좌우 각각 수행
  minutes: number; // 예상 소요 시간(분)
  steps: string[];
  tip: string; // 호흡·자세 큐
  caution?: string;
}

export interface Routine {
  id: string;
  createdAt: string;
  basedOnId: string | null; // 근거가 된 분석 기록 id (없으면 기본 루틴)
  focus: MetricKey[];
  focusLabel: string;
  exerciseIds: string[];
}

/** 하루 운동 수행 기록 */
export interface DayLog {
  date: string; // YYYY-MM-DD
  doneIds: string[];
  total: number; // 당시 루틴의 운동 개수
}

/* ---------- 사용자 ---------- */

export type Goal = 'neck' | 'balance' | 'habit';

export const GOAL_LABELS: Record<Goal, string> = {
  neck: '거북목 개선',
  balance: '체형 균형',
  habit: '바른 자세 습관',
};

export interface Profile {
  name: string;
  goal: Goal;
  agreedAt: string; // ISO-8601
}
