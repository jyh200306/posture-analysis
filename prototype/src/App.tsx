import { useState } from 'react';
import { Logo } from './components/Logo';
import { Icon } from './components/Icon';
import { TabBar } from './components/TabBar';
import type { Tab } from './components/TabBar';
import { Onboarding } from './screens/Onboarding';
import { Home } from './screens/Home';
import { Analyze } from './screens/Analyze';
import type { AnalyzeOutput } from './screens/Analyze';
import { Result } from './screens/Result';
import { Coach } from './screens/Coach';
import { History } from './screens/History';
import { Settings } from './screens/Settings';
import { BodyReport, buildReportData } from './screens/BodyReport';
import { classifyPattern } from './lib/scoring';
import { buildRoutine } from './lib/routine';
import type { Point } from './lib/pose';
import {
  activeDaysThisWeek,
  clearAll,
  clearRecords,
  listRecords,
  loadProfile,
  loadRoutine,
  logOf,
  saveProfile,
  saveRecord,
  saveRoutine,
  streakDays,
  todayKey,
  toggleDone,
} from './lib/storage';
import type { AnalysisResult, Profile } from './types';

/** 결과 화면 표시에 필요한 데이터 묶음 (기록에는 저장하지 않는 것 포함) */
interface ResultView {
  result: AnalysisResult;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  ear: Point;
  previousScore: number | null;
}

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(loadProfile);
  const [tab, setTab] = useState<Tab>('home');
  const [records, setRecords] = useState(listRecords);
  const [routine, setRoutine] = useState(loadRoutine);
  const [todayLog, setTodayLog] = useState(() => logOf(todayKey()));
  const [streak, setStreak] = useState(streakDays);
  const [view, setView] = useState<ResultView | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [freshRoutine, setFreshRoutine] = useState(false);

  function closeResult() {
    if (view) URL.revokeObjectURL(view.imageUrl);
    setView(null);
  }

  function handleAnalyzed(output: AnalyzeOutput) {
    const previous = records[0] ?? null;
    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      direction: output.direction,
      overallScore: output.overallScore,
      pattern: classifyPattern(output.direction, output.metrics),
      metrics: output.metrics,
      keypoints: output.keypoints,
    };
    saveRecord({
      id: result.id,
      createdAt: result.createdAt,
      direction: result.direction,
      overallScore: result.overallScore,
      pattern: result.pattern,
      metrics: result.metrics,
    });
    setRecords(listRecords());
    setView({
      result,
      imageUrl: output.imageUrl,
      imageWidth: output.imageWidth,
      imageHeight: output.imageHeight,
      ear: output.ear,
      previousScore: previous?.overallScore ?? null,
    });
  }

  function handleMakeRoutine() {
    if (!view) return;
    const next = buildRoutine(view.result);
    saveRoutine(next);
    setRoutine(next);
    closeResult();
    setFreshRoutine(true);
    setTab('coach');
  }

  function handleToggleDone(exerciseId: string) {
    if (!routine) return;
    setTodayLog(toggleDone(exerciseId, routine.exerciseIds.length));
    setStreak(streakDays());
  }

  function handleSaveProfile(next: Profile) {
    saveProfile(next);
    setProfile(next);
  }

  function handleClearRecords() {
    clearRecords();
    setRecords([]);
  }

  function handleClearAll() {
    clearAll();
    setRecords([]);
    setRoutine(null);
    setTodayLog(null);
    setStreak(0);
    setProfile(null);
    setSettingsOpen(false);
  }

  if (!profile) {
    return (
      <div className="app">
        <Onboarding onDone={handleSaveProfile} />
      </div>
    );
  }

  // 분석 결과 — 전체 화면으로 표시
  if (view) {
    return (
      <div className="app">
        <header className="header header-centered">
          <button className="icon-btn" onClick={closeResult} aria-label="뒤로">
            <Icon name="back" size={22} />
          </button>
          <Logo size={24} />
          <span className="header-spacer" />
        </header>
        <Result
          {...view}
          onMakeRoutine={handleMakeRoutine}
          onDone={() => {
            closeResult();
            setTab('home');
          }}
        />
      </div>
    );
  }

  if (settingsOpen) {
    return (
      <div className="app">
        <Settings
          profile={profile}
          onSaveProfile={handleSaveProfile}
          onClearRecords={handleClearRecords}
          onClearAll={handleClearAll}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="app with-tabbar">
      <header className="header">
        {tab !== 'home' ? (
          <button className="icon-btn" onClick={() => setTab('home')} aria-label="홈으로">
            <Icon name="back" size={22} />
          </button>
        ) : (
          <Logo size={24} />
        )}
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="설정">
          <Icon name="sliders" size={20} />
        </button>
      </header>

      {tab === 'home' && (
        <Home
          profile={profile}
          records={records}
          routine={routine}
          todayLog={todayLog}
          streak={streak}
          onAnalyze={() => setTab('analyze')}
          onCoach={() => setTab('coach')}
          onHistory={() => setTab('history')}
        />
      )}
      {tab === 'analyze' && <Analyze onComplete={handleAnalyzed} />}
      {tab === 'report' && (
        <BodyReport
          data={buildReportData(records, profile.name)}
          userName={profile.name}
          onAnalyze={() => setTab('analyze')}
          onHistory={() => setTab('history')}
        />
      )}
      {tab === 'coach' && (
        <Coach
          routine={routine}
          todayLog={todayLog}
          streak={streak}
          activeDays={activeDaysThisWeek()}
          profileName={profile.name}
          freshRoutine={freshRoutine}
          onToggleDone={handleToggleDone}
          onAnalyze={() => setTab('analyze')}
        />
      )}
      {tab === 'history' && (
        <History
          records={records}
          activeDays={activeDaysThisWeek()}
          onAnalyze={() => setTab('analyze')}
        />
      )}

      <TabBar active={tab} onChange={(t) => { setFreshRoutine(false); setTab(t); }} />
    </div>
  );
}
