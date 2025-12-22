import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Modal, Button, Input, Select, Radio, message, Space, Divider, Checkbox, Upload } from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import useStore from '../stores'
import { editUserDataContent, editSingleItemComplete, deleteSingleItem, batchDeleteItems, addSingleItem, appendDataFile } from '../services/api'
import './DataDetailPage.css'

const { TextArea } = Input
const { Option } = Select

export default function DataDetailPage() {
  const { dataId } = useParams()
  const navigate = useNavigate()
  const { currentDataDetail, dataDetailLoading, fetchDataContent, clearDataDetail } = useStore()
  
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState([])
  
  // 编辑相关状态
  const [editingItems, setEditingItems] = useState({}) // {originalIndex: editedJsonString}
  const [batchEditModalVisible, setBatchEditModalVisible] = useState(false)
  const [batchEditFieldType, setBatchEditFieldType] = useState('meta_description')
  const [batchEditRole, setBatchEditRole] = useState('')
  const [batchEditValue, setBatchEditValue] = useState('')
  const [batchEditing, setBatchEditing] = useState(false)
  
  // 批量选择和删除相关状态
  const [selectedItems, setSelectedItems] = useState(new Set()) // 选中的数据索引集合
  const [batchDeleting, setBatchDeleting] = useState(false)
  
  // 添加数据相关状态
  const [addItemModalVisible, setAddItemModalVisible] = useState(false)
  const [newItemJson, setNewItemJson] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  
  // 导入追加相关状态
  const [importing, setImporting] = useState(false)
  
  // 获取所有可用的角色
  const getAllRoles = () => {
    if (!currentDataDetail?.data) return []
    const roles = new Set()
    currentDataDetail.data.forEach(item => {
      if (item.turns && Array.isArray(item.turns)) {
        item.turns.forEach(turn => {
          if (turn.role) roles.add(turn.role)
        })
      }
    })
    return Array.from(roles)
  }

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
    message.success('已复制到剪贴板')
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

  // 验证编辑后的JSON是否只修改了允许的字段
  const validateEditedJson = (originalItem, editedJsonString) => {
    try {
      const editedItem = JSON.parse(editedJsonString)
      
      // 检查结构是否一致（不允许修改JSON结构）
      const originalKeys = Object.keys(originalItem).sort()
      const editedKeys = Object.keys(editedItem).sort()
      if (JSON.stringify(originalKeys) !== JSON.stringify(editedKeys)) {
        return { valid: false, error: '不允许修改JSON结构，只能修改meta_description和turns中的text字段' }
      }
      
      // 检查meta字段
      if (originalItem.meta && editedItem.meta) {
        const originalMetaKeys = Object.keys(originalItem.meta).sort()
        const editedMetaKeys = Object.keys(editedItem.meta).sort()
        if (JSON.stringify(originalMetaKeys) !== JSON.stringify(editedMetaKeys)) {
          return { valid: false, error: '不允许修改meta的结构，只能修改meta_description字段' }
        }
        // 检查meta_description是否改变
        if (originalItem.meta.meta_description !== editedItem.meta.meta_description) {
          // 允许修改
        }
      } else if (originalItem.meta !== editedItem.meta) {
        return { valid: false, error: '不允许修改meta的结构' }
      }
      
      // 检查turns字段
      if (originalItem.turns && editedItem.turns) {
        if (!Array.isArray(editedItem.turns) || editedItem.turns.length !== originalItem.turns.length) {
          return { valid: false, error: '不允许修改turns数组的长度或结构' }
        }
        
        for (let i = 0; i < originalItem.turns.length; i++) {
          const originalTurn = originalItem.turns[i]
          const editedTurn = editedItem.turns[i]
          
          // 检查turn的结构
          const originalTurnKeys = Object.keys(originalTurn).sort()
          const editedTurnKeys = Object.keys(editedTurn).sort()
          if (JSON.stringify(originalTurnKeys) !== JSON.stringify(editedTurnKeys)) {
            return { valid: false, error: `不允许修改turn ${i + 1}的结构` }
          }
          
          // 检查role是否改变
          if (originalTurn.role !== editedTurn.role) {
            return { valid: false, error: `不允许修改turn ${i + 1}的role字段` }
          }
          
          // 允许修改text字段
          if (originalTurn.text !== editedTurn.text) {
            // 允许修改
          }
        }
      } else if (originalItem.turns !== editedItem.turns) {
        return { valid: false, error: '不允许修改turns的结构' }
      }
      
      // 检查其他字段是否改变
      for (const key of originalKeys) {
        if (key === 'meta' || key === 'turns') continue
        if (JSON.stringify(originalItem[key]) !== JSON.stringify(editedItem[key])) {
          return { valid: false, error: `不允许修改字段: ${key}` }
        }
      }
      
      return { valid: true }
    } catch (e) {
      return { valid: false, error: `JSON格式错误: ${e.message}` }
    }
  }

  // 保存单条数据编辑
  const handleSaveSingleEdit = async (originalIndex) => {
    const editedJsonString = editingItems[originalIndex]
    if (!editedJsonString) {
      message.warning('没有修改内容')
      return
    }
    
    const originalItem = currentDataDetail.data[originalIndex]
    
    // 验证编辑后的JSON
    const validation = validateEditedJson(originalItem, editedJsonString)
    if (!validation.valid) {
      message.error(validation.error)
      return
    }
    
    try {
      const editedItem = JSON.parse(editedJsonString)
      
      // 检查是否有实际修改
      const metaDescChanged = originalItem.meta?.meta_description !== editedItem.meta?.meta_description
      let turnsChanged = false
      if (originalItem.turns && editedItem.turns) {
        for (let i = 0; i < originalItem.turns.length; i++) {
          if (originalItem.turns[i].text !== editedItem.turns[i].text) {
            turnsChanged = true
            break
          }
        }
      }
      
      if (!metaDescChanged && !turnsChanged) {
        message.warning('没有检测到允许的修改')
        return
      }
      
      // 使用新的API，一次提交完整编辑后的JSON
      await editSingleItemComplete(parseInt(dataId), originalIndex, editedItem)
      
      message.success('保存成功')
      
      // 清除编辑状态
      const newEditingItems = { ...editingItems }
      delete newEditingItems[originalIndex]
      setEditingItems(newEditingItems)
      
      // 重新加载数据
      await fetchDataContent(parseInt(dataId))
    } catch (err) {
      message.error('保存失败: ' + (err.message || '未知错误'))
    }
  }

  // 处理JSON编辑
  const handleJsonEdit = (originalIndex, value) => {
    setEditingItems({
      ...editingItems,
      [originalIndex]: value
    })
  }

  // 打开批量编辑模态框
  const handleOpenBatchEdit = () => {
    setBatchEditFieldType('meta_description')
    setBatchEditRole('')
    setBatchEditValue('')
    setBatchEditModalVisible(true)
  }

  // 保存批量编辑
  const handleSaveBatchEdit = async () => {
    if (!batchEditValue.trim() && batchEditFieldType === 'meta_description') {
      message.warning('meta_description 不能为空')
      return
    }
    
    if (batchEditFieldType === 'turn_text' && !batchEditRole) {
      message.warning('批量编辑 turn_text 需要选择角色')
      return
    }
    
    try {
      setBatchEditing(true)
      
      const editRequest = {
        edit_type: 'batch',
        field_type: batchEditFieldType,
        new_value: batchEditValue,
      }
      
      if (batchEditFieldType === 'turn_text') {
        editRequest.role = batchEditRole
      }
      
      await editUserDataContent(parseInt(dataId), editRequest)
      message.success('批量编辑成功，已更新所有数据')
      
      // 重新加载数据
      await fetchDataContent(parseInt(dataId))
      setBatchEditModalVisible(false)
      setBatchEditValue('')
    } catch (err) {
      message.error('批量编辑失败: ' + (err.message || '未知错误'))
    } finally {
      setBatchEditing(false)
    }
  }

  // 删除单条数据
  const handleDeleteSingleItem = async (originalIndex) => {
    if (!confirm(`确定要删除第 ${originalIndex + 1} 条数据吗？`)) return
    
    try {
      await deleteSingleItem(parseInt(dataId), originalIndex)
      message.success('删除成功')
      // 清除选中状态
      const newSelected = new Set(selectedItems)
      newSelected.delete(originalIndex)
      setSelectedItems(newSelected)
      // 重新加载数据
      await fetchDataContent(parseInt(dataId))
    } catch (err) {
      message.error('删除失败: ' + (err.message || '未知错误'))
    }
  }

  // 切换选中状态
  const handleToggleSelect = (originalIndex) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(originalIndex)) {
      newSelected.delete(originalIndex)
    } else {
      newSelected.add(originalIndex)
    }
    setSelectedItems(newSelected)
  }

  // 全选/取消全选
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIndices = new Set(filteredData.map((item, index) => {
        return currentDataDetail.data.findIndex(d => d === item)
      }))
      setSelectedItems(allIndices)
    } else {
      setSelectedItems(new Set())
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) {
      message.warning('请先选择要删除的数据')
      return
    }
    
    if (!confirm(`确定要删除选中的 ${selectedItems.size} 条数据吗？`)) return
    
    try {
      setBatchDeleting(true)
      const itemIndices = Array.from(selectedItems)
      await batchDeleteItems(parseInt(dataId), itemIndices)
      message.success(`成功删除 ${itemIndices.length} 条数据`)
      setSelectedItems(new Set())
      // 重新加载数据
      await fetchDataContent(parseInt(dataId))
    } catch (err) {
      message.error('批量删除失败: ' + (err.message || '未知错误'))
    } finally {
      setBatchDeleting(false)
    }
  }

  // 打开添加数据模态框
  const handleOpenAddItem = () => {
    setNewItemJson('')
    setAddItemModalVisible(true)
  }

  // 保存添加的数据
  const handleSaveAddItem = async () => {
    if (!newItemJson.trim()) {
      message.warning('请输入JSON数据')
      return
    }
    
    try {
      const newItem = JSON.parse(newItemJson)
      setAddingItem(true)
      await addSingleItem(parseInt(dataId), newItem)
      message.success('添加成功')
      setAddItemModalVisible(false)
      setNewItemJson('')
      // 重新加载数据
      await fetchDataContent(parseInt(dataId))
    } catch (err) {
      if (err.message.includes('JSON')) {
        message.error('JSON格式错误: ' + err.message)
      } else {
        message.error('添加失败: ' + (err.message || '未知错误'))
      }
    } finally {
      setAddingItem(false)
    }
  }

  // 处理文件导入追加
  const handleFileImport = async (file) => {
    if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.csv')) {
      message.error('只支持 .jsonl 和 .csv 格式的文件')
      return false
    }
    
    try {
      setImporting(true)
      const result = await appendDataFile(parseInt(dataId), file)
      message.success(`成功导入 ${result.added_count} 条数据，当前共 ${result.total_count} 条数据`)
      // 重新加载数据
      await fetchDataContent(parseInt(dataId))
      return false // 阻止默认上传行为
    } catch (err) {
      message.error('导入失败: ' + (err.message || '未知错误'))
      return false
    } finally {
      setImporting(false)
    }
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

  const allRoles = getAllRoles()

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

      {/* 操作按钮区域 */}
      <div style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleOpenBatchEdit}
        >
          批量编辑
        </Button>
        <Button
          type="default"
          icon={<PlusOutlined />}
          onClick={handleOpenAddItem}
        >
          添加数据
        </Button>
        <Upload
          accept=".jsonl,.csv"
          showUploadList={false}
          beforeUpload={handleFileImport}
          disabled={importing}
        >
          <Button
            icon={<UploadOutlined />}
            loading={importing}
          >
            导入追加
          </Button>
        </Upload>
        {selectedItems.size > 0 && (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleBatchDelete}
            loading={batchDeleting}
          >
            批量删除 ({selectedItems.size})
          </Button>
        )}
      </div>

      <div className="search-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Checkbox
            checked={selectedItems.size > 0 && selectedItems.size === filteredData.length}
            indeterminate={selectedItems.size > 0 && selectedItems.size < filteredData.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
          >
            全选
          </Checkbox>
          <input
            type="text"
            placeholder="搜索数据（支持任意字段）..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
            style={{ flex: 1 }}
          />
          <span className="search-result">
            {filteredData.length} / {currentDataDetail.total_count} 条
            {selectedItems.size > 0 && ` (已选 ${selectedItems.size})`}
          </span>
        </div>
      </div>

      <div className="data-list-container">
        {filteredData.length === 0 ? (
          <div className="empty-state">
            <p>没有匹配的数据</p>
          </div>
        ) : (
          <div className="data-items">
            {filteredData.map((item, index) => {
              const originalIndex = currentDataDetail.data.findIndex(d => d === item)
              const editedJson = editingItems[originalIndex]
              const displayJson = editedJson || JSON.stringify(item, null, 2)
              const isEditing = !!editingItems[originalIndex]
              
              return (
                <div key={index} className="data-item">
                  <div 
                    className="item-header"
                    onClick={() => toggleRowExpand(index)}
                  >
                    <Checkbox
                      checked={selectedItems.has(originalIndex)}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleToggleSelect(originalIndex)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginRight: 8 }}
                    />
                    <button className="expand-button">
                      {expandedRows.has(index) ? '▼' : '▶'}
                    </button>
                    <span className="item-index">第 {originalIndex + 1} 条</span>
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
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSingleItem(originalIndex)
                      }}
                      style={{ marginLeft: 'auto' }}
                    >
                      删除
                    </Button>
                  </div>

                  {expandedRows.has(index) && (
                    <div className="item-content">
                      <div className="json-container">
                        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                          <button 
                            className="copy-button"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(displayJson)
                            }}
                          >
                            复制 JSON
                          </button>
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveSingleEdit(originalIndex)
                            }}
                            disabled={!isEditing}
                          >
                            保存
                          </Button>
                        </div>
                        <TextArea
                          value={displayJson}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleJsonEdit(originalIndex, e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          rows={15}
                          style={{ 
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            whiteSpace: 'pre',
                            overflowWrap: 'normal',
                            overflowX: 'auto'
                          }}
                          placeholder="可直接编辑JSON，只允许修改meta_description和turns中的text字段"
                        />
                        {isEditing && (
                          <div style={{ marginTop: 8, padding: '8px', background: '#e6f7ff', borderRadius: '4px', fontSize: '12px' }}>
                            <span style={{ color: '#1890ff' }}>💡 提示：只能修改 meta.meta_description 和 turns[].text 字段，其他字段和结构不允许修改</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 批量编辑模态框 */}
      <Modal
        title="批量编辑数据"
        open={batchEditModalVisible}
        onOk={handleSaveBatchEdit}
        onCancel={() => {
          setBatchEditModalVisible(false)
          setBatchEditValue('')
        }}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: batchEditing, icon: <SaveOutlined /> }}
        cancelButtonProps={{ icon: <CloseOutlined /> }}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span style={{ fontWeight: 500 }}>字段类型：</span>
              <Select
                value={batchEditFieldType}
                onChange={(value) => {
                  setBatchEditFieldType(value)
                  if (value === 'meta_description') {
                    setBatchEditRole('')
                  }
                }}
                style={{ width: 200, marginLeft: 8 }}
                disabled={batchEditing}
              >
                <Option value="meta_description">meta_description</Option>
                <Option value="turn_text">turn_text</Option>
              </Select>
            </div>

            {batchEditFieldType === 'turn_text' && (
              <div>
                <span style={{ fontWeight: 500 }}>角色：</span>
                <Select
                  value={batchEditRole}
                  onChange={setBatchEditRole}
                  style={{ width: 200, marginLeft: 8 }}
                  disabled={batchEditing}
                  placeholder="选择角色"
                >
                  {allRoles.map(role => (
                    <Option key={role} value={role}>{role}</Option>
                  ))}
                </Select>
              </div>
            )}
          </Space>
        </div>

        <Divider />

        <div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 500 }}>新值：</span>
          </div>
          <TextArea
            value={batchEditValue}
            onChange={(e) => setBatchEditValue(e.target.value)}
            rows={6}
            placeholder={
              batchEditFieldType === 'meta_description' 
                ? '输入新的 meta_description（将应用到所有数据）' 
                : `输入新的 text 内容（将应用到所有 ${batchEditRole} 角色）`
            }
            disabled={batchEditing}
          />
        </div>

        <div style={{ marginTop: 16, padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
          <span style={{ color: '#d46b08' }}>
            ⚠️ 批量编辑将修改所有数据的 {batchEditFieldType === 'meta_description' ? 'meta_description' : `${batchEditRole} 角色的 text`} 字段
          </span>
        </div>
      </Modal>

      {/* 添加数据模态框 */}
      <Modal
        title="添加数据"
        open={addItemModalVisible}
        onOk={handleSaveAddItem}
        onCancel={() => {
          setAddItemModalVisible(false)
          setNewItemJson('')
        }}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: addingItem, icon: <SaveOutlined /> }}
        cancelButtonProps={{ icon: <CloseOutlined /> }}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 500 }}>新数据项（JSON格式）：</span>
          </div>
          <TextArea
            value={newItemJson}
            onChange={(e) => setNewItemJson(e.target.value)}
            rows={20}
            placeholder='请输入完整的JSON数据，例如：\n{\n  "meta": {\n    "meta_description": "描述"\n  },\n  "turns": [\n    {"role": "user", "text": "问题"},\n    {"role": "assistant", "text": "回答"}\n  ]\n}'
            style={{ 
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              overflowX: 'auto'
            }}
            disabled={addingItem}
          />
        </div>
        <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: '4px' }}>
          <span style={{ color: '#1890ff' }}>
            💡 提示：请确保JSON格式正确，数据将被添加到文件末尾
          </span>
        </div>
      </Modal>
    </div>
  )
}
