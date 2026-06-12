import type { AnalysisResult, Level, MetricKey, MetricScore } from '../types';

/** 지표별 상태 설명 — 측정값을 일상 언어로 풀어준다 */
export function metricStateText(key: MetricKey, metric: MetricScore): string {
  const v = `${metric.value}°`;
  switch (key) {
    case 'shoulderTilt':
      return metric.level === 'good'
        ? `어깨 라인이 수평에 가깝습니다 (기울기 ${v}).`
        : `어깨 라인이 한쪽으로 ${v} 기울어 있습니다. 가방을 한쪽으로만 메거나 한쪽 팔로만 마우스를 쓰는 습관이 영향을 줄 수 있습니다.`;
    case 'pelvisTilt':
      return metric.level === 'good'
        ? `골반 라인이 수평에 가깝습니다 (기울기 ${v}).`
        : `골반 라인이 한쪽으로 ${v} 기울어 있습니다. 다리를 꼬고 앉거나 한쪽 다리에 체중을 싣는 습관과 관련이 깊습니다.`;
    case 'headTilt':
      return metric.level === 'good'
        ? `머리가 수평을 잘 유지하고 있습니다 (기울기 ${v}).`
        : `머리가 한쪽으로 ${v} 기울어 있습니다. 모니터나 휴대폰 위치가 정면에서 벗어나 있지 않은지 확인해 보세요.`;
    case 'bodyLean':
      return metric.level === 'good'
        ? `몸통 중심선이 안정적입니다 (기울기 ${v}).`
        : `몸통이 한쪽으로 ${v} 기울어 있습니다. 코어 근육의 좌우 균형을 함께 점검해 보세요.`;
    case 'neckForward':
      return metric.level === 'good'
        ? `귀가 어깨 수직선 가까이에 잘 정렬되어 있습니다 (${v}).`
        : `귀가 어깨 수직선보다 ${v} 앞으로 나가 있습니다. 머리가 앞으로 나갈수록 목과 어깨 근육의 부담이 커집니다.`;
    case 'roundedUpper':
      return metric.level === 'good'
        ? `귀-어깨-골반 정렬이 곧게 유지되고 있습니다 (꺾임 ${v}).`
        : `상체 정렬선이 ${v} 꺾여 등이 굽은 패턴이 보입니다. 가슴 앞 근육은 짧아지고 등 근육은 약해지기 쉬운 상태입니다.`;
    case 'trunkLean':
      return metric.level === 'good'
        ? `몸통이 수직에 가깝게 서 있습니다 (기울기 ${v}).`
        : `몸통이 ${v} 기울어 있습니다. 화면을 향해 상체를 내미는 습관이 굳지 않도록 주의가 필요합니다.`;
    case 'hipShift':
      return metric.level === 'good'
        ? `골반이 발목 수직선 위에 잘 놓여 있습니다 (${v}).`
        : `골반이 발목 수직선에서 ${v} 벗어나 있습니다. 골반을 앞으로 내밀고 서는 습관(스웨이백)과 관련될 수 있습니다.`;
  }
}

/** 종합 평가 한 단락 */
export function summaryText(result: AnalysisResult): string {
  const levels = Object.values(result.metrics).map((m) => m.level as Level);
  const badCount = levels.filter((l) => l === 'bad').length;
  const cautionCount = levels.filter((l) => l === 'caution').length;

  if (badCount === 0 && cautionCount === 0) {
    return '측정된 모든 지표가 양호 범위입니다. 지금 정렬을 유지하는 것이 목표입니다. 기본 루틴으로 바른 자세를 만드는 근육을 계속 깨워 주세요.';
  }
  if (badCount === 0) {
    return `전반적으로 안정적이지만 ${cautionCount}개 지표가 주의 범위에 있습니다. 작은 흐트러짐이 굳기 전에 잡는 것이 가장 효율적인 시점입니다.`;
  }
  return `${badCount}개 지표가 교정이 필요한 범위로 측정되었습니다. 특히 점수가 가장 낮은 영역부터 루틴으로 관리해 보세요. 자세는 근육의 습관이라 꾸준히 반복하면 분명히 달라집니다.`;
}

/** 회차 비교 코멘트 */
export function progressText(current: number, previous: number | null): string {
  if (previous === null) {
    return '첫 측정을 마쳤습니다. 같은 장소, 같은 거리, 같은 시간대에 다시 측정하면 변화를 정확히 비교할 수 있습니다.';
  }
  const diff = current - previous;
  if (diff >= 3) return `지난 측정보다 ${diff}점 올랐습니다. 몸이 반응하고 있다는 신호입니다.`;
  if (diff > 0) return `지난 측정보다 ${diff}점 올랐습니다. 좋은 방향입니다.`;
  if (diff <= -3)
    return `지난 측정보다 ${Math.abs(diff)}점 내려갔습니다. 촬영 각도 영향일 수 있으니 같은 조건에서 한 번 더 측정해 보세요.`;
  if (diff < 0) return `지난 측정보다 ${Math.abs(diff)}점 내려갔습니다. 추이로 판단하는 것이 정확합니다.`;
  return '지난 측정과 같은 점수입니다. 루틴을 병행하며 추이를 지켜보세요.';
}

/** 데일리 자세 팁 — 날짜 기준으로 순환 */
const DAILY_TIPS: Array<{ title: string; body: string }> = [
  {
    title: '모니터 높이',
    body: '화면 상단이 눈높이와 같거나 살짝 아래에 오도록 맞추세요. 노트북이라면 거치대와 외장 키보드가 가장 효과적인 투자입니다.',
  },
  {
    title: '50분마다 일어나기',
    body: '아무리 바른 자세도 오래 유지하면 부담이 됩니다. 50분마다 한 번 일어나 2분만 걸어도 척추 부담이 크게 줄어듭니다.',
  },
  {
    title: '의자에 앉는 법',
    body: '엉덩이를 등받이 끝까지 밀어 넣고, 발바닥 전체가 바닥에 닿게 하세요. 무릎과 골반은 90°에 가깝게 유지합니다.',
  },
  {
    title: '휴대폰은 눈높이로',
    body: '고개를 숙일수록 목이 받는 하중은 커집니다. 휴대폰을 가슴 위로 들어 올리는 것만으로 목의 부담이 줄어듭니다.',
  },
  {
    title: '가방은 번갈아 메기',
    body: '한쪽으로만 가방을 메면 어깨 높이 차이가 굳어집니다. 양쪽으로 번갈아 메거나 백팩을 사용해 보세요.',
  },
  {
    title: '다리 꼬지 않기',
    body: '다리를 꼬는 습관은 골반 좌우 불균형의 가장 흔한 원인 중 하나입니다. 무의식적으로 꼬게 된다면 발을 발받침에 올려 보세요.',
  },
  {
    title: '숨은 코어 운동, 호흡',
    body: '숨을 깊게 들이마시고 길게 내쉬는 것만으로 몸통 깊은 곳 근육이 일합니다. 의자에서 코로 4초 들이마시고 6초 내쉬기를 5회 반복해 보세요.',
  },
  {
    title: '서 있을 때 체중 분배',
    body: '한쪽 다리에 체중을 싣고 골반을 내밀어 서는 습관은 스웨이백을 부릅니다. 양발에 체중을 고르게 나눠 보세요.',
  },
  {
    title: '잠자리 점검',
    body: '엎드려 자는 자세는 목을 한쪽으로 오래 돌려 둡니다. 옆으로 잘 때는 베개가 어깨 높이를 채워 목이 수평이 되게 하세요.',
  },
  {
    title: '운전할 때',
    body: '등받이를 과하게 눕히면 머리가 앞으로 나옵니다. 등받이는 100~110°, 머리 받침은 뒤통수에 닿을 듯 말 듯하게 조정하세요.',
  },
];

export function dailyTip(date = new Date()): { title: string; body: string } {
  const dayIndex = Math.floor(date.getTime() / 86400000);
  return DAILY_TIPS[dayIndex % DAILY_TIPS.length];
}
