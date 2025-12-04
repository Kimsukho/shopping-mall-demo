const mongoose = require('mongoose');

// 주문 아이템 스키마 (Cart의 cartItemSchema와 유사하지만 주문 시점 가격 저장)
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

// 배송지 정보 스키마 (User의 address와 유사한 단순 구조)
const shippingAddressSchema = new mongoose.Schema({
  recipientName: {
    type: String,
    required: true,
    trim: true,
  },
  recipientPhone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });

// 주문 스키마
const orderSchema = new mongoose.Schema({
  // 주문 기본 정보
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // 주문 상품 정보
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: '주문 상품은 최소 1개 이상이어야 합니다.',
    },
  },
  
  // 금액 정보 (Cart와 유사한 구조)
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  shippingFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  
  // 배송 정보
  shippingAddress: {
    type: shippingAddressSchema,
    required: true,
  },
  
  // 주문 상태
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'preparing', 'shipping_start', 'shipping', 'delivered', 'cancelled'],
      message: '주문 상태가 올바르지 않습니다.',
    },
    default: 'pending',
  },
  
  // 결제 정보
  paymentMethod: {
    type: String,
    enum: {
      values: ['card', 'bank_transfer'],
      message: '결제 방법이 올바르지 않습니다.',
    },
    required: true,
  },
  
  // 메모/요청사항
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  
  // 결제 정보 (PortOne 결제 데이터)
  paymentData: {
    imp_uid: {
      type: String,
      trim: true,
    },
    merchant_uid: {
      type: String,
      trim: true,
    },
    paid_amount: {
      type: Number,
      min: 0,
    },
    pay_method: {
      type: String,
      trim: true,
    },
  },
}, {
  timestamps: true, // createdAt과 updatedAt 자동 생성
});

// 인덱스 추가 (Cart와 유사한 구조)
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'paymentData.imp_uid': 1 });
orderSchema.index({ 'paymentData.merchant_uid': 1 });

// 주문 번호 자동 생성 (주문 생성 전)
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    // 주문 번호 형식: ORD-YYYYMMDD-HHMMSS-XXXX (예: ORD-20240101-143025-0001)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // 같은 초에 여러 주문이 생성될 경우를 대비한 랜덤 숫자
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    this.orderNumber = `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }
  next();
});

// totalAmount 자동 계산 (주문 생성/수정 시) - Cart와 유사한 로직
orderSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    try {
      // items가 이미 populate되어 있지 않은 경우에만 populate
      if (this.items.length > 0 && !this.items[0].product || typeof this.items[0].product === 'string') {
        await this.populate('items.product');
      }
      
      // items의 총액 계산 (Cart의 totalAmount 계산과 유사)
      const itemsTotal = this.items.reduce((total, item) => {
        // unitPrice가 있으면 사용, 없으면 product.price 사용
        const price = item.unitPrice || (item.product && item.product.price ? item.product.price : 0);
        return total + (price * item.quantity);
      }, 0);
      
      // totalAmount 계산 (상품 총액 + 배송비)
      this.totalAmount = itemsTotal + (this.shippingFee || 0);
    } catch (error) {
      console.error('totalAmount 계산 오류:', error);
      // 에러가 발생해도 계속 진행 (unitPrice가 이미 설정되어 있으면 문제없음)
    }
  }
  next();
});

// 주문 상태 변경 메서드
orderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// 주문 취소 메서드
orderSchema.methods.cancel = function() {
  // 배송이 시작되거나 확인된 주문은 취소할 수 없음
  if (['confirmed', 'preparing', 'shipping_start', 'shipping', 'delivered'].includes(this.status)) {
    throw new Error('배송이 시작되거나 확인된 주문은 취소할 수 없습니다.');
  }
  
  this.status = 'cancelled';
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

