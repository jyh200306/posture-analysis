import type { Exercise, MetricKey } from '../types';

/**
 * 교정 운동 라이브러리.
 * 거북목·굽은 등에는 심부 목 굽힘근 활성화와 흉추 가동성 회복,
 * 좌우 불균형에는 단축된 쪽 이완 + 약화된 쪽 강화,
 * 골반 정렬에는 고관절 앞 이완 + 코어·둔근 강화라는
 * 교정 운동의 기본 원칙(이완 → 가동 → 강화)을 따른다.
 */
export const EXERCISES: Exercise[] = [
  {
    id: 'chin-tuck',
    name: '턱 당기기',
    english: 'Chin Tuck',
    kind: 'strength',
    targets: ['neckForward', 'headTilt'],
    sets: 3,
    reps: 10,
    minutes: 3,
    steps: [
      '벽에 등을 대고 서거나 의자에 바르게 앉습니다',
      '시선은 정면에 두고, 턱을 뒤로 수평하게 당겨 이중 턱을 만듭니다',
      '뒷목이 길어지는 느낌으로 5초 유지한 뒤 천천히 풉니다',
    ],
    tip: '고개를 끄덕이거나 숙이지 말고, 머리 전체를 뒤로 미는 느낌으로 수행하세요.',
    caution: '목에 통증이 퍼지거나 저림이 있으면 중단하세요.',
  },
  {
    id: 'upper-trap-stretch',
    name: '상부 승모근 스트레칭',
    english: 'Upper Trapezius Stretch',
    kind: 'stretch',
    targets: ['neckForward', 'shoulderTilt', 'headTilt'],
    sets: 2,
    hold: 30,
    perSide: true,
    minutes: 3,
    steps: [
      '바르게 앉아 한 손으로 의자 옆을 잡아 어깨를 고정합니다',
      '반대 손을 머리에 올리고, 고개를 반대쪽 옆으로 천천히 기울입니다',
      '목 옆 라인이 당기는 지점에서 30초 유지합니다',
    ],
    tip: '손으로 세게 누르지 말고 머리 무게만으로 늘립니다. 어깨가 따라 올라가지 않게 하세요.',
  },
  {
    id: 'levator-stretch',
    name: '견갑거근 스트레칭',
    english: 'Levator Scapulae Stretch',
    kind: 'stretch',
    targets: ['neckForward'],
    sets: 2,
    hold: 30,
    perSide: true,
    minutes: 3,
    steps: [
      '바르게 앉아 한 손을 등 뒤로 보내 어깨를 내립니다',
      '고개를 반대쪽 45° 방향으로 돌린 뒤, 겨드랑이를 본다는 느낌으로 숙입니다',
      '목 뒤 사선 라인이 당기는 지점에서 30초 유지합니다',
    ],
    tip: '숨을 내쉬면서 조금씩 깊게 늘립니다.',
  },
  {
    id: 'thoracic-extension',
    name: '흉추 펴기',
    english: 'Thoracic Extension',
    kind: 'mobility',
    targets: ['roundedUpper', 'neckForward', 'trunkLean'],
    sets: 2,
    reps: 10,
    minutes: 4,
    steps: [
      '등받이가 어깨뼈 아래에 오도록 의자에 앉습니다 (폼롤러가 있다면 등 가운데에 가로로 둡니다)',
      '양손을 머리 뒤에 받치고 팔꿈치를 모읍니다',
      '숨을 내쉬며 등 윗부분만 뒤로 젖혔다가 천천히 돌아옵니다',
    ],
    tip: '허리를 꺾는 게 아니라 등 윗부분(흉추)만 움직인다는 느낌이 중요합니다.',
    caution: '허리에 통증이 느껴지면 젖히는 범위를 줄이세요.',
  },
  {
    id: 'wall-angel',
    name: '벽 천사',
    english: 'Wall Angel',
    kind: 'mobility',
    targets: ['roundedUpper', 'shoulderTilt'],
    sets: 3,
    reps: 10,
    minutes: 4,
    steps: [
      '벽에 뒤통수·등·엉덩이를 붙이고 섭니다',
      '팔꿈치를 90°로 굽혀 손등과 팔꿈치를 벽에 댑니다',
      '벽에서 떨어지지 않게 유지하며 팔을 위아래로 천천히 슬라이드합니다',
    ],
    tip: '허리가 벽에서 뜨지 않도록 갈비뼈를 살짝 내려 유지하세요.',
  },
  {
    id: 'doorway-pec',
    name: '문틀 가슴 스트레칭',
    english: 'Doorway Pec Stretch',
    kind: 'stretch',
    targets: ['roundedUpper', 'neckForward'],
    sets: 3,
    hold: 30,
    minutes: 3,
    steps: [
      '문틀 앞에 서서 양 팔꿈치를 90°로 굽혀 문틀에 댑니다',
      '한 발을 앞으로 내딛고 가슴을 천천히 앞으로 내밉니다',
      '가슴 앞쪽이 당기는 지점에서 30초 유지합니다',
    ],
    tip: '허리를 꺾어 미는 것이 아니라 몸 전체가 한 덩어리로 이동해야 합니다.',
  },
  {
    id: 'prone-ytw',
    name: '엎드려 Y-T-W 레이즈',
    english: 'Prone Y-T-W Raise',
    kind: 'strength',
    targets: ['roundedUpper', 'shoulderTilt'],
    sets: 2,
    reps: 8,
    minutes: 5,
    steps: [
      '바닥에 엎드려 이마 아래에 수건을 받칩니다',
      '팔을 Y자로 뻗어 엄지를 천장으로 향한 채 들어 올렸다 내립니다',
      '같은 방식으로 T자, W자 순서로 반복합니다',
    ],
    tip: '어깨를 귀에서 멀어지게 끌어내린 상태로, 어깨뼈 사이 근육의 힘으로 들어 올리세요.',
  },
  {
    id: 'cat-cow',
    name: '캣 카우',
    english: 'Cat-Cow',
    kind: 'mobility',
    targets: ['roundedUpper', 'trunkLean'],
    sets: 2,
    reps: 10,
    minutes: 3,
    steps: [
      '네발기기 자세에서 어깨 아래 손목, 골반 아래 무릎을 둡니다',
      '숨을 내쉬며 등을 천장으로 둥글게 말아 올립니다',
      '숨을 들이마시며 가슴을 열고 등을 부드럽게 내립니다',
    ],
    tip: '꼬리뼈부터 목까지 척추가 한 마디씩 순서대로 움직이는 것을 느껴보세요.',
  },
  {
    id: 'bird-dog',
    name: '버드 독',
    english: 'Bird Dog',
    kind: 'strength',
    targets: ['trunkLean', 'bodyLean', 'hipShift'],
    sets: 2,
    reps: 10,
    perSide: true,
    minutes: 5,
    steps: [
      '네발기기 자세에서 허리를 평평하게 유지합니다',
      '한쪽 팔과 반대쪽 다리를 바닥과 평행하게 뻗습니다',
      '몸통이 흔들리지 않게 3초 유지한 뒤 제자리로 돌아옵니다',
    ],
    tip: '등 위에 물컵이 있다고 상상하고, 골반이 좌우로 기울지 않게 하세요.',
  },
  {
    id: 'dead-bug',
    name: '데드 버그',
    english: 'Dead Bug',
    kind: 'strength',
    targets: ['hipShift', 'bodyLean', 'trunkLean'],
    sets: 2,
    reps: 10,
    perSide: true,
    minutes: 5,
    steps: [
      '천장을 보고 누워 팔을 위로 뻗고 무릎을 90°로 듭니다',
      '허리로 바닥을 지그시 누른 채, 한쪽 팔과 반대쪽 다리를 천천히 뻗습니다',
      '바닥에 닿기 직전까지 내렸다가 제자리로 돌아옵니다',
    ],
    tip: '허리가 바닥에서 뜨면 동작 범위를 줄이세요. 숨을 내쉬며 뻗습니다.',
  },
  {
    id: 'glute-bridge',
    name: '엉덩이 브릿지',
    english: 'Glute Bridge',
    kind: 'strength',
    targets: ['hipShift', 'pelvisTilt'],
    sets: 3,
    reps: 12,
    minutes: 4,
    steps: [
      '누워서 무릎을 세우고 발을 골반 너비로 둡니다',
      '엉덩이를 조이며 어깨-골반-무릎이 일직선이 될 때까지 들어 올립니다',
      '꼭대기에서 2초 유지한 뒤 천천히 내립니다',
    ],
    tip: '허리 힘이 아니라 엉덩이 힘으로 들어 올리는 감각에 집중하세요.',
  },
  {
    id: 'hip-flexor-stretch',
    name: '고관절 앞 스트레칭',
    english: 'Hip Flexor Stretch',
    kind: 'stretch',
    targets: ['hipShift', 'trunkLean'],
    sets: 2,
    hold: 30,
    perSide: true,
    minutes: 4,
    steps: [
      '한쪽 무릎을 바닥에 대고 반대 발을 앞으로 내딛어 런지 자세를 만듭니다',
      '엉덩이를 살짝 조인 채 골반을 앞으로 천천히 밀어냅니다',
      '뒷다리 골반 앞쪽이 당기는 지점에서 30초 유지합니다',
    ],
    tip: '허리를 젖히지 말고 몸통은 수직을 유지하세요. 오래 앉아 일하는 사람에게 특히 중요한 동작입니다.',
  },
  {
    id: 'ql-stretch',
    name: '옆구리 스트레칭',
    english: 'Quadratus Lumborum Stretch',
    kind: 'stretch',
    targets: ['pelvisTilt', 'shoulderTilt', 'bodyLean'],
    sets: 2,
    hold: 30,
    perSide: true,
    minutes: 3,
    steps: [
      '바르게 서거나 앉아 한 손을 머리 위로 뻗습니다',
      '숨을 내쉬며 몸통을 반대쪽 옆으로 길게 기울입니다',
      '옆구리가 당기는 지점에서 30초 유지합니다',
    ],
    tip: '몸이 앞으로 숙여지지 않게, 옆으로만 길어지는 느낌으로 늘립니다.',
  },
  {
    id: 'side-lying-abduction',
    name: '옆으로 누워 다리 들기',
    english: 'Side-Lying Hip Abduction',
    kind: 'strength',
    targets: ['pelvisTilt'],
    sets: 2,
    reps: 12,
    perSide: true,
    minutes: 4,
    steps: [
      '옆으로 누워 아래팔로 머리를 받치고 몸을 일직선으로 만듭니다',
      '위쪽 다리를 곧게 편 채 천천히 들어 올립니다',
      '골반이 뒤로 눕지 않게 유지하며 천천히 내립니다',
    ],
    tip: '발끝을 살짝 아래로 향하게 하면 엉덩이 옆 근육에 더 정확히 자극이 갑니다.',
  },
  {
    id: 'side-plank',
    name: '사이드 플랭크',
    english: 'Side Plank',
    kind: 'strength',
    targets: ['bodyLean', 'pelvisTilt', 'shoulderTilt'],
    sets: 2,
    hold: 25,
    perSide: true,
    minutes: 4,
    steps: [
      '옆으로 누워 팔꿈치를 어깨 아래에 둡니다',
      '골반을 들어 올려 머리-몸통-다리를 일직선으로 만듭니다',
      '골반이 떨어지지 않게 25초 유지합니다',
    ],
    tip: '힘들면 무릎을 굽혀 무릎 지지로 시작해도 좋습니다.',
    caution: '어깨에 통증이 있으면 무릎 지지 변형으로 수행하세요.',
  },
  {
    id: 'plank',
    name: '플랭크',
    english: 'Plank',
    kind: 'strength',
    targets: ['trunkLean', 'hipShift'],
    sets: 3,
    hold: 30,
    minutes: 4,
    steps: [
      '팔꿈치를 어깨 아래에 두고 엎드려 몸을 들어 올립니다',
      '머리-등-골반-발뒤꿈치가 일직선이 되게 만듭니다',
      '배와 엉덩이에 힘을 유지하며 30초 버팁니다',
    ],
    tip: '엉덩이가 위로 솟거나 허리가 아래로 처지지 않는 것이 시간보다 중요합니다.',
  },
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | null {
  return BY_ID.get(id) ?? null;
}

/** 지표별 추천 운동 — 효과 순서대로 나열 (앞에 있을수록 우선 배정) */
export const METRIC_PROGRAMS: Record<MetricKey, string[]> = {
  neckForward: ['chin-tuck', 'upper-trap-stretch', 'levator-stretch', 'thoracic-extension', 'doorway-pec'],
  roundedUpper: ['thoracic-extension', 'wall-angel', 'doorway-pec', 'prone-ytw', 'cat-cow'],
  trunkLean: ['cat-cow', 'bird-dog', 'plank', 'hip-flexor-stretch'],
  hipShift: ['hip-flexor-stretch', 'glute-bridge', 'dead-bug', 'plank'],
  shoulderTilt: ['upper-trap-stretch', 'ql-stretch', 'wall-angel', 'side-plank', 'prone-ytw'],
  pelvisTilt: ['ql-stretch', 'side-lying-abduction', 'glute-bridge', 'side-plank'],
  headTilt: ['upper-trap-stretch', 'chin-tuck'],
  bodyLean: ['side-plank', 'dead-bug', 'ql-stretch', 'bird-dog'],
};

/** 모든 지표가 양호할 때 제공하는 기본 유지 루틴 */
export const BASE_PROGRAM = ['chin-tuck', 'cat-cow', 'wall-angel', 'glute-bridge', 'plank'];

/** 운동 한 개의 분량 텍스트 (예: 10회 × 3세트 / 좌우 30초 × 2세트) */
export function doseText(ex: Exercise): string {
  const side = ex.perSide ? '좌우 ' : '';
  if (ex.hold) return `${side}${ex.hold}초 × ${ex.sets}세트`;
  return `${side}${ex.reps}회 × ${ex.sets}세트`;
}
