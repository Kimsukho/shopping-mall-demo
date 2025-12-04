const { Product } = require('../models');
const mongoose = require('mongoose');

// CREATE - 새 상품 생성
const createProduct = async (req, res) => {
  try {
    // 관리자 권한 확인
    if (req.user && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '상품 생성 권한이 없습니다. 관리자만 상품을 생성할 수 있습니다.',
      });
    }

    const { sku, name, price, category, image, description } = req.body;

    // 필수 필드 검증
    if (!sku || !name || price === undefined || !category || !image) {
      return res.status(400).json({
        success: false,
        message: 'SKU, 상품명, 가격, 카테고리, 이미지는 필수입니다.',
      });
    }

    const newProduct = new Product({
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      price: Number(price),
      category,
      image: image.trim(),
      description: description || '',
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 생성되었습니다.',
      data: savedProduct,
    });
  } catch (error) {
    if (error.code === 11000) {
      // 중복 SKU 오류
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 SKU입니다.',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '유효성 검증 오류',
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: '상품 생성 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// READ - 모든 상품 조회
const getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;
    
    // 카테고리 필터링 (선택사항)
    const query = category ? { category } : {};
    
    const products = await Product.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 목록 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// READ - 특정 상품 조회 (ID로)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// READ - SKU로 상품 조회
const getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    const product = await Product.findOne({ sku: sku.toUpperCase().trim() });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// UPDATE - 상품 정보 수정
const updateProduct = async (req, res) => {
  try {
    // 관리자 권한 확인
    if (req.user && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '상품 수정 권한이 없습니다. 관리자만 상품을 수정할 수 있습니다.',
      });
    }

    const { id } = req.params;
    const { sku, name, price, category, image, description } = req.body;

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    // 업데이트할 필드 설정
    if (sku) product.sku = sku.toUpperCase().trim();
    if (name) product.name = name.trim();
    if (price !== undefined) product.price = Number(price);
    if (category) product.category = category;
    if (image) product.image = image.trim();
    if (description !== undefined) product.description = description;

    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: '상품 정보가 성공적으로 수정되었습니다.',
      data: updatedProduct,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 SKU입니다.',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '유효성 검증 오류',
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: '상품 정보 수정 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// DELETE - 상품 삭제
const deleteProduct = async (req, res) => {
  try {
    // 관리자 권한 확인
    if (req.user && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '상품 삭제 권한이 없습니다. 관리자만 상품을 삭제할 수 있습니다.',
      });
    }

    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID입니다.',
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.',
      data: {
        id: product._id,
        sku: product.sku,
        name: product.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 삭제 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
};

