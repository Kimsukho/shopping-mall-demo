import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import Navbar from '../components/Navbar'
import api from '../services/api'
import '../styles/pages/ForgotPassword.css'

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors((prev) => ({
        ...prev,
        email: '',
      }))
    }
  }

  const validateEmail = () => {
    if (!email) {
      setErrors({ email: '이메일을 입력해주세요.' })
      return false
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrors({ email: '올바른 이메일 형식이 아닙니다.' })
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateEmail()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      })

      if (response.data.success) {
        setSuccess(true)
        // 토큰을 URL에 포함하여 비밀번호 재설정 페이지로 이동
        const resetToken = response.data.data.resetToken
        setTimeout(() => {
          navigate(`/reset-password?token=${resetToken}`)
        }, 2000)
      }
    } catch (error) {
      console.error('비밀번호 찾기 오류:', error)
      
      if (error.response?.data) {
        const errorData = error.response.data
        setErrors({ submit: errorData.message || '비밀번호 찾기 중 오류가 발생했습니다.' })
      } else if (error.request) {
        setErrors({ submit: '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.' })
      } else {
        setErrors({ submit: '요청을 보내는 중 오류가 발생했습니다.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-page">
      <Navbar />
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <button 
            className="back-button"
            onClick={() => navigate('/login')}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            로그인으로 돌아가기
          </button>

          <div className="forgot-password-header">
            <div className="icon-wrapper">
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <h2 className="forgot-password-title">비밀번호 찾기</h2>
            <p className="forgot-password-subtitle">
              {success 
                ? '이메일을 확인해주세요. 비밀번호 재설정 페이지로 이동합니다...'
                : '가입하신 이메일 주소를 입력해주세요. 비밀번호 재설정 링크를 보내드립니다.'}
            </p>
          </div>

          {success ? (
            <div className="success-message">
              <p>비밀번호 재설정 페이지로 이동합니다...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forgot-password-form">
              {errors.submit && (
                <div className="error-message">{errors.submit}</div>
              )}

              <div className="form-group">
                <label htmlFor="email">이메일</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    className={errors.email ? 'input-error' : ''}
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )}
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? '전송 중...' : '비밀번호 재설정 링크 보내기'}
              </button>
            </form>
          )}

          <div className="forgot-password-footer">
            <span>계정을 기억하시나요?</span>
            <Link to="/login">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

