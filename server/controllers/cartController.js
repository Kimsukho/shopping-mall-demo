const Cart = require('../models/Cart');
const Product = require('../models/Product');

// 현재 사용자의 장바구니 조회
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    // 장바구니가 없으면 생성
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니를 불러오는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 장바구니에 아이템 추가
const addItemToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    // 상품 존재 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    // 수량 유효성 검사
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '수량은 1 이상이어야 합니다.',
      });
    }

    // 장바구니 찾기 또는 생성
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // 아이템 추가
    await cart.addItem(productId, quantity);

    // 최신 정보로 다시 조회
    await cart.populate('items.product');

    res.json({
      success: true,
      message: '장바구니에 상품이 추가되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 아이템 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니에 상품을 추가하는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 장바구니 아이템 수량 수정
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    // 수량 유효성 검사
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '수량은 1 이상이어야 합니다.',
      });
    }

    // 장바구니 찾기
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    // 아이템이 장바구니에 있는지 확인
    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니에 해당 상품이 없습니다.',
      });
    }

    // 수량 업데이트
    await cart.updateItemQuantity(productId, quantity);

    // 최신 정보로 다시 조회
    await cart.populate('items.product');

    res.json({
      success: true,
      message: '장바구니 아이템 수량이 수정되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 아이템 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템을 수정하는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 장바구니에서 아이템 제거
const removeItemFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    // 장바구니 찾기
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    // 아이템이 장바구니에 있는지 확인
    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니에 해당 상품이 없습니다.',
      });
    }

    // 아이템 제거
    await cart.removeItem(productId);

    // 최신 정보로 다시 조회
    await cart.populate('items.product');

    res.json({
      success: true,
      message: '장바구니에서 상품이 제거되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 아이템 제거 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니에서 상품을 제거하는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 장바구니 비우기
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // 장바구니 찾기
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    // 장바구니 비우기
    await cart.clear();

    res.json({
      success: true,
      message: '장바구니가 비워졌습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 비우기 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니를 비우는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart,
};

