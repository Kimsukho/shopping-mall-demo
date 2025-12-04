const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlist,
} = require('../controllers/wishlistController');
const { authenticateToken } = require('../middleware/auth');

// 모든 찜하기 라우트는 인증 필요 (로그인한 사용자만 접근 가능)
// authenticateToken 미들웨어가 먼저 실행되어:
// 1. 사용자가 액션 요청을 보냄
// 2. 미들웨어가 먼저 로그인 여부 검사
//    - 로그인 안 되어 있으면 → ❌ "로그인이 필요합니다" 응답 (401)
//    - 로그인 되어 있으면 → ✅ 다음 단계로 통과 (req.user에 사용자 정보 저장)

// READ - 현재 사용자의 찜하기 목록 조회
router.get('/', authenticateToken, getWishlist);

// CREATE - 찜하기에 상품 추가
router.post('/items', authenticateToken, addToWishlist);

// DELETE - 찜하기에서 상품 제거
router.delete('/items/:productId', authenticateToken, removeFromWishlist);

// DELETE - 찜하기 비우기
router.delete('/clear', authenticateToken, clearWishlist);

// READ - 찜하기에 상품이 있는지 확인
router.get('/check/:productId', authenticateToken, checkWishlist);

module.exports = router;

