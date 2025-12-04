# Shopping Mall Client

Vite + React를 사용한 쇼핑몰 데모 클라이언트입니다.

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정 (선택사항):
`.env` 파일을 생성하고 API URL을 설정하세요.

`.env` 파일 예시:
```
VITE_API_URL=http://localhost:5000/api
```

## 실행 방법

### 개발 모드
```bash
npm run dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 빌드 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
client/
├── public/          # 정적 파일
├── src/
│   ├── components/  # React 컴포넌트
│   ├── hooks/       # Custom React Hooks
│   ├── services/    # API 서비스
│   │   └── api.js   # Axios 인스턴스
│   ├── utils/       # 유틸리티 함수
│   ├── App.jsx      # 메인 App 컴포넌트
│   ├── App.css      # App 스타일
│   ├── main.jsx     # React 진입점
│   └── index.css    # 전역 스타일
├── index.html       # HTML 템플릿
├── vite.config.js   # Vite 설정
└── package.json     # 프로젝트 의존성
```

## 주요 기능

- ⚡️ Vite로 빠른 개발 환경
- ⚛️ React 18
- 🛣️ React Router DOM
- 📡 Axios를 사용한 API 통신
- 🎨 모던한 UI 스타일링

## 개발 팁

- `src/components/` 폴더에 재사용 가능한 컴포넌트를 추가하세요
- `src/services/api.js`를 사용하여 서버와 통신하세요
- `src/hooks/` 폴더에 커스텀 훅을 추가하세요

