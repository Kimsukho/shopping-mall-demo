# Shopping Mall Server

Node.js, Express, MongoDB를 사용한 쇼핑몰 데모 서버입니다.

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`.env` 파일을 생성하고 MongoDB 연결 정보를 설정하세요.

`.env` 파일 예시:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shoping-mall
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

## 실행 방법

### 개발 모드 (nodemon 사용)
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

## 프로젝트 구조

```
server/
├── config/          # 설정 파일
│   └── database.js  # MongoDB 연결 설정
├── models/          # Mongoose 모델
├── routes/          # Express 라우트
│   └── index.js     # 메인 라우트
├── server.js        # Express 서버 진입점
├── package.json     # 프로젝트 의존성
└── .env     # 환경 변수 예제
```

## API 엔드포인트

- `GET /` - 서버 상태 확인
- `GET /api/health` - 헬스 체크

