const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    // 이메일로 유저 찾기
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    // JWT 토큰 생성
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    // 토큰에 포함할 페이로드
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      user_type: user.user_type,
      name: user.name,
    };

    // JWT 토큰 발급
    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: jwtExpiresIn,
      issuer: 'shoping-mall-api',
      audience: 'shoping-mall-client',
    });

    // 비밀번호는 응답에서 제외
    const userResponse = user.toObject();
    delete userResponse.password;

    // 성공 응답 (토큰 포함)
    res.json({
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        user: userResponse,
        token: token,
        tokenType: 'Bearer',
        expiresIn: jwtExpiresIn,
      },
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// 토큰으로 현재 유저 정보 가져오기
const getCurrentUser = async (req, res) => {
  try {
    // 미들웨어에서 설정된 req.user 사용
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    // 비밀번호는 이미 미들웨어에서 제외되었지만, 안전을 위해 다시 확인
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    console.error('유저 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '유저 정보 조회 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// 비밀번호 찾기 (이메일로 재설정 토큰 생성)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 필수 필드 검증
    if (!email) {
      return res.status(400).json({
        success: false,
        message: '이메일을 입력해주세요.',
      });
    }

    // 이메일로 유저 찾기
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // 보안을 위해 존재하지 않는 이메일이어도 성공 메시지 반환
    if (!user) {
      return res.json({
        success: true,
        message: '이메일로 비밀번호 재설정 링크를 보냈습니다.',
        data: {
          resetToken: null, // 실제로는 이메일로 전송하지만, 데모용으로 토큰 반환
        },
      });
    }

    // 비밀번호 재설정 토큰 생성 (JWT 사용)
    const jwtSecret = process.env.JWT_SECRET;
    const resetTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      type: 'password-reset',
    };

    // 1시간 유효한 토큰 생성
    const resetToken = jwt.sign(resetTokenPayload, jwtSecret, {
      expiresIn: '1h',
      issuer: 'shoping-mall-api',
      audience: 'shoping-mall-client',
    });

    // 실제 프로덕션에서는 이메일로 토큰을 전송해야 합니다
    // 여기서는 데모용으로 토큰을 직접 반환합니다

    res.json({
      success: true,
      message: '이메일로 비밀번호 재설정 링크를 보냈습니다.',
      data: {
        resetToken: resetToken,
      },
    });
  } catch (error) {
    console.error('비밀번호 찾기 오류:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 찾기 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

// 비밀번호 재설정
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // 필수 필드 검증
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: '토큰과 비밀번호를 입력해주세요.',
      });
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 8자 이상이어야 합니다.',
      });
    }

    // 토큰 검증
    const jwtSecret = process.env.JWT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret, {
        issuer: 'shoping-mall-api',
        audience: 'shoping-mall-client',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: '비밀번호 재설정 토큰이 만료되었습니다. 다시 요청해주세요.',
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 토큰입니다.',
        });
      }
      throw error;
    }

    // 토큰 타입 확인
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }

    // 유저 찾기
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '유저를 찾을 수 없습니다.',
      });
    }

    // 비밀번호 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 비밀번호 업데이트
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 재설정되었습니다.',
    });
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 재설정 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

module.exports = {
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};

