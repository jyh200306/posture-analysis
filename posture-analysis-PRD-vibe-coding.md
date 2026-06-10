# 자세 분석 AI 서비스 — 정밀 PRD & 바이브 코딩 프롬프트 가이드

> **문서 버전:** v1.0  
> **작성일:** 2026-06-10  
> **Phase:** MVP (Phase 1)  
> **플랫폼:** React Native (iOS / Android)

---

## 목차

1. [제품 개요](#1-제품-개요)
2. [핵심 유저 플로우](#2-핵심-유저-플로우)
3. [기능 명세 (정밀)](#3-기능-명세-정밀)
4. [데이터 모델](#4-데이터-모델)
5. [API 설계](#5-api-설계)
6. [비기능 요구사항](#6-비기능-요구사항)
7. [KPI 및 성공 지표](#7-kpi-및-성공-지표)
8. [바이브 코딩 마스터 프롬프트](#8-바이브-코딩-마스터-프롬프트)
9. [화면별 바이브 코딩 프롬프트](#9-화면별-바이브-코딩-프롬프트)
10. [컴포넌트별 세부 프롬프트](#10-컴포넌트별-세부-프롬프트)
11. [기술 스택 & 아키텍처 프롬프트](#11-기술-스택--아키텍처-프롬프트)

---

## 1. 제품 개요

### 1.1 한 줄 정의

> 사진 한 장으로 내 자세를 AI가 분석하고, 골격 시각화와 수치 피드백으로 개선 과정을 추적하는 앱

### 1.2 핵심 가치 제안 (Value Proposition)

| 구분 | 내용 |
|------|------|
| **Pain Point** | 자세가 나쁜 건 알지만, 어디가 얼마나 나쁜지 모른다 |
| **Solution** | 스마트폰으로 찍으면 즉시 골격 분석 + 수치화된 피드백 |
| **Differentiator** | 전문 장비 없이 / 5초 이내 / 개인정보 보호 완전 무삭제 |

### 1.3 대상 사용자

```
Primary:   20-40대 직장인, 허리/어깨 불편함을 자각한 사람
Secondary: 운동 습관 형성 중인 건강 관심층
Excluded:  의료적 진단이 필요한 만성 질환자
```

---

## 2. 핵심 유저 플로우

```
[앱 실행]
    │
    ▼
[온보딩 / 면책 동의] ──→ (미동의 시 앱 종료)
    │
    ▼
[홈 화면]
    │
    ├─ [카메라 촬영] ──┐
    └─ [갤러리 선택] ──┤
                        ▼
               [촬영 가이드 + 프리뷰]
                        │
                    (재촬영 / 확인)
                        │
                        ▼
              [AI 분석 로딩] (< 5초)
                        │
                 (오류 시 재시도)
                        │
                        ▼
            [결과 리포트 화면]
            ├─ 골격 오버레이 이미지
            ├─ 종합 점수 (0-100)
            ├─ 항목별 점수 (5개)
            └─ 맞춤 피드백 텍스트
                        │
                        ▼
              [개선 추이 화면] (히스토리)
```

---

## 3. 기능 명세 (정밀)

### F-001. 이미지 입력

**설명:** 분석용 이미지를 획득하는 진입점

#### 입력 규격

| 항목 | 값 |
|------|----|
| 지원 포맷 | JPG, PNG |
| 최대 파일 크기 | 10MB |
| 최소 해상도 | 480 × 640px |
| 촬영 방향 | 정면 / 측면 (선택) |

#### 유효성 검증 규칙

```
RULE-001: 파일 크기 > 10MB → "파일 크기를 줄여주세요 (최대 10MB)" 토스트
RULE-002: 해상도 < 480×640 → "더 선명하게 촬영해 주세요" 토스트
RULE-003: 사람 감지 실패 → "전신이 나오도록 다시 촬영해 주세요" 안내
RULE-004: 어두움 감지 (평균 밝기 < 80/255) → "밝은 공간에서 촬영해 주세요" 안내
```

#### UI 컴포넌트

- **가이드 오버레이:** 촬영 시 전신 실루엣 가이드라인 표시
- **프리뷰 화면:** 촬영 후 확인/재촬영 버튼 (하단 고정)
- **진행 표시:** 분석 중 스켈레톤 로딩 + 진행률 텍스트

---

### F-002. AI 자세 분석 엔진

**설명:** 이미지에서 골격 데이터 추출 및 점수 산출

#### 감지 관절점 (17개)

```
머리(0), 목(1), 왼어깨(2), 오른어깨(3),
왼팔꿈치(4), 오른팔꿈치(5), 왼손목(6), 오른손목(7),
척추상단(8), 척추하단(9),
왼골반(10), 오른골반(11),
왼무릎(12), 오른무릎(13),
왼발목(14), 오른발목(15),
무게중심(16)
```

#### 분석 항목 및 계산 기준

| 항목 | 계산 방법 | 정상 범위 |
|------|----------|----------|
| 어깨 수평 | Δy(왼어깨, 오른어깨) / 어깨너비 | < 3% |
| 골반 수평 | Δy(왼골반, 오른골반) / 골반너비 | < 2% |
| 척추 정렬 | 머리-척추-골반 직선 편차 | < 5° |
| 목 전방 경사 | 귀-어깨 수직 오프셋 | < 2.5cm |
| 무게중심 | 발목 중심 대비 무게중심 편차 | ± 3cm |

#### 점수 산출 로직

```
각 항목 점수 (0-100):
  = 100 - (실측값 / 정상범위 상한) × 50
  단, 최솟값 0점으로 클리핑

종합 점수:
  = (어깨 × 0.25) + (골반 × 0.20) + (척추 × 0.30) + (목 × 0.15) + (무게중심 × 0.10)
  소수점 첫째 자리에서 반올림
```

#### 출력 데이터 구조

```json
{
  "analysisId": "uuid-v4",
  "timestamp": "ISO-8601",
  "overallScore": 75,
  "itemScores": {
    "shoulder": { "score": 80, "deviation": 2.1, "unit": "%" },
    "pelvis":   { "score": 70, "deviation": 3.5, "unit": "%" },
    "spine":    { "score": 72, "deviation": 4.2, "unit": "deg" },
    "neck":     { "score": 65, "deviation": 2.8, "unit": "cm" },
    "balance":  { "score": 88, "deviation": 1.2, "unit": "cm" }
  },
  "keypoints": [
    { "id": 0, "label": "head", "x": 0.52, "y": 0.08, "confidence": 0.95 }
  ],
  "feedbackText": "string (300자 이상)",
  "imageHash": "sha256-for-deduplication"
}
```

---

### F-003. 시각화 리포트

**설명:** 분석 결과를 원본 이미지 위에 시각적으로 렌더링

#### 골격 오버레이 렌더링 규칙

```
관절점 색상:
  confidence >= 0.8 → 실선 렌더링
  confidence 0.5-0.8 → 점선 렌더링
  confidence < 0.5 → 표시 안 함

불균형 색상 코드:
  GREEN (#4CAF50): 정상 (편차 < 50% 기준값)
  YELLOW (#FFC107): 주의 (편차 50-100% 기준값)
  RED (#F44336): 불균형 (편차 > 100% 기준값)

라인 두께: 3px (관절 연결선), 점 반지름: 8px
수직 기준선: 중앙 점선 (파란색, 1px, 투명도 60%)
```

#### 화면 레이아웃 구성

```
┌─────────────────────────────┐
│ ⚠️ 의료 진단 아님 (상단 배너)  │
├─────────────────────────────┤
│                             │
│   [골격 오버레이 이미지]       │
│   비율: 4:3 고정              │
│   최대 높이: 화면의 55%        │
│                             │
├─────────────────────────────┤
│   종합 점수: [75점]           │
│   ████████░░ (게이지)          │
├──────┬──────┬──────┬────────┤
│어깨   │골반   │척추   │목/균형  │
│80점  │70점  │72점  │65/88점 │
├─────────────────────────────┤
│   [맞춤 피드백] (스크롤)        │
│   1) 종합 평가               │
│   2) 개선 영역 (최대 5개)      │
│   3) 격려 메시지              │
└─────────────────────────────┘
```

---

### F-004. 맞춤형 피드백

**설명:** AI 분석 데이터를 바탕으로 개인화 텍스트 생성

#### 피드백 구조 명세

```
섹션 1 - 종합 평가 (필수, 1-2문장)
  예: "전반적으로 양호한 자세입니다. 목의 전방 기울기에 주의가 필요합니다."

섹션 2 - 개선 영역 (점수 낮은 순 최대 5개)
  각 항목:
    - 영역명 + 이모지 (예: 🦴 목 정렬)
    - 현재 상태: "귀가 어깨보다 2.8cm 앞으로 나와있습니다"
    - 개선 방법: 2-3가지 구체적 스트레칭/운동명
    - 소요 시간 명시: "하루 5분"

섹션 3 - 격려 + 다음 단계 (필수, 2-3문장)
  예: "지난주 대비 3점 향상되었습니다! 꾸준히 분석하면 자세 변화를 추적할 수 있습니다."

최소 글자 수: 300자
최대 글자 수: 600자
```

---

### F-005. 개선 추이 추적

**설명:** 로컬 저장 이력 기반 시각화

#### 데이터 저장 규칙

```
저장 위치: 기기 로컬 (AsyncStorage / MMKV)
최대 보존: 30개 (초과 시 가장 오래된 항목 자동 삭제)
저장 내용: analysisId, timestamp, overallScore, itemScores (원본 이미지 제외)
삭제 정책: 사용자 수동 삭제 or 전체 초기화
```

#### 추이 차트 스펙

```
차트 타입: 꺾은선 그래프
X축: 날짜 (최근 7회 or 30일)
Y축: 점수 (0-100, 5점 단위 그리드)
데이터 포인트: 터치 시 날짜 + 점수 툴팁
비교 뱃지: "어제 대비 +5점 ▲" / "지난주 대비 -2점 ▼"
```

---

### F-006. 법적 고지

#### 면책 문구 (변경 불가)

```
⚠️ 본 앱의 자세 분석은 AI 기술 기반이며, 의료적 진단이 아닙니다.
만성 통증이나 질환이 있는 경우 의료 전문가와 상담하세요.
```

#### 표시 위치

| 위치 | 형태 | 조건 |
|------|------|------|
| 최초 실행 | 전체화면 팝업 + 동의 버튼 | 미동의 시 진행 불가 |
| 분석 결과 상단 | 고정 배너 (노란 배경) | 항상 표시 |
| 설정 > 이용약관 | 전문 텍스트 | 선택적 열람 |

---

### F-007. 데이터 보안

#### 이미지 데이터 생명주기

```
1. 업로드: 앱 메모리 내 임시 버퍼 (디스크 기록 없음)
2. 분석: API 전송 (HTTPS, 이미지 암호화)
3. 서버: 분석 즉시 처리 후 5초 내 삭제 (로그 없음)
4. 앱 수신: 분석 결과(JSON)만 저장, 이미지 메모리 해제
5. 검증: 분석 완료 후 메모리 해제 확인 로그 출력
```

---

## 4. 데이터 모델

### 4.1 로컬 저장 스키마

```typescript
// AnalysisRecord (AsyncStorage)
interface AnalysisRecord {
  id: string;              // UUID v4
  createdAt: string;       // ISO-8601
  overallScore: number;    // 0-100
  itemScores: {
    shoulder: ItemScore;
    pelvis: ItemScore;
    spine: ItemScore;
    neck: ItemScore;
    balance: ItemScore;
  };
  feedbackSummary: string; // 첫 50자 (미리보기용)
  imageDirection: 'front' | 'side';
}

interface ItemScore {
  score: number;
  deviation: number;
  unit: string;
  level: 'good' | 'caution' | 'bad';
}

// UserSettings (AsyncStorage)
interface UserSettings {
  hasAgreedToDisclaimer: boolean;
  agreedAt: string;
  totalAnalysisCount: number;
  lastAnalysisAt: string;
}
```

---

## 5. API 설계

### 5.1 자세 분석 API

```
POST /api/v1/analyze

Headers:
  Content-Type: multipart/form-data
  Authorization: Bearer {token}

Body:
  image: File (JPG/PNG, max 10MB)
  direction: 'front' | 'side'
  clientVersion: string

Response 200:
  {
    "success": true,
    "data": AnalysisResult  // F-002 출력 구조 참조
  }

Response 400:
  { "error": "INVALID_IMAGE", "message": "전신이 감지되지 않았습니다" }

Response 429:
  { "error": "RATE_LIMIT", "message": "일일 분석 한도 초과 (100회)" }
```

### 5.2 에러 코드 정의

| 코드 | HTTP | 설명 | 사용자 메시지 |
|------|------|------|-------------|
| INVALID_IMAGE | 400 | 이미지 부적합 | "다시 촬영해 주세요" |
| NO_PERSON_DETECTED | 400 | 사람 미감지 | "전신이 나오게 찍어주세요" |
| LOW_CONFIDENCE | 400 | 인식 신뢰도 낮음 | "더 밝은 곳에서 촬영해 주세요" |
| RATE_LIMIT | 429 | 일일 한도 초과 | "오늘 분석 횟수를 초과했습니다" |
| SERVER_ERROR | 500 | 서버 오류 | "잠시 후 다시 시도해 주세요" |

---

## 6. 비기능 요구사항

### 6.1 성능 목표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| AI 분석 응답 시간 | P95 < 5초 | API 로그 |
| 앱 콜드 스타트 | < 2초 | Flipper 프로파일링 |
| 이미지 업로드 (5MB) | < 3초 | 네트워크 모니터링 |
| 리포트 렌더링 | < 1초 | JS 프로파일링 |
| 앱 번들 크기 | < 30MB | 빌드 산출물 |

### 6.2 보안 요구사항

```
- 모든 API 통신: HTTPS/TLS 1.3
- 이미지 전송: 클라이언트 사이드 AES-256 암호화 후 전송
- API 인증: JWT (만료 1시간, 리프레시 토큰 30일)
- 로컬 저장: AsyncStorage 민감 데이터 없음 (이미지 미저장)
- 앱 루팅/탈옥 감지: 분석 기능 비활성화
```

### 6.3 호환성

```
iOS: 13.0 이상
Android: 9.0 (API Level 28) 이상
인터넷: 필수 (오프라인 불가)
카메라: 후면 카메라 필수
저장 공간: 최소 50MB 여유 공간
```

---

## 7. KPI 및 성공 지표

| KPI | 목표 | 측정 주기 | 측정 방법 |
|-----|------|----------|----------|
| 첫 분석 채택률 | ≥ 70% (가입 24h 내) | 주간 | 이벤트 트래킹 |
| 주간 정기 사용률 | ≥ 45% | 주간 | 분석 이벤트 |
| 30일 이탈률 | ≤ 10% | 월간 | 활동 기반 |
| 재분석 평균 주기 | ≤ 7일 | 월간 | 타임스탬프 |
| NPS | ≥ 40점 | 월간 | 인앱 설문 |
| 분석 완료율 | ≥ 85% | 주간 | 퍼널 분석 |

---

## 8. 바이브 코딩 마스터 프롬프트

> 아래 프롬프트를 AI 코딩 도구(Cursor, Claude Code, Windsurf 등)에 붙여넣어 프로젝트를 시작하세요.

---

```
너는 시니어 React Native 개발자야. 나는 "자세 분석 AI 앱"을 만들고 있어.

# 프로젝트 개요
스마트폰 카메라로 찍은 사진을 AI가 분석해서, 골격 오버레이 이미지와 자세 점수(0-100점), 
맞춤 피드백 텍스트를 보여주는 모바일 앱이야.

# 기술 스택
- Framework: React Native (Expo SDK 51)
- Language: TypeScript (strict mode)
- Navigation: expo-router (파일 기반)
- State: Zustand
- API 통신: axios + react-query
- 로컬 저장: MMKV
- 이미지 처리: expo-image-picker, expo-camera
- 차트: react-native-gifted-charts
- UI: 커스텀 컴포넌트 (NativeWind + Tailwind)

# 디자인 시스템
- Primary Color: #4F46E5 (인디고)
- Success: #4CAF50, Warning: #FFC107, Danger: #F44336
- 폰트: Pretendard (한국어 최적화)
- 모서리: rounded-2xl 기본
- 그림자: elevation 4 (Android), shadowRadius 8 (iOS)

# 코드 규칙
- 컴포넌트: 함수형 + React.FC<Props>
- 파일명: PascalCase (컴포넌트), camelCase (유틸)
- 주석: 한국어로 작성
- 에러 처리: try-catch + 사용자 친화적 토스트 메시지
- 타입: any 사용 금지, 모든 props에 타입 정의

# 절대 하지 말아야 할 것
- 이미지를 로컬 파일시스템에 저장하는 코드
- 의료적 진단을 암시하는 문구
- 하드코딩된 API 키 (환경변수 사용)
- 클래스형 컴포넌트

모든 응답은 위 규칙을 준수하고, 코드 앞에 "이 코드가 하는 일"을 한 줄로 설명해줘.
```

---

## 9. 화면별 바이브 코딩 프롬프트

### 9.1 온보딩 / 면책 동의 화면

```
위의 마스터 프롬프트 컨텍스트에서:

[화면명] OnboardingDisclaimerScreen

[목적] 앱 첫 실행 시 법적 면책 동의를 받는 화면. 
미동의 시 앱 진행 불가. 동의 시 AsyncStorage에 agreedAt 타임스탬프 저장.

[UI 요구사항]
- 전체화면 모달 (뒤로가기 차단)
- 상단: 앱 로고 + "자세 분석 AI" 타이틀
- 중단: 면책 문구 스크롤 텍스트 박스 (스크롤 끝까지 내려야 동의 버튼 활성화)
  면책 문구: "⚠️ 본 앱의 자세 분석은 AI 기술 기반이며, 의료적 진단이 아닙니다. 만성 통증이나 질환이 있는 경우 의료 전문가와 상담하세요."
- 하단: "동의하고 시작하기" 버튼 (스크롤 완료 전 disabled + 회색)

[동작]
- 스크롤 끝: 버튼 활성화 (Primary Color로 변경 + 애니메이션)
- 버튼 탭: MMKV에 { hasAgreedToDisclaimer: true, agreedAt: ISO-8601 } 저장 → 홈화면으로 replace 이동

[타입 정의 포함해서 전체 파일 코드 작성해줘]
```

---

### 9.2 홈 화면 (분석 시작)

```
위의 마스터 프롬프트 컨텍스트에서:

[화면명] HomeScreen

[목적] 사용자의 첫 진입점. 카메라 촬영 또는 갤러리 선택으로 분석을 시작.

[UI 요구사항]
상단:
  - "안녕하세요 👋" + 오늘 날짜
  - 마지막 분석 점수 뱃지 (있으면: "지난 분석: 75점", 없으면: "첫 분석을 시작해보세요!")

중단 (메인 카드):
  - 큰 카드 컴포넌트 (elevation 4)
  - 자세 분석 일러스트 이미지 (assets/posture-illustration.png)
  - "지금 내 자세 분석하기" 타이틀
  - "5초 안에 결과 확인" 서브타이틀

하단 버튼 2개 (가로 배열):
  - 📷 "카메라로 촬영" → expo-camera 권한 요청 → 카메라 화면 이동
  - 🖼️ "갤러리에서 선택" → expo-image-picker → 프리뷰 화면 이동

하단:
  - "📊 내 자세 기록 보기" 텍스트 버튼 → 추이 화면 이동

[동작 로직]
- 카메라 권한 없으면: Alert로 "카메라 권한이 필요합니다. 설정에서 허용해주세요" + 설정앱 링크
- 갤러리 선택: 이미지 선택 완료 후 ImagePreviewScreen으로 selectedImage URI 전달
- MMKV에서 마지막 분석 점수 읽어서 뱃지에 표시

[전체 컴포넌트 코드 작성. react-query로 로컬 데이터 조회 포함]
```

---

### 9.3 카메라 / 이미지 프리뷰 화면

```
위의 마스터 프롬프트 컨텍스트에서:

[화면명] ImagePreviewScreen

[props] route.params: { imageUri: string, direction: 'front' | 'side' }

[목적] 선택/촬영된 이미지를 확인하고 분석 요청 or 재촬영을 선택.

[UI 요구사항]
- 전체화면 이미지 (ImageBackground)
- 상단 오버레이: "← 다시 촬영" 버튼 (반투명 검정 배경)
- 중앙 오버레이: 
  - 전신 가이드 실루엣 SVG (react-native-svg)
  - "전신이 가이드 안에 맞추어져 있나요?" 텍스트
- 하단 패널 (흰 배경, 라운드 상단):
  - 방향 토글: [정면] [측면] 탭
  - "✅ 이 사진으로 분석하기" 버튼 → 분석 API 호출 → 로딩 화면
  - "↩️ 다시 찍기" 텍스트 버튼

[분석 요청 로직]
- 버튼 탭 시: 이미지를 base64로 변환 후 FormData에 담아 POST /api/v1/analyze
- 로딩 중: AnalysisLoadingScreen으로 이동 (분석 완료 후 결과화면으로 자동 이동)
- 에러 처리: 에러 코드별 한국어 토스트 메시지 표시

[이미지는 절대 로컬 파일시스템에 저장하지 말 것. 메모리 URI만 사용]
[전체 코드 작성]
```

---

### 9.4 AI 분석 로딩 화면

```
위의 마스터 프롬프트 컨텍스트에서:

[화면명] AnalysisLoadingScreen

[목적] AI 분석 중임을 사용자에게 시각적으로 전달. 5초 이내 완료 예상.

[UI 요구사항]
- 배경: Primary Color (#4F46E5) 그라데이션
- 중앙:
  - 로티 애니메이션 (lottie-react-native): 스켈레톤 분석 모션
  - "AI가 자세를 분석하고 있어요" (흰색, 20px bold)
  - 동적 서브 텍스트 1초마다 변경:
    "관절점을 찾고 있어요..." → "좌우 균형을 측정해요..." → "점수를 계산해요..." → "피드백을 작성해요..."
  - 진행 바 (Animated, 0→100% 5초 동안)

[에러 처리]
- 10초 초과: "분석에 시간이 걸리고 있어요. 잠시만 기다려주세요..." 메시지 변경
- 15초 초과 or API 에러: "분석 실패" Alert → "다시 시도" / "홈으로" 버튼

[완료 시]: ResultScreen으로 navigate (뒤로가기 스택 제거)
[전체 코드 작성. useEffect로 API 폴링 or Promise 완료 감지 포함]
```

---

### 9.5 분석 결과 화면

```
위의 마스터 프롬프트 컨텍스트에서:

[화면명] ResultScreen

[props] route.params: { analysisData: AnalysisResult }

[목적] 골격 오버레이 이미지, 점수, 피드백을 통합 표시하는 핵심 화면.

[UI 요구사항 - 스크롤 가능]

섹션 1 - 면책 배너 (Fixed Top):
  - 노란 배경, 검정 텍스트
  - "⚠️ 의료적 진단이 아닙니다. AI 기반 참고 정보입니다."

섹션 2 - 골격 오버레이 이미지:
  - 원본 이미지 위에 Canvas (react-native-canvas) or SVG 오버레이
  - 관절점: 원형 점 (신뢰도에 따라 실선/점선)
  - 연결선: 색상 코딩 (GREEN/YELLOW/RED)
  - 중앙 수직선: 파란 점선

섹션 3 - 종합 점수:
  - 큰 원형 게이지 차트 (react-native-gifted-charts의 PieChart)
  - 가운데: "75점" (큰 폰트)
  - 하단: "지난주 대비 +3점 ▲" (초록) or "-2점 ▼" (빨강)

섹션 4 - 항목별 점수 가로 스크롤 카드:
  - 5개 카드 (어깨/골반/척추/목/균형)
  - 각 카드: 아이콘 + 항목명 + 점수 + 색상 인디케이터

섹션 5 - 맞춤 피드백 (expandable):
  - 종합 평가 (항상 표시)
  - 개선 영역 리스트 (아코디언)
  - 격려 메시지

섹션 6 - 하단 액션:
  - "다시 분석하기" 버튼
  - "추이 보기" 버튼

[저장 로직]
- 화면 진입 시: analysisData를 MMKV에 자동 저장 (이미지 제외)
- 저장 후: 이미지 URI 메모리 해제 (imageUri = null)

[전체 코드 작성. SVG 오버레이 렌더링 로직 포함]
```

---

### 9.6 개선 추이 화면

```
위의 마스터 프롬프트 컨텍스트에서:

[화면명] HistoryScreen

[목적] MMKV에 저장된 분석 기록을 차트와 리스트로 시각화.

[UI 요구사항]

섹션 1 - 요약 카드:
  - "총 X회 분석" + "최고 점수: 85점" + "최근 7일 평균: 72점"

섹션 2 - 점수 추이 차트:
  - react-native-gifted-charts LineChart
  - X축: 날짜 (MM/DD)
  - Y축: 0-100 (20점 단위)
  - 데이터 포인트 터치: 날짜 + 점수 툴팁
  - 탭 토글: [최근 7회] [최근 30일]

섹션 3 - 항목별 평균 비교 바:
  - 5개 항목 평균 점수 수평 바 차트
  - 가장 낮은 항목 강조 표시 (빨간 테두리)

섹션 4 - 분석 기록 리스트:
  - 날짜 내림차순
  - 각 항목: 날짜 + 종합점수 + 변화량 뱃지
  - 탭 시 해당 결과 상세 보기 가능

섹션 5 - 데이터 관리:
  - "전체 기록 삭제" 버튼 (빨강, Confirm Alert)

[데이터 로직]
- MMKV에서 모든 AnalysisRecord 읽어 날짜 내림차순 정렬
- 30개 초과 시 오래된 항목 자동 삭제 함수 포함

[전체 코드 작성. MMKV 유틸 함수 포함]
```

---

## 10. 컴포넌트별 세부 프롬프트

### 10.1 SkeletonOverlay 컴포넌트

```
위의 마스터 프롬프트 컨텍스트에서:

[컴포넌트명] SkeletonOverlay

[역할] 원본 이미지 위에 관절점과 연결선을 SVG로 렌더링

[Props]
interface SkeletonOverlayProps {
  imageWidth: number;
  imageHeight: number;
  keypoints: Array<{
    id: number;
    label: string;
    x: number;  // 0-1 정규화 좌표
    y: number;  // 0-1 정규화 좌표
    confidence: number;
  }>;
  itemScores: ItemScores;  // 색상 결정에 사용
}

[렌더링 규칙]
1. 관절 연결 쌍 정의 (JOINT_CONNECTIONS 상수):
   [머리-목, 목-왼어깨, 목-오른어깨, 왼어깨-왼팔꿈치, ...]
   
2. 각 연결선 색상:
   두 관절 중 낮은 점수 기준으로 색상 결정
   >= 70점: GREEN (#4CAF50)
   40-70점: YELLOW (#FFC107)
   < 40점: RED (#F44336)
   
3. 관절점 원:
   confidence >= 0.8: 실선 원 (반지름 8px)
   confidence 0.5-0.8: 점선 원 (StrokeDasharray)
   confidence < 0.5: 렌더링 안 함

4. 중앙 수직 기준선:
   x=0.5 위치에 파란 점선 (strokeDasharray="5,5", opacity=0.6)

[react-native-svg 사용. 전체 컴포넌트 코드 작성]
```

---

### 10.2 ScoreGauge 컴포넌트

```
위의 마스터 프롬프트 컨텍스트에서:

[컴포넌트명] ScoreGauge

[역할] 종합 점수를 원형 게이지로 표시 + 이전 점수 대비 변화량 표시

[Props]
interface ScoreGaugeProps {
  score: number;         // 0-100
  previousScore?: number; // 없으면 변화량 표시 안 함
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

[렌더링]
- react-native-gifted-charts PieChart (도넛 차트)
- 채워진 부분: score에 따라 색상
  >= 80: GREEN, 60-79: YELLOW, < 60: RED
- 가운데 텍스트: "${score}점" (32px bold)
- 아래 텍스트: 변화량 (있는 경우)
  상승: "↑ +N점" 초록색
  하락: "↓ -N점" 빨간색
  동일: "변화 없음" 회색
- animated=true: 0→score로 1.5초 Animated 증가

[전체 컴포넌트 코드 작성. useMemo로 PieChart 데이터 계산 포함]
```

---

### 10.3 FeedbackCard 컴포넌트

```
위의 마스터 프롬프트 컨텍스트에서:

[컴포넌트명] FeedbackCard

[역할] 개선 영역 하나를 아코디언 형태로 표시

[Props]
interface FeedbackCardProps {
  area: string;          // 예: "목 정렬"
  emoji: string;         // 예: "🦴"
  currentState: string;  // 예: "귀가 어깨보다 2.8cm 앞으로 나와있습니다"
  improvements: string[]; // 2-3개 개선 방법
  level: 'good' | 'caution' | 'bad';
  isExpanded: boolean;
  onToggle: () => void;
}

[UI]
- 헤더 (항상 표시): 이모지 + 영역명 + 레벨 뱃지 + 화살표 아이콘
- 레벨 뱃지 색상: good=녹색, caution=노랑, bad=빨강
- 바디 (isExpanded=true):
  - 현재 상태 텍스트 (회색 배경 박스)
  - 개선 방법 번호 리스트
- 토글 애니메이션: LayoutAnimation.easeInEaseOut

[전체 컴포넌트 코드 작성]
```

---

### 10.4 MMKV 데이터 유틸

```
위의 마스터 프롬프트 컨텍스트에서:

[파일명] src/utils/analysisStorage.ts

[역할] MMKV를 통한 분석 기록 CRUD 유틸리티

[구현할 함수 목록]
1. saveAnalysisRecord(record: AnalysisRecord): void
   - 저장 후 30개 초과 시 가장 오래된 항목 삭제

2. getAllAnalysisRecords(): AnalysisRecord[]
   - 날짜 내림차순 정렬하여 반환

3. getAnalysisById(id: string): AnalysisRecord | null

4. getLatestRecord(): AnalysisRecord | null

5. deleteAllRecords(): void
   - MMKV 분석 데이터 전체 초기화

6. getWeeklyAverage(): number
   - 최근 7일 종합점수 평균

7. getImprovementRate(current: AnalysisRecord, previous: AnalysisRecord): number
   - 두 기록 간 종합점수 변화량 반환 (양수=개선, 음수=악화)

[MMKV 키 네이밍: "analysis:${id}", "analysis:index" (id 배열)]
[타입 정의 포함. 전체 코드 작성]
```

---

## 11. 기술 스택 & 아키텍처 프롬프트

### 11.1 프로젝트 초기 세팅

```
Expo SDK 51 기반 React Native 프로젝트를 초기 세팅해줘.

[설치할 패키지]
- expo-router (파일 기반 라우팅)
- zustand (전역 상태)
- @tanstack/react-query (API 상태)
- axios (HTTP 클라이언트)
- react-native-mmkv (로컬 저장)
- expo-camera, expo-image-picker (이미지 입력)
- react-native-svg (SVG 오버레이)
- react-native-gifted-charts (차트)
- lottie-react-native (로딩 애니메이션)
- nativewind (Tailwind CSS)

[폴더 구조]
src/
  app/           # expo-router 페이지
  components/    # 재사용 컴포넌트
  hooks/         # 커스텀 훅
  utils/         # 유틸리티
  types/         # TypeScript 타입
  constants/     # 상수 (색상, API URL 등)
  store/         # Zustand 스토어
  api/           # API 클라이언트 함수

[환경변수 파일 예시 포함]
[package.json 전체 + app.json + tsconfig.json 작성]
```

---

### 11.2 API 클라이언트 설정

```
위의 마스터 프롬프트 컨텍스트에서:

[파일명] src/api/client.ts + src/api/analysis.ts

[역할] axios 인터셉터 + 분석 API 함수

[client.ts 요구사항]
- baseURL: process.env.EXPO_PUBLIC_API_URL
- 타임아웃: 15000ms
- 요청 인터셉터: Authorization 헤더 자동 주입 (MMKV에서 토큰 읽기)
- 응답 인터셉터:
  - 401: 토큰 갱신 후 재요청
  - 429: "분석 한도 초과" 에러 변환
  - 500: "서버 오류" 에러 변환
  - 네트워크 오류: "인터넷 연결을 확인해주세요"

[analysis.ts 요구사항]
async function analyzePosture(
  imageUri: string,
  direction: 'front' | 'side'
): Promise<AnalysisResult>
  - imageUri를 FormData로 변환
  - multipart/form-data POST 요청
  - 응답 후 imageUri 메모리 해제 (null 할당 힌트 주석)

[전체 코드 작성. 에러 타입 정의 포함]
```

---

*이 문서는 바이브 코딩(Vibe Coding) 방식으로 AI 코딩 도구와 함께 빠르게 개발하기 위한 프롬프트 가이드입니다. 각 섹션의 프롬프트를 순서대로 사용하거나, 필요한 부분만 선택하여 활용하세요.*
