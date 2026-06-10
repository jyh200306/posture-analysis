import type { Direction, Feedback, FeedbackArea, ItemKey, ItemScore } from '../types';
import { ITEM_LABELS } from '../types';

const ACTIONS: Record<ItemKey, { actions: string[]; minutes: number }> = {
  shoulder: {
    actions: ['벽에 등을 대고 양팔 W–Y 슬라이드 15회', '승모근 스트레칭 좌우 30초씩'],
    minutes: 5,
  },
  pelvis: {
    actions: ['옆으로 누워 다리 들어올리기 15회 × 2세트', '골반 시계 운동 1분'],
    minutes: 5,
  },
  neck: {
    actions: ['턱 당기기(친 턱) 10회 × 3세트', '상부 승모근 스트레칭 좌우 30초씩'],
    minutes: 5,
  },
  back: {
    actions: ['폼롤러 위에 등을 대고 흉추 펴기 10회', '벽 천사 운동 12회'],
    minutes: 5,
  },
  waist: {
    actions: ['벽에 등을 대고 골반 중립 자세 찾기 1분', '엉덩이 브릿지 15회 × 2세트'],
    minutes: 5,
  },
  spine: {
    actions: ['캣카우 스트레칭 10회', '벽 천사 운동 12회', '플랭크 30초 × 2세트'],
    minutes: 7,
  },
};

function stateText(key: ItemKey, item: ItemScore, direction: Direction): string {
  const value = `${item.deviation}${item.unit}`;
  switch (key) {
    case 'shoulder':
      return `좌우 어깨 높이가 어깨너비 대비 ${value} 차이로 측정되었습니다.`;
    case 'pelvis':
      return `좌우 골반 높이가 골반너비 대비 ${value} 차이로 측정되었습니다.`;
    case 'neck':
      return direction === 'front'
        ? `머리가 어깨 중심 수직선에서 ${value} 기울어진 것으로 측정되었습니다.`
        : `귀가 어깨 중심선보다 약 ${value} 앞으로 나온 것으로 측정되었습니다.`;
    case 'back':
      return `어깨–골반 라인이 수직에서 ${value} 기울어진 것으로 측정되었습니다.`;
    case 'waist':
      return `골반이 발목 수직선에서 약 ${value} 벗어난 것으로 측정되었습니다.`;
    case 'spine':
      return `귀–어깨–골반 라인이 ${value} 굽은 것으로 측정되었습니다.`;
  }
}

function summaryText(overallScore: number, worst: { key: ItemKey; item: ItemScore } | null): string {
  let base: string;
  if (overallScore >= 85) base = '전반적으로 안정적인 자세로 측정되었습니다.';
  else if (overallScore >= 70) base = '전반적으로 양호하나 일부 영역에 주의가 필요합니다.';
  else if (overallScore >= 50) base = '개선 여지가 있는 자세로 측정되었습니다.';
  else base = '여러 영역에서 불균형이 측정되었습니다.';

  if (worst && worst.item.level !== 'good') {
    base += ` 특히 ${ITEM_LABELS[worst.key]} 항목을 살펴보세요.`;
  }
  return base;
}

function encouragementText(overallScore: number, previousScore: number | null): string {
  if (previousScore === null) {
    return '첫 분석을 마쳤습니다. 꾸준히 기록하면 자세 변화를 추적할 수 있습니다. 같은 장소, 같은 거리에서 촬영하면 비교가 더 정확해집니다.';
  }
  const diff = overallScore - previousScore;
  if (diff > 0) {
    return `지난 분석 대비 ${diff}점 올랐습니다. 변화가 측정되고 있으니 같은 조건에서 꾸준히 기록해 보세요.`;
  }
  if (diff < 0) {
    return `지난 분석 대비 ${Math.abs(diff)}점 내려갔습니다. 촬영 각도에 따라 점수가 달라질 수 있으니, 같은 조건에서 다시 측정해 추이를 확인해 보세요.`;
  }
  return '지난 분석과 같은 점수입니다. 개선 운동을 병행하면서 추이를 지켜보세요.';
}

/** 점수 데이터로 3단 구조(종합 평가 / 개선 영역 / 격려)의 피드백을 생성한다. (PRD F-004) */
export function buildFeedback(
  items: Partial<Record<ItemKey, ItemScore>>,
  direction: Direction,
  overallScore: number,
  previousScore: number | null,
): Feedback {
  // 점수 낮은 순으로 정렬해 개선이 필요한 영역만 추린다
  const sorted = (Object.keys(items) as ItemKey[])
    .map((key) => ({ key, item: items[key]! }))
    .sort((a, b) => a.item.score - b.item.score);

  const areas: FeedbackArea[] = sorted
    .filter(({ item }) => item.level !== 'good')
    .map(({ key, item }) => ({
      key,
      title: ITEM_LABELS[key],
      state: stateText(key, item, direction),
      actions: ACTIONS[key].actions,
      minutes: ACTIONS[key].minutes,
    }));

  return {
    summary: summaryText(overallScore, sorted[0] ?? null),
    areas,
    encouragement: encouragementText(overallScore, previousScore),
  };
}
