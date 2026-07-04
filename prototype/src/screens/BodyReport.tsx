import { useState } from 'react';
import { ScoreRing } from '../components/ScoreRing';
import { AnatomyFigure } from '../components/AnatomyFigure';
import type { AnatomyRegion, HighlightLevel } from '../components/AnatomyFigure';
import type { AnalysisRecord, Keypoint } from '../types';

/** 한 방향의 실측 골격 데이터 (키포인트가 있을 때만) */
export interface PoseView {
  keypoints: Keypoint[];
  ear?: { x: number; y: number; confidence: number };
  imageWidth: number;
  imageHeight: number;
}

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
  /** 실측 골격 — 키포인트가 있는 방향만. 없으면 해당 칸은 "측정 필요"로 비운다 */
  pose: { front: PoseView | null; side: PoseView | null };
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

/**
 * 근육 이름 → 해부 그래픽 부위 + 심각도 판정에 쓸 지표.
 * 강조 농도는 해당 지표의 실측 레벨을 따른다(문제 근육인데 레벨 정보가 없으면 주의 처리).
 */
const MUSCLE_TO_REGION: Record<
  string,
  { regions: AnatomyRegion[]; metric: 'neck' | 'shoulder' | 'pelvis' }
> = {
  '가슴근육(대흉근)': { regions: ['chest'], metric: 'neck' },
  상부승모근: { regions: ['trapezius', 'neck-back'], metric: 'neck' },
  '뒷목 근육': { regions: ['neck-back'], metric: 'neck' },
  '등 근육(능형근)': { regions: ['upper-back'], metric: 'neck' },
  하부승모근: { regions: ['trapezius', 'upper-back'], metric: 'neck' },
  '앞목 굽힘근': { regions: ['neck-front'], metric: 'neck' },
  '한쪽 허리근육(요방형근)': { regions: ['lower-back'], metric: 'pelvis' },
  '중간·하부 승모근': { regions: ['trapezius', 'upper-back'], metric: 'shoulder' },
  '반대쪽 둔근': { regions: ['gluteal'], metric: 'pelvis' },
};

/**
 * 문제 근육 목록 + 지표 레벨 → 해부 그래픽 강조 맵.
 * 같은 부위가 여러 근육에서 강조되면 더 심한 레벨을 유지한다.
 */
function buildAnatomyHighlights(
  muscleNames: string[],
  levels: { neck: Level; shoulder: Level; pelvis: Level },
): Partial<Record<AnatomyRegion, HighlightLevel>> {
  const out: Partial<Record<AnatomyRegion, HighlightLevel>> = {};
  for (const name of muscleNames) {
    const entry = MUSCLE_TO_REGION[name];
    if (!entry) continue;
    const metricLevel = levels[entry.metric];
    // 목록에 오른 근육은 이미 문제가 관측된 근육 — good이어도 최소 주의로 표시
    const level: HighlightLevel = metricLevel === 'bad' ? 'bad' : 'caution';
    for (const region of entry.regions) {
      if (out[region] !== 'bad') out[region] = level;
    }
  }
  return out;
}

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

/** 기록에서 골격 렌더용 PoseView 추출 — 키포인트가 없으면(구 기록) null */
function poseOf(rec: AnalysisRecord | undefined): PoseView | null {
  if (!rec?.keypoints || rec.keypoints.length === 0 || !rec.imageWidth || !rec.imageHeight) {
    return null;
  }
  return {
    keypoints: rec.keypoints,
    ear: rec.ear,
    imageWidth: rec.imageWidth,
    imageHeight: rec.imageHeight,
  };
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
    pose: {
      front: poseOf(latestFront),
      side: poseOf(latestSide),
    },
  };
}

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

  // 해부 그래픽 강조 — 단축·약화 구분 없이 문제 근육 모두 빨강, 심각도로 농도 차등
  const anatomyHighlights = buildAnatomyHighlights(
    [...analysis.muscles.tight, ...analysis.muscles.weak],
    { neck: neckLevel, shoulder: shoulderLevel, pelvis: pelvisLevel },
  );
  const hasHighlights = Object.keys(anatomyHighlights).length > 0;

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

      {/* ───────── 2. 자세 시각화 (해부학 신체 그래픽 — 취약 근육 빨강 강조) ───────── */}
      <div className="section">
        <p className="label">visual · 자세 시각화</p>
        <div className="posture-visual">
          {/* 정면/후면/측면 전신 근육도 — 문제가 관측된 근육을 빨간색으로 표시 */}
          <div className="anatomy-grid">
            {(
              [
                { view: 'front', label: '정면' },
                { view: 'back', label: '후면' },
                { view: 'side', label: '측면' },
              ] as const
            ).map(({ view, label }) => (
              <div className="anatomy-cell" key={view}>
                <span className="anatomy-cell-label">{label}</span>
                <AnatomyFigure view={view} highlights={anatomyHighlights} />
              </div>
            ))}
          </div>

          {/* 범례 — 빨강 = 관리 필요 부위 */}
          <p className="anatomy-legend">
            {hasHighlights ? (
              <>
                <span className="anatomy-legend-swatch anatomy-legend-swatch--bad" aria-hidden />
                시급
                <span className="anatomy-legend-swatch anatomy-legend-swatch--caution" aria-hidden />
                주의 — 붉게 표시된 근육이 관리가 필요한 부위입니다
              </>
            ) : (
              '주요 근육이 균형 범위로 측정되었습니다.'
            )}
          </p>

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

      {/* ───────── 3. 근육 불균형 (단축 / 약화) ───────── */}
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
                    <span className="muscle-chip" key={m}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="muscle-col">
                <p className="heading">약화·늘어남</p>
                <p className="caption">힘을 잃은 근육</p>
                <div className="muscle-chips">
                  {analysis.muscles.weak.map((m) => (
                    <span className="muscle-chip" key={m}>
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
