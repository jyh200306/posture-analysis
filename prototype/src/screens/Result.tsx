import { ScoreRing } from '../components/ScoreRing';
import { SkeletonOverlay } from '../components/SkeletonOverlay';
import { LevelTag } from '../components/LevelTag';
import { metricStateText, progressText, summaryText } from '../lib/feedback';
import type { Point } from '../lib/pose';
import type { AnalysisResult, MetricKey } from '../types';
import { DIRECTION_LABELS, DIRECTION_METRICS, METRIC_DESC, METRIC_LABELS } from '../types';

interface Props {
  result: AnalysisResult;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  ear: Point;
  previousScore: number | null;
  onMakeRoutine: () => void;
  onDone: () => void;
}

export function Result({
  result,
  imageUrl,
  imageWidth,
  imageHeight,
  ear,
  previousScore,
  onMakeRoutine,
  onDone,
}: Props) {
  const metricKeys = DIRECTION_METRICS[result.direction].filter((key) => result.metrics[key]);

  return (
    <div className="screen fade-in">
      <div className="banner">AI 기반 참고 정보이며 의료적 진단이 아닙니다</div>

      <div className="overlay-frame">
        <img src={imageUrl} alt="골격 오버레이가 표시된 분석 사진" />
        <SkeletonOverlay
          keypoints={result.keypoints}
          direction={result.direction}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          ear={ear}
        />
      </div>

      <div className="section score-section">
        <p className="label">{DIRECTION_LABELS[result.direction]} 측정 결과</p>
        <ScoreRing score={result.overallScore} />
        <p className="pattern-tag">{result.pattern}</p>
        <p className="caption num">{progressText(result.overallScore, previousScore)}</p>
      </div>

      <div className="section">
        <p className="label">정렬 지표</p>
        <div className="item-list">
          {metricKeys.map((key) => {
            const metric = result.metrics[key]!;
            return (
              <div className="item-row" key={key}>
                <div className="item-row-main">
                  <p className="heading">{METRIC_LABELS[key]}</p>
                  <p className="caption">{METRIC_DESC[key]}</p>
                  <p className="caption num">측정값 {metric.value}°</p>
                </div>
                <div className="item-row-right">
                  <span className="item-score num">{metric.score}</span>
                  <LevelTag level={metric.level} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section stack">
        <p className="label">코칭 리포트</p>
        <p className="body-strong">{summaryText(result)}</p>
        {metricKeys
          .filter((key) => result.metrics[key]!.level !== 'good')
          .sort((a, b) => result.metrics[a]!.score - result.metrics[b]!.score)
          .map((key) => (
            <div className="feedback-area" key={key}>
              <div className="feedback-area-head">
                <span className="heading">{METRIC_LABELS[key]}</span>
                <LevelTag level={result.metrics[key]!.level} />
              </div>
              <p className="feedback-state">{metricStateText(key as MetricKey, result.metrics[key]!)}</p>
            </div>
          ))}
      </div>

      <div className="section stack">
        <button className="btn btn-primary" onClick={onMakeRoutine}>
          이 결과로 맞춤 루틴 만들기
        </button>
        <button className="btn btn-secondary" onClick={onDone}>
          홈으로
        </button>
      </div>
    </div>
  );
}
