const express = require('express');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '서버가 정상적으로 작동 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// Add your routes here
router.use('/products', require('./products'));
router.use('/users', require('./users'));
router.use('/auth', require('./auth'));
router.use('/carts', require('./carts'));
router.use('/wishlists', require('./wishlists'));
router.use('/orders', require('./orders'));

module.exports = router;

