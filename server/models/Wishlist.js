const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  products: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    default: [],
  },
}, {
  timestamps: true,
});

// 인덱스 추가
wishlistSchema.index({ user: 1 });

// 찜하기 아이템 추가 메서드
wishlistSchema.methods.addProduct = function(productId) {
  // 이미 있는 상품인지 확인
  if (!this.products.includes(productId)) {
    this.products.push(productId);
  }
  return this.save();
};

// 찜하기 아이템 제거 메서드
wishlistSchema.methods.removeProduct = function(productId) {
  this.products = this.products.filter(
    (id) => id.toString() !== productId.toString()
  );
  return this.save();
};

// 찜하기에 상품이 있는지 확인 메서드
wishlistSchema.methods.hasProduct = function(productId) {
  return this.products.some(
    (id) => id.toString() === productId.toString()
  );
};

// 찜하기 비우기 메서드
wishlistSchema.methods.clear = function() {
  this.products = [];
  return this.save();
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;

