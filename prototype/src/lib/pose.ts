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
  /** PRD 정의 17개 관절점 (배열 인덱스 = 관절 id) */
  keypoints: Keypoint[];
  /** 귀 위치 — 목 전방 경사 계산용 (PRD 17개에는 없지만 측정에 필요) */
  ear: Point;
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

// MediaPipe BlazePose 33개 관절 중 사용하는 인덱스
const BP = {
  nose: 0,
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

/**
 * 이미지에서 자세를 감지해 PRD 17개 관절점으로 변환한다.
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

  // 몸통(어깨·골반)이 제대로 안 보이면 분석 불가로 처리 (RULE-003)
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

  const earL = pt(BP.earL);
  const earR = pt(BP.earR);

  return {
    keypoints: points.map(([label, p], id) => ({ id, label, ...p })),
    ear: earL.confidence >= earR.confidence ? earL : earR,
  };
}
