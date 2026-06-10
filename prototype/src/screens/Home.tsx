import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { AnalysisRecord } from '../types';

const MAX_FILE_MB = 10; // PRD RULE-001

interface Props {
  lastRecord: AnalysisRecord | null;
  onPick: (file: File) => void;
  onHistory: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function Home({ lastRecord, onPick, onHistory }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError('파일 크기를 줄여주세요 (최대 10MB)');
      return;
    }
    setError(null);
    onPick(file);
  }

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="screen fade-in">
      <div className="section">
        <p className="label">{today}</p>
        <h1 className="title">
          사진 한 장으로
          <br />
          자세를 측정합니다
        </h1>
        <p className="body-text">
          전신이 나온 사진을 올리면 관절 17곳을 감지해 어깨 · 골반 · 척추 · 목 · 무게중심을
          채점합니다.
        </p>
      </div>

      <div className="section home-status num">
        {lastRecord
          ? `최근 분석 ${lastRecord.overallScore}점 · ${formatDate(lastRecord.createdAt)}`
          : '아직 분석 기록이 없습니다'}
      </div>

      <div className="section stack">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          hidden
          onChange={handleFile}
        />
        <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
          사진 선택하기
        </button>
        <button className="btn btn-secondary" onClick={onHistory}>
          분석 기록 보기
        </button>
        {error && <p className="error-text">{error}</p>}
        <p className="caption">JPG · PNG, 최대 10MB — 이미지는 기기 밖으로 전송되지 않습니다</p>
      </div>
    </div>
  );
}
