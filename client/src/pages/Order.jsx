import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faHome, faList, faBox, faTruck, faCreditCard } from '@fortawesome/free-solid-svg-icons'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../services/api'
import '../styles/pages/Order.css'

function Order() {
  const navigate = useNavigate()
  const location = useLocation()
  const orderNumber = location.state?.orderNumber
  const orderId = location.state?.orderId
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 주문 상세 정보 가져오기
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('주문 정보를 찾을 수 없습니다.')
        setLoading(false)
        return
      }

      try {
        const response = await api.get(`/orders/${orderId}`)
        if (response.data.success) {
          setOrder(response.data.data)
        } else {
          setError('주문 정보를 불러올 수 없습니다.')
        }
      } catch (error) {
        console.error('주문 정보 조회 오류:', error)
        setError('주문 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrderDetails()
    } else if (!orderNumber) {
      // 주문 정보가 없으면 장바구니로 리다이렉트
      navigate('/cart')
    } else {
      setLoading(false)
    }
  }, [orderId, orderNumber, navigate])

  if (loading) {
    return (
      <div className="order-complete-page">
        <Navbar />
        <div className="order-complete-container">
          <div className="loading-message">주문 정보를 불러오는 중...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || (!order && !orderNumber)) {
    return (
      <div className="order-complete-page">
        <Navbar />
        <div className="order-complete-container">
          <div className="error-message">
            <p>{error || '주문 정보를 찾을 수 없습니다.'}</p>
            <button
              className="action-button primary"
              onClick={() => navigate('/')}
            >
              <FontAwesomeIcon icon={faHome} />
              계속 쇼핑하기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const displayOrderNumber = order?.orderNumber || orderNumber
  const displayItems = order?.items || []
  const displayTotalAmount = order?.totalAmount || 0
  const displayShippingFee = order?.shippingFee || 0
  const displayShippingAddress = order?.shippingAddress || null
  const displayPaymentMethod = order?.paymentMethod || ''

  return (
    <div className="order-complete-page">
      <Navbar />

      <div className="order-complete-container">
        <div className="order-complete-content">
          {/* 성공 메시지 */}
          <div className="success-section">
            <div className="success-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <h1 className="success-title">주문이 완료되었습니다!</h1>
            <p className="success-message">
              주문해주셔서 감사합니다. 주문 내역은 아래에서 확인하실 수 있습니다.
            </p>
          </div>

          {/* 주문 번호 */}
          <div className="order-info-box">
            <div className="order-info-header">
              <FontAwesomeIcon icon={faBox} />
              <h2>주문 정보</h2>
            </div>
            {order?.createdAt && (
              <div className="order-info-row">
                <span className="order-info-label">주문 일자</span>
                <span className="order-info-value">
                  {new Date(order.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
            <div className="order-info-row">
              <span className="order-info-label">주문 번호</span>
              <span className="order-info-value">{displayOrderNumber}</span>
            </div>
            {order?.status && (
              <div className="order-info-row">
                <span className="order-info-label">주문 상태</span>
                <span className={`order-status order-status-${order.status}`}>
                  {order.status === 'pending' ? '결제대기' :
                   order.status === 'confirmed' ? '주문확인' : 
                   order.status === 'preparing' ? '상품준비중' :
                   order.status === 'shipping_start' ? '배송시작' :
                   order.status === 'shipping' ? '배송중' :
                   order.status === 'delivered' ? '배송완료' :
                   order.status === 'cancelled' ? '주문취소' :
                   order.status}
                </span>
              </div>
            )}
          </div>

          {/* 주문 상품 목록 */}
          {displayItems.length > 0 && (
            <div className="order-items-box">
              <div className="order-info-header">
                <FontAwesomeIcon icon={faBox} />
                <h2>주문 상품</h2>
              </div>
              <div className="order-items-list">
                {displayItems.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="order-item-image">
                      {item.product?.image ? (
                        <img src={item.product.image} alt={item.product.name || '상품 이미지'} />
                      ) : (
                        <div className="no-image">이미지 없음</div>
                      )}
                    </div>
                    <div className="order-item-info">
                      <h3 className="order-item-name">{item.product?.name || '상품명'}</h3>
                      <div className="order-item-details">
                        <span>수량: {item.quantity}개</span>
                        <span className="order-item-price">
                          ₩{((item.unitPrice || item.product?.price || 0) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 배송지 정보 */}
          {displayShippingAddress && (
            <div className="order-shipping-box">
              <div className="order-info-header">
                <FontAwesomeIcon icon={faTruck} />
                <h2>배송지 정보</h2>
              </div>
              <div className="shipping-info">
                <div className="shipping-info-row">
                  <span className="shipping-label">수령인</span>
                  <span className="shipping-value">{displayShippingAddress.recipientName}</span>
                </div>
                <div className="shipping-info-row">
                  <span className="shipping-label">전화번호</span>
                  <span className="shipping-value">{displayShippingAddress.recipientPhone}</span>
                </div>
                <div className="shipping-info-row">
                  <span className="shipping-label">주소</span>
                  <span className="shipping-value">{displayShippingAddress.address}</span>
                </div>
              </div>
            </div>
          )}

          {/* 결제 정보 */}
          <div className="order-payment-box">
            <div className="order-info-header">
              <FontAwesomeIcon icon={faCreditCard} />
              <h2>결제 정보</h2>
            </div>
            <div className="payment-info">
              <div className="payment-info-row">
                <span className="payment-label">결제 방법</span>
                <span className="payment-value">
                  {displayPaymentMethod === 'card' ? '카드 결제' : 
                   displayPaymentMethod === 'bank_transfer' ? '계좌이체' : 
                   displayPaymentMethod}
                </span>
              </div>
              <div className="payment-info-row">
                <span className="payment-label">상품 금액</span>
                <span className="payment-value">
                  ₩{(displayTotalAmount - displayShippingFee).toLocaleString()}
                </span>
              </div>
              <div className="payment-info-row">
                <span className="payment-label">배송비</span>
                <span className="payment-value">
                  {displayShippingFee === 0 ? '무료' : `₩${displayShippingFee.toLocaleString()}`}
                </span>
              </div>
              <div className="payment-info-row total">
                <span className="payment-label">총 결제금액</span>
                <span className="payment-value total-amount">
                  ₩{displayTotalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="action-buttons">
            <button
              className="action-button primary"
              onClick={() => navigate('/orders')}
            >
              <FontAwesomeIcon icon={faList} />
              주문 목록 보기
            </button>
            <button
              className="action-button secondary"
              onClick={() => navigate('/')}
            >
              <FontAwesomeIcon icon={faHome} />
              계속 쇼핑하기
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Order

