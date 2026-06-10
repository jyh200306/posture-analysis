import { useEffect, useState } from 'react';
import { detectPose } from '../lib/pose';
import { scorePose } from '../lib/scoring';
import type { ScoredAnalysis } from '../lib/scoring';
import type { Direction, Keypoint } from '../types';

export interface AnalyzeOutput extends ScoredAnalysis {
  direction: Direction;
  keypoints: Keypoint[];
  imageWidth: number;
  imageHeight: number;
}

interface Props {
  imageUrl: string;
  onCancel: () => void;
  onComplete: (output: AnalyzeOutput) => void;
}

const STEPS = [
  '관절점을 찾고 있습니다',
  '좌우 균형을 측정하고 있습니다',
  '점수를 계산하고 있습니다',
  '피드백을 작성하고 있습니다',
];

const MIN_WIDTH = 480; // PRD RULE-002
const MIN_HEIGHT = 640;

type Phase = 'preview' | 'loading' | 'error';

export function Analyze({ imageUrl, onCancel, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('preview');
  const [direction, setDirection] = useState<Direction>('front');
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');

  // 분석 중 단계 문구를 1초 간격으로 순환
  useEffect(() => {
    if (phase !== 'loading') return;
    setStepIndex(0);
    const timer = setInterval(
      () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [phase]);

  async function run() {
    setPhase('loading');
    try {
      const img = new Image();
      img.src = imageUrl;
      await img.decode();

      if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT) {
        fail('해상도가 낮습니다. 더 선명한 사진을 선택해 주세요 (최소 480×640).');
        return;
      }

      // 분석이 너무 빨리 끝나도 진행 과정이 보이도록 최소 노출 시간을 둔다
      const [pose] = await Promise.all([
        detectPose(img),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      if (!pose) {
        fail('전신이 감지되지 않았습니다. 전신이 나온 사진으로 다시 시도해 주세요.');
        return;
      }

      const scored = scorePose(pose, img.naturalWidth, img.naturalHeight);
      onComplete({
        ...scored,
        direction,
        keypoints: pose.keypoints,
        imageWidth: img.naturalWidth,
        imageHeight: img.naturalHeight,
      });
    } catch {
      fail('분석 중 문제가 발생했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.');
    }
  }

  function fail(message: string) {
    setError(message);
    setPhase('error');
  }

  if (phase === 'loading') {
    return (
      <div className="screen fade-in">
        <div className="loading">
          <p className="label">Analyzing</p>
          <p className="heading">{STEPS[stepIndex]}</p>
          <div className="loading-bar" />
          <p className="caption">최초 분석은 AI 모델 다운로드로 몇 초 더 걸릴 수 있습니다</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="screen fade-in">
        <div className="section stack">
          <p className="label">Error</p>
          <h1 className="heading">{error}</h1>
          <button className="btn btn-primary" onClick={onCancel}>
            다른 사진 선택하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen fade-in">
      <div className="overlay-frame">
        <img src={imageUrl} alt="분석할 사진 미리보기" />
      </div>
      <div className="section stack">
        <p className="caption">촬영 방향을 선택하세요. 측면 사진일수록 목 측정이 정확합니다.</p>
        <div className="toggle">
          <button
            className={direction === 'front' ? 'active' : ''}
            onClick={() => setDirection('front')}
          >
            정면
          </button>
          <button
            className={direction === 'side' ? 'active' : ''}
            onClick={() => setDirection('side')}
          >
            측면
          </button>
        </div>
        <button className="btn btn-primary" onClick={run}>
          이 사진으로 분석하기
        </button>
        <button className="btn-text" onClick={onCancel}>
          다른 사진 선택하기
        </button>
      </div>
    </div>
  );
}
