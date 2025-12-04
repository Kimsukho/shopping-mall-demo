import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faClock, faUser, faBox, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'
import api from '../../services/api'
import '../../styles/pages/Admin.css'

function OrderManagement() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [orderLoading, setOrderLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [statusFilter, setStatusFilter] = useState('all')
  const [allOrders, setAllOrders] = useState([]) // 전체 주문 목록 (필터링 전)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setOrderLoading(true)
      setError(null)
      
      const response = await api.get('/orders/all')
      
      if (response.data.success) {
        const allOrdersData = response.data.data || []
        setAllOrders(allOrdersData)
        
        // 클라이언트 측 필터링
        let filteredOrders = allOrdersData
        if (statusFilter !== 'all') {
          filteredOrders = allOrdersData.filter(order => order.status === statusFilter)
        }
        setOrders(filteredOrders)
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error)
      if (error.response?.status === 401) {
        setError('로그인이 필요합니다.')
      } else if (error.response?.status === 403) {
        setError('관리자 권한이 필요합니다.')
      } else {
        setError('주문 목록을 불러오는 중 오류가 발생했습니다.')
      }
    } finally {
      setOrderLoading(false)
    }
  }

  // 페이지네이션 계산
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return orders.slice(startIndex, endIndex)
  }, [orders, currentPage, itemsPerPage])

  const totalPages = Math.ceil(orders.length / itemsPerPage)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1) // 페이지 크기 변경 시 첫 페이지로
  }

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status: newStatus })
      if (response.data.success) {
        alert('주문 상태가 변경되었습니다.')
        fetchOrders()
      }
    } catch (error) {
      console.error('주문 상태 변경 오류:', error)
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.')
      } else if (error.response?.status === 403) {
        alert('관리자 권한이 필요합니다.')
      } else {
        alert(error.response?.data?.message || '주문 상태 변경 중 오류가 발생했습니다.')
      }
    }
  }

  const handleViewOrder = (orderId) => {
    navigate('/order-complete', {
      state: {
        orderId,
      },
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
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

  const handleStartShipping = async (orderId) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status: 'shipping_start' })
      if (response.data.success) {
        alert('배송이 시작되었습니다.')
        fetchOrders()
      }
    } catch (error) {
      console.error('배송 시작 오류:', error)
      alert(error.response?.data?.message || '배송 시작 중 오류가 발생했습니다.')
    }
  }

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

  return (
    <div className="tab-content">
      <div className="orders-header">
        <h2 className="tab-title">주문 관리</h2>
      </div>

      <div className="orders-list">
        <div className="orders-list-header">
          <div className="orders-header-left">
            <h3 className="form-section-title">등록된 주문 목록</h3>
            {/* {orders.length > 0 && (
              <span className="orders-count">
                {statusFilter !== 'all' 
                  ? `필터 결과: ${orders.length}개` 
                  : `총 ${orders.length}개`}
              </span>
            )} */}
          </div>
          {orders.length > 0 && (
            <div className="orders-header-right">
              <div className="items-per-page-selector">
                <label htmlFor="ordersItemsPerPage">페이지당:</label>
                <select
                  id="ordersItemsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="items-per-page-select"
                >
                  <option value="10">10개</option>
                  <option value="20">20개</option>
                  <option value="50">50개</option>
                  <option value="100">100개</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {allOrders.length > 0 && (
          <div className="admin-order-status-tabs">
            <button
              className={`admin-status-tab ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('all')
                setCurrentPage(1)
              }}
            >
              전체
              <span className="status-tab-badge">{getOrderCount('all')}</span>
            </button>
            <button
              className={`admin-status-tab ${statusFilter === 'confirmed' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('confirmed')
                setCurrentPage(1)
              }}
            >
              주문확인
              <span className="status-tab-badge">{getOrderCount('confirmed')}</span>
            </button>
            <button
              className={`admin-status-tab ${statusFilter === 'preparing' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('preparing')
                setCurrentPage(1)
              }}
            >
              상품준비중
              <span className="status-tab-badge">{getOrderCount('preparing')}</span>
            </button>
            <button
              className={`admin-status-tab ${statusFilter === 'shipping_start' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('shipping_start')
                setCurrentPage(1)
              }}
            >
              배송시작
              <span className="status-tab-badge">{getOrderCount('shipping_start')}</span>
            </button>
            <button
              className={`admin-status-tab ${statusFilter === 'shipping' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('shipping')
                setCurrentPage(1)
              }}
            >
              배송중
              <span className="status-tab-badge">{getOrderCount('shipping')}</span>
            </button>
            <button
              className={`admin-status-tab ${statusFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('delivered')
                setCurrentPage(1)
              }}
            >
              배송완료
              <span className="status-tab-badge">{getOrderCount('delivered')}</span>
            </button>
            <button
              className={`admin-status-tab ${statusFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('cancelled')
                setCurrentPage(1)
              }}
            >
              주문취소
              <span className="status-tab-badge">{getOrderCount('cancelled')}</span>
            </button>
          </div>
        )}

        {orderLoading ? (
          <div className="loading-message">주문 목록을 불러오는 중...</div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button
              className="action-button primary"
              onClick={() => fetchOrders()}
            >
              다시 시도
            </button>
          </div>
        ) : allOrders.length === 0 ? (
          <div className="empty-message">등록된 주문이 없습니다.</div>
        ) : orders.length === 0 ? (
          <div className="empty-message">선택한 상태의 주문이 없습니다.</div>
        ) : (
          <>
            <div className="table-count-info">
              {statusFilter !== 'all' ? (
                <>
                  필터 결과: <strong>{orders.length}개</strong> / 전체: <strong>{allOrders.length}개</strong>
                </>
              ) : (
                <>
                  총 <strong>{allOrders.length}개</strong>
                </>
              )}
            </div>
            
            <div className="admin-orders-cards">
              {paginatedOrders.map((order) => {
                const customerName = order.user?.name || '알 수 없음'
                const customerEmail = order.user?.email || '이메일 없음'
                const customerPhone = order.shippingAddress?.phone || '전화번호 없음'
                const productCount = order.items?.length || 0
                const shippingAddress = order.shippingAddress
                const addressText = shippingAddress 
                  ? `${shippingAddress.address} ${shippingAddress.detailAddress || ''}`.trim()
                  : '배송 주소 없음'
                
                return (
                  <div key={order._id} className="admin-order-card">
                    <div className="admin-order-card-header">
                      <div className="admin-order-header-left">
                        <div className="admin-order-number">
                          <FontAwesomeIcon icon={faClock} />
                          {order.orderNumber}
                        </div>
                        <div className="admin-order-customer-date">
                          {customerName} • {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <div className="admin-order-header-right">
                        <div className="admin-order-status-amount">
                          <span className={`admin-status-badge ${getStatusClass(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          <span className="admin-order-total">₩{order.totalAmount?.toLocaleString() || '0'}</span>
                          <button 
                            className="admin-view-details-button"
                            onClick={() => handleViewOrder(order._id)}
                          >
                            <FontAwesomeIcon icon={faEye} />
                            상세보기
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="admin-order-card-body">
                      <div className="admin-order-info-section">
                        <div className="admin-order-info-item">
                          <h4 className="admin-order-info-title">
                            <FontAwesomeIcon icon={faUser} />
                            고객 정보
                          </h4>
                          <div className="admin-order-info-content">
                            <div>{customerEmail}</div>
                            <div>{customerPhone}</div>
                          </div>
                        </div>
                        
                        <div className="admin-order-info-item">
                          <h4 className="admin-order-info-title">
                            <FontAwesomeIcon icon={faBox} />
                            주문 상품
                          </h4>
                          <div className="admin-order-info-content">
                            <div>{productCount}개 상품</div>
                          </div>
                        </div>
                        
                        <div className="admin-order-info-item">
                          <h4 className="admin-order-info-title">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            배송 주소
                          </h4>
                          <div className="admin-order-info-content">
                            <div>{addressText}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="admin-order-actions">
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                          className="admin-order-status-select"
                        >
                          <option value="pending">결제대기</option>
                          <option value="confirmed">주문확인</option>
                          <option value="preparing">상품준비중</option>
                          <option value="shipping_start">배송시작</option>
                          <option value="shipping">배송중</option>
                          <option value="delivered">배송완료</option>
                          <option value="cancelled">주문취소</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      )
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return <span key={page} className="pagination-ellipsis">...</span>
                    }
                    return null
                  })}
                </div>
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OrderManagement

