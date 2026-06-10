export type Direction = 'front' | 'side';
export type Level = 'good' | 'caution' | 'bad';
export type ItemKey = 'shoulder' | 'pelvis' | 'spine' | 'neck' | 'balance';

export const ITEM_LABELS: Record<ItemKey, string> = {
  shoulder: '어깨 수평',
  pelvis: '골반 수평',
  spine: '척추 정렬',
  neck: '목 정렬',
  balance: '무게중심',
};

export const LEVEL_LABELS: Record<Level, string> = {
  good: '양호',
  caution: '주의',
  bad: '불균형',
};

export interface Keypoint {
  id: number;
  label: string;
  x: number; // 0–1 정규화 좌표
  y: number;
  confidence: number;
}

export interface ItemScore {
  score: number; // 0–100
  deviation: number;
  unit: string;
  level: Level;
}

export interface FeedbackArea {
  key: ItemKey;
  title: string;
  state: string;
  actions: string[];
  minutes: number;
}

export interface Feedback {
  summary: string;
  areas: FeedbackArea[];
  encouragement: string;
}

export interface AnalysisResult {
  id: string;
  createdAt: string; // ISO-8601
  direction: Direction;
  overallScore: number;
  items: Record<ItemKey, ItemScore>;
  keypoints: Keypoint[];
  feedback: Feedback;
}

/** 저장용 — 이미지/키포인트/피드백 본문은 저장하지 않는다 (PRD 4.1) */
export interface AnalysisRecord {
  id: string;
  createdAt: string;
  direction: Direction;
  overallScore: number;
  items: Record<ItemKey, ItemScore>;
}
