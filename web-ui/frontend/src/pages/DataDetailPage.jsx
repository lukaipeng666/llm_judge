import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '../stores'
import './DataDetailPage.css'

export default function DataDetailPage() {
  const { dataId } = useParams()
  const navigate = useNavigate()
  const { currentDataDetail, dataDetailLoading, fetchDataContent, clearDataDetail } = useStore()
  
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState([])

  useEffect(() => {
    if (!dataId) {
      navigate('/data')
      return
    }
    fetchDataContent(parseInt(dataId))
    
    return () => {
      clearDataDetail()
    }
  }, [dataId, fetchDataContent, clearDataDetail])

  useEffect(() => {
    if (currentDataDetail?.data) {
      const data = currentDataDetail.data
      if (searchText.trim()) {
        const lowerSearch = searchText.toLowerCase()
        const filtered = data.filter(item => {
          const itemStr = JSON.stringify(item).toLowerCase()
          return itemStr.includes(lowerSearch)
        })
        setFilteredData(filtered)
      } else {
        setFilteredData(data)
      }
    }
  }, [currentDataDetail, searchText])

  const toggleRowExpand = (index) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  const renderJsonValue = (value) => {
    if (value === null) return 'null'
    if (typeof value === 'boolean') return value.toString()
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'string') return `"${value}"`
    if (Array.isArray(value)) return `[${value.length} items]`
    if (typeof value === 'object') return '{...}'
    return String(value)
  }

  if (dataDetailLoading && !currentDataDetail) {
    return <div className="loading">加载中...</div>
  }

  if (!currentDataDetail) {
    return <div className="error-message">无法加载数据详情</div>
  }

  if (currentDataDetail.error) {
    return (
      <div className="data-detail-container">
        <div className="detail-header">
          <button onClick={() => navigate('/data')} className="back-button">← 返回</button>
          <h1>{currentDataDetail.filename}</h1>
        </div>
        <div className="error-message" style={{ marginTop: '20px' }}>
          {currentDataDetail.error}
        </div>
      </div>
    )
  }

  return (
    <div className="data-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate('/data')} className="back-button">← 返回</button>
        <h1>{currentDataDetail.filename}</h1>
        {currentDataDetail.description && (
          <p className="file-description">{currentDataDetail.description}</p>
        )}
      </div>

      <div className="detail-stats">
        <div className="stat-item">
          <span className="stat-label">总数据条数：</span>
          <span className="stat-value">{currentDataDetail.total_count}</span>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="搜索数据（支持任意字段）..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
        <span className="search-result">
          {filteredData.length} / {currentDataDetail.total_count} 条
        </span>
      </div>

      <div className="data-list-container">
        {filteredData.length === 0 ? (
          <div className="empty-state">
            <p>没有匹配的数据</p>
          </div>
        ) : (
          <div className="data-items">
            {filteredData.map((item, index) => (
              <div key={index} className="data-item">
                <div 
                  className="item-header"
                  onClick={() => toggleRowExpand(index)}
                >
                  <button className="expand-button">
                    {expandedRows.has(index) ? '▼' : '▶'}
                  </button>
                  <span className="item-index">第 {index + 1} 条</span>
                  <div className="item-preview">
                    {Object.entries(item).slice(0, 3).map(([key, value]) => (
                      <span key={key} className="preview-field">
                        <span className="field-name">{key}:</span>
                        <span className="field-value">{renderJsonValue(value)}</span>
                      </span>
                    ))}
                    {Object.keys(item).length > 3 && (
                      <span className="preview-more">+{Object.keys(item).length - 3} more</span>
                    )}
                  </div>
                </div>

                {expandedRows.has(index) && (
                  <div className="item-content">
                    <div className="json-container">
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(JSON.stringify(item, null, 2))}
                      >
                        复制 JSON
                      </button>
                      <pre className="json-view">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
