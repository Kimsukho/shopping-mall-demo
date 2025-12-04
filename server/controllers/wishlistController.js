const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// 현재 사용자의 찜하기 목록 조회
const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    let wishlist = await Wishlist.findOne({ user: userId }).populate('products');

    // 찜하기 목록이 없으면 생성
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
      await wishlist.save();
    }

    res.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    console.error('찜하기 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '찜하기 목록을 불러오는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 찜하기에 상품 추가
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    // 상품 존재 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    // 찜하기 목록 찾기 또는 생성
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    // 이미 찜하기에 있는지 확인
    if (wishlist.hasProduct(productId)) {
      return res.status(400).json({
        success: false,
        message: '이미 찜하기에 추가된 상품입니다.',
      });
    }

    // 상품 추가
    await wishlist.addProduct(productId);

    // 최신 정보로 다시 조회
    await wishlist.populate('products');

    res.json({
      success: true,
      message: '찜하기에 상품이 추가되었습니다.',
      data: wishlist,
    });
  } catch (error) {
    console.error('찜하기 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '찜하기에 상품을 추가하는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 찜하기에서 상품 제거
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    // 찜하기 목록 찾기
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: '찜하기 목록을 찾을 수 없습니다.',
      });
    }

    // 상품이 찜하기에 있는지 확인
    if (!wishlist.hasProduct(productId)) {
      return res.status(404).json({
        success: false,
        message: '찜하기에 해당 상품이 없습니다.',
      });
    }

    // 상품 제거
    await wishlist.removeProduct(productId);

    // 최신 정보로 다시 조회
    await wishlist.populate('products');

    res.json({
      success: true,
      message: '찜하기에서 상품이 제거되었습니다.',
      data: wishlist,
    });
  } catch (error) {
    console.error('찜하기 제거 오류:', error);
    res.status(500).json({
      success: false,
      message: '찜하기에서 상품을 제거하는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 찜하기 비우기
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    // 찜하기 목록 찾기
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: '찜하기 목록을 찾을 수 없습니다.',
      });
    }

    // 찜하기 비우기
    await wishlist.clear();

    res.json({
      success: true,
      message: '찜하기가 비워졌습니다.',
      data: wishlist,
    });
  } catch (error) {
    console.error('찜하기 비우기 오류:', error);
    res.status(500).json({
      success: false,
      message: '찜하기를 비우는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 찜하기에 상품이 있는지 확인
const checkWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.json({
        success: true,
        data: { isInWishlist: false },
      });
    }

    const isInWishlist = wishlist.hasProduct(productId);

    res.json({
      success: true,
      data: { isInWishlist },
    });
  } catch (error) {
    console.error('찜하기 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '찜하기 확인 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlist,
};

