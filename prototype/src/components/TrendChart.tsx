import type { AnalysisRecord } from '../types';

interface Props {
  /** 오래된 순으로 정렬된 기록 */
  records: AnalysisRecord[];
  height?: number;
}

const W = 472;
const PAD = { top: 16, right: 16, bottom: 26, left: 30 };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
}

/** 종합 점수 추이 꺾은선 차트 */
export function TrendChart({ records, height = 190 }: Props) {
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const xAt = (i: number) =>
    PAD.left + (records.length === 1 ? innerW / 2 : (i / (records.length - 1)) * innerW);
  const yAt = (score: number) => PAD.top + innerH * (1 - score / 100);

  const points = records.map((r, i) => ({ x: xAt(i), y: yAt(r.overallScore), record: r }));
  // 기록이 많으면 x축 라벨은 처음/중간/끝만 표시
  const labelEvery = records.length <= 7 ? 1 : Math.ceil(records.length / 3);

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className="trend-chart"
      role="img"
      aria-label="점수 추이 차트"
    >
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            y1={yAt(v)}
            x2={W - PAD.right}
            y2={yAt(v)}
            stroke="var(--line)"
            strokeWidth={1}
          />
          <text x={PAD.left - 8} y={yAt(v) + 3} textAnchor="end" className="chart-text num">
            {v}
          </text>
        </g>
      ))}

      {points.length > 1 && (
        <>
          <polygon
            points={[
              `${points[0].x},${yAt(0)}`,
              ...points.map((p) => `${p.x},${p.y}`),
              `${points[points.length - 1].x},${yAt(0)}`,
            ].join(' ')}
            fill="var(--primary)"
            opacity={0.05}
          />
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}

      {points.map((p, i) => (
        <g key={p.record.id}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="var(--paper)" stroke="var(--primary)" strokeWidth={1.8}>
            <title>{`${formatDate(p.record.createdAt)} — ${p.record.overallScore}점`}</title>
          </circle>
          {(i % labelEvery === 0 || i === points.length - 1) && (
            <text x={p.x} y={height - 8} textAnchor="middle" className="chart-text num">
              {formatDate(p.record.createdAt)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
