import { useState } from 'react';
import { Icon } from '../components/Icon';
import type { Goal, Profile } from '../types';
import { GOAL_LABELS } from '../types';

const DISCLAIMER =
  '워크모션의 자세 분석은 AI 기술 기반 참고 정보이며, 의료적 진단이 아닙니다. 만성 통증이나 질환이 있는 경우 의료 전문가와 상담하세요. 사진은 기기 안에서만 처리되며 외부로 전송되거나 저장되지 않습니다.';

interface Props {
  profile: Profile;
  onSaveProfile: (profile: Profile) => void;
  onClearRecords: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function Settings({ profile, onSaveProfile, onClearRecords, onClearAll, onClose }: Props) {
  const [name, setName] = useState(profile.name);
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const dirty = name.trim() !== profile.name || goal !== profile.goal;

  function handleClearRecords() {
    if (window.confirm('모든 측정 기록을 삭제할까요? 되돌릴 수 없습니다.')) onClearRecords();
  }

  function handleClearAll() {
    if (window.confirm('프로필, 측정 기록, 루틴을 모두 삭제할까요? 되돌릴 수 없습니다.'))
      onClearAll();
  }

  return (
    <div className="screen fade-in">
      <div className="player-head">
        <button className="icon-btn" onClick={onClose} aria-label="뒤로">
          <Icon name="back" size={22} />
        </button>
        <span className="caption">설정</span>
      </div>

      <div className="section stack">
        <p className="label">프로필</p>
        <div className="field">
          <label className="field-label" htmlFor="set-name">
            이름 또는 닉네임
          </label>
          <input
            id="set-name"
            className="input"
            type="text"
            maxLength={12}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <p className="field-label">목표</p>
          <div className="choice-list">
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <button
                key={g}
                className={`choice${goal === g ? ' active' : ''}`}
                onClick={() => setGoal(g)}
              >
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
        {dirty && (
          <button
            className="btn btn-primary"
            onClick={() => onSaveProfile({ ...profile, name: name.trim(), goal })}
          >
            변경 사항 저장
          </button>
        )}
      </div>

      <div className="section stack">
        <p className="label">측정 가이드</p>
        <ul className="guide-list">
          <li>기기를 허리 높이에 세워 두고 2–3m 떨어져 서세요</li>
          <li>몸의 윤곽이 보이는 옷차림이 인식 정확도를 높입니다</li>
          <li>매번 같은 장소·거리·시간대에 측정하면 비교가 정확해집니다</li>
          <li>측정 직전에 자세를 고치지 말고 평소 그대로 서는 것이 중요합니다</li>
        </ul>
      </div>

      <div className="section stack">
        <p className="label">데이터</p>
        <p className="caption">
          모든 데이터는 이 기기의 브라우저에만 저장됩니다. 서버로 전송되는 정보는 없습니다.
        </p>
        <button className="btn btn-secondary" onClick={handleClearRecords}>
          측정 기록 삭제
        </button>
        <button className="btn-text danger" onClick={handleClearAll}>
          전체 데이터 초기화
        </button>
      </div>

      <div className="section stack">
        <p className="label">안내</p>
        <div className="disclaimer-box">
          <p>{DISCLAIMER}</p>
        </div>
        <p className="caption num">워크모션 1.0.0</p>
      </div>
    </div>
  );
}
