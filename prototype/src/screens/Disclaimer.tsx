import { useState } from 'react';

// PRD F-006: 변경 불가 면책 문구
const DISCLAIMER_TEXT =
  '본 앱의 자세 분석은 AI 기술 기반이며, 의료적 진단이 아닙니다. 만성 통증이나 질환이 있는 경우 의료 전문가와 상담하세요.';

export function Disclaimer({ onAgree }: { onAgree: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="screen fade-in">
      <div className="section disclaimer">
        <p className="label">Posture Analysis</p>
        <h1 className="title">
          시작하기 전에
          <br />
          확인해 주세요
        </h1>
        <div className="disclaimer-box">
          <p>{DISCLAIMER_TEXT}</p>
          <p>업로드한 사진은 기기 안에서만 처리되며, 외부로 전송되거나 저장되지 않습니다.</p>
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          위 내용을 모두 확인했습니다
        </label>
        <button className="btn btn-primary" disabled={!checked} onClick={onAgree}>
          동의하고 시작하기
        </button>
      </div>
    </div>
  );
}
