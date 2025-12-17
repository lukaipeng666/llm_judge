import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../stores'
import './DataManagePage.css'

export default function DataManagePage() {
  const navigate = useNavigate()
  const { userDataFiles, fetchUserDataFiles, uploadUserDataFile, updateUserDataFile, deleteUserDataFile, loading, error } = useStore()
  
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    fetchUserDataFiles()
  }, [])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.csv')) {
      alert('只支持 .jsonl 和 .csv 格式的文件')
      return
    }

    setUploading(true)
    try {
      const description = prompt('请输入文件描述（可选）：')
      await uploadUserDataFile(file, description || '')
      alert('文件上传成功')
      e.target.value = '' // 重置文件输入
    } catch (err) {
      alert(err.message || '文件上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (dataFile) => {
    setEditingId(dataFile.id)
    setEditDescription(dataFile.description || '')
  }

  const handleSaveEdit = async (id) => {
    try {
      await updateUserDataFile(id, editDescription)
      setEditingId(null)
      alert('更新成功')
    } catch (err) {
      alert(err.message || '更新失败')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditDescription('')
  }

  const handleViewDetail = (dataId) => {
    navigate(`/data-detail/${dataId}`)
  }

  const handleDelete = async (id, filename) => {
    if (!confirm(`确定要删除文件 "${filename}" 吗？`)) return

    try {
      await deleteUserDataFile(id)
      alert('删除成功')
    } catch (err) {
      alert(err.message || '删除失败')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading && !userDataFiles.length) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="data-manage-container">
      <div className="data-manage-header">
        <h1>数据管理</h1>
        <p className="subtitle">管理你的评测数据文件</p>
      </div>

      <div className="upload-section">
        <label htmlFor="file-upload" className="upload-button">
          {uploading ? '上传中...' : '+ 上传数据文件'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".jsonl,.csv"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        <span className="upload-hint">支持 .jsonl 和 .csv 格式文件</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="data-list">
        {userDataFiles.length === 0 ? (
          <div className="empty-state">
            <p>暂无数据文件</p>
            <p className="hint">点击上方按钮上传你的第一个数据文件</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>文件名</th>
                <th>描述</th>
                <th>大小</th>
                <th>上传时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {userDataFiles.map((dataFile) => (
                <tr key={dataFile.id}>
                  <td className="filename">{dataFile.filename}</td>
                  <td className="description">
                    {editingId === dataFile.id ? (
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="输入描述..."
                        className="edit-input"
                      />
                    ) : (
                      <span>{dataFile.description || '-'}</span>
                    )}
                  </td>
                  <td className="file-size">
                    {formatFileSize(dataFile.file_size || 0)}
                  </td>
                  <td className="created-at">
                    {new Date(dataFile.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="actions">
                    {editingId === dataFile.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(dataFile.id)}
                          className="action-btn save-btn"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="action-btn cancel-btn"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleViewDetail(dataFile.id)}
                          className="action-btn view-btn"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => handleEdit(dataFile)}
                          className="action-btn edit-btn"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(dataFile.id, dataFile.filename)}
                          className="action-btn delete-btn"
                        >
                          删除
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
