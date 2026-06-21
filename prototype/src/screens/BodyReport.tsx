import { useState } from 'react';
import { ScoreRing } from '../components/ScoreRing';

/* ==========================================================================
 * AI 아웃바디 분석 리포트
 *
 * 분석 엔진의 정량 결과(JSON)를 Props로 받아, 런타임 LLM 없이 아래의
 * 룰 기반(static 매핑 테이블) 알고리즘만으로 사용자가 읽기 쉬운 리포트를 만든다.
 * 디자인은 프로젝트의 DESIGN.md "모노크롬 에디토리얼" 원칙을 따른다 —
 * 색이 아닌 구조(채움·선·텍스트)로 상태를 구분하고, 느낌표·이모지·의료적 단정은 쓰지 않는다.
 *
 * 데이터 모델은 의도적으로 이 파일 안에서 독립적으로 정의한다(기존 types.ts 미수정).
 * 추후 실제 엔진과 연결할 때는 엔진 출력 → BodyReportData로 매핑만 하면 된다.
 * ========================================================================== */

/* ---------- 입력 데이터 타입 ---------- */

export type PostureType = 'UPPER_CROSSED' | 'LOWER_CROSSED' | 'BALANCED';
export type ShoulderAsym = 'LEFT_LOW' | 'RIGHT_LOW' | 'EVEN';
export type PelvisTiltState = 'ANTERIOR' | 'POSTERIOR' | 'NEUTRAL';

export interface BodyReportData {
  user: { name: string; actualAge: number };
  analysis: {
    totalScore: number; // 0–100
    bodyAge: number;
    postureType: PostureType;
    metrics: {
      forwardHeadAngle: number; // 거북목(전방머리자세) 각도(°)
      shoulderAsymmetry: ShoulderAsym;
      pelvisTilt: PelvisTiltState;
    };
    muscles: {
      tight: string[]; // 단축·뭉친 근육
      weak: string[]; //  약화된 근육
    };
    risks: {
      year1: string[]; // 1년 방치 시 잠재 위험
      year3: string[]; // 3년 방치 시 잠재 위험
    };
  };
}

interface Props {
  data: BodyReportData;
  /** 화면에 표시할 사용자 이름 — 주어지면 data.user.name 대신 사용 (프로필 연동) */
  userName?: string;
}

/* ==========================================================================
 * 룰 기반 매핑 테이블 (static)
 *
 * 모든 문장은 정적 템플릿이며, 값(나이 차이·각도 등)만 치환한다.
 * DESIGN.md §7 톤 규칙: 짧고 단정하게, 느낌표·이모지 금지, "~로 추정/측정됩니다".
 * ========================================================================== */

type Level = 'good' | 'caution' | 'bad';

/** 자세 패턴별 라벨 + 요약 — postureType만으로 정해지는 정적 문구 */
const POSTURE_LABELS: Record<PostureType, { title: string; summary: string }> = {
  UPPER_CROSSED: {
    title: '상부 교차 증후군 경향',
    summary: '가슴·뒷목 근육은 짧아지고 등·앞목 근육은 약해진 상체 정렬 패턴이 관측됩니다.',
  },
  LOWER_CROSSED: {
    title: '하부 교차 증후군 경향',
    summary: '골반이 앞으로 기울며 허리는 짧아지고 둔근·복근은 약해진 하체 정렬 패턴이 관측됩니다.',
  },
  BALANCED: {
    title: '균형 잡힌 정렬',
    summary: '주요 지표가 균형 범위에 있습니다. 현재 정렬을 유지하는 것이 목표입니다.',
  },
};

/** 어깨 비대칭 상태 → 컴팩트 각도 텍스트 */
function shoulderAngleText(s: ShoulderAsym): string {
  if (s === 'LEFT_LOW') return '좌측 ↓';
  if (s === 'RIGHT_LOW') return '우측 ↓';
  return '균형';
}

/** 골반 경사 상태 → 컴팩트 각도 텍스트 */
function pelvisAngleText(p: PelvisTiltState): string {
  if (p === 'ANTERIOR') return '전방 경사';
  if (p === 'POSTERIOR') return '후방 경사';
  return '중립';
}

/**
 * 종합 대시보드의 한 줄 코멘트.
 * postureType과 나이 차이를 정적 템플릿에 끼워 넣는다 (런타임 LLM 아님).
 */
function postureComment(type: PostureType, bodyAge: number, actualAge: number): string {
  const diff = bodyAge - actualAge;
  const ageClause =
    diff > 0
      ? `체형 나이가 실제보다 ${diff}살 높게 추정됩니다`
      : diff < 0
        ? `체형 나이가 실제보다 ${Math.abs(diff)}살 낮게 추정됩니다`
        : '체형 나이가 실제 나이와 비슷하게 추정됩니다';

  switch (type) {
    case 'UPPER_CROSSED':
      return `전방머리자세 경향이 관측되며, ${ageClause}.`;
    case 'LOWER_CROSSED':
      return `골반 정렬 불균형 경향이 관측되며, ${ageClause}.`;
    case 'BALANCED':
      return `정렬이 안정적이며, ${ageClause}.`;
  }
}

/**
 * 종합 점수 → 등급.
 * 기존 lib/scoring.ts의 gradeOf와 동일한 구간/라벨을 유지한다(독립 컴포넌트라 값만 복제).
 */
function gradeOf(score: number): string {
  if (score >= 90) return '우수';
  if (score >= 80) return '양호';
  if (score >= 65) return '보통';
  if (score >= 50) return '주의';
  return '관리 필요';
}

/**
 * 거북목 각도 → 위험 레벨.
 * 임계값은 scoring.ts의 neckForward spec(good ≤ 8°, bad > 16°)과 정합.
 */
function forwardHeadLevel(angle: number): Level {
  if (angle <= 8) return 'good';
  if (angle <= 16) return 'caution';
  return 'bad';
}

/** 비대칭/경사 상태 → 위험 레벨 (균형 상태가 아니면 주의) */
function stateLevel(notBalanced: boolean): Level {
  return notBalanced ? 'caution' : 'good';
}

/* ==========================================================================
 * 데모용 정적 골격 좌표 (0–1 정규화)
 *
 * 실제 사진/키포인트가 없는 리포트 단독 화면을 위한 대표 골격.
 * SkeletonOverlay.tsx의 선 스타일 규칙(흰 선 + 검정 헤일로 + 흰 점선 기준선)을 모사한다.
 * ========================================================================== */

interface SkelPoint {
  id: string;
  x: number;
  y: number;
}

// 측면 거북목 데모 자세 — 머리가 어깨 수직선보다 앞으로 나간 형태
const SIDE_SKELETON: Record<string, SkelPoint> = {
  ear: { id: 'ear', x: 0.6, y: 0.16 },
  neck: { id: 'neck', x: 0.5, y: 0.26 },
  shoulder: { id: 'shoulder', x: 0.46, y: 0.3 },
  spineUpper: { id: 'spineUpper', x: 0.47, y: 0.42 },
  hip: { id: 'hip', x: 0.5, y: 0.6 },
  knee: { id: 'knee', x: 0.5, y: 0.78 },
  ankle: { id: 'ankle', x: 0.5, y: 0.95 },
};

const SIDE_BONES: Array<[string, string]> = [
  ['ear', 'neck'],
  ['neck', 'shoulder'],
  ['shoulder', 'spineUpper'],
  ['spineUpper', 'hip'],
  ['hip', 'knee'],
  ['knee', 'ankle'],
];

// 정면 데모 자세 — 좌우 대칭 기준. 어깨/골반 기울기는 메트릭에 따라 런타임에 y를 보정한다.
const FRONT_SKELETON: Record<string, SkelPoint> = {
  head: { id: 'head', x: 0.5, y: 0.13 },
  neck: { id: 'neck', x: 0.5, y: 0.26 },
  shoulderL: { id: 'shoulderL', x: 0.36, y: 0.3 },
  shoulderR: { id: 'shoulderR', x: 0.64, y: 0.3 },
  hipL: { id: 'hipL', x: 0.42, y: 0.58 },
  hipR: { id: 'hipR', x: 0.58, y: 0.58 },
  kneeL: { id: 'kneeL', x: 0.42, y: 0.78 },
  kneeR: { id: 'kneeR', x: 0.58, y: 0.78 },
  ankleL: { id: 'ankleL', x: 0.42, y: 0.95 },
  ankleR: { id: 'ankleR', x: 0.58, y: 0.95 },
};

const FRONT_BONES: Array<[string, string]> = [
  ['head', 'neck'],
  ['neck', 'shoulderL'],
  ['neck', 'shoulderR'],
  ['neck', 'hipL'],
  ['neck', 'hipR'],
  ['shoulderL', 'hipL'],
  ['shoulderR', 'hipR'],
  ['hipL', 'hipR'],
  ['hipL', 'kneeL'],
  ['hipR', 'kneeR'],
  ['kneeL', 'ankleL'],
  ['kneeR', 'ankleR'],
];

/* ==========================================================================
 * 컴포넌트
 * ========================================================================== */

type TimelineKey = 'now' | 'year1' | 'year3';

export function BodyReport({ data, userName }: Props) {
  const { user, analysis } = data;
  // 프로필 이름이 주어지면 그것을, 아니면 데이터의 이름을 표시
  const displayName = userName?.trim() || user.name;
  const ageDiff = analysis.bodyAge - user.actualAge;

  // 위험 부위 레벨 판정 (힛맵·강조 포인트에 사용)
  const neckLevel = forwardHeadLevel(analysis.metrics.forwardHeadAngle);
  const shoulderLevel = stateLevel(analysis.metrics.shoulderAsymmetry !== 'EVEN');
  const pelvisLevel = stateLevel(analysis.metrics.pelvisTilt !== 'NEUTRAL');

  const posture = POSTURE_LABELS[analysis.postureType];

  return (
    <div className="screen fade-in">
      {/* ───────── 1. 종합 대시보드 ───────── */}
      <div className="section score-section">
        <p className="label">overall · 종합 분석</p>
        <ScoreRing score={analysis.totalScore} />
        <p className="caption">
          {displayName}님의 체형 점수 · {gradeOf(analysis.totalScore)}
        </p>

        {/* 실제 나이 vs 체형 나이 */}
        <div className="age-compare">
          <div className="age-cell">
            <span className="age-cap">실제 나이</span>
            <span className="age-val num">{user.actualAge}</span>
          </div>
          <div className="age-arrow" aria-hidden>
            →
          </div>
          <div className="age-cell">
            <span className="age-cap">체형 나이</span>
            <span className="age-val num">{analysis.bodyAge}</span>
            {ageDiff !== 0 && (
              <span className="age-diff num">
                {ageDiff > 0 ? '+' : '−'}
                {Math.abs(ageDiff)}
              </span>
            )}
          </div>
        </div>

        {/* 룰 기반 한 줄 코멘트 */}
        <p className="pattern-tag">{posture.title}</p>
        <p className="body-strong report-comment">
          {postureComment(analysis.postureType, analysis.bodyAge, user.actualAge)}
        </p>
      </div>

      {/* ───────── 2. 자세 시각화 (정면/측면 오버레이 선 + 사이드 각도) ───────── */}
      <div className="section">
        <p className="label">visual · 자세 시각화</p>
        <div className="posture-visual">
          {/* 정면/측면 오버레이 선 — 2개만 */}
          <div className="overlay-grid">
            <div className="overlay-cell">
              <span className="overlay-cell-label">정면</span>
              <FrontSkeleton shoulder={analysis.metrics.shoulderAsymmetry} shoulderLevel={shoulderLevel} pelvisLevel={pelvisLevel} />
            </div>
            <div className="overlay-cell">
              <span className="overlay-cell-label">측면</span>
              <SideSkeleton highlight={neckLevel} />
            </div>
          </div>

          {/* 사이드 컴팩트 각도 — 부위명 + 각도만 */}
          <div className="angle-chips">
            <AngleChip name="목" value={`${analysis.metrics.forwardHeadAngle}°`} level={neckLevel} />
            <AngleChip name="어깨" value={shoulderAngleText(analysis.metrics.shoulderAsymmetry)} level={shoulderLevel} />
            <AngleChip name="골반" value={pelvisAngleText(analysis.metrics.pelvisTilt)} level={pelvisLevel} />
          </div>
        </div>
      </div>

      {/* ───────── 3. 근육 불균형 (단축 ↔ 약화) ───────── */}
      <div className="section stack">
        <p className="label">muscle · 근육 장력 불균형</p>
        <p className="body-strong">{posture.summary}</p>

        <div className="muscle-grid">
          <div className="muscle-col">
            <p className="heading">단축·뭉침</p>
            <p className="caption">짧아져 당기는 근육</p>
            <div className="muscle-chips">
              {analysis.muscles.tight.map((m) => (
                <span className="muscle-chip muscle-chip--tight" key={m}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="muscle-divider" aria-hidden>
            <span>↔</span>
          </div>

          <div className="muscle-col">
            <p className="heading">약화·늘어남</p>
            <p className="caption">힘을 잃은 근육</p>
            <div className="muscle-chips">
              {analysis.muscles.weak.map((m) => (
                <span className="muscle-chip muscle-chip--weak" key={m}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="caption">
          체형 변화의 근본 원인은 근육의 장력 불균형입니다. 짧아진 쪽은 풀어 주고 약해진 쪽은 깨우는
          것이 교정의 핵심입니다.
        </p>
      </div>

      {/* ───────── 4. 미래 위험 예측 (탭 전환) ───────── */}
      <RiskTimeline risks={analysis.risks} />
    </div>
  );
}

/* ---------- 하위 컴포넌트 ---------- */

/** 정면 데모 골격 — 어깨 비대칭을 좌우 어깨 y로 반영. SkeletonOverlay 선 스타일 모사 */
function FrontSkeleton({
  shoulder,
  shoulderLevel,
  pelvisLevel,
}: {
  shoulder: ShoulderAsym;
  shoulderLevel: Level;
  pelvisLevel: Level;
}) {
  // 비대칭 시 낮은 쪽 어깨를 아래로 내려 시각화 (정규화 좌표 보정)
  const drop = 0.035;
  const dyL = shoulder === 'LEFT_LOW' ? drop : 0;
  const dyR = shoulder === 'RIGHT_LOW' ? drop : 0;
  const pts: Record<string, SkelPoint> = {
    ...FRONT_SKELETON,
    shoulderL: { ...FRONT_SKELETON.shoulderL, y: FRONT_SKELETON.shoulderL.y + dyL },
    shoulderR: { ...FRONT_SKELETON.shoulderR, y: FRONT_SKELETON.shoulderR.y + dyR },
  };
  const px = (p: SkelPoint) => ({ x: p.x * 100, y: p.y * 100 });
  const baseX = 50; // 중앙 수직 기준선

  return (
    <svg className="skel-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      {/* 중앙 수직 기준선 (흰 점선) */}
      <line x1={baseX} y1={0} x2={baseX} y2={100} stroke="#fff" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.7} />

      {/* 어깨 수평선 — 기울기 가시화 */}
      <line
        x1={px(pts.shoulderL).x}
        y1={px(pts.shoulderL).y}
        x2={px(pts.shoulderR).x}
        y2={px(pts.shoulderR).y}
        stroke="#fff"
        strokeWidth={0.4}
        strokeDasharray="2 2"
        opacity={0.85}
      />

      {/* 골격 선 — 검정 헤일로 위에 흰 선 */}
      {FRONT_BONES.map(([a, b]) => {
        const p1 = px(pts[a]);
        const p2 = px(pts[b]);
        return (
          <g key={`${a}-${b}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#000" strokeWidth={1.8} opacity={0.35} strokeLinecap="round" />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#fff" strokeWidth={0.9} strokeLinecap="round" />
          </g>
        );
      })}

      {/* 관절점 */}
      {Object.values(pts).map((p) => {
        const { x, y } = px(p);
        return <circle key={p.id} cx={x} cy={y} r={1.1} fill="#fff" stroke="#000" strokeWidth={0.4} />;
      })}

      {/* 위험 부위 강조 — 비대칭 시 낮은 어깨, 골반 경사 시 골반 */}
      {shoulderLevel !== 'good' && shoulder !== 'EVEN' && (
        <circle
          cx={px(shoulder === 'LEFT_LOW' ? pts.shoulderL : pts.shoulderR).x}
          cy={px(shoulder === 'LEFT_LOW' ? pts.shoulderL : pts.shoulderR).y}
          r={3}
          fill="none"
          className={`skel-heat skel-heat-${shoulderLevel}`}
          strokeWidth={1}
        />
      )}
      {pelvisLevel !== 'good' && (
        <circle
          cx={(px(pts.hipL).x + px(pts.hipR).x) / 2}
          cy={(px(pts.hipL).y + px(pts.hipR).y) / 2}
          r={3.4}
          fill="none"
          className={`skel-heat skel-heat-${pelvisLevel}`}
          strokeWidth={1}
        />
      )}
    </svg>
  );
}

/** 측면 데모 골격 — SkeletonOverlay 선 스타일을 모사 */
function SideSkeleton({ highlight }: { highlight: Level }) {
  const pts = SIDE_SKELETON;
  const px = (p: SkelPoint) => ({ x: p.x * 100, y: p.y * 100 });
  // 수직 기준선: 발목을 지나는 plumb line
  const baseX = pts.ankle.x * 100;

  return (
    <svg className="skel-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      {/* 수직 정렬 기준선 (흰 점선) */}
      <line x1={baseX} y1={0} x2={baseX} y2={100} stroke="#fff" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.7} />

      {/* 귀-어깨 정렬선 — 거북목 측정 근거 */}
      <line
        x1={px(pts.ear).x}
        y1={px(pts.ear).y}
        x2={px(pts.shoulder).x}
        y2={px(pts.shoulder).y}
        stroke="#fff"
        strokeWidth={0.4}
        strokeDasharray="2 2"
        opacity={0.85}
      />

      {/* 골격 선 — 검정 헤일로 위에 흰 선 */}
      {SIDE_BONES.map(([a, b]) => {
        const p1 = px(pts[a]);
        const p2 = px(pts[b]);
        return (
          <g key={`${a}-${b}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#000" strokeWidth={1.8} opacity={0.35} strokeLinecap="round" />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#fff" strokeWidth={0.9} strokeLinecap="round" />
          </g>
        );
      })}

      {/* 관절점 */}
      {Object.values(pts).map((p) => {
        const { x, y } = px(p);
        return <circle key={p.id} cx={x} cy={y} r={1.1} fill="#fff" stroke="#000" strokeWidth={0.4} />;
      })}

      {/* 위험 부위(귀) 강조 포인트 */}
      {highlight !== 'good' && (
        <circle
          cx={px(pts.ear).x}
          cy={px(pts.ear).y}
          r={3.2}
          fill="none"
          className={`skel-heat skel-heat-${highlight}`}
          strokeWidth={1}
        />
      )}
    </svg>
  );
}

/** 컴팩트 부위별 각도 칩 — 부위명 + 각도값만. 위험 시 강조 */
function AngleChip({ name, value, level }: { name: string; value: string; level: Level }) {
  return (
    <div className={`angle-chip angle-chip--${level}`}>
      <span className="angle-chip-name">{name}</span>
      <span className="angle-chip-value num">{value}</span>
    </div>
  );
}

/** 미래 위험 예측 타임라인 — 현재 / 1년 / 3년 탭 전환 */
function RiskTimeline({ risks }: { risks: BodyReportData['analysis']['risks'] }) {
  const [active, setActive] = useState<TimelineKey>('year1');

  const TABS: Array<{ key: TimelineKey; label: string }> = [
    { key: 'now', label: '현재' },
    { key: 'year1', label: '1년 뒤' },
    { key: 'year3', label: '3년 뒤' },
  ];

  // 현재는 위험 누적 전 상태, 이후는 누적 위험을 노출
  const items: string[] =
    active === 'now'
      ? ['지금은 교정으로 되돌리기 가장 쉬운 시점입니다.']
      : active === 'year1'
        ? risks.year1
        : // 3년 뒤에는 1년 위험에 더해 새 위험이 누적된다
          [...risks.year1, ...risks.year3];

  return (
    <div className="section stack">
      <p className="label">forecast · 방치 시 예측</p>

      {/* 세그먼트 탭 */}
      <div className="timeline-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            className={`timeline-tab ${active === t.key ? 'is-active' : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 타임라인 그래픽 + 리스트 */}
      <div className="timeline">
        {items.map((text, i) => (
          <div className="timeline-item" key={`${active}-${i}`}>
            <span className={`timeline-dot ${active === 'now' ? 'is-now' : ''}`} aria-hidden />
            <p className="timeline-text">{text}</p>
          </div>
        ))}
      </div>

      {active !== 'now' && (
        <p className="caption">
          위 항목은 현재 정렬을 방치할 경우의 경향 예측이며, 교정 루틴을 병행하면 진행을 늦추거나
          되돌릴 수 있습니다.
        </p>
      )}
    </div>
  );
}

/* ---------- 데모용 mock 데이터 ---------- */

export const MOCK_BODY_REPORT: BodyReportData = {
  user: { name: '김운동', actualAge: 30 },
  analysis: {
    totalScore: 72,
    bodyAge: 33,
    postureType: 'UPPER_CROSSED',
    metrics: {
      forwardHeadAngle: 18.5,
      shoulderAsymmetry: 'LEFT_LOW',
      pelvisTilt: 'ANTERIOR',
    },
    muscles: {
      tight: ['가슴근육(대흉근)', '상부승모근', '뒷목 근육'],
      weak: ['등 근육(능형근)', '하부승모근', '앞목 굽힘근'],
    },
    risks: {
      year1: ['만성 어깨 결림', '거북목 증후군 초기 통증'],
      year3: ['목 디스크 위험도 증가', '만성 편두통 및 긴장성 두통'],
    },
  },
};
