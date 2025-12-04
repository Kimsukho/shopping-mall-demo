const express = require('express');
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart,
} = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

// 모든 장바구니 라우트는 인증 필요 (로그인한 사용자만 접근 가능)
// READ - 현재 사용자의 장바구니 조회
router.get('/', authenticateToken, getCart);

// CREATE - 장바구니에 아이템 추가
router.post('/items', authenticateToken, addItemToCart);

// UPDATE - 장바구니 아이템 수량 수정
router.put('/items/:productId', authenticateToken, updateCartItem);

// DELETE - 장바구니에서 아이템 제거
router.delete('/items/:productId', authenticateToken, removeItemFromCart);

// DELETE - 장바구니 비우기
router.delete('/clear', authenticateToken, clearCart);

module.exports = router;

