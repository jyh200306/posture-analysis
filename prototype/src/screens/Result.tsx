import { ScoreRing } from '../components/ScoreRing';
import { SkeletonOverlay } from '../components/SkeletonOverlay';
import { LevelTag } from '../components/LevelTag';
import type { AnalysisResult } from '../types';
import { DIRECTION_ITEMS, DIRECTION_LABELS, ITEM_LABELS } from '../types';

interface Props {
  result: AnalysisResult;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  previousScore: number | null;
  onRestart: () => void;
  onHistory: () => void;
}

function deltaText(current: number, previous: number | null): string | null {
  if (previous === null) return null;
  const diff = current - previous;
  if (diff > 0) return `직전 분석 대비 +${diff}점`;
  if (diff < 0) return `직전 분석 대비 -${Math.abs(diff)}점`;
  return '직전 분석과 같은 점수';
}

export function Result({
  result,
  imageUrl,
  imageWidth,
  imageHeight,
  previousScore,
  onRestart,
  onHistory,
}: Props) {
  const { feedback } = result;
  const delta = deltaText(result.overallScore, previousScore);

  return (
    <div className="screen fade-in">
      <div className="banner">의료적 진단이 아닙니다 — AI 기반 참고 정보입니다</div>

      <div className="overlay-frame">
        <img src={imageUrl} alt="골격 오버레이가 표시된 분석 사진" />
        <SkeletonOverlay
          keypoints={result.keypoints}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
        />
      </div>

      <div className="section score-section">
        <p className="label">Overall Score — {DIRECTION_LABELS[result.direction]} 종합 점수</p>
        <ScoreRing score={result.overallScore} />
        {delta && <p className="caption num">{delta}</p>}
      </div>

      <div className="section">
        <p className="label">Items — {DIRECTION_LABELS[result.direction]} 측정 항목</p>
        <div className="item-list">
          {DIRECTION_ITEMS[result.direction].map((key) => {
            const item = result.items[key];
            if (!item) return null;
            return (
              <div className="item-row" key={key}>
                <div>
                  <p className="heading">{ITEM_LABELS[key]}</p>
                  <p className="caption num">
                    편차 {item.deviation}
                    {item.unit}
                  </p>
                </div>
                <div className="item-row-right">
                  <span className="item-score num">{item.score}</span>
                  <LevelTag level={item.level} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section stack">
        <p className="label">Feedback — 피드백</p>
        <p>{feedback.summary}</p>

        {feedback.areas.map((area) => (
          <div className="feedback-area" key={area.key}>
            <div className="feedback-area-head">
              <span className="heading">{area.title}</span>
              <LevelTag level={result.items[area.key]!.level} />
            </div>
            <p className="feedback-state">{area.state}</p>
            <ol className="feedback-actions">
              {area.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
            <p className="caption num">하루 {area.minutes}분</p>
          </div>
        ))}

        <p className="body-text">{feedback.encouragement}</p>
      </div>

      <div className="section stack">
        <button className="btn btn-primary" onClick={onRestart}>
          다시 분석하기
        </button>
        <button className="btn btn-secondary" onClick={onHistory}>
          추이 보기
        </button>
      </div>
    </div>
  );
}
