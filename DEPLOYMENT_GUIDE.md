# 배포 가이드

이 프로젝트는 **Client (Vercel)**와 **Server (Heroku)**로 분리되어 배포됩니다.

## 📋 배포 순서

### 1단계: Server (Heroku) 배포 (먼저 배포)
서버를 먼저 배포하여 API URL을 확보한 후, 클라이언트에서 사용합니다.

### 2단계: Client (Vercel) 배포
서버 URL을 받은 후 클라이언트를 배포합니다.

---

## 🚀 1단계: Heroku에 Server 배포

### 사전 준비사항

1. **Heroku 계정 생성**
   - https://www.heroku.com 접속
   - 무료 계정으로 가입

2. **GitHub에 코드 푸시**
   - 프로젝트를 GitHub 저장소에 푸시
   - Heroku는 GitHub와 연동하여 배포 가능

### Heroku 배포 단계

#### 1. Heroku 앱 생성
1. Heroku 대시보드 (https://dashboard.heroku.com) 접속
2. "New" → "Create new app" 클릭
3. App name 입력 (예: `shoping-mall-api`)
4. Region 선택 (United States 또는 Europe)
5. "Create app" 클릭

#### 2. GitHub 연동
1. 생성된 앱의 "Deploy" 탭으로 이동
2. "Deployment method"에서 "GitHub" 선택
3. "Connect to GitHub" 클릭
4. GitHub 인증 후 저장소 선택
5. 저장소 연결 확인

#### 3. 환경 변수 설정 (Config Vars)
1. 앱의 "Settings" 탭으로 이동
2. "Config Vars" 섹션에서 "Reveal Config Vars" 클릭
3. 다음 환경 변수들을 추가:

```
MONGODB_ATLAS_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
PORT=5000
```

**중요:**
- `MONGODB_ATLAS_URL`: MongoDB Atlas 연결 문자열 (필수)
- `JWT_SECRET`: 강력한 랜덤 문자열로 변경 (필수)
- `CLIENT_URL`: Vercel 배포 후 받은 URL로 업데이트 필요

#### 4. 배포 설정
1. "Deploy" 탭으로 돌아가기
2. "Manual deploy" 섹션에서:
   - Branch 선택: `main` 또는 `master`
   - "Deploy Branch" 클릭
3. 배포 완료 대기 (약 2-3분)

#### 5. 서버 URL 확인
- 배포 완료 후 "Settings" 탭의 "Domains" 섹션에서 URL 확인
- 예: `https://shoping-mall-api.herokuapp.com`
- 이 URL이 API 서버 주소입니다.

---

## 🎨 2단계: Vercel에 Client 배포

### 사전 준비사항

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인 (권장)

2. **환경 변수 준비**
   - Heroku에서 받은 서버 URL 필요

### Vercel 배포 단계

#### 1. 프로젝트 Import
1. Vercel 대시보드 접속
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택
4. "Import" 클릭

#### 2. 프로젝트 설정
1. **Framework Preset**: Vite 선택
2. **Root Directory**: `client` 폴더 선택
   - "Override" 체크박스 활성화
   - Root Directory에 `client` 입력
3. **Build Command**: `npm run build` (자동 입력됨)
4. **Output Directory**: `dist` (자동 입력됨)

#### 3. 환경 변수 설정
"Environment Variables" 섹션에서 다음 변수 추가:

```
VITE_API_URL=https://your-heroku-app.herokuapp.com/api
```

**중요:**
- `VITE_API_URL`: Heroku에서 받은 서버 URL + `/api`
- 예: `https://shoping-mall-api.herokuapp.com/api`

#### 4. 배포 실행
1. "Deploy" 버튼 클릭
2. 배포 완료 대기 (약 1-2분)

#### 5. 배포 URL 확인
- 배포 완료 후 Vercel에서 제공하는 URL 확인
- 예: `https://shoping-mall-client.vercel.app`
- 이 URL을 Heroku의 `CLIENT_URL`에 업데이트 필요

---

## 🔄 3단계: 환경 변수 업데이트

### Heroku에서 CLIENT_URL 업데이트
1. Heroku 앱의 "Settings" → "Config Vars"로 이동
2. `CLIENT_URL` 값을 Vercel URL로 업데이트
3. 서버 재시작 (Settings → "Restart all dynos")

---

## ✅ 배포 확인

### Server 확인
- 브라우저에서 `https://your-heroku-app.herokuapp.com` 접속
- `{"message":"Shopping Mall API 서버가 실행 중입니다."}` 메시지 확인

### Client 확인
- 브라우저에서 Vercel URL 접속
- 홈페이지가 정상적으로 로드되는지 확인
- 로그인/회원가입 기능 테스트

---

## 🔧 문제 해결

### Heroku 배포 오류
1. **Build 실패**: `package.json`의 `start` 스크립트 확인
2. **MongoDB 연결 실패**: `MONGODB_ATLAS_URL` 확인
3. **포트 오류**: Heroku는 자동으로 PORT를 할당하므로 `process.env.PORT` 사용 확인

### Vercel 배포 오류
1. **Build 실패**: Root Directory가 `client`로 설정되었는지 확인
2. **API 연결 실패**: `VITE_API_URL` 환경 변수 확인
3. **CORS 오류**: Heroku의 `CLIENT_URL`이 Vercel URL과 일치하는지 확인

---

## 📝 체크리스트

### 배포 전
- [ ] MongoDB Atlas 계정 생성 및 데이터베이스 설정
- [ ] MongoDB Atlas 연결 문자열 준비
- [ ] JWT_SECRET 강력한 랜덤 문자열 생성
- [ ] GitHub에 코드 푸시 완료
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인

### Heroku 배포
- [ ] Heroku 앱 생성
- [ ] GitHub 연동
- [ ] 환경 변수 설정 (MONGODB_ATLAS_URL, JWT_SECRET 등)
- [ ] 배포 완료
- [ ] 서버 URL 확인

### Vercel 배포
- [ ] Vercel 프로젝트 Import
- [ ] Root Directory: `client` 설정
- [ ] 환경 변수 설정 (VITE_API_URL)
- [ ] 배포 완료
- [ ] 클라이언트 URL 확인

### 배포 후
- [ ] Heroku의 CLIENT_URL 업데이트
- [ ] 서버 재시작
- [ ] 전체 기능 테스트

---

## 🔐 보안 주의사항

1. **환경 변수는 절대 GitHub에 커밋하지 마세요**
2. **JWT_SECRET은 강력한 랜덤 문자열을 사용하세요**
3. **MongoDB Atlas의 IP Whitelist 설정 확인**
4. **프로덕션 환경에서는 HTTPS만 사용하세요**

---

## 📚 참고 자료

- [Heroku 공식 문서](https://devcenter.heroku.com/)
- [Vercel 공식 문서](https://vercel.com/docs)
- [MongoDB Atlas 문서](https://www.mongodb.com/docs/atlas/)

