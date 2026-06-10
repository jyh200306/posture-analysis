import type { ItemKey, ItemScore, Level } from '../types';
import type { PoseData, Point } from './pose';

/** PRD 정상 범위 상한 */
const THRESHOLDS: Record<ItemKey, number> = {
  shoulder: 3, // %
  pelvis: 2, // %
  spine: 5, // °
  neck: 2.5, // cm
  balance: 3, // cm
};

const UNITS: Record<ItemKey, string> = {
  shoulder: '%',
  pelvis: '%',
  spine: '°',
  neck: 'cm',
  balance: 'cm',
};

/** PRD 종합 점수 가중치 */
const WEIGHTS: Record<ItemKey, number> = {
  shoulder: 0.25,
  pelvis: 0.2,
  spine: 0.3,
  neck: 0.15,
  balance: 0.1,
};

// 픽셀→cm 환산: 몸통 길이(목–골반 중점)를 50cm로 가정 (프로토타입 근사)
const TORSO_CM = 50;

export interface ScoredAnalysis {
  overallScore: number;
  items: Record<ItemKey, ItemScore>;
}

function levelOf(deviation: number, threshold: number): Level {
  // PRD F-003: 편차 < 기준 50% 양호, 50–100% 주의, 초과 시 불균형
  if (deviation < threshold * 0.5) return 'good';
  if (deviation <= threshold) return 'caution';
  return 'bad';
}

function toItemScore(key: ItemKey, deviation: number): ItemScore {
  const threshold = THRESHOLDS[key];
  // PRD 공식: 100 - (실측값 / 정상범위 상한) × 50, 최솟값 0
  const score = Math.max(0, Math.min(100, Math.round(100 - (deviation / threshold) * 50)));
  return {
    score,
    deviation: Math.round(deviation * 10) / 10,
    unit: UNITS[key],
    level: levelOf(deviation, threshold),
  };
}

/** PRD 분석 공식에 따라 17개 관절점에서 5개 항목 점수와 종합 점수를 계산한다. */
export function scorePose(pose: PoseData, imgWidth: number, imgHeight: number): ScoredAnalysis {
  // 정규화 좌표(0–1)를 픽셀 좌표로 변환 (가로세로 비율 왜곡 방지)
  const px = (p: Point) => ({ x: p.x * imgWidth, y: p.y * imgHeight });
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const kp = (id: number) => px(pose.keypoints[id]);
  const head = kp(0);
  const neck = kp(1);
  const shoulderL = kp(2);
  const shoulderR = kp(3);
  const hipL = kp(10);
  const hipR = kp(11);
  const ankleMid = {
    x: (kp(14).x + kp(15).x) / 2,
    y: (kp(14).y + kp(15).y) / 2,
  };
  const com = kp(16);
  const ear = px(pose.ear);

  const pxPerCm = dist(neck, com) / TORSO_CM;

  // 어깨 수평: Δy / 어깨너비 (%)
  const shoulderWidth = Math.max(dist(shoulderL, shoulderR), 1);
  const shoulderDev = (Math.abs(shoulderL.y - shoulderR.y) / shoulderWidth) * 100;

  // 골반 수평: Δy / 골반너비 (%)
  const pelvisWidth = Math.max(dist(hipL, hipR), 1);
  const pelvisDev = (Math.abs(hipL.y - hipR.y) / pelvisWidth) * 100;

  // 척추 정렬: 머리–골반 라인의 수직 대비 기울기 (°)
  const spineDev =
    (Math.atan2(Math.abs(head.x - com.x), Math.abs(com.y - head.y)) * 180) / Math.PI;

  // 목 전방 경사: 귀–어깨 중심 수평 오프셋 (cm)
  const neckDev = Math.abs(ear.x - neck.x) / pxPerCm;

  // 무게중심: 발목 중심 대비 수평 편차 (cm)
  const balanceDev = Math.abs(com.x - ankleMid.x) / pxPerCm;

  const items: Record<ItemKey, ItemScore> = {
    shoulder: toItemScore('shoulder', shoulderDev),
    pelvis: toItemScore('pelvis', pelvisDev),
    spine: toItemScore('spine', spineDev),
    neck: toItemScore('neck', neckDev),
    balance: toItemScore('balance', balanceDev),
  };

  const overallScore = Math.round(
    (Object.keys(WEIGHTS) as ItemKey[]).reduce(
      (sum, key) => sum + items[key].score * WEIGHTS[key],
      0,
    ),
  );

  return { overallScore, items };
}
