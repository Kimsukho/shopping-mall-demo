# 환경 변수 설정 가이드

## Server (Heroku) 환경 변수

Heroku 대시보드의 Settings → Config Vars에서 다음 변수들을 설정하세요:

```env
# MongoDB 연결 (필수)
MONGODB_ATLAS_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT 설정 (필수)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# CORS 설정 (Vercel 배포 후 업데이트 필요)
CLIENT_URL=https://your-vercel-app.vercel.app

# 환경 설정
NODE_ENV=production

# 포트 (Heroku가 자동 할당하므로 설정 불필요)
# PORT=5000
```

## Client (Vercel) 환경 변수

Vercel 프로젝트 설정의 Environment Variables에서 다음 변수를 설정하세요:

```env
# API 서버 URL (Heroku 배포 후 업데이트 필요)
VITE_API_URL=https://your-heroku-app.herokuapp.com/api
```

## 로컬 개발 환경 변수

### server/.env
```env
PORT=5000
NODE_ENV=development
MONGODB_ATLAS_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
# 또는 로컬 MongoDB 사용 시
# MONGODB_ATLAS_URL=mongodb://localhost:27017/shoping-mall
JWT_SECRET=your-local-development-secret-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### client/.env
```env
VITE_API_URL=http://localhost:5000/api
```

## 중요 사항

1. **절대 GitHub에 .env 파일을 커밋하지 마세요**
2. **프로덕션 JWT_SECRET은 최소 32자 이상의 강력한 랜덤 문자열을 사용하세요**
3. **MongoDB Atlas의 Network Access에서 Heroku IP를 허용하거나 0.0.0.0/0으로 설정하세요**

