import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faUpload, faTimes } from '@fortawesome/free-solid-svg-icons'
import api from '../../services/api'
import '../../styles/pages/Admin.css'

function ProductFormModal({ isOpen, onClose, productId, onSuccess }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    category: '',
    image: '',
    description: '',
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageInfo, setImageInfo] = useState(null)
  const widgetRef = useRef(null)
  const isEditMode = !!productId

  // 상품 정보 가져오기 (수정 모드일 때)
  useEffect(() => {
    if (isOpen && isEditMode && productId) {
      fetchProduct()
    } else if (isOpen && !isEditMode) {
      // 등록 모드일 때 폼 초기화
      resetForm()
    }
  }, [isOpen, productId, isEditMode])

  const fetchProduct = async () => {
    try {
      setFetching(true)
      const response = await api.get(`/products/${productId}`)
      
      if (response.data.success) {
        const product = response.data.data
        setFormData({
          sku: product.sku || '',
          name: product.name || '',
          price: product.price || '',
          category: product.category || '',
          image: product.image || '',
          description: product.description || '',
        })
        
        // 이미지가 있으면 이미지 정보 설정
        if (product.image) {
          setImageInfo({
            url: product.image,
            uploadedAt: product.updatedAt ? new Date(product.updatedAt).toLocaleString('ko-KR') : new Date().toLocaleString('ko-KR'),
          })
        }
      }
    } catch (error) {
      console.error('상품 조회 오류:', error)
      alert('상품 정보를 불러오는 중 오류가 발생했습니다.')
      onClose()
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    // 환경변수 검증
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      console.warn('Cloudinary 환경변수가 설정되지 않았습니다.')
      return
    }

    // Cloudinary 위젯 초기화
    if (window.cloudinary) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          sources: ['local', 'camera', 'url'],
          multiple: false,
          maxFileSize: 5000000, // 5MB
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary 업로드 오류:', error)
            alert('이미지 업로드 중 오류가 발생했습니다.')
            setUploading(false)
            return
          }

          if (result && result.event === 'success') {
            const imageUrl = result.info.secure_url
            const imageData = {
              url: imageUrl,
              publicId: result.info.public_id,
              format: result.info.format,
              width: result.info.width,
              height: result.info.height,
              bytes: result.info.bytes,
              uploadedAt: new Date().toLocaleString('ko-KR'),
            }
            setFormData((prev) => ({
              ...prev,
              image: imageUrl,
            }))
            setImageInfo(imageData)
            // 이미지 에러 초기화
            if (errors.image) {
              setErrors((prev) => ({
                ...prev,
                image: '',
              }))
            }
            setUploading(false)
          }

          if (result && result.event === 'close') {
            setUploading(false)
          }
        }
      )
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy()
      }
    }
  }, [isOpen, errors])

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      price: '',
      category: '',
      image: '',
      description: '',
    })
    setImageInfo(null)
    setErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleImageUpload = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      alert('Cloudinary 환경변수가 설정되지 않았습니다.')
      return
    }

    if (!window.cloudinary) {
      alert('Cloudinary 위젯을 로드할 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    if (!widgetRef.current) {
      alert('Cloudinary 위젯이 초기화되지 않았습니다. 페이지를 새로고침해주세요.')
      return
    }

    setUploading(true)
    widgetRef.current.open()
  }

  const handleRemoveImage = () => {
    if (window.confirm('업로드된 이미지를 삭제하시겠습니까?')) {
      setFormData((prev) => ({
        ...prev,
        image: '',
      }))
      setImageInfo(null)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU를 입력해주세요.'
    }

    if (!formData.name.trim()) {
      newErrors.name = '상품명을 입력해주세요.'
    }

    if (!formData.price) {
      newErrors.price = '상품가격을 입력해주세요.'
    } else if (Number(formData.price) < 0) {
      newErrors.price = '상품가격은 0 이상이어야 합니다.'
    }

    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요.'
    }

    if (!formData.image.trim()) {
      newErrors.image = '이미지를 업로드해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      // 서버에 전송할 데이터 준비
      const productData = {
        ...formData,
        price: Number(formData.price),
      }
      
      let response
      if (isEditMode) {
        response = await api.put(`/products/${productId}`, productData)
      } else {
        response = await api.post('/products', productData)
      }
      
      if (response.data.success) {
        alert(isEditMode ? '상품 정보가 성공적으로 수정되었습니다.' : '상품이 성공적으로 등록되었습니다.')
        resetForm()
        onClose()
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      console.error(isEditMode ? '상품 수정 오류:' : '상품 등록 오류:', error)
      
      let errorMessage = isEditMode ? '상품 수정 중 오류가 발생했습니다.' : '상품 등록 중 오류가 발생했습니다.'
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage
        
        if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join('\n')
        }
        
        if (error.response.status === 401) {
          errorMessage = '로그인이 필요합니다.'
        } else if (error.response.status === 403) {
          errorMessage = '관리자 권한이 필요합니다.'
        } else if (error.response.status === 404 && isEditMode) {
          errorMessage = '상품을 찾을 수 없습니다.'
        }
      } else if (error.request) {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content product-form-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditMode ? '상품 수정' : '새 상품 등록'}</h2>
          <button className="modal-close" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {fetching ? (
          <div className="loading-message" style={{ padding: '40px', textAlign: 'center' }}>
            상품 정보를 불러오는 중...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label htmlFor="sku">
                SKU <span className="required">*</span>
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="예: PROD-001"
                className={errors.sku ? 'input-error' : ''}
                disabled={isEditMode}
              />
              {errors.sku && <span className="error-text">{errors.sku}</span>}
              <p className="input-hint">상품 고유 번호 (중복 불가){isEditMode ? ' - 수정 불가' : ''}</p>
            </div>

            <div className="form-group">
              <label htmlFor="name">
                상품명 <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="상품명을 입력하세요"
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">
                  상품가격 <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className={errors.price ? 'input-error' : ''}
                />
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">
                  카테고리 <span className="required">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={errors.category ? 'input-error' : ''}
                >
                  <option value="">선택하세요</option>
                  <option value="상의">상의</option>
                  <option value="하의">하의</option>
                  <option value="악세사리">악세사리</option>
                </select>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faImage} /> 상품 이미지 <span className="required">*</span>
              </label>
              
              <div className="image-upload-section">
                <button
                  type="button"
                  className="upload-button"
                  onClick={handleImageUpload}
                  disabled={uploading || loading}
                >
                  <FontAwesomeIcon icon={faUpload} />
                  {uploading ? '업로드 중...' : 'Cloudinary 이미지 업로드'}
                </button>
              </div>
              
              {errors.image && <span className="error-text">{errors.image}</span>}
              
              {formData.image && (
                <div className="image-preview-container">
                  <div className="image-preview">
                    <img src={formData.image} alt="미리보기" onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }} />
                    <div className="image-error" style={{ display: 'none' }}>
                      이미지를 불러올 수 없습니다.
                    </div>
                    <button
                      type="button"
                      className="remove-image-button"
                      onClick={handleRemoveImage}
                      title="이미지 제거"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  {imageInfo && (
                    <div className="image-info">
                      <h4 className="image-info-title">이미지 정보</h4>
                      <div className="image-info-content">
                        <div className="info-row">
                          <span className="info-label">URL:</span>
                          <span className="info-value">
                            <a href={imageInfo.url} target="_blank" rel="noopener noreferrer" className="image-url-link">
                              {imageInfo.url}
                            </a>
                          </span>
                        </div>
                        {imageInfo.publicId && (
                          <div className="info-row">
                            <span className="info-label">Public ID:</span>
                            <span className="info-value">{imageInfo.publicId}</span>
                          </div>
                        )}
                        {imageInfo.width && imageInfo.height && (
                          <div className="info-row">
                            <span className="info-label">크기:</span>
                            <span className="info-value">{imageInfo.width} × {imageInfo.height}px</span>
                          </div>
                        )}
                        {imageInfo.format && (
                          <div className="info-row">
                            <span className="info-label">형식:</span>
                            <span className="info-value">{imageInfo.format.toUpperCase()}</span>
                          </div>
                        )}
                        {imageInfo.bytes && (
                          <div className="info-row">
                            <span className="info-label">파일 크기:</span>
                            <span className="info-value">{(imageInfo.bytes / 1024).toFixed(2)} KB</span>
                          </div>
                        )}
                        {imageInfo.uploadedAt && (
                          <div className="info-row">
                            <span className="info-label">업로드 시간:</span>
                            <span className="info-value">{imageInfo.uploadedAt}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">설명</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="상품에 대한 상세 설명을 입력하세요 (선택사항)"
                rows="4"
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleClose}
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="submit-product-button"
                disabled={loading}
              >
                {loading ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '상품 수정' : '상품 등록')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ProductFormModal
