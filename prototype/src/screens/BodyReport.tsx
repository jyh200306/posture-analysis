import { useState } from 'react';
import { ScoreRing } from '../components/ScoreRing';
import type { AnalysisRecord } from '../types';

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
      // 실측 기반 각도 크기(°)와 심각도 — 방향 정보가 없는 실제 기록을 위해 사용.
      // 주어지면 각도 칩이 이 값을 그대로 표시한다(없으면 위 enum 텍스트로 폴백).
      shoulderTiltAngle?: number;
      shoulderLevel?: Level;
      pelvisTiltAngle?: number;
      pelvisLevel?: Level;
      neckLevel?: Level;
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
  /** 리포트 데이터. null이면 측정 기록이 없는 빈 상태를 보여준다. */
  data: BodyReportData | null;
  /** 화면에 표시할 사용자 이름 — 주어지면 data.user.name 대신 사용 (프로필 연동) */
  userName?: string;
  /** 측정 화면으로 이동 (빈 상태 CTA) */
  onAnalyze?: () => void;
  /** 히스토리(기록) 화면으로 이동 */
  onHistory?: () => void;
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
 * 실측 기록 → 리포트 데이터 매핑 (룰 기반)
 *
 * 실제 측정(AnalysisRecord)은 각도 "크기"와 심각도만 담고 방향(좌/우, 전/후)은 없다.
 * 따라서 방향 enum은 균형/중립으로 두고, 심각도(level)와 각도값으로 시각화·코멘트를 만든다.
 * bodyAge·근육·위험은 소스 데이터가 없어 점수/지표 레벨에서 룰기반으로 산출한다(추정치).
 * 정면/측면은 따로 촬영되므로 각각 최신 기록을 합쳐 한 리포트로 만든다.
 * ========================================================================== */

/** 측면 패턴 → 단축/약화 근육 (정적 매핑, 측정 레벨로 선택) */
const SIDE_MUSCLE_MAP = {
  tight: ['가슴근육(대흉근)', '상부승모근', '뒷목 근육'],
  weak: ['등 근육(능형근)', '하부승모근', '앞목 굽힘근'],
};
const FRONT_MUSCLE_MAP = {
  tight: ['한쪽 허리근육(요방형근)', '상부승모근'],
  weak: ['중간·하부 승모근', '반대쪽 둔근'],
};

/** 지표 레벨 → 위험 문구 (정적). 측정에서 문제가 관측된 부위만 노출 */
const RISK_MAP: Record<'neck' | 'shoulder' | 'pelvis', { year1: string[]; year3: string[] }> = {
  neck: {
    year1: ['만성 어깨 결림', '거북목 증후군 초기 통증'],
    year3: ['목 디스크 위험도 증가', '만성 긴장성 두통'],
  },
  shoulder: {
    year1: ['어깨 높이 차이 고착', '한쪽 어깨·목 결림'],
    year3: ['회전근개 부담 증가', '척추 측만 경향'],
  },
  pelvis: {
    year1: ['허리 피로감 증가', '골반 좌우 불균형 고착'],
    year3: ['요통 위험 증가', '고관절 부담'],
  },
};

/** 측정 metrics에서 특정 지표의 각도값·레벨을 꺼낸다 (없으면 null) */
function pick(rec: AnalysisRecord | undefined, key: string): { value: number; level: Level } | null {
  if (!rec) return null;
  const m = (rec.metrics as Record<string, { value: number; level: Level } | undefined>)[key];
  return m ? { value: m.value, level: m.level } : null;
}

/**
 * 최신 정면·측면 기록을 합쳐 리포트 데이터를 만든다. 기록이 하나도 없으면 null.
 * @param records 저장된 기록 (최신순)
 * @param name 표시 이름
 * @param actualAge 실제 나이 (없으면 체형 나이 비교 생략용 기본값)
 */
export function buildReportData(
  records: AnalysisRecord[],
  name: string,
  actualAge = 30,
): BodyReportData | null {
  const latestSide = records.find((r) => r.direction === 'side');
  const latestFront = records.find((r) => r.direction === 'front');
  if (!latestSide && !latestFront) return null;

  // 종합 점수 — 두 방향 평균(있는 것만)
  const scores = [latestSide?.overallScore, latestFront?.overallScore].filter(
    (s): s is number => typeof s === 'number',
  );
  const totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // 지표 추출
  const neck = pick(latestSide, 'neckForward');
  const rounded = pick(latestSide, 'roundedUpper');
  const shoulder = pick(latestFront, 'shoulderTilt');
  const pelvis = pick(latestFront, 'pelvisTilt');

  const neckLevel: Level = neck?.level ?? 'good';
  const shoulderLevel: Level = shoulder?.level ?? 'good';
  const pelvisLevel: Level = pelvis?.level ?? 'good';

  // 패턴 — 측면 거북목/굽은등 우선, 아니면 정면 불균형, 아니면 균형
  const postureType: PostureType =
    neckLevel !== 'good' || (rounded && rounded.level !== 'good')
      ? 'UPPER_CROSSED'
      : pelvisLevel !== 'good'
        ? 'LOWER_CROSSED'
        : 'BALANCED';

  // 근육 — 패턴에 따라 정적 매핑, 문제 없으면 빈 배열
  const muscles =
    postureType === 'UPPER_CROSSED'
      ? SIDE_MUSCLE_MAP
      : postureType === 'LOWER_CROSSED'
        ? FRONT_MUSCLE_MAP
        : { tight: [], weak: [] };

  // 위험 — 레벨이 good이 아닌 부위만 누적
  const risks = { year1: [] as string[], year3: [] as string[] };
  const addRisk = (key: 'neck' | 'shoulder' | 'pelvis', level: Level) => {
    if (level === 'good') return;
    risks.year1.push(...RISK_MAP[key].year1);
    risks.year3.push(...RISK_MAP[key].year3);
  };
  addRisk('neck', neckLevel);
  addRisk('shoulder', shoulderLevel);
  addRisk('pelvis', pelvisLevel);
  if (risks.year1.length === 0) {
    risks.year1.push('현재 정렬을 유지하면 특별한 위험 누적은 낮게 추정됩니다');
    risks.year3.push('정기 측정으로 변화를 지켜보세요');
  }

  // 체형 나이 — 점수가 낮을수록 실제 나이보다 높게 추정 (룰기반, 100점=실제, 50점=+10살 정도)
  const bodyAge = Math.round(actualAge + (100 - totalScore) * 0.2);

  return {
    user: { name, actualAge },
    analysis: {
      totalScore,
      bodyAge,
      postureType,
      metrics: {
        forwardHeadAngle: neck?.value ?? 0,
        shoulderAsymmetry: 'EVEN', // 방향 정보 없음 — 심각도는 level로 표현
        pelvisTilt: 'NEUTRAL',
        shoulderTiltAngle: shoulder?.value,
        shoulderLevel,
        pelvisTiltAngle: pelvis?.value,
        pelvisLevel,
        neckLevel,
      },
      muscles,
      risks,
    },
  };
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

export function BodyReport({ data, userName, onAnalyze, onHistory }: Props) {
  // 측정 기록이 없을 때 — 빈 상태 안내
  if (!data) {
    return (
      <div className="screen fade-in">
        <div className="section stack report-empty">
          <p className="label">report · 자세 리포트</p>
          <p className="body-strong">아직 측정 기록이 없습니다.</p>
          <p className="caption">
            정면·측면 사진을 촬영하면 측정 결과를 바탕으로 리포트가 생성되고, 새로 측정할 때마다
            자동으로 갱신됩니다.
          </p>
          {onAnalyze && (
            <button className="btn btn-primary" onClick={onAnalyze}>
              자세 측정하러 가기
            </button>
          )}
        </div>
      </div>
    );
  }

  const { user, analysis } = data;
  // 프로필 이름이 주어지면 그것을, 아니면 데이터의 이름을 표시
  const displayName = userName?.trim() || user.name;
  const ageDiff = analysis.bodyAge - user.actualAge;

  // 위험 부위 레벨 판정 — 실측 레벨이 주어지면 우선 사용, 없으면 enum/각도에서 추정
  const met = analysis.metrics;
  const neckLevel = met.neckLevel ?? forwardHeadLevel(met.forwardHeadAngle);
  const shoulderLevel = met.shoulderLevel ?? stateLevel(met.shoulderAsymmetry !== 'EVEN');
  const pelvisLevel = met.pelvisLevel ?? stateLevel(met.pelvisTilt !== 'NEUTRAL');

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

        {/* 히스토리 보기 버튼 */}
        {onHistory && (
          <button className="btn btn-secondary report-history-btn" onClick={onHistory}>
            측정 기록 보기
          </button>
        )}
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

          {/* 사이드 컴팩트 각도 — 부위명 + 각도만. 실측 각도가 있으면 숫자로, 없으면 enum 텍스트 */}
          <div className="angle-chips">
            <AngleChip name="목" value={`${met.forwardHeadAngle}°`} level={neckLevel} />
            <AngleChip
              name="어깨"
              value={met.shoulderTiltAngle != null ? `${met.shoulderTiltAngle}°` : shoulderAngleText(met.shoulderAsymmetry)}
              level={shoulderLevel}
            />
            <AngleChip
              name="골반"
              value={met.pelvisTiltAngle != null ? `${met.pelvisTiltAngle}°` : pelvisAngleText(met.pelvisTilt)}
              level={pelvisLevel}
            />
          </div>
        </div>
      </div>

      {/* ───────── 3. 근육 불균형 (단축 ↔ 약화) ───────── */}
      <div className="section stack">
        <p className="label">muscle · 근육 장력 불균형</p>
        <p className="body-strong">{posture.summary}</p>

        {analysis.muscles.tight.length === 0 && analysis.muscles.weak.length === 0 ? (
          <p className="caption">측정된 지표가 균형 범위라, 두드러진 장력 불균형은 관측되지 않았습니다.</p>
        ) : (
          <>
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
          </>
        )}
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
