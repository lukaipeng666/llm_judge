import React, { useEffect, useState } from 'react'
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Typography,
  Progress,
  Modal,
  Descriptions,
  message,
  Tooltip,
  Empty,
  Input,
} from 'antd'
import {
  ReloadOutlined,
  StopOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import useStore from '../stores'

const { Title, Text, Paragraph } = Typography

function TasksPage() {
  const { tasks, loading, fetchTasks, cancelTask, deleteTask, updateTask } = useStore()
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [editVisible, setEditVisible] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editMessage, setEditMessage] = useState('')

  useEffect(() => {
    // 初始加载，显示 loading
    fetchTasks(false)
    
    // 设置自动刷新，静默模式
    const interval = setInterval(() => {
      fetchTasks(true)  // 静默刷新，不显示 loading
    }, 5000)  // 每 5 秒刷新一次
    setRefreshInterval(interval)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [])

  const handleViewDetail = (task) => {
    setSelectedTask(task)
    setDetailVisible(true)
  }

  const handleCancelTask = async (taskId) => {
    Modal.confirm({
      title: '确认取消任务',
      content: '确定要取消这个运行中的任务吗？',
      icon: <ExclamationCircleOutlined />,
      centered: true,
      onOk: async () => {
        try {
          await cancelTask(taskId)
          message.success('任务已取消')
        } catch (error) {
          message.error('取消任务失败')
        }
      },
    })
  }

  const handleDeleteTask = async (taskId) => {
    Modal.confirm({
      title: '确认删除任务',
      content: '确定要删除这个任务吗？此操作不可恢复。',
      icon: <ExclamationCircleOutlined />,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await deleteTask(taskId)
          message.success('任务已删除')
        } catch (error) {
          message.error('删除任务失败')
        }
      },
    })
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setEditMessage(task.message || '')
    setEditVisible(true)
  }

  const handleSaveEdit = async () => {
    try {
      await updateTask(editingTask.task_id, { message: editMessage })
      message.success('任务备注已更新')
      setEditVisible(false)
    } catch (error) {
      message.error('更新失败')
    }
  }

  const getStatusIcon = (status) => {
    const iconMap = {
      pending: <ClockCircleOutlined style={{ color: '#8c8c8c' }} />,
      running: <LoadingOutlined style={{ color: '#1890ff' }} spin />,
      completed: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      failed: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      cancelled: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
    }
    return iconMap[status] || <ClockCircleOutlined />
  }

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'default', text: '等待中' },
      running: { color: 'processing', text: '运行中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' },
      cancelled: { color: 'warning', text: '已取消' },
    }
    const { color, text } = statusMap[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  const columns = [
    {
      title: '任务 ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 180,
      render: (text, record) => (
        <Space>
          {getStatusIcon(record.status)}
          <Text copyable={{ text }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
      filters: [
        { text: '等待中', value: 'pending' },
        { text: '运行中', value: 'running' },
        { text: '已完成', value: 'completed' },
        { text: '失败', value: 'failed' },
        { text: '已取消', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 200,
      render: (progress, record) => {
        const status = record.status === 'failed' ? 'exception' : 
                      record.status === 'completed' ? 'success' : 'active'
        return (
          <Progress
            percent={Number((progress || 0).toFixed(1))}
            size="small"
            status={status}
          />
        )
      },
    },
    {
      title: '模型',
      key: 'model',
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title={record.config?.model}>
          <Tag color="blue">{record.config?.model?.split('/').pop() || '-'}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '评分函数',
      key: 'scoring',
      render: (_, record) => (
        <Tag color="purple">{record.config?.scoring || '-'}</Tag>
      ),
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text type="secondary" style={{ maxWidth: 200 }} ellipsis>
            {text}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      defaultSortOrder: 'descend',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑备注">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditTask(record)}
            />
          </Tooltip>
          {record.status === 'running' && (
            <Tooltip title="取消任务">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={() => handleCancelTask(record.task_id)}
              />
            </Tooltip>
          )}
          {['completed', 'failed', 'cancelled'].includes(record.status) && (
            <Tooltip title="删除任务">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTask(record.task_id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          任务管理
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchTasks(false)}  // 手动刷新显示 loading
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Card bordered={false} className="card-shadow">
        <Table
          columns={columns}
          dataSource={tasks || []}
          rowKey="task_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个任务`,
          }}
          locale={{
            emptyText: <Empty description="暂无任务" />,
          }}
        />
      </Card>

      {/* 任务详情弹窗 */}
      <Modal
        title="任务详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
        centered
      >
        {selectedTask && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="任务 ID" span={2}>
                <Text copyable>{selectedTask.task_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedTask.status)}
              </Descriptions.Item>
              <Descriptions.Item label="进度">
                {(selectedTask.progress || 0).toFixed(2)}%
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedTask.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedTask.updated_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="模型" span={2}>
                {selectedTask.config?.model || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="评分函数">
                {selectedTask.config?.scoring || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="工作线程">
                {selectedTask.config?.max_workers || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="数据文件" span={2}>
                <Text ellipsis style={{ maxWidth: 400 }}>
                  {selectedTask.config?.data_file || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="当前消息" span={2}>
                {selectedTask.message || '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedTask.result?.output && (
              <div style={{ marginTop: 16 }}>
                <Text strong>输出日志:</Text>
                <Paragraph
                  code
                  style={{
                    maxHeight: 200,
                    overflow: 'auto',
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    marginTop: 8,
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {selectedTask.result.output}
                  </pre>
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 编辑任务弹窗 */}
      <Modal
        title="编辑任务备注"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={handleSaveEdit}
        okText="保存"
        cancelText="取消"
        centered
      >
        {editingTask && (
          <div>
            <p><Text strong>任务 ID:</Text> {editingTask.task_id}</p>
            <p><Text strong>当前状态:</Text> {getStatusTag(editingTask.status)}</p>
            <div style={{ marginTop: 16 }}>
              <Text strong>备注信息:</Text>
              <Input.TextArea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={4}
                placeholder="输入任务备注..."
                maxLength={500}
                showCount
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TasksPage
