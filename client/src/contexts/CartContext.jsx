import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      // 로그인하지 않은 경우 localStorage에서 불러오기 (fallback)
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart))
        } catch (error) {
          console.error('장바구니 불러오기 오류:', error)
        }
      }
      return
    }

    try {
      setLoading(true)
      const response = await api.get('/carts')
      if (response.data.success) {
        // 서버 응답을 클라이언트 형식으로 변환
        const items = response.data.data.items.map(item => ({
          productId: item.product._id || item.product,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          quantity: item.quantity,
          sku: item.product.sku,
          category: item.product.category,
        }))
        setCartItems(items)
      }
    } catch (error) {
      // 네트워크 오류나 401 오류는 조용히 처리 (fallback으로 이동)
      if (error.code === 'ERR_NETWORK' || error.response?.status === 401) {
        // 네트워크 오류나 인증 오류인 경우 localStorage에서 불러오기
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart))
          } catch (e) {
            console.error('로컬 장바구니 불러오기 오류:', e)
          }
        }
      } else {
        console.error('장바구니 조회 오류:', error)
        // 기타 에러도 localStorage에서 불러오기 (fallback)
        const savedCart = localStorage.getItem('cart')
        if (savedCart) {
          try {
            setCartItems(JSON.parse(savedCart))
          } catch (e) {
            console.error('로컬 장바구니 불러오기 오류:', e)
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // 서버에서 장바구니 불러오기
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const addToCart = async (item) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      // 로그인하지 않은 경우 localStorage에만 저장
      setCartItems((prevItems) => {
        const existingItem = prevItems.find(
          (i) => i.productId === item.productId
        )

        if (existingItem) {
          const updated = prevItems.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          )
          localStorage.setItem('cart', JSON.stringify(updated))
          return updated
        }

        const updated = [...prevItems, item]
        localStorage.setItem('cart', JSON.stringify(updated))
        return updated
      })
      return
    }

    // 로그인한 경우 서버 API 호출
    try {
      const response = await api.post('/carts/items', {
        productId: item.productId,
        quantity: item.quantity,
      })
      
      if (response.data.success) {
        // 서버 응답으로 장바구니 업데이트
        const items = response.data.data.items.map(cartItem => ({
          productId: cartItem.product._id || cartItem.product,
          name: cartItem.product.name,
          price: cartItem.product.price,
          image: cartItem.product.image,
          quantity: cartItem.quantity,
          sku: cartItem.product.sku,
          category: cartItem.product.category,
        }))
        setCartItems(items)
      }
    } catch (error) {
      console.error('장바구니 추가 오류:', error)
      throw error
    }
  }

  const removeFromCart = async (productId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      // 로그인하지 않은 경우 localStorage에서만 제거
      setCartItems((prevItems) => {
        const updated = prevItems.filter(
          (item) => item.productId !== productId
        )
        localStorage.setItem('cart', JSON.stringify(updated))
        return updated
      })
      return
    }

    // 로그인한 경우 서버 API 호출
    try {
      const response = await api.delete(`/carts/items/${productId}`)
      if (response.data.success) {
        const items = response.data.data.items.map(item => ({
          productId: item.product._id || item.product,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          quantity: item.quantity,
          sku: item.product.sku,
          category: item.product.category,
        }))
        setCartItems(items)
      }
    } catch (error) {
      console.error('장바구니 제거 오류:', error)
      throw error
    }
  }

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      // 로그인하지 않은 경우 localStorage에서만 수정
      setCartItems((prevItems) => {
        const updated = prevItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        )
        localStorage.setItem('cart', JSON.stringify(updated))
        return updated
      })
      return
    }

    // 로그인한 경우 서버 API 호출
    try {
      const response = await api.put(`/carts/items/${productId}`, { quantity })
      if (response.data.success) {
        const items = response.data.data.items.map(item => ({
          productId: item.product._id || item.product,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          quantity: item.quantity,
          sku: item.product.sku,
          category: item.product.category,
        }))
        setCartItems(items)
      }
    } catch (error) {
      console.error('장바구니 수량 수정 오류:', error)
      throw error
    }
  }

  const clearCart = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      // 로그인하지 않은 경우 localStorage에서만 비우기
      setCartItems([])
      localStorage.removeItem('cart')
      return
    }

    // 로그인한 경우 서버 API 호출
    try {
      const response = await api.delete('/carts/clear')
      if (response.data.success) {
        setCartItems([])
      }
    } catch (error) {
      console.error('장바구니 비우기 오류:', error)
      throw error
    }
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        fetchCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

