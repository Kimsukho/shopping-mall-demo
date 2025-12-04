import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../contexts/CartContext'
import api from '../services/api'
import '../styles/pages/Checkout.css'

function Checkout() {
  const navigate = useNavigate()
  const { cartItems, getCartTotal, fetchCart, removeFromCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [addressOption, setAddressOption] = useState('new') // 'default' 또는 'new' (기본값: 신규 입력)
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    address: '',
    paymentMethod: 'card', // 기본값: 카드 결제
    notes: '',
  })
  const [errors, setErrors] = useState({})

  // 포트원 결제 모듈 초기화
  useEffect(() => {
    // IMP 스크립트가 로드되었는지 확인
    if (window.IMP) {
      window.IMP.init('imp61035061')
      console.log('포트원 결제 모듈이 초기화되었습니다.')
    } else {
      // IMP 스크립트가 아직 로드되지 않은 경우 대기
      const checkIMP = setInterval(() => {
        if (window.IMP) {
          window.IMP.init('imp61035061')
          console.log('포트원 결제 모듈이 초기화되었습니다.')
          clearInterval(checkIMP)
        }
      }, 100)

      // 5초 후에도 로드되지 않으면 중단
      setTimeout(() => {
        clearInterval(checkIMP)
        if (!window.IMP) {
          console.warn('포트원 결제 모듈을 로드할 수 없습니다.')
        }
      }, 5000)
    }
  }, [])

  // 사용자 정보 및 최근 배송지 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/auth/me')
        if (response.data.success) {
          setUser(response.data.data)
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error)
      }
    }

    const fetchRecentShippingAddress = async () => {
      try {
        // 로그인한 사용자의 최근 주문에서 배송지 정보 가져오기
        const response = await api.get('/orders')
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          // 주문 목록은 이미 서버에서 최신순으로 정렬되어 있으므로 첫 번째 주문이 가장 최근 주문
          const recentOrder = response.data.data[0]
          if (recentOrder.shippingAddress) {
            // localStorage에 최근 배송지 정보 저장
            localStorage.setItem('recentShippingAddress', JSON.stringify(recentOrder.shippingAddress))
          }
        } else {
          // 주문이 없는 경우 localStorage에서 기존 정보 제거
          localStorage.removeItem('recentShippingAddress')
        }
      } catch (error) {
        console.error('최근 배송지 정보 가져오기 오류:', error)
        // 에러가 발생하면 localStorage에서 기존 정보 제거
        localStorage.removeItem('recentShippingAddress')
      }
    }

    fetchUserInfo()
    fetchRecentShippingAddress()
  }, [])

  // 주소 옵션 변경 시 처리
  useEffect(() => {
    if (addressOption === 'default') {
      // 최근 배송지 선택 시: 로그인한 사용자의 최근 주문 배송지 정보 또는 사용자 정보로 자동 채우기
      const recentShippingAddress = localStorage.getItem('recentShippingAddress')
      
      if (recentShippingAddress) {
        try {
          const addressData = JSON.parse(recentShippingAddress)
          setFormData((prev) => ({
            ...prev,
            recipientName: addressData.recipientName || user?.name || '',
            recipientPhone: addressData.recipientPhone || '',
            address: addressData.address || user?.address || '',
          }))
        } catch (error) {
          console.error('최근 배송지 정보 파싱 오류:', error)
          // 파싱 실패 시 사용자 정보로 폴백
          if (user && (user.name || user.address)) {
            setFormData((prev) => ({
              ...prev,
              recipientName: user.name || '',
              address: user.address || '',
            }))
          }
        }
      } else if (user && (user.name || user.address)) {
        // 최근 배송지가 없으면 로그인한 사용자의 기본 정보로 폴백
        setFormData((prev) => ({
          ...prev,
          recipientName: user.name || '',
          address: user.address || '',
        }))
      }
    }
    // 신규 입력 선택 시는 사용자가 이미 입력한 내용을 유지
  }, [addressOption, user])

  // 장바구니 데이터 불러오기
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // 장바구니가 비어있으면 장바구니 페이지로 리다이렉트
  useEffect(() => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.')
      navigate('/cart')
    }
  }, [cartItems, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // 전화번호 필드인 경우 숫자만 허용하고 자동 포맷팅
    if (name === 'recipientPhone') {
      // 숫자만 추출
      const numbers = value.replace(/[^0-9]/g, '')
      
      // 자동 포맷팅 (010-1234-5678 형식)
      let formatted = numbers
      if (numbers.length > 3 && numbers.length <= 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      } else if (numbers.length > 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
    
    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  // 주소 옵션 변경 핸들러
  const handleAddressOptionChange = (e) => {
    setAddressOption(e.target.value)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = '수령인 이름을 입력해주세요.'
    }

    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = '수령인 전화번호를 입력해주세요.'
    } else {
      // 숫자만 추출하여 길이 확인 (010-1234-5678 = 11자리)
      const phoneNumbers = formData.recipientPhone.replace(/[^0-9]/g, '')
      if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
        newErrors.recipientPhone = '올바른 전화번호 형식이 아닙니다. (10-11자리 숫자)'
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = '배송지 주소를 입력해주세요.'
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = '결제 방법을 선택해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // merchant_uid 생성 (고유 주문 번호)
  const generateMerchantUid = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    return `ORDER_${year}${month}${day}${hours}${minutes}${seconds}_${random}`
  }

  // 주문 생성 함수 (결제 성공 후 호출)
  const createOrderAfterPayment = async (paymentData) => {
    try {
      // 주문 전 장바구니 항목들 저장 (주문에 포함된 항목들)
      const orderedItems = [...cartItems]
      
      const orderData = {
        shippingAddress: {
          recipientName: formData.recipientName.trim(),
          recipientPhone: formData.recipientPhone.trim(),
          address: formData.address.trim(),
        },
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim(),
        paymentData: {
          imp_uid: paymentData.imp_uid,
          merchant_uid: paymentData.merchant_uid,
          paid_amount: paymentData.paid_amount,
          pay_method: paymentData.pay_method,
        },
      }

      const response = await api.post('/orders', orderData)

      if (response.data.success) {
        // 주문 성공 시 배송지 정보를 localStorage에 저장 (최근 배송지로 사용)
        const shippingAddressData = {
          recipientName: formData.recipientName.trim(),
          recipientPhone: formData.recipientPhone.trim(),
          address: formData.address.trim(),
        }
        localStorage.setItem('recentShippingAddress', JSON.stringify(shippingAddressData))
        
        // 주문 성공 시 주문에 포함된 항목들만 장바구니에서 제거
        try {
          // 주문에 포함된 각 항목을 장바구니에서 제거
          for (const item of orderedItems) {
            try {
              await removeFromCart(item.productId)
            } catch (removeError) {
              console.error(`장바구니에서 항목 제거 오류 (${item.productId}):`, removeError)
              // 개별 항목 제거 실패해도 계속 진행
            }
          }
        } catch (clearError) {
          console.error('장바구니 항목 제거 오류:', clearError)
          // 장바구니 항목 제거 실패해도 주문은 성공한 것으로 처리
        }
        
        // 주문 완료 페이지로 이동 (주문 번호 전달)
        navigate('/order-complete', {
          state: {
            orderNumber: response.data.data.orderNumber,
            orderId: response.data.data._id,
          },
        })
      }
    } catch (error) {
      console.error('주문 생성 오류:', error)
      console.error('에러 응답:', error.response?.data)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // 포트원 모듈이 초기화되지 않았으면 경고
    if (!window.IMP) {
      alert('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    try {
      setLoading(true)

      const totalPrice = getCartTotal()
      const shippingFee = totalPrice >= 50000 ? 0 : 3000
      const finalAmount = totalPrice + shippingFee

      // 상품명 생성 (여러 상품인 경우 첫 번째 상품명 + 외 N개)
      const productName = cartItems.length === 1
        ? cartItems[0].name
        : `${cartItems[0].name} 외 ${cartItems.length - 1}개`

      // merchant_uid 생성
      const merchantUid = generateMerchantUid()

      // 포트원 결제 요청
      window.IMP.request_pay(
        {
          pg: 'html5_inicis', // 모든 결제 이니시스 사용
          pay_method: formData.paymentMethod === 'card' ? 'card' : 'trans', // card: 카드, trans: 계좌이체
          merchant_uid: merchantUid, // 주문 고유번호
          name: productName, // 상품명
          amount: finalAmount, // 결제 금액
          buyer_name: formData.recipientName.trim(), // 구매자 이름
          buyer_tel: formData.recipientPhone.trim(), // 구매자 전화번호
          buyer_email: user?.email || '', // 구매자 이메일
          m_redirect_url: `${window.location.origin}/order-complete`, // 모바일 결제 후 리다이렉트 URL
        },
        async (rsp) => {
          // 결제 완료 후 콜백
          try {
            if (rsp.success) {
              // 결제 성공
              console.log('결제 성공:', rsp)

              // 서버에 주문 생성 요청
              await createOrderAfterPayment({
                imp_uid: rsp.imp_uid,
                merchant_uid: rsp.merchant_uid,
                paid_amount: rsp.paid_amount,
                pay_method: rsp.pay_method,
              })
            } else {
              // 결제 실패
              console.error('결제 실패:', rsp)
              setLoading(false)
              
              // 결제 실패 페이지로 이동
              navigate('/order-failed', {
                state: {
                  errorType: 'payment',
                  errorMessage: rsp.error_msg || '결제에 실패했습니다.',
                },
              })
            }
          } catch (error) {
            console.error('주문 생성 오류:', error)
            console.error('에러 응답:', error.response?.data)
            
            setLoading(false)
            
            // 에러 타입 및 메시지 추출
            let errorType = 'unknown'
            let errorMessage = '주문 처리 중 오류가 발생했습니다.'
            let orderNumber = null
            
            if (error.response?.status === 401) {
              alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.')
              navigate('/login')
              return
            } else if (error.response?.status === 409) {
              // 중복 주문
              errorType = 'duplicate'
              errorMessage = error.response.data?.message || '이미 처리된 주문입니다.'
              orderNumber = error.response.data?.data?.existingOrder?.orderNumber || null
            } else if (error.response?.status === 400) {
              // 결제 검증 실패
              errorType = 'payment'
              errorMessage = error.response.data?.message || '결제 검증에 실패했습니다.'
            } else if (error.response?.status === 500) {
              // 서버 오류
              errorType = 'server'
              errorMessage = error.response.data?.message || error.response.data?.error || '서버에서 오류가 발생했습니다.'
            } else {
              errorMessage = error.message || '주문 처리 중 오류가 발생했습니다.'
            }
            
            // 주문 실패 페이지로 이동
            navigate('/order-failed', {
              state: {
                errorType,
                errorMessage,
                orderNumber,
              },
            })
          }
        }
      )
    } catch (error) {
      console.error('결제 요청 오류:', error)
      alert('결제 요청 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const totalPrice = getCartTotal()
  const shippingFee = totalPrice >= 50000 ? 0 : 3000
  const finalAmount = totalPrice + shippingFee

  if (cartItems.length === 0) {
    return null // 리다이렉트 중
  }

  return (
    <div className="checkout-page">
      <Navbar />

      <div className="checkout-container">
        <div className="checkout-header">
          <button className="back-button" onClick={() => navigate('/cart')}>
            <FontAwesomeIcon icon={faArrowLeft} />
            장바구니로 돌아가기
          </button>
          <h1 className="checkout-title">주문/결제</h1>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-content">
            {/* 왼쪽: 주문 정보 입력 */}
            <div className="checkout-form-section">
              {/* 배송지 정보 */}
              <div className="form-section">
                <h2 className="section-title center">배송지 정보</h2>

                <div className="form-group">
                  <div className="form-group-header">
                    <label htmlFor="recipientName">
                      수령인 이름 <span className="required">*</span>
                    </label>
                    {/* 주소 옵션 라디오 버튼 */}
                    {user && (user.name || user.address) && (
                      <div className="address-option-group">
                        <label className={`address-option ${addressOption === 'default' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="addressOption"
                            value="default"
                            checked={addressOption === 'default'}
                            onChange={handleAddressOptionChange}
                          />
                          <span>최근 배송지</span>
                        </label>
                        <label className={`address-option ${addressOption === 'new' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="addressOption"
                            value="new"
                            checked={addressOption === 'new'}
                            onChange={handleAddressOptionChange}
                          />
                          <span>신규 입력</span>
                        </label>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    id="recipientName"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    placeholder="수령인 이름을 입력하세요"
                    className={errors.recipientName ? 'input-error' : ''}
                  />
                  {errors.recipientName && (
                    <span className="error-text">{errors.recipientName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="recipientPhone">
                    수령인 전화번호 <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="recipientPhone"
                    name="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    maxLength={13}
                    inputMode="numeric"
                    className={errors.recipientPhone ? 'input-error' : ''}
                  />
                  {errors.recipientPhone && (
                    <span className="error-text">{errors.recipientPhone}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="address">
                    배송지 주소 <span className="required">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="배송지 주소를 입력하세요"
                    rows="3"
                    className={errors.address ? 'input-error' : ''}
                  />
                  {errors.address && (
                    <span className="error-text">{errors.address}</span>
                  )}
                </div>

                {/* 배송 요청사항 */}
                <div className="form-group">
                  <label htmlFor="notes">
                    배송 요청사항 (선택사항)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="배송 시 요청사항을 입력하세요"
                    rows="3"
                  />
                </div>
              </div>

              {/* 결제 방법 */}
              <div className="form-section">
                <h2 className="section-title center">결제 방법</h2>
                <div className="payment-methods">
                  <label className={`payment-method-option ${formData.paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleChange}
                    />
                    <span>카드 결제</span>
                  </label>
                  <label className={`payment-method-option ${formData.paymentMethod === 'bank_transfer' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={formData.paymentMethod === 'bank_transfer'}
                      onChange={handleChange}
                    />
                    <span>계좌이체</span>
                  </label>
                </div>
                {errors.paymentMethod && (
                  <span className="error-text">{errors.paymentMethod}</span>
                )}
              </div>
            </div>

            {/* 오른쪽: 주문 요약 */}
            <div className="checkout-summary-section">
              <div className="order-summary-box">
                <h3 className="summary-title">주문 요약</h3>
                
                <div className="summary-items">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="summary-item">
                      <div className="summary-item-image">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="summary-item-info">
                        <h4 className="summary-item-name">{item.name}</h4>
                        <div className="summary-item-details">
                          <span>수량: {item.quantity}개</span>
                          <span className="summary-item-price">
                            ₩{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-totals">
                  <div className="summary-row">
                    <span>상품 금액</span>
                    <span>₩{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>배송비</span>
                    <span>{shippingFee === 0 ? '무료' : `₩${shippingFee.toLocaleString()}`}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total-row">
                    <span>총 결제금액</span>
                    <span className="total-amount">₩{finalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="submit-order-button"
                  disabled={loading}
                >
                  {loading ? '주문 처리 중...' : '주문하기'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}

export default Checkout

