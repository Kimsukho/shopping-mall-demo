const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수입니다.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, '올바른 이메일 형식이 아닙니다.'],
    },
    name: {
      type: String,
      required: [true, '이름은 필수입니다.'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다.'],
      minlength: [8, '비밀번호는 최소 8자 이상이어야 합니다.'],
      // 비밀번호는 저장 전에 해싱해야 합니다 (bcrypt 등 사용)
    },
    user_type: {
      type: String,
      required: [true, '사용자 타입은 필수입니다.'],
      enum: {
        values: ['customer', 'admin'],
        message: '사용자 타입은 customer 또는 admin이어야 합니다.',
      },
      default: 'customer',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true, // createdAt과 updatedAt 자동 생성
  }
);

// 인덱스 추가 (이메일 검색 성능 향상)
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;

