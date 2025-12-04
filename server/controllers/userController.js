const { User } = require('../models');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// CREATE - 새 유저 생성 (회원가입)
const createUser = async (req, res) => {
  try {
    const { email, name, password, user_type, address } = req.body;

    // 필수 필드 검증
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일, 이름, 비밀번호는 필수입니다.',
      });
    }

    // 비밀번호 해싱 (bcrypt 사용)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      user_type: user_type || 'customer',
      address: address !== undefined ? address : '',
    });

    const savedUser = await newUser.save();

    // 비밀번호는 응답에서 제외
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: '유저가 성공적으로 생성되었습니다.',
      data: userResponse,
    });
  } catch (error) {
    if (error.code === 11000) {
      // 중복 이메일 오류
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 이메일입니다.',
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
      message: '유저 생성 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// READ - 모든 유저 조회
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // 비밀번호 제외

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '유저 목록 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// READ - 특정 유저 조회
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 유저 ID입니다.',
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '유저 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// UPDATE - 유저 정보 수정
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, password, user_type, address } = req.body;

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 유저 ID입니다.',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    // 업데이트할 필드 설정
    if (email) user.email = email;
    if (name) user.name = name;
    if (password) {
      // 비밀번호 해싱 (bcrypt 사용)
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
    }
    if (user_type) user.user_type = user_type;
    if (address !== undefined) user.address = address;

    const updatedUser = await user.save();

    // 비밀번호는 응답에서 제외
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: '유저 정보가 성공적으로 수정되었습니다.',
      data: userResponse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 이메일입니다.',
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
      message: '유저 정보 수정 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// DELETE - 유저 삭제
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // MongoDB ObjectId 형식 검증
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 유저 ID입니다.',
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '유저가 성공적으로 삭제되었습니다.',
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '유저 삭제 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};

