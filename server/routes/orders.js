const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
} = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// 모든 주문 라우트는 인증 필요 (로그인한 사용자만 접근 가능)

// CREATE - 주문 생성 (장바구니에서 주문 생성)
router.post('/', authenticateToken, createOrder);

// READ - 현재 사용자의 주문 목록 조회
router.get('/', authenticateToken, getOrders);

// READ - 관리자용: 모든 주문 목록 조회
router.get('/all', authenticateToken, getAllOrders);

// READ - 주문 상세 조회 (주문 번호 또는 ID로)
router.get('/:id', authenticateToken, getOrderById);

// UPDATE - 주문 상태 변경 (관리자만)
router.put('/:id/status', authenticateToken, updateOrderStatus);

// DELETE - 주문 취소 (사용자 본인 또는 관리자)
router.delete('/:id', authenticateToken, cancelOrder);

module.exports = router;

