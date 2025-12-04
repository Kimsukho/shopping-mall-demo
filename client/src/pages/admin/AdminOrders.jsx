import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import api from '../../services/api'
import '../../styles/pages/AdminOrders.css'

function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchOrders()
    }
  }, [currentUser, statusFilter])

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (!token) {
        alert('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      const response = await api.get('/auth/me')
      if (response.data.success) {
        const user = response.data.data
        setCurrentUser(user)
        
        if (user.user_type !== 'admin') {
          alert('관리자 권한이 필요합니다.')
          navigate('/')
          return
        }
      }
    } catch (error) {
      console.error('권한 확인 오류:', error)
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.')
        navigate('/login')
      } else {
        alert('권한 확인 중 오류가 발생했습니다.')
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const response = await api.get(`/orders/all${queryParams}`)
      
      if (response.data.success) {
        setOrders(response.data.data || [])
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error)
      if (error.response?.status === 401) {
        setError('로그인이 필요합니다.')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else if (error.response?.status === 403) {
        setError('관리자 권한이 필요합니다.')
        setTimeout(() => {
          navigate('/')
        }, 1500)
      } else {
        setError('주문 목록을 불러오는 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
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
    setCurrentPage(1)
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
        navigate('/login')
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

  if (loading && !currentUser) {
    return (
      <div className="admin-orders-page">
        <Navbar />
        <div className="admin-orders-container">
          <div className="loading-message">권한 확인 중...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error && !currentUser) {
    return (
      <div className="admin-orders-page">
        <Navbar />
        <div className="admin-orders-container">
          <div className="error-message">
            <p>{error}</p>
            <button
              className="action-button primary"
              onClick={() => navigate('/')}
            >
              홈으로 가기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="admin-orders-page">
      <Navbar />
      
      <div className="admin-orders-container">
        <div className="admin-orders-header">
          <h1 className="admin-orders-title">주문 관리</h1>
        </div>

        {/* 필터 및 페이지당 항목 수 선택 */}
        <div className="admin-orders-controls">
          <div className="status-filter-group">
            <label htmlFor="statusFilter">상태 필터:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="status-filter-select"
            >
              <option value="all">전체</option>
              <option value="pending">결제대기</option>
              <option value="confirmed">주문확인</option>
              <option value="preparing">상품준비중</option>
              <option value="shipping_start">배송시작</option>
              <option value="shipping">배송중</option>
              <option value="delivered">배송완료</option>
              <option value="cancelled">주문취소</option>
            </select>
          </div>
          
          {orders.length > 0 && (
            <div className="items-per-page-selector">
              <label htmlFor="itemsPerPage">페이지당:</label>
              <select
                id="itemsPerPage"
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
          )}
        </div>

        {loading ? (
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
        ) : orders.length === 0 ? (
          <div className="empty-message">등록된 주문이 없습니다.</div>
        ) : (
          <>
            <div className="orders-count-info">
              총 {orders.length}개의 주문
            </div>
            
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>고객명</th>
                    <th>상품</th>
                    <th>금액</th>
                    <th>주문일</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => {
                    const customerName = order.user?.name || '알 수 없음'
                    const productCount = order.items?.length || 0
                    const firstProduct = order.items?.[0]?.product
                    const productName = firstProduct?.name || '상품명 없음'
                    const displayProduct = productCount > 1 
                      ? `${productName} 외 ${productCount - 1}개`
                      : productName
                    
                    return (
                      <tr key={order._id}>
                        <td className="order-number-cell">#{order.orderNumber}</td>
                        <td>{customerName}</td>
                        <td className="product-cell">{displayProduct}</td>
                        <td className="amount-cell">₩{order.totalAmount?.toLocaleString() || '0'}</td>
                        <td className="date-cell">{formatDate(order.createdAt)}</td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                            className="status-select"
                          >
                            <option value="pending">결제대기</option>
                            <option value="confirmed">주문확인</option>
                            <option value="preparing">상품준비중</option>
                            <option value="shipping_start">배송시작</option>
                            <option value="shipping">배송중</option>
                            <option value="delivered">배송완료</option>
                            <option value="cancelled">주문취소</option>
                          </select>
                        </td>
                        <td>
                          <button 
                            className="view-order-button"
                            onClick={() => handleViewOrder(order._id)}
                          >
                            <FontAwesomeIcon icon={faEye} />
                            상세보기
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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

      <Footer />
    </div>
  )
}

export default AdminOrders

