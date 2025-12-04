import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDollarSign, faShoppingCart, faBox } from '@fortawesome/free-solid-svg-icons'
import '../../styles/pages/Admin.css'

function Analytics({ totalProducts }) {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    monthlyRevenue: [],
  })

  useEffect(() => {
    fetchAnalytics()
  }, [totalProducts])

  const fetchAnalytics = async () => {
    try {
      // TODO: API 연동
      // const response = await api.get('/analytics')
      // if (response.data.success) {
      //   setAnalytics(response.data.data)
      // }
      // 임시 데이터
      setAnalytics({
        totalRevenue: 1250000,
        totalOrders: 156,
        totalProducts: totalProducts || 0,
        monthlyRevenue: [
          { month: '1월', revenue: 250000 },
          { month: '2월', revenue: 300000 },
          { month: '3월', revenue: 350000 },
          { month: '4월', revenue: 350000 },
        ],
      })
    } catch (error) {
      console.error('매출 분석 조회 오류:', error)
    }
  }

  return (
    <div className="tab-content">
      <h2 className="tab-title">매출 분석</h2>
      <div className="analytics-stats">
        <div className="analytics-card">
          <div className="analytics-icon revenue">
            <FontAwesomeIcon icon={faDollarSign} />
          </div>
          <div className="analytics-info">
            <h3>총 매출</h3>
            <p className="analytics-number">${analytics.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon orders">
            <FontAwesomeIcon icon={faShoppingCart} />
          </div>
          <div className="analytics-info">
            <h3>총 주문</h3>
            <p className="analytics-number">{analytics.totalOrders}</p>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon products">
            <FontAwesomeIcon icon={faBox} />
          </div>
          <div className="analytics-info">
            <h3>등록 상품</h3>
            <p className="analytics-number">{analytics.totalProducts}</p>
          </div>
        </div>
      </div>

      <div className="revenue-chart-container">
        <h3 className="chart-title">월별 매출 추이</h3>
        <div className="revenue-chart">
          {analytics.monthlyRevenue.map((item, index) => {
            const maxRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue))
            const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
            return (
              <div key={index} className="chart-bar">
                <div className="bar-value" style={{ height: `${height}%` }}>
                  <span className="bar-amount">${(item.revenue / 1000).toFixed(0)}k</span>
                </div>
                <div className="bar-label">{item.month}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Analytics

