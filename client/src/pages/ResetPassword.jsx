import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import Navbar from '../components/Navbar'
import api from '../services/api'
import '../styles/pages/ResetPassword.css'

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  useEffect(() => {
    // 토큰이 없으면 비밀번호 찾기 페이지로 리다이렉트
    if (!token) {
      setTokenValid(false)
    }
  }, [token])

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

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password: formData.password,
      })

      if (response.data.success) {
        setSuccess(true)
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error)
      
      if (error.response?.data) {
        const errorData = error.response.data
        setErrors({ submit: errorData.message || '비밀번호 재설정 중 오류가 발생했습니다.' })
        
        // 토큰이 유효하지 않은 경우
        if (error.response.status === 400 && errorData.message.includes('토큰')) {
          setTokenValid(false)
        }
      } else if (error.request) {
        setErrors({ submit: '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.' })
      } else {
        setErrors({ submit: '요청을 보내는 중 오류가 발생했습니다.' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <Navbar />
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="error-state">
              <h2>유효하지 않은 링크입니다</h2>
              <p>비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다.</p>
              <Link to="/forgot-password" className="retry-button">
                비밀번호 찾기 다시 시도
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <Navbar />
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="success-state">
              <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
              <h2>비밀번호가 성공적으로 변경되었습니다</h2>
              <p>로그인 페이지로 이동합니다...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-page">
      <Navbar />
      <div className="reset-password-container">
        <div className="reset-password-card">
          <h2 className="reset-password-title">비밀번호 재설정</h2>
          <p className="reset-password-subtitle">
            새로운 비밀번호를 입력해주세요.
          </p>

          <form onSubmit={handleSubmit} className="reset-password-form">
            {errors.submit && (
              <div className="error-message">{errors.submit}</div>
            )}

            <div className="form-group">
              <label htmlFor="password">새 비밀번호</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                  placeholder="최소 8자 이상"
                  disabled={loading}
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

            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  placeholder="비밀번호를 다시 입력하세요"
                  disabled={loading}
                />
                <button
                  type="button"
                  className={`password-toggle ${showConfirmPassword ? 'active' : ''}`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? '재설정 중...' : '비밀번호 재설정'}
            </button>
          </form>

          <div className="reset-password-footer">
            <Link to="/login">로그인으로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

