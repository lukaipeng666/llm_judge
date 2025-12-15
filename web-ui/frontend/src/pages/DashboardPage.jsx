import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Spin } from 'antd'
import {
  ExperimentOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ApiOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useReportStore, useTaskStore } from '../stores'

const { Title, Text } = Typography

function DashboardPage() {
  const navigate = useNavigate()
  const { reports, fetchReports, loading: reportsLoading } = useReportStore()
  const { tasks, fetchTasks, loading: tasksLoading } = useTaskStore()
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
    const datasets = new Set(reports.map(r => r.dataset))
    const models = new Set(reports.map(r => r.model))
    const runningTasks = tasks.filter(t => t.status === 'running').length

    setStats({
      totalReports: reports.length,
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
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      render: (text) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: '准确率',
      key: 'accuracy',
      render: (_, record) => {
        const accuracy = record.summary?.accuracy
        if (accuracy === undefined) return '-'
        const percent = (accuracy * 100).toFixed(2)
        const color = accuracy >= 0.8 ? '#52c41a' : accuracy >= 0.5 ? '#faad14' : '#ff4d4f'
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
      render: (text) => text ? text.replace(/_/g, ' ') : '-',
    },
  ]

  // 任务状态表格列
  const taskColumns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 180,
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
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => `${(progress || 0).toFixed(1)}%`,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
  ]

  const loading = reportsLoading || tasksLoading

  return (
    <div className="fade-in">
      <Title level={3} style={{ marginBottom: 24 }}>
        仪表盘
      </Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-blue" bordered={false}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>评测报告</span>}
              value={stats.totalReports}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-green" bordered={false}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>数据集</span>}
              value={stats.totalDatasets}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-orange" bordered={false}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>模型</span>}
              value={stats.totalModels}
              prefix={<ApiOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-red" bordered={false}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>运行中任务</span>}
              value={stats.runningTasks}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近报告和任务状态 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="最近评测报告"
            extra={<a onClick={() => navigate('/reports')}>查看全部</a>}
            bordered={false}
            className="card-shadow"
          >
            <Spin spinning={loading}>
              <Table
                columns={recentReportsColumns}
                dataSource={reports.slice(0, 5)}
                rowKey={(record) => `${record.dataset}-${record.model}-${record.timestamp}`}
                pagination={false}
                size="small"
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
            title="任务状态"
            extra={<a onClick={() => navigate('/tasks')}>管理任务</a>}
            bordered={false}
            className="card-shadow"
          >
            <Spin spinning={loading}>
              <Table
                columns={taskColumns}
                dataSource={tasks.slice(0, 5)}
                rowKey="task_id"
                pagination={false}
                size="small"
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card
        title="快速操作"
        bordered={false}
        className="card-shadow"
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card
              hoverable
              onClick={() => navigate('/evaluate')}
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <ExperimentOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <div style={{ fontWeight: 600 }}>开始评测</div>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>配置并启动新的评测任务</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              hoverable
              onClick={() => navigate('/reports')}
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
              }}
            >
              <FileTextOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <div style={{ fontWeight: 600 }}>查看报告</div>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>浏览历史评测报告</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              hoverable
              onClick={() => navigate('/results')}
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
              }}
            >
              <CheckCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <div style={{ fontWeight: 600 }}>结果分析</div>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>模型性能对比分析</Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default DashboardPage
