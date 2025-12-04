const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');

// CREATE - 새 상품 생성 (인증 필요)
router.post('/', authenticateToken, createProduct);

// READ - 모든 상품 조회 (쿼리 파라미터: ?category=상의)
router.get('/', getAllProducts);

// READ - SKU로 상품 조회
router.get('/sku/:sku', getProductBySku);

// READ - 특정 상품 조회 (ID로)
router.get('/:id', getProductById);

// UPDATE - 상품 정보 수정 (인증 필요)
router.put('/:id', authenticateToken, updateProduct);

// DELETE - 상품 삭제 (인증 필요)
router.delete('/:id', authenticateToken, deleteProduct);

module.exports = router;

