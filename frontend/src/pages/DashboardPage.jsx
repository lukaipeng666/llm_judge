import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin, Button } from 'antd'
import {
  ExperimentOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ApiOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useStore from '../stores'

const { Title, Text } = Typography

function DashboardPage() {
  const navigate = useNavigate()
  const { reports, fetchReports, loading: reportsLoading } = useStore()
  const { tasks, fetchTasks, loading: tasksLoading } = useStore()
  const [stats, setStats] = useState({
    totalReports: 0,
    totalDatasets: 0,
    totalModels: 0,
    runningTasks: 0,
  })

  useEffect(() => {
    fetchReports()
    fetchTasks()
  }, [])

  useEffect(() => {
    // 计算统计数据
    const safeReports = reports || []
    const safeTasks = tasks || []
    const datasets = new Set(safeReports.map(r => r.dataset))
    const models = new Set(safeReports.map(r => r.model))
    const runningTasks = safeTasks.filter(t => t.status === 'running').length

    setStats({
      totalReports: safeReports.length,
      totalDatasets: datasets.size,
      totalModels: models.size,
      runningTasks,
    })
  }, [reports, tasks])

  // 最近报告表格列
  const recentReportsColumns = [
    {
      title: '数据集',
      dataIndex: 'dataset',
      key: 'dataset',
      render: (text) => <Tag color="blue" style={{ borderRadius: 12 }}>{text}</Tag>,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      render: (text) => <Tag color="purple" style={{ borderRadius: 12 }}>{text}</Tag>,
    },
    {
      title: '准确率',
      key: 'accuracy',
      render: (_, record) => {
        const accuracy = record.summary?.accuracy
        if (accuracy === undefined) return '-'
        const percent = (accuracy * 100).toFixed(2)
        const color = accuracy >= 0.8 ? '#34C759' : accuracy >= 0.5 ? '#FF9500' : '#FF3B30'
        return <span style={{ color, fontWeight: 600 }}>{percent}%</span>
      },
    },
    {
      title: '平均分',
      key: 'avgScore',
      render: (_, record) => {
        const score = record.summary?.average_score
        return score !== undefined ? score.toFixed(4) : '-'
      },
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => text ? <Text type="secondary">{text.replace(/_/g, ' ')}</Text> : '-',
    },
  ]

  // 任务状态表格列
  const taskColumns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 150,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: { color: 'default', text: '等待中' },
          running: { color: 'processing', text: '运行中' },
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '失败' },
          cancelled: { color: 'warning', text: '已取消' },
        }
        const { color, text } = statusMap[status] || { color: 'default', text: status }
        return <Tag color={color} style={{ borderRadius: 12 }}>{text}</Tag>
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => <span style={{ fontFamily: 'SF Pro Text' }}>{(progress || 0).toFixed(1)}%</span>,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: text => <Text type="secondary" style={{ fontSize: 13 }}>{text}</Text>
    },
  ]

  const loading = reportsLoading || tasksLoading

  return (
    <div className="fade-in">
      <Title level={2} style={{ marginBottom: 32, fontSize: 28 }}>
        Dashboard
      </Title>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-blue card-hoverable" bordered={false}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: 8, opacity: 0.9 }}>评测报告</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{stats.totalReports}</div>
            </div>
            <FileTextOutlined style={{ position: 'absolute', right: 20, bottom: 20, fontSize: 48, opacity: 0.2 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-green card-hoverable" bordered={false}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: 8, opacity: 0.9 }}>数据集</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{stats.totalDatasets}</div>
            </div>
            <DatabaseOutlined style={{ position: 'absolute', right: 20, bottom: 20, fontSize: 48, opacity: 0.2 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-orange card-hoverable" bordered={false}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: 8, opacity: 0.9 }}>模型</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{stats.totalModels}</div>
            </div>
            <ApiOutlined style={{ position: 'absolute', right: 20, bottom: 20, fontSize: 48, opacity: 0.2 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-red card-hoverable" bordered={false}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: 8, opacity: 0.9 }}>运行中任务</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{stats.runningTasks}</div>
            </div>
            <ClockCircleOutlined style={{ position: 'absolute', right: 20, bottom: 20, fontSize: 48, opacity: 0.2 }} />
          </Card>
        </Col>
      </Row>

      {/* 最近报告和任务状态 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ fontSize: 18, fontWeight: 600 }}>最近评测报告</span>}
            extra={<Button type="link" onClick={() => navigate('/reports')}>查看全部 <RightOutlined /></Button>}
            bordered={false}
            className="glass-card"
          >
            <Spin spinning={loading}>
              <Table
                columns={recentReportsColumns}
                dataSource={(reports || []).slice(0, 5)}
                rowKey={(record) => `${record.dataset}-${record.model}-${record.timestamp}`}
                pagination={false}
                size="middle"
                onRow={(record) => ({
                  onClick: () => navigate(`/reports/${record.dataset}/${record.model}`),
                  style: { cursor: 'pointer' },
                })}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ fontSize: 18, fontWeight: 600 }}>任务状态</span>}
            extra={<Button type="link" onClick={() => navigate('/tasks')}>管理任务 <RightOutlined /></Button>}
            bordered={false}
            className="glass-card"
          >
            <Spin spinning={loading}>
              <Table
                columns={taskColumns}
                dataSource={(tasks || []).slice(0, 5)}
                rowKey="task_id"
                pagination={false}
                size="middle"
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <div style={{ marginTop: 32 }}>
        <Title level={4} style={{ marginBottom: 16 }}>快速操作</Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card
              hoverable
              className="card-hoverable"
              onClick={() => navigate('/evaluate')}
              style={{
                textAlign: 'center',
                background: 'white',
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{
                width: 64, height: 64, margin: '0 auto 16px',
                background: '#F0F5FF', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ExperimentOutlined style={{ fontSize: 32, color: '#007AFF' }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>开始评测</div>
              <Text type="secondary">配置并启动新的评测任务</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              hoverable
              className="card-hoverable"
              onClick={() => navigate('/reports')}
              style={{
                textAlign: 'center',
                background: 'white',
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{
                width: 64, height: 64, margin: '0 auto 16px',
                background: '#F6FFED', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileTextOutlined style={{ fontSize: 32, color: '#34C759' }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>查看报告</div>
              <Text type="secondary">浏览历史评测报告</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              hoverable
              className="card-hoverable"
              onClick={() => navigate('/results')}
              style={{
                textAlign: 'center',
                background: 'white',
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{
                width: 64, height: 64, margin: '0 auto 16px',
                background: '#FFF7E6', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CheckCircleOutlined style={{ fontSize: 32, color: '#FF9500' }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>结果分析</div>
              <Text type="secondary">模型性能对比分析</Text>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default DashboardPage
