import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import api from '../services/api'
import Navbar from '../components/Navbar'
import '../styles/pages/Login.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [rememberEmail, setRememberEmail] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // 컴포넌트 마운트 시 토큰 확인 및 유저 정보 검증, 저장된 이메일 불러오기
  useEffect(() => {
    const checkAuth = async () => {
      // 토큰 확인
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (!token) {
        setCheckingAuth(false)
        // 로그아웃으로부터 온 경우 이메일 자동 입력
        if (location.state?.email) {
          setFormData(prev => ({
            ...prev,
            email: location.state.email,
          }))
          setRememberEmail(true)
        } else {
          // 저장된 이메일 불러오기
          const savedEmail = localStorage.getItem('rememberedEmail')
          if (savedEmail) {
            setFormData(prev => ({
              ...prev,
              email: savedEmail,
            }))
            setRememberEmail(true)
          }
        }
        return
      }

      try {
        // 토큰으로 유저 정보 가져오기
        const response = await api.get('/auth/me')
        
        if (response.data.success) {
          // 유효한 토큰이 있고 유저 정보를 가져올 수 있으면 메인 페이지로 이동
          navigate('/')
        }
      } catch (error) {
        // 토큰이 유효하지 않으면 토큰 제거하고 로그인 페이지 유지
        console.error('토큰 검증 오류:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        
        // 저장된 이메일 불러오기
        const savedEmail = localStorage.getItem('rememberedEmail')
        if (savedEmail) {
          setFormData(prev => ({
            ...prev,
            email: savedEmail,
          }))
          setRememberEmail(true)
        }
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [navigate, location.state])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 클라이언트 측 유효성 검증
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // 서버에 보낼 데이터 준비 (이메일 정리)
      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      console.log('로그인 요청:', { ...loginData, password: '***' }) // 디버깅용

      // 서버에 로그인 요청
      const response = await api.post('/auth/login', loginData)

      console.log('로그인 응답:', response.data) // 디버깅용

      // 서버에서 성공 응답을 받은 경우
      if (response.data.success) {
        // 토큰 및 사용자 정보 저장
        const { token, user } = response.data.data

        if (keepLoggedIn) {
          // 로그인 상태 유지 선택 시 localStorage에 저장 (영구 저장)
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
        } else {
          // 로그인 상태 유지 미선택 시 sessionStorage에 저장 (세션 종료 시 삭제)
          sessionStorage.setItem('token', token)
          sessionStorage.setItem('user', JSON.stringify(user))
        }

        // 아이디 기억하기 처리
        if (rememberEmail) {
          // 아이디 기억하기 선택 시 localStorage에 이메일 저장
          localStorage.setItem('rememberedEmail', formData.email.trim().toLowerCase())
        } else {
          // 아이디 기억하기 미선택 시 저장된 이메일 제거
          localStorage.removeItem('rememberedEmail')
        }

        // 성공 메시지 표시 (선택사항)
        alert('로그인에 성공했습니다!')

        // 메인 페이지로 이동
        navigate('/')
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      console.error('서버 응답 데이터:', error.response?.data)

      // 서버에서 에러 응답을 받은 경우
      if (error.response?.data) {
        const errorData = error.response.data
        setErrors({ submit: errorData.message || '로그인 중 오류가 발생했습니다.' })
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        setErrors({ submit: '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.' })
      } else {
        // 요청 설정 중 오류가 발생한 경우
        setErrors({ submit: '요청을 보내는 중 오류가 발생했습니다.' })
      }
    } finally {
      setLoading(false)
    }
  }

  // 인증 확인 중이면 로딩 표시
  if (checkingAuth) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="loading-message">확인 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <Navbar />
      <div className="login-container">
        {/* 로그인 폼 카드 */}
        <div className="login-card">
          <h2 className="login-title">로그인</h2>
          <p className="login-subtitle">계정에 로그인하여 쇼핑을 시작하세요</p>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* 이메일 */}
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'input-error' : ''}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  className={`password-toggle ${showPassword ? 'active' : ''}`}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
              </div>
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            {/* 옵션 행 */}
            <div className="form-options">
              <div className="checkbox-group">
                <label className="checkbox-label" htmlFor="rememberEmail">
                  <input
                    type="checkbox"
                    id="rememberEmail"
                    name="rememberEmail"
                    checked={rememberEmail}
                    onChange={(e) => {
                      e.stopPropagation()
                      setRememberEmail(e.target.checked)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span>아이디 기억하기</span>
                </label>
                <label className="checkbox-label" htmlFor="keepLoggedIn">
                  <input
                    type="checkbox"
                    id="keepLoggedIn"
                    name="keepLoggedIn"
                    checked={keepLoggedIn}
                    onChange={(e) => {
                      e.stopPropagation()
                      setKeepLoggedIn(e.target.checked)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span>로그인 상태 유지</span>
                </label>
              </div>
              <Link to="/forgot-password" className="forgot-password-link">
                비밀번호 찾기
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 구분선 */}
          <div className="divider">
            <span>또는</span>
          </div>

          {/* 소셜 로그인 버튼들 */}
          <div className="social-login">
            <button type="button" className="social-button google">
              <span className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </span>
              <span>Google로 로그인</span>
            </button>
            <button type="button" className="social-button facebook">
              <span className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                </svg>
              </span>
              <span>Facebook으로 로그인</span>
            </button>
            <button type="button" className="social-button apple">
              <span className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000000"/>
                </svg>
              </span>
              <span>Apple로 로그인</span>
            </button>
          </div>

          {/* 회원가입 링크 */}
          <div className="signup-link">
            <span>아직 계정이 없으신가요?</span>
            <Link to="/signup">회원가입</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

