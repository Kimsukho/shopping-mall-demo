import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart, faArrowLeft, faHeart, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import '../styles/pages/Cart.css'

function Cart() {
  const navigate = useNavigate()
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart, fetchCart, loading: cartLoading } = useCart()
  const { addToWishlist } = useWishlist()
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [quantityInputs, setQuantityInputs] = useState({}) // 각 상품의 입력 중인 수량 값

  // 컴포넌트 마운트 시 장바구니 불러오기 (한 번만 실행)
  useEffect(() => {
    fetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 장바구니 아이템이 변경될 때마다 전체 선택 및 수량 입력값 동기화
  useEffect(() => {
    if (cartItems.length > 0) {
      const allItemKeys = new Set(cartItems.map(item => item.productId))
      setSelectedItems(allItemKeys)
      
      // 수량 입력값을 실제 장바구니 수량과 동기화
      const newQuantityInputs = {}
      cartItems.forEach(item => {
        newQuantityInputs[item.productId] = item.quantity
      })
      setQuantityInputs(newQuantityInputs)
    } else {
      setSelectedItems(new Set())
      setQuantityInputs({})
    }
  }, [cartItems])

  const handleRemoveItem = async (productId) => {
    if (window.confirm('정말 이 상품을 장바구니에서 제거하시겠습니까?')) {
      try {
        setLoading(true)
        await removeFromCart(productId)
      } catch (error) {
        console.error('장바구니 제거 오류:', error)
        if (error.response?.status === 401) {
          alert('로그인이 필요합니다.')
          navigate('/login')
        } else {
          alert('장바구니에서 상품을 제거하는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(productId)
    } else {
      try {
        setLoading(true)
        await updateQuantity(productId, newQuantity)
      } catch (error) {
        console.error('장바구니 수량 수정 오류:', error)
        if (error.response?.status === 401) {
          alert('로그인이 필요합니다.')
          navigate('/login')
        } else {
          alert('장바구니 수량을 수정하는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }
  }

  // 전체 선택/해제
  const handleSelectAll = (checked) => {
    if (checked) {
      const allItemKeys = new Set(cartItems.map(item => item.productId))
      setSelectedItems(allItemKeys)
    } else {
      setSelectedItems(new Set())
    }
  }

  // 개별 아이템 선택/해제
  const handleSelectItem = (itemKey, checked) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(itemKey)
    } else {
      newSelected.delete(itemKey)
    }
    setSelectedItems(newSelected)
  }

  // 선택된 아이템들 가져오기
  const getSelectedItems = () => {
    return cartItems.filter(item => 
      selectedItems.has(item.productId)
    )
  }

  // 선택된 상품 삭제
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) {
      alert('삭제할 상품을 선택해주세요.')
      return
    }
    if (window.confirm(`선택한 ${selectedItems.size}개의 상품을 삭제하시겠습니까?`)) {
      try {
        setLoading(true)
        const selectedItemsList = getSelectedItems()
        for (const item of selectedItemsList) {
          await removeFromCart(item.productId)
        }
        setSelectedItems(new Set())
      } catch (error) {
        console.error('장바구니 제거 오류:', error)
        if (error.response?.status === 401) {
          alert('로그인이 필요합니다.')
          navigate('/login')
        } else {
          alert('장바구니에서 상품을 제거하는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }
  }

  // 선택된 상품 찜하기
  const handleWishlistSelected = () => {
    if (selectedItems.size === 0) {
      alert('찜할 상품을 선택해주세요.')
      return
    }
    getSelectedItems().forEach(item => {
      addToWishlist(item.productId)
    })
    alert(`${selectedItems.size}개의 상품이 찜 목록에 추가되었습니다.`)
  }

  // 선택된 상품 주문
  const handleCheckoutSelected = () => {
    if (selectedItems.size === 0) {
      alert('주문할 상품을 선택해주세요.')
      return
    }
    // TODO: 선택된 상품만 결제 페이지로 이동
    alert('선택한 상품 주문 기능은 준비 중입니다.')
  }

  // 전체 상품 주문
  const handleCheckoutAll = () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.')
      return
    }
    // 주문 페이지로 이동
    navigate('/checkout')
  }

  const totalPrice = getCartTotal()
  const selectedCount = selectedItems.size
  const isAllSelected = cartItems.length > 0 && selectedItems.size === cartItems.length

  return (
    <div className="cart-page">
      <Navbar />
      
      <div className="cart-container">
        <div className="cart-header">
          {/* <button className="back-button" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} />
            뒤로가기
          </button> */}
          <h1 className="cart-title">장바구니</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <FontAwesomeIcon icon={faShoppingCart} className="empty-icon" />
            <h2>장바구니가 비어있습니다</h2>
            <p>상품을 추가해보세요!</p>
            <button className="shop-button" onClick={() => navigate('/')}>
              쇼핑하러 가기
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items-section">
              {/* 테이블 헤더 위의 선택 및 액션 버튼 */}
              <div className="cart-table-header-actions">
                <label className="select-all-label">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="select-all-checkbox"
                  />
                  <span>전체선택</span>
                </label>
                <div className="header-action-buttons">
                  <button 
                    className="header-action-button"
                    onClick={handleDeleteSelected}
                    disabled={selectedCount === 0}
                  >
                    상품선택삭제
                  </button>
                  <button 
                    className="header-action-button"
                    onClick={handleWishlistSelected}
                    disabled={selectedCount === 0}
                  >
                    선택상품찜
                  </button>
                </div>
              </div>

              <div className="cart-table-container">
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th className="checkbox-column"></th>
                      <th>상품정보</th>
                      <th>수량</th>
                      <th>상품금액</th>
                      <th>배송비</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, index) => {
                      const itemKey = item.productId
                      const isSelected = selectedItems.has(itemKey)
                      const itemTotal = item.price * item.quantity
                      
                      return (
                        <tr key={itemKey} className={isSelected ? 'selected' : ''}>
                          <td className="checkbox-column">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectItem(itemKey, e.target.checked)}
                              className="item-checkbox"
                            />
                          </td>
                          <td className="product-info-column">
                            <div 
                              className="product-info-cell"
                              onClick={() => navigate(`/products/${item.productId}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="cart-item-image">
                                <img src={item.image} alt={item.name} />
                              </div>
                              <div className="cart-item-info">
                                <h3 className="cart-item-name">{item.name}</h3>
                                <div className="cart-item-details">
                                  <span className="cart-item-sku">SKU: {item.sku}</span>
                                </div>
                                <button
                                  className="option-change-link"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/products/${item.productId}`)
                                  }}
                                >
                                  옵션/수량변경
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="quantity-column">
                            <div className="quantity-controls-inline">
                              <button
                                className="quantity-button-inline"
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <FontAwesomeIcon icon={faMinus} />
                              </button>
                              <input
                                type="number"
                                className="quantity-value-inline"
                                value={quantityInputs[item.productId] ?? item.quantity}
                                min="1"
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 1
                                  // 입력값만 로컬 state에 저장 (실제 수량 변경은 하지 않음)
                                  setQuantityInputs(prev => ({
                                    ...prev,
                                    [item.productId]: newValue > 0 ? newValue : 1
                                  }))
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    const newValue = parseInt(e.target.value) || 1
                                    if (newValue > 0) {
                                      handleQuantityChange(item.productId, newValue)
                                    } else {
                                      // 유효하지 않은 값이면 원래 수량으로 복원
                                      setQuantityInputs(prev => ({
                                        ...prev,
                                        [item.productId]: item.quantity
                                      }))
                                    }
                                    e.target.blur()
                                  }
                                }}
                                onBlur={() => {
                                  // 포커스를 잃었을 때 입력값이 유효하지 않으면 원래 수량으로 복원
                                  const currentValue = quantityInputs[item.productId]
                                  if (!currentValue || currentValue < 1) {
                                    setQuantityInputs(prev => ({
                                      ...prev,
                                      [item.productId]: item.quantity
                                    }))
                                  }
                                }}
                              />
                              <button
                                className="quantity-button-inline"
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              >
                                <FontAwesomeIcon icon={faPlus} />
                              </button>
                            </div>
                          </td>
                          <td className="price-column">
                            ₩{item.price.toLocaleString()}
                          </td>
                          <td className="shipping-column">
                            {index === 0 ? (
                              <div className="shipping-info">무료</div>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="cart-total-summary">
                <div className="total-summary-line">
                  <span>총 상품금액</span>
                  <span>₩{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 오른쪽 주문 정보 박스 */}
            <div className="cart-order-info-section">
              <div className="order-info-box">
                <h3 className="order-info-title">주문정보</h3>
                <div className="order-info-content">
                  <div className="order-info-row">
                    <span>총 상품금액</span>
                    <span>₩{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="order-info-row">
                    <span>총 배송비</span>
                    <span>{totalPrice >= 50000 ? '0원' : '₩3,000'}</span>
                  </div>
                  <div className="order-info-row discount-row">
                    <span>할인금액</span>
                    <span className="discount-amount">-₩0</span>
                  </div>
                  <div className="order-info-divider"></div>
                  <div className="order-info-row total-row">
                    <span>총 합계</span>
                    <span className="total-amount">₩{(totalPrice + (totalPrice >= 50000 ? 0 : 3000)).toLocaleString()}</span>
                  </div>
                  <div className="order-info-row points-row">
                    <span>총 적립예정 포인트</span>
                    <span>0P</span>
                  </div>
                </div>
                <div className="order-info-terms">
                  <ul>
                    <li>장바구니 상품은 최대 30일간 보관됩니다.</li>
                    <li>쿠폰 및 적립금은 주문서에서 사용 가능합니다.</li>
                    <li>배송비는 상품별로 다를 수 있습니다.</li>
                    <li>반품/교환은 배송완료 후 7일 이내 가능합니다.</li>
                  </ul>
                </div>
                <button 
                  className="purchase-button"
                  onClick={handleCheckoutAll}
                  disabled={loading || cartItems.length === 0}
                >
                  구매하기 ({cartItems.length}건)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Cart

