const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const axios = require('axios');

// PortOne 결제 검증 함수
const verifyPayment = async (imp_uid, expectedAmount) => {
  try {
    // PortOne REST API를 사용하여 결제 정보 조회
    // 실제 운영 환경에서는 PortOne REST API 키를 사용해야 합니다
    const portoneApiKey = process.env.PORTONE_REST_API_KEY;
    const portoneApiSecret = process.env.PORTONE_REST_API_SECRET;
    
    if (!portoneApiKey || !portoneApiSecret) {
      console.warn('PortOne API 키가 설정되지 않았습니다. 결제 검증을 건너뜁니다.');
      // 개발 환경에서는 검증을 건너뛸 수 있음
      return { success: true, verified: false, message: 'API 키 미설정으로 검증 건너뜀' };
    }

    // PortOne Access Token 발급
    const tokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: portoneApiKey,
      imp_secret: portoneApiSecret,
    });

    const accessToken = tokenResponse.data.response.access_token;

    // 결제 정보 조회
    const paymentResponse = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: {
        Authorization: accessToken,
      },
    });

    const paymentData = paymentResponse.data.response;

    // 결제 검증
    if (paymentData.status !== 'paid') {
      return {
        success: false,
        verified: false,
        message: '결제가 완료되지 않았습니다.',
        paymentStatus: paymentData.status,
      };
    }

    if (parseInt(paymentData.amount) !== parseInt(expectedAmount)) {
      return {
        success: false,
        verified: false,
        message: '결제 금액이 일치하지 않습니다.',
        expectedAmount,
        actualAmount: paymentData.amount,
      };
    }

    return {
      success: true,
      verified: true,
      paymentData,
    };
  } catch (error) {
    console.error('결제 검증 오류:', error);
    return {
      success: false,
      verified: false,
      message: '결제 검증 중 오류가 발생했습니다.',
      error: error.message,
    };
  }
};

// 주문 중복 체크 함수
const checkDuplicateOrder = async (merchant_uid, imp_uid) => {
  try {
    // merchant_uid로 중복 주문 체크
    if (merchant_uid) {
      const existingOrderByMerchant = await Order.findOne({
        'paymentData.merchant_uid': merchant_uid,
      });
      
      if (existingOrderByMerchant) {
        return {
          isDuplicate: true,
          message: '이미 처리된 주문입니다.',
          existingOrder: existingOrderByMerchant,
        };
      }
    }

    // imp_uid로 중복 주문 체크
    if (imp_uid) {
      const existingOrderByImp = await Order.findOne({
        'paymentData.imp_uid': imp_uid,
      });
      
      if (existingOrderByImp) {
        return {
          isDuplicate: true,
          message: '이미 처리된 결제입니다.',
          existingOrder: existingOrderByImp,
        };
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('주문 중복 체크 오류:', error);
    throw error;
  }
};

// 주문 생성 (장바구니에서 주문 생성)
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod, notes, paymentData } = req.body;

    // 필수 필드 검증
    if (!shippingAddress || !shippingAddress.recipientName || !shippingAddress.recipientPhone || !shippingAddress.address) {
      return res.status(400).json({
        success: false,
        message: '배송지 정보를 모두 입력해주세요.',
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: '결제 방법을 선택해주세요.',
      });
    }

    // 장바구니 조회
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '장바구니가 비어있습니다.',
      });
    }

    // 장바구니 아이템을 주문 아이템으로 변환
    const orderItems = cart.items.map(item => {
      if (!item.product) {
        throw new Error('상품 정보를 찾을 수 없습니다.');
      }
      const productId = item.product._id || item.product;
      const productPrice = item.product.price || 0;
      
      return {
        product: productId,
        quantity: item.quantity,
        unitPrice: productPrice, // 주문 시점의 가격 저장
      };
    });

    // 배송비 계산 (50,000원 이상 무료배송)
    const subtotal = cart.totalAmount;
    const shippingFee = subtotal >= 50000 ? 0 : 3000;
    const expectedTotalAmount = subtotal + shippingFee;

    // 결제 검증 성공 여부 추적
    let isPaymentVerified = false;

    // 결제 정보가 있는 경우 결제 검증 및 중복 체크
    if (paymentData && paymentData.imp_uid) {
      // 1. 주문 중복 체크
      const duplicateCheck = await checkDuplicateOrder(
        paymentData.merchant_uid,
        paymentData.imp_uid
      );

      if (duplicateCheck.isDuplicate) {
        return res.status(409).json({
          success: false,
          message: duplicateCheck.message,
          data: {
            existingOrder: {
              orderNumber: duplicateCheck.existingOrder.orderNumber,
              orderId: duplicateCheck.existingOrder._id,
            },
          },
        });
      }

      // 2. 결제 검증
      const paymentVerification = await verifyPayment(
        paymentData.imp_uid,
        expectedTotalAmount
      );

      if (!paymentVerification.verified) {
        // 개발 환경에서 API 키가 없으면 경고만 하고 계속 진행
        if (paymentVerification.message === 'API 키 미설정으로 검증 건너뜀') {
          console.warn('결제 검증이 건너뛰어졌습니다. 개발 환경에서는 정상 동작합니다.');
          // 개발 환경에서는 결제 검증을 건너뛰지만, 결제 정보가 있으면 성공으로 간주
          isPaymentVerified = true;
        } else {
          return res.status(400).json({
            success: false,
            message: paymentVerification.message || '결제 검증에 실패했습니다.',
            error: paymentVerification.error,
          });
        }
      } else {
        // 결제 검증 성공
        isPaymentVerified = true;
      }
    }

    // 주문 번호 생성
    const generateOrderNumber = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
    };

    const orderNumber = generateOrderNumber();

    // 주문 생성
    const orderData = {
      orderNumber,
      user: userId,
      items: orderItems,
      shippingFee,
      shippingAddress: {
        recipientName: shippingAddress.recipientName,
        recipientPhone: shippingAddress.recipientPhone,
        address: shippingAddress.address,
      },
      paymentMethod,
      notes: notes || '',
      // 결제 검증이 성공했으면 주문 상태를 'confirmed'로 설정, 아니면 기본값 'pending'
      status: isPaymentVerified ? 'confirmed' : 'pending',
    };

    // 결제 정보가 있으면 추가
    if (paymentData) {
      orderData.paymentData = {
        imp_uid: paymentData.imp_uid,
        merchant_uid: paymentData.merchant_uid,
        paid_amount: paymentData.paid_amount,
        pay_method: paymentData.pay_method,
      };
    }

    const order = new Order(orderData);

    // 주문 저장
    await order.save();

    // 주문 정보 populate
    try {
      await order.populate('items.product');
      await order.populate('user', 'name email');
    } catch (populateError) {
      console.error('주문 정보 populate 오류:', populateError);
      // populate 실패해도 계속 진행
    }

    // 주문 생성 후 장바구니 비우기
    try {
      cart.items = [];
      cart.totalAmount = 0;
      cart.totalItems = 0;
      await cart.save();
    } catch (cartError) {
      console.error('장바구니 비우기 오류:', cartError);
      // 장바구니 비우기 실패해도 주문은 성공한 것으로 처리
    }

    res.status(201).json({
      success: true,
      message: '주문이 성공적으로 생성되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 생성 오류:', error);
    console.error('에러 스택:', error.stack);
    res.status(500).json({
      success: false,
      message: '주문 생성 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 현재 사용자의 주문 목록 조회
const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query; // 선택적 필터링

    // 쿼리 구성
    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    // 주문 목록 조회 (최신순)
    const orders = await Order.find(query)
      .populate('items.product', 'name sku image price category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록을 불러오는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 주문 상세 조회 (주문 번호 또는 ID로)
const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // 주문 조회 (주문 번호 또는 ID로)
    const order = await Order.findOne({
      $or: [{ _id: id }, { orderNumber: id }],
      user: userId, // 본인 주문만 조회 가능
    })
      .populate('items.product', 'name sku image price category description')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('주문 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문을 불러오는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 주문 상태 변경 (관리자만)
const updateOrderStatus = async (req, res) => {
  try {
    // 관리자 권한 확인
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.',
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // 상태 유효성 검사
    if (!status || !['pending', 'confirmed', 'preparing', 'shipping_start', 'shipping', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '유효한 주문 상태를 입력해주세요.',
      });
    }

    // 주문 조회
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 상태 변경
    await order.updateStatus(status);

    // 최신 정보로 다시 조회
    await order.populate('items.product', 'name sku image price category');
    await order.populate('user', 'name email');

    res.json({
      success: true,
      message: '주문 상태가 변경되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 상태 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 상태 변경 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 주문 취소 (사용자 본인 또는 관리자)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.user_type === 'admin';

    // 주문 조회
    const order = await Order.findOne({
      $or: [{ _id: id }, { orderNumber: id }],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    // 권한 확인 (본인 주문이거나 관리자)
    if (!isAdmin && order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '본인의 주문만 취소할 수 있습니다.',
      });
    }

    // 주문 취소
    await order.cancel();

    // 최신 정보로 다시 조회
    await order.populate('items.product', 'name sku image price category');
    await order.populate('user', 'name email');

    res.json({
      success: true,
      message: '주문이 취소되었습니다.',
      data: order,
    });
  } catch (error) {
    console.error('주문 취소 오류:', error);
    
    // 주문 취소 불가능한 경우
    if (error.message.includes('취소할 수 없습니다')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: '주문 취소 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

// 관리자용: 모든 주문 목록 조회
const getAllOrders = async (req, res) => {
  try {
    // 관리자 권한 확인
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.',
      });
    }

    const { status, userId } = req.query; // 선택적 필터링

    // 쿼리 구성
    const query = {};
    if (status) {
      query.status = status;
    }
    if (userId) {
      query.user = userId;
    }

    // 모든 주문 목록 조회 (최신순)
    const orders = await Order.find(query)
      .populate('items.product', 'name sku image price category')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록을 불러오는 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
};

