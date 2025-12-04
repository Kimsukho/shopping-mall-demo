import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faBox, faShoppingCart, faChartLine } from '@fortawesome/free-solid-svg-icons'
import Navbar from '../../components/Navbar'
import UserManagement from '../../components/admin/UserManagement'
import ProductManagement from '../../components/admin/ProductManagement'
import OrderManagement from '../../components/admin/OrderManagement'
import Analytics from '../../components/admin/Analytics'
import api from '../../services/api'
import '../../styles/pages/Admin.css'

function Admin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('users')
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    // location state에서 activeTab을 받아서 설정
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab)
    }
  }, [location.state])

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await api.get('/auth/me')
      if (response.data.success) {
        const user = response.data.data
        setCurrentUser(user)
        
        if (user.user_type !== 'admin') {
          alert('어드민 권한이 필요합니다.')
          navigate('/')
          return
        }
      }
    } catch (error) {
      console.error('권한 확인 오류:', error)
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">
            <FontAwesomeIcon icon={faUser} /> 관리자 대시보드
          </h1>
        </div>

        {/* 탭 메뉴 */}
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FontAwesomeIcon icon={faUser} />
            사용자 관리
          </button>
          <button
            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <FontAwesomeIcon icon={faBox} />
            상품 관리
          </button>
          <button
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <FontAwesomeIcon icon={faShoppingCart} />
            주문 관리
          </button>
          <button
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FontAwesomeIcon icon={faChartLine} />
            매출 분석
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'users' && <UserManagement currentUser={currentUser} />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'analytics' && <Analytics totalProducts={0} />}
      </div>
    </div>
  )
}

export default Admin

