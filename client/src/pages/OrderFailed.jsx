import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle, faHome, faShoppingCart, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../styles/pages/OrderFailed.css'

function OrderFailed() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // location.state에서 실패 정보 가져오기
  const errorMessage = location.state?.errorMessage || '주문 처리 중 오류가 발생했습니다.'
  const errorType = location.state?.errorType || 'unknown' // 'payment', 'duplicate', 'server', 'unknown'
  const orderNumber = location.state?.orderNumber || null

  const getErrorTitle = () => {
    switch (errorType) {
      case 'payment':
        return '결제 검증 실패'
      case 'duplicate':
        return '중복 주문'
      case 'server':
        return '서버 오류'
      default:
        return '주문 실패'
    }
  }

  const getErrorDescription = () => {
    switch (errorType) {
      case 'payment':
        return '결제 정보 검증에 실패했습니다. 결제가 정상적으로 완료되지 않았을 수 있습니다.'
      case 'duplicate':
        return '이미 처리된 주문입니다. 동일한 주문이 이미 존재합니다.'
      case 'server':
        return '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      default:
        return '주문 처리 중 예기치 않은 오류가 발생했습니다.'
    }
  }

  return (
    <div className="order-failed-page">
      <Navbar />

      <div className="order-failed-container">
        <div className="order-failed-content">
          {/* 실패 아이콘 및 메시지 */}
          <div className="failure-section">
            <div className="failure-icon">
              <FontAwesomeIcon icon={faTimesCircle} />
            </div>
            <h1 className="failure-title">{getErrorTitle()}</h1>
            <p className="failure-message">
              {getErrorDescription()}
            </p>
            {errorMessage && (
              <div className="error-details">
                <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                <span>{errorMessage}</span>
              </div>
            )}
            {orderNumber && (
              <div className="order-number-info">
                <span className="order-number-label">주문 번호:</span>
                <span className="order-number-value">{orderNumber}</span>
              </div>
            )}
          </div>

          {/* 안내 메시지 */}
          <div className="info-section">
            <h2 className="info-title">다음 단계</h2>
            <ul className="info-list">
              <li>결제가 완료되지 않았다면, 카드사나 은행에서 결제 내역을 확인해주세요.</li>
              <li>결제가 완료되었는데도 주문이 실패했다면, 고객센터로 문의해주세요.</li>
              <li>장바구니에 담긴 상품은 그대로 유지됩니다.</li>
            </ul>
          </div>

          {/* 액션 버튼 */}
          <div className="action-buttons">
            <button
              className="action-button primary"
              onClick={() => navigate('/cart')}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              장바구니로 돌아가기
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

export default OrderFailed

