import { useEffect, useState } from 'react';

interface Props {
  score: number; // 0–100
  size?: number;
}

/** 종합 점수 원형 게이지 — 트랙은 헤어라인, 채움은 잉크색 (모노크롬) */
export function ScoreRing({ score, size = 220 }: Props) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // 마운트 후 0 → score로 채워지는 애니메이션 (CSS transition)
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setProgress(score));
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.9s ease-out' }}
        />
      </svg>
      <div className="score-ring-center">
        <span className="score-ring-value num">{score}</span>
        <span className="score-ring-unit">점 / 100</span>
      </div>
    </div>
  );
}
