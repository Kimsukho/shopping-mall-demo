import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faEdit, faUser, faEnvelope, faTag, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons'
import api from '../../services/api'
import '../../styles/pages/Admin.css'

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchField, setSearchField] = useState('all') // 검색 필드 선택
  const [userTypeFilters, setUserTypeFilters] = useState({
    all: false,
    admin: false,
    customer: false,
  })
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    user_type: 'customer',
    address: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/users')
      if (response.data.success) {
        setUsers(response.data.data)
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user._id)
    setEditForm({
      name: user.name,
      email: user.email,
      user_type: user.user_type,
      address: user.address || '',
    })
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setEditForm({
      name: '',
      email: '',
      user_type: 'customer',
      address: '',
    })
  }

  const handleSaveEdit = async (userId) => {
    try {
      const response = await api.put(`/users/${userId}`, editForm)
      if (response.data.success) {
        alert('사용자 정보가 수정되었습니다.')
        setEditingUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error('사용자 수정 오류:', error)
      alert(error.response?.data?.message || '사용자 정보 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('정말 이 사용자를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await api.delete(`/users/${userId}`)
      if (response.data.success) {
        alert('사용자가 삭제되었습니다.')
        fetchUsers()
        // 현재 페이지에 사용자가 없으면 이전 페이지로 이동
        if (paginatedUsers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
      }
    } catch (error) {
      console.error('사용자 삭제 오류:', error)
      alert(error.response?.data?.message || '사용자 삭제 중 오류가 발생했습니다.')
    }
  }

  // 필터 및 검색 필터링
  const filteredUsers = useMemo(() => {
    let result = users

    // 사용자 타입 필터 적용 (체크박스)
    const activeUserTypes = Object.entries(userTypeFilters)
      .filter(([key, value]) => key !== 'all' && value)
      .map(([key]) => key)
    
    if (activeUserTypes.length > 0) {
      result = result.filter((user) => activeUserTypes.includes(user.user_type))
    }

    // 검색 필드별 검색어 필터 적용
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((user) => {
        if (searchField === 'all') {
          const name = user.name?.toLowerCase() || ''
          const email = user.email?.toLowerCase() || ''
          const address = user.address?.toLowerCase() || ''
          const userType = user.user_type === 'admin' ? '관리자' : '고객'
          
          return (
            name.includes(query) ||
            email.includes(query) ||
            address.includes(query) ||
            userType.includes(query)
          )
        } else if (searchField === 'name') {
          return user.name?.toLowerCase().includes(query)
        } else if (searchField === 'email') {
          return user.email?.toLowerCase().includes(query)
        } else if (searchField === 'address') {
          return user.address?.toLowerCase().includes(query)
        }
        return true
      })
    }

    return result
  }, [users, searchQuery, searchField, userTypeFilters])

  // 페이지네이션 계산
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredUsers.slice(startIndex, endIndex)
  }, [filteredUsers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // 검색어 또는 필터 변경 시 첫 페이지로
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, searchField, userTypeFilters])

  const handleUserTypeFilterChange = (type) => {
    if (type === 'all') {
      const newValue = !userTypeFilters.all
      setUserTypeFilters({
        all: newValue,
        admin: newValue,
        customer: newValue,
      })
    } else {
      setUserTypeFilters((prev) => {
        const newFilters = {
          ...prev,
          [type]: !prev[type],
        }
        // 모든 개별 필터가 체크되면 '전체'도 체크
        if (newFilters.admin && newFilters.customer) {
          newFilters.all = true
        } else {
          newFilters.all = false
        }
        return newFilters
      })
    }
  }

  const hasActiveFilters = Object.entries(userTypeFilters)
    .filter(([key]) => key !== 'all')
    .some(([, value]) => value) || searchQuery.trim() !== ''

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1) // 페이지 크기 변경 시 첫 페이지로
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="tab-content">
      <div className="users-header">
        <h2 className="tab-title">사용자 관리</h2>
      </div>

      <div className="users-list">
        <div className="users-list-header">
          <div className="users-header-left">
            <h3 className="form-section-title">등록된 사용자 목록</h3>
          </div>
          {users.length > 0 && (
            <div className="users-header-right">
              <div className="items-per-page-selector">
                <label htmlFor="usersItemsPerPage">페이지당:</label>
                <select
                  id="usersItemsPerPage"
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
          )}
        </div>

        {users.length > 0 && (
          <div className="detailed-filter-container">
            <div className="filter-row">
              <div className="filter-label">검색옵션</div>
              <div className="filter-checkboxes">
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={userTypeFilters.all}
                    onChange={() => handleUserTypeFilterChange('all')}
                  />
                  <span>전체</span>
                </label>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={userTypeFilters.admin}
                    onChange={() => handleUserTypeFilterChange('admin')}
                  />
                  <span>관리자</span>
                </label>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={userTypeFilters.customer}
                    onChange={() => handleUserTypeFilterChange('customer')}
                  />
                  <span>고객</span>
                </label>
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
                  <option value="name">이름</option>
                  <option value="email">이메일</option>
                  <option value="address">주소</option>
                </select>
                <input
                  type="text"
                  placeholder="전체항목을 입력해주세요."
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

        {users.length > 0 && (
          <div className="table-count-info">
            {searchQuery || hasActiveFilters ? (
              <span>검색 결과: <strong>{filteredUsers.length}개</strong> / 전체: <strong>{users.length}개</strong></span>
            ) : (
              <span>총 <strong>{users.length}개</strong></span>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-message">사용자 목록을 불러오는 중...</div>
        ) : users.length === 0 ? (
          <div className="empty-message">등록된 사용자가 없습니다.</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-message">검색 결과가 없습니다.</div>
        ) : (
          <>
            <div className="users-table-container">
              <table className="users-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>사용자 타입</th>
                  <th>주소</th>
                  <th>가입일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user._id}>
                    {editingUser === user._id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleInputChange}
                            className="edit-input"
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleInputChange}
                            className="edit-input"
                          />
                        </td>
                        <td>
                          <select
                            name="user_type"
                            value={editForm.user_type}
                            onChange={handleInputChange}
                            className="edit-select"
                          >
                            <option value="customer">고객</option>
                            <option value="admin">관리자</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            name="address"
                            value={editForm.address}
                            onChange={handleInputChange}
                            className="edit-input"
                          />
                        </td>
                        <td>
                          {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="save-button"
                              onClick={() => handleSaveEdit(user._id)}
                            >
                              저장
                            </button>
                            <button
                              className="cancel-button"
                              onClick={handleCancelEdit}
                            >
                              취소
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <div className="user-name">
                            <FontAwesomeIcon icon={faUser} />
                            {user.name}
                          </div>
                        </td>
                        <td>
                          <div className="user-email">
                            <FontAwesomeIcon icon={faEnvelope} />
                            {user.email}
                          </div>
                        </td>
                        <td>
                          <span className={`user-type ${user.user_type}`}>
                            <FontAwesomeIcon icon={faTag} />
                            {user.user_type === 'admin' ? '관리자' : '고객'}
                          </span>
                        </td>
                        <td>{user.address || '-'}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => handleEdit(user)}
                              aria-label="수정"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDelete(user._id)}
                              aria-label="삭제"
                              disabled={user._id === currentUser?._id}
                              title={user._id === currentUser?._id ? '자신의 계정은 삭제할 수 없습니다' : ''}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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

      <div className="admin-stats">
        <div className="stat-card">
          <h3>전체 사용자</h3>
          <p className="stat-number">{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>관리자</h3>
          <p className="stat-number">
            {users.filter((u) => u.user_type === 'admin').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>고객</h3>
          <p className="stat-number">
            {users.filter((u) => u.user_type === 'customer').length}
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserManagement

