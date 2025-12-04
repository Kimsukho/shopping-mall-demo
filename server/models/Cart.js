const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: {
    type: [cartItemSchema],
    default: [],
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// 인덱스 추가
cartSchema.index({ user: 1 });

// 아이템 변경 시 totalAmount와 totalItems 자동 계산
cartSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    await this.populate('items.product');
    
    // totalItems 계산 (총 아이템 개수)
    this.totalItems = this.items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
    
    // totalAmount 계산 (총 금액)
    this.totalAmount = this.items.reduce((total, item) => {
      if (item.product && item.product.price) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);
  }
  next();
});

// 장바구니 총액 계산 메서드
cartSchema.methods.calculateTotal = async function() {
  await this.populate('items.product');
  return this.items.reduce((total, item) => {
    if (item.product && item.product.price) {
      return total + (item.product.price * item.quantity);
    }
    return total;
  }, 0);
};

// 장바구니 아이템 추가 메서드
cartSchema.methods.addItem = function(productId, quantity = 1) {
  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
    });
  }

  return this.save();
};

// 장바구니 아이템 제거 메서드
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// 장바구니 아이템 수량 업데이트 메서드
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }
    item.quantity = quantity;
  }

  return this.save();
};

// 장바구니 비우기 메서드
cartSchema.methods.clear = function() {
  this.items = [];
  return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;

