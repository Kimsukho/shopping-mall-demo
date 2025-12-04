const express = require('express');
const router = express.Router();
const { login, getCurrentUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 로그인 (인증 불필요)
router.post('/login', login);

// 비밀번호 찾기 (인증 불필요)
router.post('/forgot-password', forgotPassword);

// 비밀번호 재설정 (인증 불필요, 토큰 필요)
router.post('/reset-password', resetPassword);

// 현재 유저 정보 가져오기 (인증 필요)
// authenticateToken 미들웨어가 먼저 실행되어:
// 1. JWT 토큰 검증
// 2. 로그인 여부 확인
// 3. req.user에 사용자 정보 저장
// 4. 로그인 안 되어 있으면 "로그인이 필요합니다" 응답
// 5. 로그인 되어 있으면 getCurrentUser 컨트롤러 실행
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;

