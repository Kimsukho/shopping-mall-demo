import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBox, faArrowRight, faTimes, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../services/api'
import '../styles/pages/Orders.css'

function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([]) // 전체 주문 목록 (필터링 전)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  
  // 탭 옵션 정의
  const tabs = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '결제대기' },
    { value: 'confirmed', label: '주문확인' },
    { value: 'preparing', label: '상품준비중' },
    { value: 'shipping_start', label: '배송시작' },
    { value: 'shipping', label: '배송중' },
    { value: 'delivered', label: '배송완료' },
    { value: 'cancelled', label: '주문취소' },
  ]
  
  // 각 탭별 주문 개수 계산
  const getOrderCount = (filterValue) => {
    if (filterValue === 'all') {
      return allOrders.length
    } else if (filterValue === 'pending') {
      return allOrders.filter(order => order.status === 'pending').length
    } else if (filterValue === 'confirmed') {
      return allOrders.filter(order => order.status === 'confirmed').length
    } else if (filterValue === 'preparing') {
      return allOrders.filter(order => order.status === 'preparing').length
    } else if (filterValue === 'shipping_start') {
      return allOrders.filter(order => order.status === 'shipping_start').length
    } else if (filterValue === 'shipping') {
      return allOrders.filter(order => order.status === 'shipping').length
    } else if (filterValue === 'delivered') {
      return allOrders.filter(order => order.status === 'delivered').length
    } else if (filterValue === 'cancelled') {
      return allOrders.filter(order => order.status === 'cancelled').length
    }
    return 0
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 전체 주문 가져오기
      const response = await api.get('/orders')
      
      if (response.data.success) {
        const allOrdersData = response.data.data || []
        setAllOrders(allOrdersData)
        
        let filteredOrders = allOrdersData
        
        // 클라이언트 측 필터링
        if (statusFilter === 'all') {
          // 전체: 모든 주문 표시
          filteredOrders = allOrdersData
        } else if (statusFilter === 'pending') {
          // 결제대기: pending 상태
          filteredOrders = allOrdersData.filter(order => order.status === 'pending')
        } else if (statusFilter === 'confirmed') {
          // 주문확인: confirmed 상태
          filteredOrders = allOrdersData.filter(order => order.status === 'confirmed')
        } else if (statusFilter === 'preparing') {
          // 상품준비중: preparing 상태
          filteredOrders = allOrdersData.filter(order => order.status === 'preparing')
        } else if (statusFilter === 'shipping_start') {
          // 배송시작: shipping_start 상태
          filteredOrders = allOrdersData.filter(order => order.status === 'shipping_start')
        } else if (statusFilter === 'shipping') {
          // 배송중: shipping 상태
          filteredOrders = allOrdersData.filter(order => order.status === 'shipping')
        } else if (statusFilter === 'delivered') {
          // 배송완료: delivered 상태
          filteredOrders = allOrdersData.filter(order => order.status === 'delivered')
        } else if (statusFilter === 'cancelled') {
          // 주문취소: cancelled 상태
          filteredOrders = allOrdersData.filter(order => order.status === 'cancelled')
        }
        
        setOrders(filteredOrders)
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error)
      if (error.response?.status === 401) {
        setError('로그인이 필요합니다.')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        setError('주문 목록을 불러오는 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOrderClick = (orderId) => {
    navigate('/order-complete', {
      state: {
        orderId,
      },
    })
  }

  const handleCancelOrder = async (orderId, orderNumber, e) => {
    e.stopPropagation() // 주문 클릭 이벤트 방지
    
    if (!window.confirm(`주문 번호 ${orderNumber}을(를) 취소하시겠습니까?`)) {
      return
    }

    try {
      const response = await api.delete(`/orders/${orderId}`)
      if (response.data.success) {
        alert('주문이 취소되었습니다.')
        fetchOrders() // 목록 새로고침
      }
    } catch (error) {
      console.error('주문 취소 오류:', error)
      if (error.response?.status === 400) {
        alert(error.response.data?.message || '주문을 취소할 수 없습니다.')
      } else if (error.response?.status === 401) {
        alert('로그인이 필요합니다.')
        navigate('/login')
      } else {
        alert('주문 취소 중 오류가 발생했습니다.')
      }
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '결제대기'
      case 'confirmed':
        return '주문확인'
      case 'preparing':
        return '상품준비중'
      case 'shipping_start':
        return '배송시작'
      case 'shipping':
        return '배송중'
      case 'delivered':
        return '배송완료'
      case 'cancelled':
        return '주문취소'
      default:
        return status
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-processing'
      case 'confirmed':
        return 'status-confirmed'
      case 'preparing':
        return 'status-preparing'
      case 'shipping_start':
        return 'status-shipping'
      case 'shipping':
        return 'status-shipping'
      case 'delivered':
        return 'status-delivered'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return ''
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="orders-page">
        <Navbar />
        <div className="orders-container">
          <div className="loading-message">주문 목록을 불러오는 중...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="orders-page">
        <Navbar />
        <div className="orders-container">
          <div className="error-message">
            <p>{error}</p>
            <button
              className="action-button primary"
              onClick={() => navigate('/')}
            >
              계속 쇼핑하기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="orders-page">
      <Navbar />

      <div className="orders-container">
        <div className="orders-header">
          <h1 className="orders-title">주문 내역</h1>
        </div>
        
        {/* 상태 필터 탭 */}
        <div className="status-tabs">
          {tabs.map((tab) => {
            const count = getOrderCount(tab.value)
            return (
              <button
                key={tab.value}
                className={`status-tab ${statusFilter === tab.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
                {count > 0 && (
                  <span className="status-tab-badge">{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <FontAwesomeIcon icon={faBox} className="empty-icon" />
            <h2>주문 내역이 없습니다</h2>
            <p>아직 주문한 상품이 없습니다.</p>
            <button
              className="shop-button"
              onClick={() => navigate('/')}
            >
              쇼핑하러 가기
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order._id}
                className="order-card"
                onClick={() => handleOrderClick(order._id)}
              >
                <div className="order-card-header">
                  <div className="order-card-header-left">
                    <div className="order-number">
                      <FontAwesomeIcon icon={faBox} />
                      <span>주문번호: {order.orderNumber}</span>
                    </div>
                    <div className="order-date">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="order-status-badge">
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items && order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="order-item-preview">
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name || '상품 이미지'}
                            className="order-item-preview-image"
                          />
                        )}
                        <div className="order-item-preview-info">
                          <span className="order-item-preview-name">
                            {item.product?.name || '상품명'}
                          </span>
                          <span className="order-item-preview-quantity">
                            수량: {item.quantity}개
                          </span>
                        </div>
                      </div>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <div className="order-items-more">
                        외 {order.items.length - 3}개 상품
                      </div>
                    )}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-total">
                      <span className="order-total-label">총 결제금액</span>
                      <span className="order-total-amount">
                        ₩{order.totalAmount?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="order-actions">
                      {order.status !== 'cancelled' && !['shipping_start', 'shipping', 'delivered', 'confirmed'].includes(order.status) && (
                        <button
                          className="cancel-order-button"
                          onClick={(e) => handleCancelOrder(order._id, order.orderNumber, e)}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                          주문 취소
                        </button>
                      )}
                      <button
                        className="view-order-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOrderClick(order._id)
                        }}
                      >
                        상세보기
                        <FontAwesomeIcon icon={faArrowRight} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Orders

