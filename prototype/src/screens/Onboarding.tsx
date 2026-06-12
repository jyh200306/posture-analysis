import { useState } from 'react';
import { Logo } from '../components/Logo';
import type { Goal, Profile } from '../types';
import { GOAL_LABELS } from '../types';

const DISCLAIMER =
  '워크모션의 자세 분석은 AI 기술 기반 참고 정보이며, 의료적 진단이 아닙니다. 만성 통증이나 질환이 있는 경우
   의료 전문가와 상담하세요.';

interface Props {
  onDone: (profile: Profile) => void;
}

export function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal>('neck');
  const [agreed, setAgreed] = useState(false);

  function start() {
    onDone({
      name: name.trim(),
      goal,
      agreedAt: new Date().toISOString(),
    });
  }

  if (step === 0) {
    return (
      <div className="onboard fade-in" key={0}>
        <div className="onboard-body">
          <Logo size={56} withText={false} />
          <h1 className="display">
            자세를
            <br />
            데이터로 관리하다
          </h1>
          <p className="body-text">
            사진 한 장이면 충분합니다.
            당신에게 필요한 교정 루틴을 만들어
            매일 함께합니다.
          </p>
        </div>
        <div className="onboard-foot">
          <div className="dots">
            <span className="dot active" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <button className="btn btn-primary" onClick={() => setStep(1)}>
            다음
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="onboard fade-in" key={1}>
        <div className="onboard-body">
          <p className="label">How it works</p>
          <h1 className="display">
            측정하고, 교정하고,
            <br />
            추적합니다
          </h1>
          <ol className="onboard-steps">
            <li>
              <span className="step-no num">1</span>
              <div>
                <p className="heading">정렬 측정</p>
                <p className="caption">
                  관절 17곳을 인식해 어깨·골반·목의 정렬을 각도로 측정
                </p>
              </div>
            </li>
            <li>
              <span className="step-no num">2</span>
              <div>
                <p className="heading">맞춤 루틴</p>
                <p className="caption">
                  가장 약한 영역을 찾아 하루 10분 안팎의 교정 운동 처방
                </p>
              </div>
            </li>
            <li>
              <span className="step-no num">3</span>
              <div>
                <p className="heading">변화 추적</p>
                <p className="caption">측정을 반복하며 점수와 자세 패턴의 변화 기록</p>
              </div>
            </li>
          </ol>
          <p className="caption">
            사진은 기기 안에서만 분석되고 외부로 전송되거나 저장되지 않습니다.
          </p>
        </div>
        <div className="onboard-foot">
          <div className="dots">
            <span className="dot" />
            <span className="dot active" />
            <span className="dot" />
          </div>
          <button className="btn btn-primary" onClick={() => setStep(2)}>
            다음
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboard fade-in" key={2}>
      <div className="onboard-body">
        <p className="label">Profile</p>
        <h1 className="display">
          무엇을
          <br />
          바꾸고 싶나요?
        </h1>

        <div className="field">
          <label className="field-label" htmlFor="ob-name">
            이름 또는 닉네임 <span className="caption">(선택)</span>
          </label>
          <input
            id="ob-name"
            className="input"
            type="text"
            maxLength={12}
            placeholder="예: 연호"
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

        <div className="disclaimer-box">
          <p>{DISCLAIMER}</p>
        </div>
        <label className="check-row">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          위 내용을 확인했으며 동의합니다
        </label>
      </div>
      <div className="onboard-foot">
        <div className="dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot active" />
        </div>
        <button className="btn btn-primary" disabled={!agreed} onClick={start}>
          워크모션 시작하기
        </button>
      </div>
    </div>
  );
}
