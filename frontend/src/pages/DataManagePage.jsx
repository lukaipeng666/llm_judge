import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Input, message } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import useStore from '../stores'
import './DataManagePage.css'

export default function DataManagePage() {
  const navigate = useNavigate()
  const { userDataFiles, fetchUserDataFiles, uploadUserDataFile, deleteUserDataFile, loading, error } = useStore()

  const [uploading, setUploading] = useState(false)
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false)
  const [description, setDescription] = useState('')
  const [pendingFile, setPendingFile] = useState(null)

  useEffect(() => {
    fetchUserDataFiles()
  }, [])

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.csv')) {
      message.error('只支持 .jsonl 和 .csv 格式的文件')
      return
    }

    // 打开描述输入弹窗
    setPendingFile(file)
    setDescriptionModalVisible(true)
    e.target.value = '' // 重置文件输入
  }

  const handleUploadWithDescription = async () => {
    if (!pendingFile) return

    setUploading(true)
    setDescriptionModalVisible(false)

    try {
      await uploadUserDataFile(pendingFile, description || '')
      message.success('文件上传成功')
      setDescription('')
      setPendingFile(null)
    } catch (err) {
      message.error(err.message || '文件上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleCancelDescription = () => {
    setDescriptionModalVisible(false)
    setDescription('')
    setPendingFile(null)
  }


  const handleViewDetail = (dataId) => {
    navigate(`/data-detail/${dataId}`)
  }

  const handleDelete = async (id, filename) => {
    Modal.confirm({
      title: '确认删除文件',
      content: `确定要删除文件 "${filename}" 吗？此操作不可恢复。`,
      icon: <ExclamationCircleOutlined />,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await deleteUserDataFile(id)
          message.success('删除成功')
        } catch (err) {
          message.error(err.message || '删除失败')
        }
      }
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading && (!userDataFiles || userDataFiles.length === 0)) {
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
        {!userDataFiles || userDataFiles.length === 0 ? (
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
                    <span>{dataFile.description || '-'}</span>
                  </td>
                  <td className="file-size">
                    {formatFileSize(dataFile.file_size || 0)}
                  </td>
                  <td className="created-at">
                    {new Date(dataFile.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => handleViewDetail(dataFile.id)}
                      className="action-btn view-btn"
                    >
                      查看/编辑
                    </button>
                    <button
                      onClick={() => handleDelete(dataFile.id, dataFile.filename)}
                      className="action-btn delete-btn"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 文件描述输入弹窗 */}
      <Modal
        title="输入文件描述"
        open={descriptionModalVisible}
        onOk={handleUploadWithDescription}
        onCancel={handleCancelDescription}
        okText="确认上传"
        cancelText="取消"
        centered
        confirmLoading={uploading}
      >
        <Input.TextArea
          placeholder="请输入文件描述（可选）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  )
}
