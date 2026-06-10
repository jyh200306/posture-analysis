import { useState } from 'react';
import { Disclaimer } from './screens/Disclaimer';
import { Home } from './screens/Home';
import { Analyze } from './screens/Analyze';
import type { AnalyzeOutput } from './screens/Analyze';
import { Result } from './screens/Result';
import { History } from './screens/History';
import { agree, clearRecords, hasAgreed, listRecords, saveRecord } from './lib/storage';
import { buildFeedback } from './lib/feedback';
import type { AnalysisResult } from './types';

type Screen = 'home' | 'analyze' | 'result' | 'history';

/** 결과 화면 표시에 필요한 데이터 묶음 (기록에는 저장하지 않는 것 포함) */
interface AnalysisView {
  result: AnalysisResult;
  imageWidth: number;
  imageHeight: number;
  previousScore: number | null;
}

export default function App() {
  const [agreed, setAgreed] = useState(hasAgreed);
  const [screen, setScreen] = useState<Screen>('home');
  const [records, setRecords] = useState(listRecords);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [view, setView] = useState<AnalysisView | null>(null);

  // PRD F-007: 분석 흐름을 벗어나면 이미지 객체 URL을 즉시 해제
  function releaseImage() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
  }

  function goHome() {
    releaseImage();
    setView(null);
    setScreen('home');
  }

  function goHistory() {
    releaseImage();
    setView(null);
    setScreen('history');
  }

  function handlePick(file: File) {
    setImageUrl(URL.createObjectURL(file));
    setScreen('analyze');
  }

  function handleAnalyzed(output: AnalyzeOutput) {
    const previous = records[0] ?? null;
    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      direction: output.direction,
      overallScore: output.overallScore,
      items: output.items,
      keypoints: output.keypoints,
      feedback: buildFeedback(output.items, output.overallScore, previous?.overallScore ?? null),
    };
    saveRecord({
      id: result.id,
      createdAt: result.createdAt,
      direction: result.direction,
      overallScore: result.overallScore,
      items: result.items,
    });
    setRecords(listRecords());
    setView({
      result,
      imageWidth: output.imageWidth,
      imageHeight: output.imageHeight,
      previousScore: previous?.overallScore ?? null,
    });
    setScreen('result');
  }

  function handleClear() {
    clearRecords();
    setRecords([]);
  }

  if (!agreed) {
    return (
      <div className="app">
        <Disclaimer
          onAgree={() => {
            agree();
            setAgreed(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <button className="header-mark" onClick={goHome}>
          자세 분석
        </button>
        <button className="header-nav" onClick={goHistory}>
          기록
        </button>
      </header>

      {screen === 'home' && (
        <Home lastRecord={records[0] ?? null} onPick={handlePick} onHistory={goHistory} />
      )}
      {screen === 'analyze' && imageUrl && (
        <Analyze imageUrl={imageUrl} onCancel={goHome} onComplete={handleAnalyzed} />
      )}
      {screen === 'result' && view && imageUrl && (
        <Result
          {...view}
          imageUrl={imageUrl}
          onRestart={goHome}
          onHistory={goHistory}
        />
      )}
      {screen === 'history' && (
        <History records={records} onClear={handleClear} onAnalyze={goHome} />
      )}

      <footer className="footer caption">AI 기반 참고 정보이며 의료적 진단이 아닙니다</footer>
    </div>
  );
}
