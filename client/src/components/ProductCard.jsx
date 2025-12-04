import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart } from '@fortawesome/free-solid-svg-icons'
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons'
import { useWishlist } from '../contexts/WishlistContext'

const ProductCard = memo(({ product }) => {
  const navigate = useNavigate()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const isWishlisted = isInWishlist(product.id)

  const handleWishlistClick = (e) => {
    e.stopPropagation()
    toggleWishlist(product.id)
  }

  const handleCardClick = () => {
    navigate(`/products/${product.id}`)
  }

  return (
    <div className="product-card" onClick={handleCardClick}>
      <div 
        className="product-image"
        style={product.image ? {
          backgroundImage: `url(${product.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
      >
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
        <button 
          className={`wishlist-icon ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FontAwesomeIcon icon={isWishlisted ? faHeart : faHeartRegular} />
        </button>
      </div>
      <h3 className="product-name">{product.name}</h3>
      <div className="product-price">
        <span className="current-price">₩{Number(product.currentPrice).toLocaleString()}</span>
        {product.originalPrice && (
          <span className="original-price">₩{Number(product.originalPrice).toLocaleString()}</span>
        )}
      </div>
    </div>
  )
})

ProductCard.displayName = 'ProductCard'

export default ProductCard

