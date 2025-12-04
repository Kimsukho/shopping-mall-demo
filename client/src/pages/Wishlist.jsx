import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faArrowLeft, faTrash } from '@fortawesome/free-solid-svg-icons'
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useWishlist } from '../contexts/WishlistContext'
import api from '../services/api'
import '../styles/pages/Wishlist.css'

function Wishlist() {
  const navigate = useNavigate()
  const { wishlistItems, removeFromWishlist, isInWishlist } = useWishlist()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (wishlistItems.length > 0) {
      fetchWishlistProducts()
    } else {
      setLoading(false)
      setProducts([])
    }
  }, [wishlistItems])

  const fetchWishlistProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 모든 상품을 가져온 후 위시리스트에 있는 것만 필터링
      const response = await api.get('/products')
      
      if (response.data.success) {
        const wishlistProducts = response.data.data.filter((product) =>
          wishlistItems.some(id => id.toString() === product._id.toString())
        )
        setProducts(wishlistProducts)
      }
    } catch (error) {
      console.error('위시리스트 상품 조회 오류:', error)
      setError('위시리스트 상품을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWishlist = async (productId) => {
    if (window.confirm('위시리스트에서 제거하시겠습니까?')) {
      try {
        setLoading(true)
        await removeFromWishlist(productId)
      } catch (error) {
        console.error('찜하기 제거 오류:', error)
        if (error.response?.status === 401) {
          alert('로그인이 필요합니다.')
          navigate('/login')
        } else {
          alert('위시리스트에서 상품을 제거하는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`)
  }

  return (
    <div className="wishlist-page">
      <Navbar />
      
      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1 className="wishlist-title">
            찜 목록
          </h1>
        </div>

        {loading ? (
          <div className="wishlist-loading">찜 목록을 불러오는 중...</div>
        ) : error ? (
          <div className="wishlist-error">{error}</div>
        ) : wishlistItems.length === 0 ? (
          <div className="wishlist-empty">
            <FontAwesomeIcon icon={faHeartRegular} className="empty-icon" />
            <h2>찜 목록이 비어있습니다</h2>
            <p>마음에 드는 상품을 찜해보세요!</p>
            <button className="shop-button" onClick={() => navigate('/')}>
              쇼핑하러 가기
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="wishlist-empty">
            <FontAwesomeIcon icon={faHeartRegular} className="empty-icon" />
            <h2>찜한 상품을 찾을 수 없습니다</h2>
            <p>상품이 삭제되었거나 더 이상 판매되지 않을 수 있습니다.</p>
            <button className="shop-button" onClick={() => navigate('/')}>
              쇼핑하러 가기
            </button>
          </div>
        ) : (
          <div className="wishlist-content">
            <div className="wishlist-header-info">
              <h2>찜한 상품 ({products.length}개)</h2>
            </div>

            <div className="wishlist-grid">
              {products.map((product) => (
                <div key={product._id} className="wishlist-item">
                  <div 
                    className="wishlist-item-image"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <img src={product.image} alt={product.name} />
                    <button
                      className="wishlist-remove-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFromWishlist(product._id)
                      }}
                      aria-label="위시리스트에서 제거"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                  <div 
                    className="wishlist-item-info"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <h3 className="wishlist-item-name">{product.name}</h3>
                    <div className="wishlist-item-details">
                      <span className="wishlist-item-category">{product.category}</span>
                      <span className="wishlist-item-sku">SKU: {product.sku}</span>
                    </div>
                    <div className="wishlist-item-price">
                      ₩{product.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Wishlist

