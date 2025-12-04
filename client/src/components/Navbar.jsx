import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faHeart, faShoppingCart, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import api from '../services/api'
import '../styles/components/Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { getCartCount, clearCart } = useCart()
  const { getWishlistCount, clearWishlist } = useWishlist()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const cartCount = getCartCount()
  const wishlistCount = getWishlistCount()

  useEffect(() => {
    // 토큰 확인
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (token) {
      // 토큰이 있으면 유저 정보 가져오기
      fetchUserInfo()
    } else {
      setLoading(false)
    }
  }, [])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me')
      
      if (response.data.success) {
        setUser(response.data.data)
      }
    } catch (error) {
      console.error('유저 정보 가져오기 오류:', error)
      // 토큰이 유효하지 않으면 제거
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    // 저장된 이메일 확인
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    
    // 토큰 및 유저 정보 제거
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    
    // 장바구니 및 찜 목록 초기화
    clearCart()
    clearWishlist()
    
    // localStorage에서 장바구니와 찜 목록도 제거
    localStorage.removeItem('cart')
    localStorage.removeItem('wishlist')
    
    // 상태 초기화
    setUser(null)
    setDropdownOpen(false)
    
    // 아이디 기억하기가 되어있다면 이메일과 함께 로그인 페이지로 이동
    if (rememberedEmail) {
      navigate('/login', { state: { email: rememberedEmail } })
    } else {
      navigate('/login')
    }
  }

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen)
  }

  // 로그인 여부 확인 함수
  const checkAuthAndNavigate = async (path) => {
    // 토큰 확인
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      // 토큰이 없으면 로그인 페이지로 이동
      alert('로그인이 필요합니다.')
      navigate('/login')
      return false
    }

    // 토큰이 있으면 유효성 검증
    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        // 유효한 토큰이면 요청한 페이지로 이동
        navigate(path)
        return true
      }
    } catch (error) {
      // 토큰이 유효하지 않으면 제거하고 로그인 페이지로 이동
      console.error('인증 오류:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      setUser(null)
      alert('로그인이 필요합니다.')
      navigate('/login')
      return false
    }
  }

  const handleCartClick = () => {
    checkAuthAndNavigate('/cart')
  }

  const handleWishlistClick = () => {
    checkAuthAndNavigate('/wishlist')
  }

  const isAdmin = user?.user_type === 'admin'

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <h1 className="logo" onClick={() => navigate('/')}>FASHIONOVA</h1>
        </div>
        
        <nav className="navbar-center">
          <a href="#" className="nav-link">New Arrivals</a>
          <a href="#" className="nav-link">Clothing</a>
          <a href="#" className="nav-link">Sale</a>
          <a href="#" className="nav-link">About</a>
        </nav>
        
        <div className="navbar-right">
          <button className="icon-button" aria-label="Search">
            <FontAwesomeIcon icon={faSearch} />
          </button>
          <button 
            className="icon-button" 
            aria-label="Wishlist"
            onClick={handleWishlistClick}
            style={{ position: 'relative' }}
          >
            <FontAwesomeIcon icon={faHeart} />
            {wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount}</span>}
          </button>
          <button 
            className="icon-button cart-button" 
            aria-label="Cart"
            onClick={handleCartClick}
          >
            <FontAwesomeIcon icon={faShoppingCart} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          
          {!loading && (
            <>
              {user ? (
                <div className="user-menu" ref={dropdownRef}>
                  <button 
                    className="user-welcome-button"
                    onClick={toggleDropdown}
                  >
                    <span>{user.name}님 환영합니다.</span>
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}
                    />
                  </button>
                  {dropdownOpen && (
                    <div className="user-dropdown">
                    
                      {isAdmin && (
                        <button 
                          className="dropdown-item admin-item"
                          onClick={() => {
                            navigate('/admin')
                            setDropdownOpen(false)
                          }}
                        >
                          관리자 대시보드
                        </button>
                      )}
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          navigate('/orders')
                          setDropdownOpen(false)
                        }}
                      >
                        주문 내역
                      </button>
                      <button 
                        className="dropdown-item logout-item"
                        onClick={handleLogout}
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button 
                    className="login-nav-button"
                    onClick={() => navigate('/login')}
                  >
                    로그인
                  </button>
                  <button 
                    className="signup-nav-button"
                    onClick={() => navigate('/signup')}
                  >
                    회원가입
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar

