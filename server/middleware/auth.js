const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT 시크릿 키 가져오기
const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'your-secret-key-change-in-production';
};

// Authorization 헤더에서 토큰 추출
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return null;
  }
  // "Bearer TOKEN" 형식에서 토큰 추출
  return authHeader.split(' ')[1];
};

// JWT 토큰 검증
const verifyToken = (token) => {
  try {
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: 'shoping-mall-api',
      audience: 'shoping-mall-client',
    });
    return { success: true, decoded };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return { 
        success: false, 
        error: 'INVALID_TOKEN',
        message: '유효하지 않은 토큰입니다.' 
      };
    }
    if (error.name === 'TokenExpiredError') {
      return { 
        success: false, 
        error: 'EXPIRED_TOKEN',
        message: '토큰이 만료되었습니다.' 
      };
    }
    return { 
      success: false, 
      error: 'TOKEN_VERIFICATION_ERROR',
      message: '토큰 검증 중 오류가 발생했습니다.',
      errorDetails: error.message 
    };
  }
};

// 사용자 정보 조회
const getUserFromToken = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password');
    return { success: true, user };
  } catch (error) {
    return { 
      success: false, 
      error: 'USER_NOT_FOUND',
      message: '사용자를 찾을 수 없습니다.',
      errorDetails: error.message 
    };
  }
};

// 에러 응답 생성
const sendAuthError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// JWT 토큰 검증 미들웨어
// 로그인 여부를 먼저 검사하는 미들웨어
// 1. 사용자가 액션 요청을 보냄
// 2. 미들웨어가 먼저 로그인 여부 검사
//    - 로그인 안 되어 있으면 → ❌ "로그인이 필요합니다" 응답 (401)
//    - 로그인 되어 있으면 → ✅ 다음 단계로 통과 (req.user에 사용자 정보 저장)
const authenticateToken = async (req, res, next) => {
  try {
    // 1. 토큰 추출
    const token = extractTokenFromHeader(req);
    if (!token) {
      return sendAuthError(res, 401, '로그인이 필요합니다.');
    }

    // 2. 토큰 검증
    const verifyResult = verifyToken(token);
    if (!verifyResult.success) {
      // 토큰이 없거나 유효하지 않으면 로그인 필요 메시지 반환
      return sendAuthError(res, 401, '로그인이 필요합니다.');
    }

    const { decoded } = verifyResult;

    // 3. 사용자 정보 조회
    const userResult = await getUserFromToken(decoded.userId);
    if (!userResult.success) {
      return sendAuthError(res, 401, '로그인이 필요합니다.');
    }

    const { user } = userResult;

    // 4. req에 사용자 정보 저장 (다음 미들웨어/컨트롤러에서 사용 가능)
    req.user = user;
    req.userId = decoded.userId;

    // 5. 로그인 되어 있으면 다음 단계로 통과
    next();
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return res.status(500).json({
      success: false,
      message: '토큰 검증 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};

module.exports = {
  authenticateToken,
  // 내부 함수들도 export (테스트용)
  extractTokenFromHeader,
  verifyToken,
  getUserFromToken,
  getJwtSecret,
};

