import type { Direction, Level, MetricKey, MetricScore } from '../types';
import type { PoseData, Point } from './pose';

/**
 * 측정 기준 — 운동학의 정적 자세 평가에서 쓰는 수직 정렬선 개념을 따른다.
 * 바른 선 자세에서 측면의 귀·어깨·골반·발목은 하나의 수직선 위에 놓이고,
 * 정면의 어깨·골반·귀 라인은 수평을 이룬다. 각 지표는 이 기준선에서
 * 벗어난 각도(°)를 잰다. 각도는 사진 크기·거리와 무관해 회차 간 비교가 가능하다.
 */
interface MetricSpec {
  good: number; // 이 각도 이하면 양호
  bad: number; //  이 각도 초과면 교정 필요
  weight: number; // 종합 점수 가중치 (방향별 합 1)
}

// 주의: 아래 임계값(good/bad)과 가중치(weight)는 임상적으로 검증된 값이 아닌
// 초기 추정치다. 실제 사진으로 테스트하며 보정해야 하며, 이 점수는 의료적
// 진단이 아니라 회차 간 변화를 보는 참고 지표로만 사용한다.
const SPECS: Record<MetricKey, MetricSpec> = {
  // 정면 — 좌우 균형
  shoulderTilt: { good: 2, bad: 4, weight: 0.3 },
  pelvisTilt: { good: 2, bad: 4, weight: 0.3 },
  headTilt: { good: 3, bad: 6, weight: 0.2 },
  bodyLean: { good: 2, bad: 4, weight: 0.2 },
  // 측면 — 전후 정렬. neckForward의 양호 8° 기준은
  // 귀-어깨 거리 기준 약 2.5cm 전방 이동에 해당한다.
  neckForward: { good: 8, bad: 16, weight: 0.35 },
  roundedUpper: { good: 10, bad: 20, weight: 0.25 },
  trunkLean: { good: 4, bad: 8, weight: 0.2 },
  hipShift: { good: 4, bad: 8, weight: 0.2 },
};

export interface ScoredAnalysis {
  overallScore: number;
  metrics: Partial<Record<MetricKey, MetricScore>>;
}

function levelOf(value: number, spec: MetricSpec): Level {
  if (value <= spec.good) return 'good';
  if (value <= spec.bad) return 'caution';
  return 'bad';
}

/** 편차 0° → 100점, 양호 경계 → 85점, 교정 경계 → 60점, 그 이상은 완만히 감점 */
function scoreOf(value: number, spec: MetricSpec): number {
  let score: number;
  if (value <= spec.good) {
    score = 100 - (value / spec.good) * 15;
  } else if (value <= spec.bad) {
    score = 85 - ((value - spec.good) / (spec.bad - spec.good)) * 25;
  } else {
    score = Math.max(15, 60 - ((value - spec.bad) / spec.bad) * 45);
  }
  return Math.round(score);
}

function toMetric(value: number, spec: MetricSpec): MetricScore {
  return {
    score: scoreOf(value, spec),
    value: Math.round(value * 10) / 10,
    level: levelOf(value, spec),
  };
}

/** 촬영 방향에 맞는 지표를 측정해 항목별·종합 점수를 계산한다. */
export function scorePose(
  pose: PoseData,
  imgWidth: number,
  imgHeight: number,
  direction: Direction,
): ScoredAnalysis {
  // 정규화 좌표(0–1)를 픽셀 좌표로 변환해 가로세로 비율 왜곡을 없앤다
  const px = (p: Point | { x: number; y: number }) => ({
    x: p.x * imgWidth,
    y: p.y * imgHeight,
  });

  type P = { x: number; y: number };
  // 두 점을 잇는 선이 수평에서 기운 각도 (0–90°)
  const tiltFromHorizontal = (a: P, b: P) => {
    const deg = Math.abs((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
    return Math.min(deg, 180 - deg);
  };
  // 아래 점에서 위 점으로 향하는 선이 수직에서 기운 각도 (0–90°)
  const tiltFromVertical = (top: P, bottom: P) =>
    Math.abs((Math.atan2(top.x - bottom.x, bottom.y - top.y) * 180) / Math.PI);

  const kp = (id: number) => px(pose.keypoints[id]);
  const neck = kp(1);
  const shoulderL = kp(2);
  const shoulderR = kp(3);
  const hipL = kp(10);
  const hipR = kp(11);
  const hipMid = kp(16);
  const ankleL = pose.keypoints[14];
  const ankleR = pose.keypoints[15];
  const ankleMid = px({
    x: (ankleL.x + ankleR.x) / 2,
    y: (ankleL.y + ankleR.y) / 2,
  });
  const ear = px(pose.ear);

  const values: Partial<Record<MetricKey, number>> = {};

  if (direction === 'front') {
    values.shoulderTilt = tiltFromHorizontal(shoulderL, shoulderR);
    values.pelvisTilt = tiltFromHorizontal(hipL, hipR);
    values.bodyLean = tiltFromVertical(neck, hipMid);
    // 머리 기울기는 양쪽 귀가 모두 보일 때만 측정
    if (pose.earL.confidence >= 0.5 && pose.earR.confidence >= 0.5) {
      values.headTilt = tiltFromHorizontal(px(pose.earL), px(pose.earR));
    }
  } else {
    // 목 전방 정렬: 바른 자세에서 귀는 어깨 바로 위 — 수직선에서 벗어난 각도를 잰다
    values.neckForward = tiltFromVertical(ear, neck);
    // 상체 굽음: 귀-어깨 선과 어깨-골반 선이 일직선(0°)에서 꺾인 정도
    values.roundedUpper = Math.abs(
      tiltFromVertical(ear, neck) - tiltFromVertical(neck, hipMid),
    );
    values.trunkLean = tiltFromVertical(neck, hipMid);
    // 골반 정렬은 발목이 보일 때만 측정 (전신이 아니면 건너뜀)
    if (ankleL.confidence >= 0.5 || ankleR.confidence >= 0.5) {
      values.hipShift = tiltFromVertical(hipMid, ankleMid);
    }
  }

  const metrics: Partial<Record<MetricKey, MetricScore>> = {};
  let weighted = 0;
  let weightSum = 0;
  for (const key of Object.keys(values) as MetricKey[]) {
    const metric = toMetric(values[key]!, SPECS[key]);
    metrics[key] = metric;
    weighted += metric.score * SPECS[key].weight;
    weightSum += SPECS[key].weight;
  }

  return {
    // 일부 지표가 빠졌으면 측정된 지표의 가중치만으로 평균
    overallScore: Math.round(weighted / weightSum),
    metrics,
  };
}

/* ---------- 등급 ---------- */

export interface GradeInfo {
  label: string;
  comment: string;
}

export function gradeOf(score: number): GradeInfo {
  if (score >= 90) return { label: '우수', comment: '정렬이 매우 안정적입니다' };
  if (score >= 80) return { label: '양호', comment: '전반적으로 바른 정렬입니다' };
  if (score >= 65) return { label: '보통', comment: '일부 영역의 관리가 필요합니다' };
  if (score >= 50) return { label: '주의', comment: '교정 운동을 시작해 보세요' };
  return { label: '관리 필요', comment: '꾸준한 교정 루틴이 필요합니다' };
}

/* ---------- 자세 패턴 분류 ---------- */

/** 지표 조합으로 대표 자세 패턴을 분류한다. 의학적 진단이 아닌 경향 설명. */
export function classifyPattern(
  direction: Direction,
  metrics: Partial<Record<MetricKey, MetricScore>>,
): string {
  const lv = (key: MetricKey): Level => metrics[key]?.level ?? 'good';
  const anyCaution = Object.values(metrics).some((m) => m.level !== 'good');

  if (direction === 'side') {
    const neckBad = lv('neckForward') === 'bad';
    const upperOff = lv('roundedUpper') !== 'good';
    if (neckBad && upperOff) return '거북목·굽은 등 복합 패턴';
    if (neckBad) return '전방머리자세(거북목) 패턴';
    if (lv('roundedUpper') === 'bad') return '굽은 등 패턴';
    if (lv('hipShift') === 'bad') return '스웨이백 경향';
    if (lv('trunkLean') === 'bad') return '상체 기울임 패턴';
    if (anyCaution) return '경미한 전후 정렬 흐트러짐';
    return '중립 정렬';
  }

  const shoulderBad = lv('shoulderTilt') === 'bad';
  const pelvisBad = lv('pelvisTilt') === 'bad';
  if (shoulderBad && pelvisBad) return '전신 좌우 불균형 패턴';
  if (shoulderBad) return '어깨 비대칭 패턴';
  if (pelvisBad) return '골반 비대칭 패턴';
  if (lv('headTilt') === 'bad') return '머리 기울임 패턴';
  if (lv('bodyLean') === 'bad') return '몸통 측방 기울임';
  if (anyCaution) return '경미한 좌우 불균형';
  return '좌우 균형 양호';
}
