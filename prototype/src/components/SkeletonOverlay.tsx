import type { Keypoint } from '../types';

interface Props {
  keypoints: Keypoint[];
  /** 원본 이미지 픽셀 크기 (viewBox 좌표계) */
  imageWidth: number;
  imageHeight: number;
}

// 관절 연결 쌍 (PRD 17개 관절 id 기준)
const CONNECTIONS: Array<[number, number]> = [
  [0, 1], // 머리–목
  [1, 2], // 목–왼어깨
  [1, 3], // 목–오른어깨
  [2, 4], // 왼어깨–왼팔꿈치
  [4, 6], // 왼팔꿈치–왼손목
  [3, 5],
  [5, 7],
  [1, 8], // 목–척추상단
  [8, 9], // 척추상단–척추하단
  [9, 16], // 척추하단–골반중심
  [16, 10], // 골반중심–왼골반
  [16, 11],
  [10, 12], // 왼골반–왼무릎
  [12, 14], // 왼무릎–왼발목
  [11, 13],
  [13, 15],
];

const MIN_CONFIDENCE = 0.5;

/** 흑백 사진 위에 흰 골격 라인을 SVG로 렌더링한다. (스타일 규칙: DESIGN.md 6장) */
export function SkeletonOverlay({ keypoints, imageWidth, imageHeight }: Props) {
  const px = (p: Keypoint) => ({ x: p.x * imageWidth, y: p.y * imageHeight });
  const dotRadius = Math.max(imageWidth, imageHeight) * 0.008;

  return (
    <svg viewBox={`0 0 ${imageWidth} ${imageHeight}`} preserveAspectRatio="xMidYMid meet">
      {/* 중앙 수직 기준선 */}
      <line
        x1={imageWidth / 2}
        y1={0}
        x2={imageWidth / 2}
        y2={imageHeight}
        stroke="#fff"
        strokeWidth={1}
        strokeDasharray="6 6"
        opacity={0.7}
        vectorEffect="non-scaling-stroke"
      />

      {CONNECTIONS.map(([a, b]) => {
        const from = keypoints[a];
        const to = keypoints[b];
        if (from.confidence < MIN_CONFIDENCE || to.confidence < MIN_CONFIDENCE) return null;
        const p1 = px(from);
        const p2 = px(to);
        return (
          <g key={`${a}-${b}`}>
            {/* 밝은 배경에서도 보이도록 검정 헤일로를 깔고 흰 선을 올린다 */}
            <line {...lineProps(p1, p2)} stroke="#000" strokeWidth={5} opacity={0.35} />
            <line {...lineProps(p1, p2)} stroke="#fff" strokeWidth={2.5} />
          </g>
        );
      })}

      {keypoints.map((p) => {
        if (p.confidence < MIN_CONFIDENCE) return null;
        const { x, y } = px(p);
        const solid = p.confidence >= 0.8; // 신뢰도 0.5–0.8은 빈 원
        return (
          <circle
            key={p.id}
            cx={x}
            cy={y}
            r={dotRadius}
            fill={solid ? '#fff' : 'transparent'}
            stroke={solid ? '#000' : '#fff'}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

function lineProps(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return {
    x1: p1.x,
    y1: p1.y,
    x2: p2.x,
    y2: p2.y,
    strokeLinecap: 'round' as const,
    vectorEffect: 'non-scaling-stroke' as const,
  };
}
