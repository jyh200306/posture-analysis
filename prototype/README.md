# 자세 분석 AI — 웹 프로토타입

사진 한 장을 업로드하면 브라우저 안에서 AI(MediaPipe)가 관절 17개를 감지하고,
PRD의 점수 공식으로 어깨·골반·척추·목·무게중심을 채점해 골격 오버레이와 피드백을 보여준다.

**서버 없음. 이미지는 기기 밖으로 전송되지 않는다.** (PRD F-007 충족)

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속. (최초 분석 시 AI 모델을 CDN에서 내려받으므로 인터넷 필요)

## 단계별 개발 로드맵

| 단계 | 내용 | 상태 |
|------|------|------|
| **Stage 0** | 설계 확정, 디자인 시스템(DESIGN.md), 프로젝트 골격 | ✅ 완료 |
| **Stage 1** | 코어 루프: 사진 업로드 → MediaPipe 분석 → 점수/오버레이/피드백 결과 | ✅ 완료 |
| **Stage 2** | 기록 저장(localStorage, 최대 30개) + 추이 차트 + 면책 동의 게이트 | ✅ 완료 |
| **Stage 3** | 카메라 직접 촬영(getUserMedia), 입력 검증 고도화(밝기·해상도), 촬영 가이드 실루엣 | ⬜ 예정 |
| **Stage 4** | 피드백 고도화(LLM 연동 검토), 결과 공유/내보내기 | ⬜ 예정 |
| **Stage 5** | React Native(Expo) 이식 + 백엔드 분석 API — PRD 원안 복귀 | ⬜ 예정 |

## 폴더 구조

```
src/
  main.tsx              # 진입점
  App.tsx               # 화면 전환(상태 기반 라우터) + 분석 플로우 조립
  types.ts              # 공유 타입 (AnalysisResult 등)
  styles/global.css     # 디자인 토큰 + 전체 스타일 (DESIGN.md 구현)
  lib/
    pose.ts             # MediaPipe 래퍼: 이미지 → 관절 17개
    scoring.ts          # PRD 점수 공식: 관절 → 항목별/종합 점수
    feedback.ts         # 점수 → 한국어 피드백 텍스트
    storage.ts          # localStorage 기록 CRUD (최대 30개) + 동의 플래그
  components/
    SkeletonOverlay.tsx # 사진 위 SVG 골격 렌더링
    ScoreRing.tsx       # 원형 점수 게이지
    LevelTag.tsx        # 양호/주의/불균형 태그
    TrendChart.tsx      # 점수 추이 SVG 차트
  screens/
    Disclaimer.tsx      # 최초 실행 면책 동의
    Home.tsx            # 진입점: 사진 선택
    Analyze.tsx         # 프리뷰 + 방향 선택 + 분석 실행
    Result.tsx          # 결과 리포트
    History.tsx         # 기록 + 추이
```

## 설계 원칙 (시니어 관점)

- **의존성 3개뿐** (react, react-dom, @mediapipe/tasks-vision). 차트·라우터·상태 라이브러리 없음 — 화면 4개에는 과잉.
- **로직과 화면 분리.** `lib/`는 React를 모름 → 나중에 React Native로 이식할 때 `lib/`는 그대로 가져간다.
- **데이터는 한 방향.** 분석 완료 → 저장 → 화면 전환을 App.tsx 한 곳에서만 처리.

## 프로토타입에서의 근사치 (실서비스 전환 시 보정 필요)

- cm 단위 환산: 몸통 길이(어깨중점–골반중점)를 50cm로 가정해 픽셀→cm 변환
- 목 전방 경사는 측면 사진에서 정확함 (정면 사진은 참고치)
- 밝기/해상도 검증(RULE-002, 004)은 Stage 3에서 추가
