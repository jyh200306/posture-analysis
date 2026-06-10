import type { Direction, ItemKey, ItemScore, Level } from '../types';
import type { PoseData, Point } from './pose';

interface ItemConfig {
  threshold: number; // 정상 범위 상한
  unit: string;
  weight: number; // 종합 점수 가중치 (방향별 합계 1)
}

/** 정면 항목 — 좌우 균형 측정 */
const FRONT_CONFIG: Partial<Record<ItemKey, ItemConfig>> = {
  shoulder: { threshold: 3, unit: '%', weight: 0.4 },
  pelvis: { threshold: 2, unit: '%', weight: 0.3 },
  neck: { threshold: 3, unit: '°', weight: 0.3 },
};

/** 측면 항목 — 앞뒤 굽은 정도 측정 */
const SIDE_CONFIG: Partial<Record<ItemKey, ItemConfig>> = {
  neck: { threshold: 2.5, unit: 'cm', weight: 0.25 },
  back: { threshold: 5, unit: '°', weight: 0.25 },
  waist: { threshold: 3, unit: 'cm', weight: 0.2 },
  spine: { threshold: 10, unit: '°', weight: 0.3 },
};

// 픽셀→cm 환산: 몸통 길이(목–골반 중점)를 50cm로 가정 (프로토타입 근사)
const TORSO_CM = 50;

export interface ScoredAnalysis {
  overallScore: number;
  items: Partial<Record<ItemKey, ItemScore>>;
}

function levelOf(deviation: number, threshold: number): Level {
  // PRD F-003: 편차 < 기준 50% 양호, 50–100% 주의, 초과 시 불균형
  if (deviation < threshold * 0.5) return 'good';
  if (deviation <= threshold) return 'caution';
  return 'bad';
}

function toItemScore(deviation: number, config: ItemConfig): ItemScore {
  // PRD 공식: 100 - (실측값 / 정상범위 상한) × 50, 최솟값 0
  const score = Math.max(
    0,
    Math.min(100, Math.round(100 - (deviation / config.threshold) * 50)),
  );
  return {
    score,
    deviation: Math.round(deviation * 10) / 10,
    unit: config.unit,
    level: levelOf(deviation, config.threshold),
  };
}

/** 촬영 방향에 맞는 항목별 편차를 측정해 점수와 종합 점수를 계산한다. */
export function scorePose(
  pose: PoseData,
  imgWidth: number,
  imgHeight: number,
  direction: Direction,
): ScoredAnalysis {
  // 정규화 좌표(0–1)를 픽셀 좌표로 변환 (가로세로 비율 왜곡 방지)
  const px = (p: Point) => ({ x: p.x * imgWidth, y: p.y * imgHeight });
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  // 위쪽 점(top)–아래쪽 점(bottom)을 잇는 선이 수직에서 기울어진 각도 (°, 부호 있음)
  const tiltDeg = (top: { x: number; y: number }, bottom: { x: number; y: number }) =>
    (Math.atan2(top.x - bottom.x, bottom.y - top.y) * 180) / Math.PI;

  const kp = (id: number) => px(pose.keypoints[id]);
  const head = kp(0);
  const neck = kp(1);
  const shoulderL = kp(2);
  const shoulderR = kp(3);
  const hipL = kp(10);
  const hipR = kp(11);
  const hipMid = kp(16);
  const ankleMid = {
    x: (kp(14).x + kp(15).x) / 2,
    y: (kp(14).y + kp(15).y) / 2,
  };
  const ear = px(pose.ear);

  const pxPerCm = dist(neck, hipMid) / TORSO_CM;

  const deviations: Partial<Record<ItemKey, number>> = {};

  if (direction === 'front') {
    // 어깨 수평: 좌우 어깨 높이차 / 어깨너비 (%)
    const shoulderWidth = Math.max(dist(shoulderL, shoulderR), 1);
    deviations.shoulder = (Math.abs(shoulderL.y - shoulderR.y) / shoulderWidth) * 100;

    // 골반 수평: 좌우 골반 높이차 / 골반너비 (%)
    const pelvisWidth = Math.max(dist(hipL, hipR), 1);
    deviations.pelvis = (Math.abs(hipL.y - hipR.y) / pelvisWidth) * 100;

    // 목 정렬: 머리가 어깨 중심 수직선에서 좌우로 기울어진 각도 (°)
    deviations.neck = Math.abs(tiltDeg(head, neck));
  } else {
    // 목(거북목): 귀가 어깨 중심선보다 앞으로 나온 거리 (cm)
    deviations.neck = Math.abs(ear.x - neck.x) / pxPerCm;

    // 등 굽음: 어깨–골반 라인이 수직에서 앞으로 기울어진 각도 (°)
    deviations.back = Math.abs(tiltDeg(neck, hipMid));

    // 허리 정렬: 골반이 발목 수직선에서 앞뒤로 벗어난 거리 (cm)
    deviations.waist = Math.abs(hipMid.x - ankleMid.x) / pxPerCm;

    // 척추 굽음: 귀–어깨 라인과 어깨–골반 라인이 꺾인 각도 (°) — 일직선이면 0
    deviations.spine = Math.abs(tiltDeg(ear, neck) - tiltDeg(neck, hipMid));
  }

  const config = direction === 'front' ? FRONT_CONFIG : SIDE_CONFIG;
  const items: Partial<Record<ItemKey, ItemScore>> = {};
  let overall = 0;
  for (const key of Object.keys(config) as ItemKey[]) {
    const item = toItemScore(deviations[key]!, config[key]!);
    items[key] = item;
    overall += item.score * config[key]!.weight;
  }

  return { overallScore: Math.round(overall), items };
}
