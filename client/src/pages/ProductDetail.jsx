import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart, faHeart, faChevronRight, faChevronDown, faChevronUp, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons'
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import api from '../services/api'
import '../styles/pages/ProductDetail.css'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [showDetails, setShowDetails] = useState(false)
  const [showCare, setShowCare] = useState(false)
  
  const isWishlisted = product ? isInWishlist(product._id) : false
  
  // 카테고리 한글 매핑
  const categoryMap = {
    '상의': '상의',
    '하의': '하의',
    '악세사리': '악세사리',
  }

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/products/${id}`)
      
      if (response.data.success) {
        setProduct(response.data.data)
      }
    } catch (error) {
      console.error('상품 조회 오류:', error)
      setError('상품을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      sku: product.sku,
      category: product.category,
    }

    try {
      await addToCart(cartItem)
      alert(`${product.name} ${quantity}개가 장바구니에 추가되었습니다.`)
    } catch (error) {
      console.error('장바구니 추가 오류:', error)
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.')
        navigate('/login')
      } else {
        alert('장바구니에 상품을 추가하는 중 오류가 발생했습니다.')
      }
    }
  }

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return
    if (newQuantity > 99) return // 최대 99개로 제한
    setQuantity(newQuantity)
  }

  const handleWishlist = async () => {
    if (product) {
      try {
        await toggleWishlist(product._id)
      } catch (error) {
        console.error('찜하기 오류:', error)
        if (error.response?.status === 401) {
          alert('로그인이 필요합니다.')
          navigate('/login')
        } else {
          alert('찜하기 기능을 사용하는 중 오류가 발생했습니다.')
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <div className="product-detail-loading">상품을 불러오는 중...</div>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <div className="product-detail-error">
          {error || '상품을 찾을 수 없습니다.'}
          <button onClick={() => navigate('/')} className="back-home-button">
            홈으로 돌아가기
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="product-detail-page">
      <Navbar />
      
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/" className="breadcrumb-link">홈</Link>
          <FontAwesomeIcon icon={faChevronRight} className="breadcrumb-separator" />
          <span className="breadcrumb-current">{categoryMap[product.category] || product.category}</span>
        </div>

        <div className="product-detail-content">
          {/* 상품 이미지 */}
          <div className="product-image-section">
            <div className="product-main-image">
              <img src={product.image} alt={product.name} />
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-price-section">
              <span className="product-price">₩{product.price.toLocaleString()}</span>
            </div>

            {/* 개수 선택 */}
            <div className="product-quantity-section">
              <div className="quantity-label">
                <span>수량</span>
              </div>
              <div className="quantity-controls">
                <button
                  className="quantity-button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  aria-label="수량 감소"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <input
                  type="number"
                  className="quantity-input"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    handleQuantityChange(value)
                  }}
                  min="1"
                  max="99"
                  aria-label="수량"
                />
                <button
                  className="quantity-button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 99}
                  aria-label="수량 증가"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>

            {/* 배송 정보 */}
            <div className="shipping-info">
              <div className="shipping-location">
                <strong>배송지</strong> SOUTH KOREA
              </div>
              <div className="shipping-details">
                <div className="shipping-item">
                  <span>50,000원 이상 구매 시 무료배송</span>
                </div>
                <div className="shipping-item">
                  <span>배송 기간: 4-5일 소요</span>
                </div>
                <div className="shipping-item">
                  <span>14일 이내 국내 무료반품</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="product-actions">
              <button className="add-to-cart-button" onClick={handleAddToCart}>
                <FontAwesomeIcon icon={faShoppingCart} />
                장바구니에 담기
              </button>
              <button 
                className={`wishlist-button ${isWishlisted ? 'active' : ''}`}
                onClick={handleWishlist}
              >
                <FontAwesomeIcon icon={isWishlisted ? faHeart : faHeartRegular} />
              </button>
            </div>

            {/* 제품 상세사항 (아코디언) */}
            <div className="product-accordion">
              <button
                className="accordion-header"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span>제품 상세사항</span>
                <FontAwesomeIcon
                  icon={showDetails ? faChevronUp : faChevronDown}
                  className="accordion-icon"
                />
              </button>
              {showDetails && (
                <div className="accordion-content">
                  <div className="detail-item">
                    <strong>카테고리:</strong> {product.category}
                  </div>
                  <div className="detail-item">
                    <strong>SKU:</strong> {product.sku}
                  </div>
                  {product.description && (
                    <div className="detail-item">
                      <strong>설명:</strong> {product.description}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 세탁방법 (아코디언) */}
            <div className="product-accordion">
              <button
                className="accordion-header"
                onClick={() => setShowCare(!showCare)}
              >
                <span>세탁방법</span>
                <FontAwesomeIcon
                  icon={showCare ? faChevronUp : faChevronDown}
                  className="accordion-icon"
                />
              </button>
              {showCare && (
                <div className="accordion-content">
                  <div className="care-item">
                    <span>• 다림질 금지</span>
                  </div>
                  <div className="care-item">
                    <span>• 표백제 사용 금지</span>
                  </div>
                  <div className="care-item">
                    <span>• 드라이 건조하지 마십시오</span>
                  </div>
                  <div className="care-item">
                    <span>• 물세탁 가능</span>
                  </div>
                  <div className="care-item">
                    <span>• 드라이클리닝 가능</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ProductDetail

