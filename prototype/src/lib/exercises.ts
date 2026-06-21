import type { Exercise, MetricKey } from '../types';

export type ExerciseCategory =
  | 'neck'
  | 'shoulder'
  | 'back'
  | 'pelvis'
  | 'posture';

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  neck: '거북목',
  shoulder: '어깨 불균형·틀어짐',
  back: '등 굽음',
  pelvis: '골반 불균형·틀어짐',
  posture: '과전신·체형 무너짐',
};

export interface ExerciseEx extends Exercise {
  category: ExerciseCategory;
}

export const EXERCISES: ExerciseEx[] = [
  // ───── 거북목 ─────
  {
    id: 'chin-double',
    name: '턱 당기기',
    english: 'Chin Tuck',
    kind: 'strength',
    category: 'neck',
    targets: ['neckForward', 'headTilt'],
    sets: 1,
    hold: 10,
    minutes: 2,
    steps: [
      '손가락으로 턱을 살짝 뒤로 밀어요.',
      '정수리를 천장 쪽으로 길게 늘려요.',
      '10초간 유지해요.',
    ],
    tip: '고개를 끄덕이지 말고, 머리 전체를 뒤로 미는 느낌으로 수행해요.',
  },
  {
    id: 'neck-tilt-back',
    name: '고개 젖히기',
    english: 'Suboccipital Release',
    kind: 'stretch',
    category: 'neck',
    targets: ['neckForward'],
    sets: 1,
    hold: 10,
    minutes: 2,
    steps: [
      '양손 엄지로 목 뒤 움푹한 곳을 살짝 눌러요.',
      '고개를 천천히, 편안한 만큼만 뒤로 젖혀요.',
    ],
    tip: '통증 없이 편안한 범위 안에서만 움직여요.',
    caution: '목이 아프거나 뻐근한 분은 생략하세요.',
  },
  {
    id: 'collarbone-lookup',
    name: '쇄골 누르고 하늘 보기',
    english: 'Clavicle Press & Neck Extension',
    kind: 'stretch',
    category: 'neck',
    targets: ['neckForward'],
    sets: 1,
    hold: 10,
    minutes: 2,
    steps: [
      '양손으로 쇄골을 가볍게 눌러요.',
      '고개를 천천히 대각선 위로 들어요.',
    ],
    tip: '쇄골을 누르면 앞 목 근육이 더 잘 늘어나요.',
    caution: '목 디스크가 있는 분은 생략하세요.',
  },
  {
    id: 'wall-neck-press',
    name: '벽 밀어내며 목 세우기',
    english: 'Wall Neck Retraction',
    kind: 'strength',
    category: 'neck',
    targets: ['neckForward', 'headTilt'],
    sets: 3,
    hold: 5,
    minutes: 3,
    steps: [
      '벽에 등과 뒤통수를 붙이고 서요.',
      '뒤통수로 벽을 살짝 밀어요. 5초간 유지해요.',
    ],
    tip: '턱이 들리지 않게, 시선은 정면을 향해요.',
  },
  {
    id: 'shoulder-drop',
    name: '어깨 힘 빼고 툭 내리기',
    english: 'Shoulder Shrug Release',
    kind: 'stretch',
    category: 'neck',
    targets: ['neckForward', 'shoulderTilt'],
    sets: 5,
    reps: 1,
    minutes: 1,
    steps: [
      '숨을 마시며 어깨를 귀까지 올려요.',
      '숨을 내쉬며 어깨 힘을 툭 빼요.',
      '5회 반복해요.',
    ],
    tip: '내쉬는 순간 어깨 긴장이 완전히 풀리는 감각에 집중해요.',
  },

  // ───── 어깨 불균형·틀어짐 ─────
  {
    id: 'doorway-chest',
    name: '문틀 잡고 가슴 펴기',
    english: 'Doorway Chest Stretch',
    kind: 'stretch',
    category: 'shoulder',
    targets: ['roundedUpper', 'shoulderTilt'],
    sets: 1,
    hold: 10,
    minutes: 2,
    steps: [
      '양손으로 문틀을 잡아요.',
      '몸을 천천히 앞으로 기울여요.',
    ],
    tip: '가슴 중앙이 열리는 느낌에 집중해요.',
    caution: '어깨가 아프면 더 살짝만 기울이세요.',
  },
  {
    id: 'wall-raise',
    name: '벽 대고 만세 하기',
    english: 'Wall Slide',
    kind: 'mobility',
    category: 'shoulder',
    targets: ['roundedUpper', 'shoulderTilt'],
    sets: 1,
    reps: 10,
    minutes: 3,
    steps: [
      '벽에 등을 붙이고 팔도 벽에 댄 채 서요.',
      '팔을 천천히 위로 올렸다가 다시 내려요.',
      '10회 반복해요.',
    ],
    tip: '팔이 벽에서 떨어지지 않게 유지하는 게 핵심이에요.',
  },
  {
    id: 'towel-scapula',
    name: '날개뼈 모으기',
    english: 'Scapular Retraction',
    kind: 'strength',
    category: 'shoulder',
    targets: ['roundedUpper', 'shoulderTilt'],
    sets: 1,
    hold: 10,
    minutes: 2,
    steps: [
      '팔을 가슴 앞에서 가볍게 벌려요.',
      '양쪽 날개뼈를 등 중앙으로 서로 모아요.',
      '10초간 유지해요.',
    ],
    tip: '어깨가 귀에서 멀어지도록 아래로 끌어내려요.',
  },
  {
    id: 'chair-neck-side',
    name: '의자 잡고 목 옆으로 당기기',
    english: 'Lateral Neck Stretch',
    kind: 'stretch',
    category: 'shoulder',
    targets: ['shoulderTilt', 'headTilt'],
    sets: 2,
    hold: 15,
    perSide: true,
    minutes: 3,
    steps: [
      '한 손으로 의자 아래를 잡아요.',
      '반대 손으로 고개를 옆으로 천천히 당겨요.',
    ],
    tip: '어깨가 따라 올라오지 않도록 의자를 꼭 잡아요.',
    caution: '통증이 느껴지면 멈추세요.',
  },
  {
    id: 'elbow-rotation',
    name: '팔꿈치 붙이고 손 바깥으로 열기',
    english: 'External Rotation',
    kind: 'strength',
    category: 'shoulder',
    targets: ['shoulderTilt', 'roundedUpper'],
    sets: 1,
    reps: 10,
    minutes: 2,
    steps: [
      '팔꿈치를 옆구리에 붙여요.',
      '양손을 천천히 바깥쪽으로 열어요.',
      '10회 반복해요.',
    ],
    tip: '팔꿈치가 옆구리에서 떨어지지 않도록 유지해요.',
  },

  // ───── 등 굽음 ─────
  {
    id: 'chair-back-extension',
    name: '가슴 펴기',
    english: 'Chair Thoracic Extension',
    kind: 'mobility',
    category: 'back',
    targets: ['roundedUpper', 'trunkLean'],
    sets: 1,
    hold: 10,
    minutes: 2,
    steps: [
      '의자 등받이에 등을 기대요.',
      '가슴을 천천히, 편안한 만큼만 뒤로 열어요.',
      '10초간 유지해요.',
    ],
    tip: '등받이가 어깨뼈 아래에 오도록 위치를 조절해요.',
  },
  {
    id: 'standing-cat-cow',
    name: '날개뼈 조이기',
    english: 'Standing Cat-Cow',
    kind: 'mobility',
    category: 'back',
    targets: ['roundedUpper'],
    sets: 5,
    reps: 1,
    minutes: 2,
    steps: [
      '무릎을 살짝 굽히고 손을 무릎에 얹어요.',
      '등을 천천히 둥글게 말았다가 다시 펴요.',
      '5회 반복해요.',
    ],
    tip: '꼬리뼈부터 목까지 척추가 순서대로 움직이는 느낌에 집중해요.',
  },
  {
    id: 'chair-forward-fold',
    name: '의자 잡고 등 아래로 누르기',
    english: 'Chair Forward Fold',
    kind: 'stretch',
    category: 'back',
    targets: ['roundedUpper', 'trunkLean'],
    sets: 1,
    hold: 10,
    minutes: 2,
    steps: [
      '의자나 책상을 두 손으로 짚어요.',
      '상체를 천천히 숙여 등을 펴요.',
    ],
    tip: '등이 둥글게 말리지 않도록, 허리를 길게 늘이는 느낌으로 숙여요.',
    caution: '허리가 아프면 깊이 숙이지 마세요.',
  },
  {
    id: 'wall-armpit-stretch',
    name: '벽 짚고 겨드랑이 늘리기',
    english: 'Wall Lat Stretch',
    kind: 'stretch',
    category: 'back',
    targets: ['roundedUpper', 'shoulderTilt'],
    sets: 1,
    hold: 10,
    minutes: 2,
    steps: [
      '벽을 두 손으로 짚어요.',
      '엉덩이를 살짝 뒤로 빼며 상체를 숙여요.',
      '10초간 유지해요.',
    ],
    tip: '겨드랑이와 옆구리가 길어지는 감각에 집중해요.',
  },
  {
    id: 'standing-y-raise',
    name: '서서 만세 하고 가슴 들기',
    english: 'Standing Y Raise',
    kind: 'strength',
    category: 'back',
    targets: ['roundedUpper'],
    sets: 1,
    hold: 5,
    minutes: 2,
    steps: [
      '양팔을 Y자 모양으로 천천히 들어요.',
      '가슴을 살짝 펴고 5초간 유지해요.',
    ],
    tip: '어깨를 귀에서 멀어지게 끌어내린 상태로 들어요.',
  },

  // ───── 골반 불균형·틀어짐 ─────
  {
    id: 'chair-pigeon',
    name: '의자에 앉아 다리 꼬고 숙이기',
    english: 'Seated Figure-4 Stretch',
    kind: 'stretch',
    category: 'pelvis',
    targets: ['pelvisTilt', 'hipShift'],
    sets: 2,
    hold: 15,
    perSide: true,
    minutes: 3,
    steps: [
      '의자에 앉아 한쪽 발목을 반대쪽 무릎에 올려요.',
      '허리를 편 채 상체를 천천히 숙여요.',
    ],
    tip: '등을 평평하게 유지하면서 엉덩이 바깥 근육이 늘어나는 느낌에 집중해요.',
    caution: '무릎이 아프면 생략하세요.',
  },
  {
    id: 'chair-leg-back',
    name: '의자 잡고 한 다리 뒤로 밀기',
    english: 'Hip Flexor Stretch',
    kind: 'stretch',
    category: 'pelvis',
    targets: ['hipShift', 'pelvisTilt'],
    sets: 2,
    hold: 10,
    perSide: true,
    minutes: 3,
    steps: [
      '의자를 두 손으로 꼭 잡아요.',
      '한쪽 발을 뒤로 작게 빼고 멈춰요.',
    ],
    tip: '골반이 앞으로 당기는 느낌이 나면 잘 되고 있어요.',
    caution: '균형이 불안하면 발을 더 짧게 빼세요.',
  },
  {
    id: 'pelvis-circle',
    name: '서서 골반 크게 돌리기',
    english: 'Pelvic Circle',
    kind: 'mobility',
    category: 'pelvis',
    targets: ['pelvisTilt', 'hipShift'],
    sets: 2,
    reps: 5,
    perSide: true,
    minutes: 2,
    steps: [
      '양손을 골반에 얹고 서요.',
      '골반을 천천히 좌우로 돌려요.',
    ],
    tip: '무릎은 살짝 굽히고 시선은 정면에 두어요.',
    caution: '어지러우면 바로 멈추세요.',
  },
  {
    id: 'seated-hip-shift',
    name: '앉아서 골반 좌우로 들기',
    english: 'Seated Pelvic Shift',
    kind: 'mobility',
    category: 'pelvis',
    targets: ['pelvisTilt', 'bodyLean'],
    sets: 2,
    reps: 5,
    perSide: true,
    minutes: 2,
    steps: [
      '의자에 바르게 앉아요.',
      '한쪽 엉덩이만 살짝 들어 올려요.',
      '좌우 5회씩 반복해요.',
    ],
    tip: '무릎과 발은 정면을 향한 채 엉덩이만 움직여요.',
  },
  {
    id: 'standing-knee-hug',
    name: '서서 한쪽 다리 당겨 안기',
    english: 'Standing Knee Hug',
    kind: 'stretch',
    category: 'pelvis',
    targets: ['hipShift', 'pelvisTilt'],
    sets: 2,
    hold: 10,
    perSide: true,
    minutes: 2,
    steps: [
      '벽이나 의자를 한 손으로 잡고 서요.',
      '반대쪽 무릎을 살짝 가슴 쪽으로 당겨요.',
    ],
    tip: '허리가 꺾이지 않도록 배에 살짝 힘을 주어요.',
    caution: '균형이 불안하면 무릎을 조금만 들어요.',
  },

  // ───── 과전신·체형 무너짐 ─────
  {
    id: 'wall-squat-shallow',
    name: '벽에 등 대고 무릎 굽히기',
    english: 'Shallow Wall Squat',
    kind: 'strength',
    category: 'posture',
    targets: ['trunkLean', 'bodyLean'],
    sets: 3,
    hold: 5,
    minutes: 2,
    steps: [
      '벽에 등을 대고 서요.',
      '무릎을 살짝만 굽혀요. 깊이 앉지 않아요.',
    ],
    tip: '발뒤꿈치가 무릎보다 앞에 오도록 위치를 잡아요.',
    caution: '무릎이 안 좋은 분은 아주 살짝만 굽히세요.',
  },
  {
    id: 'wall-lumbar-flatten',
    name: '허리 벽에 붙이기',
    english: 'Lumbar Flatten',
    kind: 'strength',
    category: 'posture',
    targets: ['trunkLean', 'hipShift'],
    sets: 3,
    hold: 5,
    minutes: 2,
    steps: [
      '벽에 등을 기대고 서요.',
      '배에 힘을 주어 허리와 벽 사이 빈틈을 줄여요.',
      '5초간 유지해요.',
    ],
    tip: '숨을 내쉬며 배꼽을 등 쪽으로 당기는 느낌으로 조여요.',
  },
  {
    id: 'chair-leg-lift',
    name: '의자 짚고 한 다리 뒤로 들기',
    english: 'Standing Hip Extension',
    kind: 'strength',
    category: 'posture',
    targets: ['trunkLean', 'hipShift'],
    sets: 2,
    reps: 8,
    perSide: true,
    minutes: 3,
    steps: [
      '의자를 두 손으로 잡고 서요.',
      '한쪽 다리를 살짝만 뒤로 들어요.',
    ],
    tip: '엉덩이 힘으로 들어 올리고, 허리가 꺾이지 않아야 해요.',
    caution: '허리가 꺾이지 않을 만큼만 들어요.',
  },
  {
    id: 'standing-core-breath',
    name: '서서 배에 힘주고 호흡하기',
    english: 'Standing Core Breath',
    kind: 'strength',
    category: 'posture',
    targets: ['trunkLean', 'bodyLean'],
    sets: 5,
    reps: 1,
    minutes: 2,
    steps: [
      '편안히 서서 숨을 내쉬어요.',
      '배와 옆구리를 등 쪽으로 살짝 조여요.',
      '5회 반복해요.',
    ],
    tip: '억지로 배를 당기지 말고, 내쉬면서 자연스럽게 조여지게 해요.',
  },
  {
    id: 'soft-knee-stand',
    name: '무릎 힘 가볍게 빼고 서기',
    english: 'Soft Knee Stand',
    kind: 'mobility',
    category: 'posture',
    targets: ['trunkLean', 'hipShift'],
    sets: 1,
    hold: 10,
    minutes: 1,
    steps: [
      '편안히 서서 무릎을 살짝 굽혀요.',
      '무릎에 힘이 잠기지 않게 가볍게 풀어요.',
      '10초간 유지해요.',
    ],
    tip: '체중이 발 전체에 고르게 실리는 느낌을 확인해요.',
  },
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): ExerciseEx | null {
  return BY_ID.get(id) ?? null;
}

/** 카테고리별 운동 목록 */
export function getByCategory(cat: ExerciseCategory): ExerciseEx[] {
  return EXERCISES.filter((e) => e.category === cat);
}

/** MetricKey → 관련 카테고리 매핑 */
const METRIC_TO_CATEGORY: Record<MetricKey, ExerciseCategory> = {
  neckForward: 'neck',
  headTilt: 'neck',
  roundedUpper: 'back',
  trunkLean: 'posture',
  shoulderTilt: 'shoulder',
  pelvisTilt: 'pelvis',
  hipShift: 'pelvis',
  bodyLean: 'posture',
};

/** 지표별 추천 운동 (약한 지표의 카테고리에서 우선 선택) */
export const METRIC_PROGRAMS: Record<MetricKey, string[]> = {
  neckForward: ['chin-double', 'neck-tilt-back', 'collarbone-lookup', 'wall-neck-press', 'shoulder-drop'],
  headTilt: ['chin-double', 'wall-neck-press', 'chair-neck-side', 'shoulder-drop'],
  roundedUpper: ['chair-back-extension', 'standing-cat-cow', 'wall-raise', 'wall-armpit-stretch', 'standing-y-raise'],
  trunkLean: ['wall-lumbar-flatten', 'standing-cat-cow', 'chair-forward-fold', 'standing-core-breath'],
  shoulderTilt: ['towel-scapula', 'elbow-rotation', 'doorway-chest', 'chair-neck-side', 'wall-raise'],
  pelvisTilt: ['chair-pigeon', 'seated-hip-shift', 'pelvis-circle', 'standing-knee-hug'],
  hipShift: ['chair-leg-back', 'standing-knee-hug', 'wall-squat-shallow', 'chair-leg-lift'],
  bodyLean: ['seated-hip-shift', 'wall-lumbar-flatten', 'standing-core-breath', 'soft-knee-stand'],
};

export { METRIC_TO_CATEGORY };

/** 모든 지표 양호 시 기본 유지 루틴 (카테고리별 1개씩) */
export const BASE_PROGRAM = [
  'chin-double',
  'doorway-chest',
  'chair-back-extension',
  'chair-pigeon',
  'wall-lumbar-flatten',
];

/** 운동 분량 텍스트 */
export function doseText(ex: Exercise): string {
  const side = ex.perSide ? '좌우 ' : '';
  if (ex.hold) return `${side}${ex.hold}초 × ${ex.sets}세트`;
  return `${side}${ex.reps}회 × ${ex.sets}세트`;
}
