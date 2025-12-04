import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 자동으로 Authorization 헤더에 추가
    // localStorage와 sessionStorage 모두 확인
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 에러 처리 로직
    if (error.response?.status === 401) {
      // 인증 오류 처리 (토큰 만료 또는 유효하지 않은 토큰)
      console.error('인증 오류가 발생했습니다.');
      
      // 토큰 제거 (localStorage와 sessionStorage 모두)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // 로그인 페이지로 리다이렉트 (필요한 경우)
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

