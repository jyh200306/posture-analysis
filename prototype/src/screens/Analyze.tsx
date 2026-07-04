import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Icon } from '../components/Icon';
import { detectPose, preloadModel } from '../lib/pose';
import type { Point } from '../lib/pose';
import { scorePose } from '../lib/scoring';
import type { ScoredAnalysis } from '../lib/scoring';
import type { Direction, Keypoint } from '../types';

export interface AnalyzeOutput extends ScoredAnalysis {
  direction: Direction;
  keypoints: Keypoint[];
  ear: Point;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}

interface Props {
  onComplete: (output: AnalyzeOutput) => void;
}

type Phase = 'intro' | 'camera' | 'preview' | 'loading' | 'error';

const MAX_FILE_MB = 10;
const MIN_WIDTH = 480;
const MIN_HEIGHT = 480;

const STEPS: Record<Direction, string[]> = {
  front: [
    '관절점을 찾고 있습니다',
    '좌우 균형을 측정하고 있습니다',
    '점수를 계산하고 있습니다',
    '리포트를 만들고 있습니다',
  ],
  side: [
    '관절점을 찾고 있습니다',
    '전후 정렬을 측정하고 있습니다',
    '점수를 계산하고 있습니다',
    '리포트를 만들고 있습니다',
  ],
};

const DIRECTION_GUIDE: Record<Direction, { title: string; desc: string; items: string }> = {
  front: {
    title: '정면 측정',
    desc: '카메라를 정면으로 바라보고 양팔을 자연스럽게 내린 채 섭니다.',
    items: '어깨 수평 · 골반 수평 · 머리 기울기 · 몸통 중심',
  },
  side: {
    title: '측면 측정',
    desc: '몸 옆면이 카메라를 향하게 서서 시선은 정면 먼 곳에 둡니다.',
    items: '목 전방 정렬 · 상체 굽음 · 몸통 기울기 · 골반 정렬',
  },
};

export function Analyze({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [direction, setDirection] = useState<Direction>('side');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerSec, setTimerSec] = useState(5);

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageUrlRef = useRef<string | null>(null);
  const handedOffRef = useRef(false); // 결과 화면으로 이미지를 넘겼는지

  // 가이드를 읽는 동안 AI 모델을 미리 받아둔다
  useEffect(() => {
    preloadModel();
  }, []);

  // 화면을 떠날 때 자원 정리 — 결과 화면에 넘긴 이미지는 App이 해제한다
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (!handedOffRef.current && imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  // 카메라 화면이 뜨면 스트림을 비디오 엘리먼트에 연결
  useEffect(() => {
    if (phase === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  // 분석 중 단계 문구를 1초 간격으로 순환
  useEffect(() => {
    if (phase !== 'loading') return;
    setStepIndex(0);
    const timer = setInterval(
      () => setStepIndex((i) => Math.min(i + 1, STEPS[direction].length - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [phase, direction]);

  // 미리보기 이미지의 밝기를 검사해 어두우면 경고
  useEffect(() => {
    if (phase !== 'preview' || !imageUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const img = new Image();
        img.src = imageUrl;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 48, 48);
        const { data } = ctx.getImageData(0, 0, 48, 48);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const avg = sum / (data.length / 4);
        if (!cancelled) {
          if (avg < 60) setWarning('사진이 어둡습니다. 밝은 곳에서 다시 찍으면 더 정확합니다.');
          else if (img.naturalWidth < MIN_WIDTH || img.naturalHeight < MIN_HEIGHT)
            setWarning('해상도가 낮습니다. 더 선명한 사진이면 정확도가 올라갑니다.');
          else setWarning(null);
        }
      } catch {
        /* 밝기 검사는 보조 기능 — 실패해도 진행 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, imageUrl]);

  function setImage(url: string | null) {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = url;
    setImageUrl(url);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCountdown(null);
  }

  function backToIntro() {
    stopCamera();
    setImage(null);
    setWarning(null);
    setPhase('intro');
  }

  /* ---------- 사진 업로드 ---------- */

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`파일이 너무 큽니다. ${MAX_FILE_MB}MB 이하의 사진을 선택해 주세요.`);
      setPhase('error');
      return;
    }
    setImage(URL.createObjectURL(file));
    setPhase('preview');
  }

  /* ---------- 카메라 ---------- */

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase('camera');
    } catch {
      setError(
        '카메라를 사용할 수 없습니다. 브라우저의 카메라 권한을 허용했는지 확인하거나, 사진 업로드를 이용해 주세요.',
      );
      setPhase('error');
    }
  }

  function startCapture() {
    if (countdown !== null) return;
    let remain = timerSec;
    setCountdown(remain);
    const timer = setInterval(() => {
      remain -= 1;
      if (remain > 0) {
        setCountdown(remain);
        return;
      }
      clearInterval(timer);
      setCountdown(null);
      capture();
    }, 1000);
  }

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        setImage(URL.createObjectURL(blob));
        setPhase('preview');
      },
      'image/jpeg',
      0.92,
    );
  }

  /* ---------- 분석 ---------- */

  async function run() {
    if (!imageUrl) return;
    setPhase('loading');
    try {
      const img = new Image();
      img.src = imageUrl;
      await img.decode();

      // 분석이 너무 빨리 끝나도 진행 과정이 보이도록 최소 노출 시간을 둔다
      const [pose] = await Promise.all([
        detectPose(img),
        new Promise((resolve) => setTimeout(resolve, 1600)),
      ]);

      if (!pose) {
        setError(
          '몸이 감지되지 않았습니다. 상반신 이상이 나오도록, 배경과 구분되는 옷차림으로 다시 시도해 주세요.',
        );
        setPhase('error');
        return;
      }

      const scored = scorePose(pose, img.naturalWidth, img.naturalHeight, direction);
      handedOffRef.current = true;
      onComplete({
        ...scored,
        direction,
        keypoints: pose.keypoints,
        ear: pose.ear,
        imageUrl,
        imageWidth: img.naturalWidth,
        imageHeight: img.naturalHeight,
      });
    } catch {
      setError('분석 중 문제가 발생했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.');
      setPhase('error');
    }
  }

  /* ---------- 렌더링 ---------- */

  if (phase === 'loading') {
    return (
      <div className="screen fade-in">
        <div className="loading">
          <p className="label">Analyzing</p>
          <p className="heading">{STEPS[direction][stepIndex]}</p>
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
          <p className="label">알림</p>
          <h1 className="heading">{error}</h1>
          <button className="btn btn-primary" onClick={backToIntro}>
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'camera') {
    return (
      <div className="camera fade-in">
        <div className="camera-frame">
          <video ref={videoRef} playsInline muted className="camera-video" />
          {/* 전신 가이드 — 점선 실루엣과 중앙 수직선 */}
          <svg className="camera-guide" viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet">
            <line x1="50" y1="4" x2="50" y2="156" stroke="#fff" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.5" />
            <circle cx="50" cy="22" r="9" fill="none" stroke="#fff" strokeWidth="0.8" strokeDasharray="2.5 2.5" opacity="0.85" />
            <path
              d="M50 31v44 M50 40l-15 16 M50 40l15 16 M50 75l-10 60 M50 75l10 60"
              fill="none"
              stroke="#fff"
              strokeWidth="0.8"
              strokeDasharray="2.5 2.5"
              opacity="0.85"
              strokeLinecap="round"
            />
          </svg>
          {countdown !== null && <div className="camera-count num">{countdown}</div>}
          <button className="camera-close" onClick={backToIntro} aria-label="카메라 닫기">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="camera-panel">
          <p className="caption">
            기기를 세워 두고 2–3m 떨어져 {direction === 'front' ? '정면' : '옆면'}이 보이게 서
            주세요
          </p>
          <div className="toggle">
            {[3, 5, 10].map((sec) => (
              <button
                key={sec}
                className={timerSec === sec ? 'active' : ''}
                onClick={() => setTimerSec(sec)}
              >
                {sec}초
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={startCapture} disabled={countdown !== null}>
            {countdown !== null ? `${countdown}초 후 촬영` : '타이머 촬영'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'preview' && imageUrl) {
    return (
      <div className="screen fade-in">
        <div className="overlay-frame">
          <img src={imageUrl} alt="분석할 사진 미리보기" />
        </div>
        <div className="section stack">
          {warning && <p className="notice">{warning}</p>}
          <p className="caption">
            {DIRECTION_GUIDE[direction].title} — {DIRECTION_GUIDE[direction].items}
          </p>
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
          <button className="btn-text" onClick={backToIntro}>
            다시 선택하기
          </button>
        </div>
      </div>
    );
  }

  // intro
  return (
    <div className="screen fade-in">
      <div className="section">
        <p className="label">Posture Check</p>
        <h1 className="title">자세 측정</h1>
        <p className="body-text">
          측정 방향을 고르고 사진을 준비하세요. 같은 장소·거리·시간대에 측정할수록 회차 간
          비교가 정확해집니다.
        </p>
      </div>

      <div className="section stack">
        <div className="direction-cards">
          {(['side', 'front'] as Direction[]).map((dir) => (
            <button
              key={dir}
              className={`direction-card${direction === dir ? ' active' : ''}`}
              onClick={() => setDirection(dir)}
            >
              <p className="heading">{DIRECTION_GUIDE[dir].title}</p>
              <p className="caption">{DIRECTION_GUIDE[dir].items}</p>
            </button>
          ))}
        </div>
        <p className="caption">{DIRECTION_GUIDE[direction].desc}</p>
      </div>

      <div className="section stack">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={handleFile} />
        <button className="btn btn-primary btn-icon" onClick={openCamera}>
          <Icon name="camera" size={19} />
          카메라로 촬영
        </button>
        <button className="btn btn-secondary btn-icon" onClick={() => fileRef.current?.click()}>
          <Icon name="image" size={19} />
          사진 업로드
        </button>
        <p className="caption">
          JPG · PNG, 최대 {MAX_FILE_MB}MB — 사진은 기기 안에서만 처리되며 외부로 전송되지
          않습니다
        </p>
      </div>
    </div>
  );
}

/** 방향 선택 카드의 미니 일러스트 — 정면/측면 선 자세 */
function DirectionFigure({ dir }: { dir: Direction }) {
  const stroke = { stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <svg width="44" height="62" viewBox="0 0 44 62" aria-hidden="true">
      {dir === 'front' ? (
        <>
          <circle cx="22" cy="9" r="5.5" {...stroke} />
          <path d="M22 17v20" {...stroke} />
          <path d="M22 22l-10 9M22 22l10 9" {...stroke} />
          <path d="M22 37l-7 19M22 37l7 19" {...stroke} />
        </>
      ) : (
        <>
          <circle cx="25" cy="9" r="5.5" {...stroke} />
          <path d="M24 17c-2 6-3 12-2.5 20" {...stroke} />
          <path d="M23 23l4 11" {...stroke} />
          <path d="M21.5 37l-2 19M21.5 37l5 18" {...stroke} />
        </>
      )}
    </svg>
  );
}
