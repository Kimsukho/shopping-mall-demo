import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { heroContent, newsletterContent } from '../data/homeData'
import api from '../services/api'
import '../styles/pages/Home.css'

function Home() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/products')
      
      if (response.data.success) {
        // 최신 상품 6개만 표시 (New Arrivals)
        const sortedProducts = response.data.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6)
        setProducts(sortedProducts)
      }
    } catch (error) {
      console.error('상품 목록 조회 오류:', error)
      setError('상품 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleShopNow = useCallback(() => {
    navigate('/products')
  }, [navigate])

  const handleNewsletterSubmit = useCallback((e) => {
    e.preventDefault()
    // TODO: 뉴스레터 구독 로직
    console.log('뉴스레터 구독')
  }, [])

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">{heroContent.badge}</div>
          <h2 className="hero-title">{heroContent.title}</h2>
          <h3 className="hero-subtitle">{heroContent.subtitle}</h3>
          <p className="hero-description">{heroContent.description}</p>
          <button className="shop-now-button" onClick={handleShopNow}>
            SHOP NOW
          </button>
        </div>
        <div className="hero-image">
          {/* 히어로 이미지 영역 - 배경 이미지로 처리 */}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="products-section">
        <div className="section-header">
          <h2 className="section-title">New Arrivals</h2>
          <a href="#" className="view-all-link">View All →</a>
        </div>
        {loading ? (
          <div className="products-loading">상품을 불러오는 중...</div>
        ) : error ? (
          <div className="products-error">{error}</div>
        ) : products.length === 0 ? (
          <div className="products-empty">등록된 상품이 없습니다.</div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard 
                key={product._id} 
                product={{
                  id: product._id,
                  name: product.name,
                  currentPrice: product.price.toString(),
                  image: product.image,
                  badge: 'NEW',
                }} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <h2 className="newsletter-title">{newsletterContent.title}</h2>
        <p className="newsletter-description">{newsletterContent.description}</p>
        <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="newsletter-input"
            required
          />
          <button type="submit" className="newsletter-button">Subscribe</button>
        </form>
        <p className="newsletter-privacy">{newsletterContent.privacyText}</p>
      </section>

      <Footer />
    </div>
  )
}

export default Home

