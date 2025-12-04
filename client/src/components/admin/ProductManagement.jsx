import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faEdit, faTrash, faList, faThLarge } from '@fortawesome/free-solid-svg-icons'
import api from '../../services/api'
import ProductFormModal from './ProductFormModal'
import '../../styles/pages/Admin.css'

function ProductManagement() {
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [productLoading, setProductLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'card'
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchField, setSearchField] = useState('all') // 검색 필드 선택
  const [selectedCategory, setSelectedCategory] = useState('all') // 선택된 카테고리
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  // 상품 등록 후 돌아왔을 때 목록 새로고침
  useEffect(() => {
    if (location.state?.refreshProducts) {
      fetchProducts()
      // state 초기화
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  const fetchProducts = async () => {
    try {
      setProductLoading(true)
      setError(null)
      const response = await api.get('/products')
      
      if (response.data.success) {
        setProducts(response.data.data || [])
      }
    } catch (error) {
      console.error('상품 목록 조회 오류:', error)
      setError('상품 목록을 불러오는 중 오류가 발생했습니다.')
      
      // 에러 메시지 설정
      if (error.response) {
        if (error.response.status === 401) {
          setError('로그인이 필요합니다.')
        } else if (error.response.status === 403) {
          setError('권한이 없습니다.')
        } else {
          setError(error.response.data?.message || '상품 목록을 불러올 수 없습니다.')
        }
      } else if (error.request) {
        setError('서버에 연결할 수 없습니다.')
      }
    } finally {
      setProductLoading(false)
    }
  }

  // 필터 및 검색 필터링
  const filteredProducts = useMemo(() => {
    let result = products

    // 카테고리 필터 적용 (셀렉트 박스)
    if (selectedCategory !== 'all') {
      result = result.filter((product) => product.category === selectedCategory)
    }

    // 검색 필드별 검색어 필터 적용 (카테고리 내에서 검색)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((product) => {
        if (searchField === 'all') {
          const name = product.name?.toLowerCase() || ''
          const sku = product.sku?.toLowerCase() || ''
          const category = product.category?.toLowerCase() || ''
          const description = product.description?.toLowerCase() || ''
          
          return (
            name.includes(query) ||
            sku.includes(query) ||
            category.includes(query) ||
            description.includes(query)
          )
        } else if (searchField === 'name') {
          return product.name?.toLowerCase().includes(query)
        } else if (searchField === 'sku') {
          return product.sku?.toLowerCase().includes(query)
        }
        return true
      })
    }

    return result
  }, [products, searchQuery, searchField, selectedCategory])

  // 페이지네이션 계산
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  // 검색어 또는 필터 변경 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, searchField, selectedCategory])

  const hasActiveFilters = selectedCategory !== 'all' || searchQuery.trim() !== ''

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`"${productName}" 상품을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await api.delete(`/products/${productId}`)
      
      if (response.data.success) {
        alert('상품이 삭제되었습니다.')
        fetchProducts() // 목록 새로고침
        // 현재 페이지에 상품이 없으면 이전 페이지로 이동
        if (paginatedProducts.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error)
      let errorMessage = '상품 삭제 중 오류가 발생했습니다.'
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage
        
        if (error.response.status === 401) {
          errorMessage = '로그인이 필요합니다.'
        } else if (error.response.status === 403) {
          errorMessage = '관리자 권한이 필요합니다.'
        }
      }
      
      alert(errorMessage)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1) // 페이지 크기 변경 시 첫 페이지로
  }


  return (
    <div className="tab-content">
      <div className="products-header">
        <h2 className="tab-title">상품 관리</h2>
        <button 
          className="add-product-button"
          onClick={() => {
            setEditingProductId(null)
            setIsModalOpen(true)
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          새 상품 등록
        </button>
      </div>

      <div className="products-list">
        <div className="products-list-header">
          <div className="products-header-left">
            <h3 className="form-section-title">등록된 상품 목록</h3>
            {/* {products.length > 0 && (
              <span className="products-count">
                {searchQuery ? `검색 결과: ${filteredProducts.length}개 / 전체: ${products.length}개` : `총 ${products.length}개`}
              </span>
            )} */}
          </div>
          <div className="products-header-right">
            <div className="view-mode-toggle">
              <button
                className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="리스트 보기"
              >
                <FontAwesomeIcon icon={faList} />
              </button>
              <button
                className={`view-mode-button ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title="카드 보기"
              >
                <FontAwesomeIcon icon={faThLarge} />
              </button>
            </div>
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
          </div>
        </div>

        {products.length > 0 && (
          <div className="detailed-filter-container">
            <div className="filter-row">
              <div className="filter-label">카테고리</div>
              <div className="filter-search-group">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="filter-search-select"
                  style={{ minWidth: '200px' }}
                >
                  <option value="all">전체</option>
                  <option value="상의">상의</option>
                  <option value="하의">하의</option>
                  <option value="악세사리">악세사리</option>
                </select>
              </div>
            </div>
            <div className="filter-row">
              <div className="filter-label">검색명</div>
              <div className="filter-search-group">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="filter-search-select"
                >
                  <option value="all">전체</option>
                  <option value="name">상품명</option>
                  <option value="sku">SKU</option>
                </select>
                <input
                  type="text"
                  placeholder={selectedCategory !== 'all' ? `${selectedCategory} 카테고리 내에서 검색` : '전체항목을 입력해주세요.'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="filter-search-input"
                />
                <button
                  className="filter-search-button"
                  onClick={() => {}}
                >
                  검색
                </button>
              </div>
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="table-count-info">
            {searchQuery || hasActiveFilters ? (
              <span>검색 결과: <strong>{filteredProducts.length}개</strong> / 전체: <strong>{products.length}개</strong></span>
            ) : (
              <span>총 <strong>{products.length}개</strong></span>
            )}
          </div>
        )}
        
        {productLoading ? (
          <div className="loading-message">상품 목록을 불러오는 중...</div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchProducts} className="retry-button">
              다시 시도
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-message">등록된 상품이 없습니다.</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-message">검색 결과가 없습니다.</div>
        ) : viewMode === 'list' ? (
          <>
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>이미지</th>
                    <th>상품명</th>
                    <th>카테고리</th>
                    <th>가격</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-table-image">
                          {product.image ? (
                            <img src={product.image} alt={product.name} />
                          ) : (
                            <div className="no-image">이미지 없음</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="product-table-name">{product.name}</div>
                        <div className="product-table-sku">SKU: {product.sku}</div>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <div className="product-table-price">
                          <span className="current-price">{product.price.toLocaleString()}원</span>
                        </div>
                      </td>
                      <td>
                        <div className="product-table-actions">
                          <button
                            className="edit-button"
                            onClick={() => {
                              setEditingProductId(product._id)
                              setIsModalOpen(true)
                            }}
                            title="수정"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteProduct(product._id, product.name)}
                            title="삭제"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                    // 현재 페이지 주변 2페이지씩만 표시
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
        ) : (
          <>
            <div className="products-grid">
              {paginatedProducts.map((product) => (
                <div key={product._id} className="product-item">
                  <div className="product-item-image">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="no-image">이미지 없음</div>
                    )}
                  </div>
                  <div className="product-item-info">
                    <h4>{product.name}</h4>
                    <p className="product-sku">SKU: {product.sku}</p>
                    <p className="product-price">{product.price.toLocaleString()}원</p>
                    <p className="product-category">카테고리: {product.category}</p>
                    {product.description && (
                      <p className="product-description">{product.description}</p>
                    )}
                  </div>
                  <div className="product-item-actions">
                    <button
                      className="edit-button"
                      onClick={() => {
                        setEditingProductId(product._id)
                        setIsModalOpen(true)
                      }}
                      title="수정"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteProduct(product._id, product.name)}
                      title="삭제"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
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

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProductId(null)
        }}
        productId={editingProductId}
        onSuccess={() => {
          fetchProducts()
        }}
      />
    </div>
  )
}

export default ProductManagement

