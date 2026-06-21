import { useEffect, useState } from 'react';
import { gradeOf } from '../lib/scoring';

interface Props {
  score: number; // 0–100
  size?: number;
}

/** 종합 점수 원형 게이지 — 트랙은 헤어라인, 채움은 잉크색 */
export function ScoreRing({ score, size = 210 }: Props) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // 마운트 후 0 → score로 채워지는 애니메이션
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
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="score-ring-center">
        <span className="score-ring-value num">{score}</span>
        <span className="score-ring-grade">{gradeOf(score).label}</span>
      </div>
    </div>
  );
}
