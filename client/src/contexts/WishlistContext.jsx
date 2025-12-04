import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const WishlistContext = createContext()

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(false)

  // 서버에서 찜 목록 불러오기
  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) {
      // 로그인하지 않은 경우 localStorage에서 불러오기 (fallback)
      const savedWishlist = localStorage.getItem('wishlist')
      if (savedWishlist) {
        try {
          setWishlistItems(JSON.parse(savedWishlist))
        } catch (error) {
          console.error('위시리스트 불러오기 오류:', error)
        }
      }
      return
    }

    try {
      setLoading(true)
      const response = await api.get('/wishlists')
      if (response.data.success) {
        // 서버 응답에서 productId 배열 추출
        const productIds = response.data.data.products.map(product => 
          product._id || product
        )
        setWishlistItems(productIds)
      }
    } catch (error) {
      console.error('찜 목록 조회 오류:', error)
      // 에러 발생 시 localStorage에서 불러오기 (fallback)
      const savedWishlist = localStorage.getItem('wishlist')
      if (savedWishlist) {
        try {
          setWishlistItems(JSON.parse(savedWishlist))
        } catch (e) {
          console.error('로컬 찜 목록 불러오기 오류:', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const addToWishlist = async (productId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      // 로그인하지 않은 경우 localStorage에만 저장
      setWishlistItems((prevItems) => {
        if (prevItems.includes(productId)) {
          return prevItems // 이미 있으면 추가하지 않음
        }
        const updated = [...prevItems, productId]
        localStorage.setItem('wishlist', JSON.stringify(updated))
        return updated
      })
      return
    }

    // 로그인한 경우 서버 API 호출
    try {
      const response = await api.post('/wishlists/items', {
        productId: productId,
      })
      
      if (response.data.success) {
        // 서버 응답으로 찜 목록 업데이트
        const productIds = response.data.data.products.map(product => 
          product._id || product
        )
        setWishlistItems(productIds)
      }
    } catch (error) {
      console.error('찜하기 추가 오류:', error)
      // 이미 추가된 상품인 경우 무시
      if (error.response?.status === 400) {
        // 이미 찜하기에 있는 상품이므로 상태만 업데이트
        if (!wishlistItems.includes(productId)) {
          setWishlistItems([...wishlistItems, productId])
        }
      } else {
        throw error
      }
    }
  }

  const removeFromWishlist = async (productId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      // 로그인하지 않은 경우 localStorage에서만 제거
      setWishlistItems((prevItems) => {
        const updated = prevItems.filter((id) => id !== productId)
        localStorage.setItem('wishlist', JSON.stringify(updated))
        return updated
      })
      return
    }

    // 로그인한 경우 서버 API 호출
    try {
      const response = await api.delete(`/wishlists/items/${productId}`)
      if (response.data.success) {
        // 서버 응답으로 찜 목록 업데이트
        const productIds = response.data.data.products.map(product => 
          product._id || product
        )
        setWishlistItems(productIds)
      }
    } catch (error) {
      console.error('찜하기 제거 오류:', error)
      throw error
    }
  }

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId)
    } else {
      await addToWishlist(productId)
    }
  }

  const isInWishlist = (productId) => {
    // productId를 문자열로 변환하여 비교
    return wishlistItems.some(id => 
      id.toString() === productId.toString()
    )
  }

  const clearWishlist = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    
    if (!token) {
      // 로그인하지 않은 경우 localStorage에서만 비우기
      setWishlistItems([])
      localStorage.removeItem('wishlist')
      return
    }

    // 로그인한 경우 서버 API 호출
    try {
      const response = await api.delete('/wishlists/clear')
      if (response.data.success) {
        setWishlistItems([])
      }
    } catch (error) {
      console.error('찜하기 비우기 오류:', error)
      throw error
    }
  }

  const getWishlistCount = () => {
    return wishlistItems.length
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        getWishlistCount,
        fetchWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

