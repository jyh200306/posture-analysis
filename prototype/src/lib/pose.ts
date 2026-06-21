import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { Keypoint } from '../types';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export interface Point {
  x: number;
  y: number;
  confidence: number;
}

export interface PoseData {
  /** 17개 관절점 (배열 인덱스 = 관절 id) — 오버레이 렌더링용 */
  keypoints: Keypoint[];
  /** 귀 위치 — 목 전방 정렬 측정용 */
  ear: Point;
  earL: Point;
  earR: Point;
}

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

/** 모델은 최초 1회만 로드 (CDN에서 WASM + 모델 파일 다운로드) */
function getLandmarker(): Promise<PoseLandmarker> {
  landmarkerPromise ??= FilesetResolver.forVisionTasks(WASM_URL).then((vision) =>
    PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: 'IMAGE',
      numPoses: 1,
    }),
  );
  return landmarkerPromise;
}

/** 사용자가 기다리기 전에 모델을 미리 받아둔다 (실패해도 분석 시 재시도) */
export function preloadModel(): void {
  getLandmarker().catch(() => {
    landmarkerPromise = null;
  });
}

// MediaPipe BlazePose 33개 관절 중 사용하는 인덱스
const BP = {
  nose: 0,
  eyeOuterL: 3,
  eyeOuterR: 6,
  earL: 7,
  earR: 8,
  shoulderL: 11,
  shoulderR: 12,
  elbowL: 13,
  elbowR: 14,
  wristL: 15,
  wristR: 16,
  hipL: 23,
  hipR: 24,
  kneeL: 25,
  kneeR: 26,
  ankleL: 27,
  ankleR: 28,
} as const;

function mid(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    confidence: Math.min(a.confidence, b.confidence),
  };
}

function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    confidence: Math.min(a.confidence, b.confidence),
  };
}

// BlazePose의 귀 랜드마크는 귀 앞 가장자리에 가깝게 찍혀, 거북목 측정의 임상 기준점인
// tragus(귀 중앙)보다 앞쪽에 위치한다. 그대로 쓰면 목 전방 각도가 과대평가되어
// 거북목 판정이 지나치게 엄격해진다. 눈 바깥구석→귀 방향(머리 앞→뒤)으로 귀점을
// 조금 더 밀어 tragus에 근접시킨다. 비율은 머리 크기에 비례해 자동 조절된다.
const TRAGUS_SHIFT = 0.25; // 눈-귀 거리의 25%만큼 뒤로 이동 — 초기 추정치
function tragusOf(eyeOuter: Point, ear: Point): Point {
  return lerp(eyeOuter, ear, 1 + TRAGUS_SHIFT);
}

/**
 * 이미지에서 자세를 감지해 17개 관절점으로 변환한다.
 * 사람이 감지되지 않거나 몸통 신뢰도가 낮으면 null을 반환한다.
 */
export async function detectPose(image: HTMLImageElement): Promise<PoseData | null> {
  const landmarker = await getLandmarker();
  const detection = landmarker.detect(image);
  const lms = detection.landmarks[0];
  if (!lms) return null;

  const pt = (i: number): Point => ({
    x: lms[i].x,
    y: lms[i].y,
    confidence: lms[i].visibility ?? 1,
  });

  const head = pt(BP.nose);
  const shoulderL = pt(BP.shoulderL);
  const shoulderR = pt(BP.shoulderR);
  const hipL = pt(BP.hipL);
  const hipR = pt(BP.hipR);
  const neck = mid(shoulderL, shoulderR);
  const hipMid = mid(hipL, hipR);

  // 몸통(어깨·골반)이 제대로 안 보이면 분석 불가로 처리
  const coreConfidence =
    (shoulderL.confidence + shoulderR.confidence + hipL.confidence + hipR.confidence) / 4;
  if (coreConfidence < 0.5) return null;

  const points: Array<[string, Point]> = [
    ['head', head],
    ['neck', neck],
    ['shoulder_l', shoulderL],
    ['shoulder_r', shoulderR],
    ['elbow_l', pt(BP.elbowL)],
    ['elbow_r', pt(BP.elbowR)],
    ['wrist_l', pt(BP.wristL)],
    ['wrist_r', pt(BP.wristR)],
    ['spine_upper', lerp(neck, hipMid, 1 / 3)],
    ['spine_lower', lerp(neck, hipMid, 2 / 3)],
    ['hip_l', hipL],
    ['hip_r', hipR],
    ['knee_l', pt(BP.kneeL)],
    ['knee_r', pt(BP.kneeR)],
    ['ankle_l', pt(BP.ankleL)],
    ['ankle_r', pt(BP.ankleR)],
    ['center_of_mass', hipMid],
  ];

  // 귀 앞 가장자리 → tragus(귀 중앙)로 보정해 거북목 측정 기준을 임상 기준에 맞춘다
  const earL = tragusOf(pt(BP.eyeOuterL), pt(BP.earL));
  const earR = tragusOf(pt(BP.eyeOuterR), pt(BP.earR));

  return {
    keypoints: points.map(([label, p], id) => ({ id, label, ...p })),
    ear: earL.confidence >= earR.confidence ? earL : earR,
    earL,
    earR,
  };
}
