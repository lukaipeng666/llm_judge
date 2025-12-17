import React, { useEffect, useState } from 'react'
import {
  Table,
  Card,
  Tag,
  Input,
  Select,
  Space,
  Typography,
  Button,
  Row,
  Col,
  Statistic,
  Empty,
} from 'antd'
import {
  SearchOutlined,
  FileTextOutlined,
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useStore from '../stores'

const { Title, Text } = Typography
const { Option } = Select

function ReportsPage() {
  const navigate = useNavigate()
  const { reports, loading, fetchReports, deleteReport } = useStore()
  const [filteredReports, setFilteredReports] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    let filtered = [...reports]
    
    if (searchText) {
      const lowerSearch = searchText.toLowerCase()
      filtered = filtered.filter(
        r => r.dataset.toLowerCase().includes(lowerSearch) ||
             r.model.toLowerCase().includes(lowerSearch)
      )
    }
    
    if (selectedDataset) {
      filtered = filtered.filter(r => r.dataset === selectedDataset)
    }
    
    if (selectedModel) {
      filtered = filtered.filter(r => r.model === selectedModel)
    }
    
    setFilteredReports(filtered)
  }, [reports, searchText, selectedDataset, selectedModel])

  // 获取唯一的数据集和模型列表
  const datasets = [...new Set(reports.map(r => r.dataset))].sort()
  const models = [...new Set(reports.map(r => r.model))].sort()

  // 统计数据
  const avgAccuracy = filteredReports.length > 0
    ? filteredReports.reduce((sum, r) => sum + (r.summary?.accuracy || 0), 0) / filteredReports.length
    : 0

  const handleDelete = async (record) => {
    if (!window.confirm(`确定要删除报告 "${record.dataset} - ${record.model}" 吗？`)) {
      return
    }
    
    try {
      await deleteReport(record.id)
    } catch (err) {
      alert(`删除失败: ${err.message}`)
    }
  }

  const columns = [
    {
      title: '数据集',
      dataIndex: 'dataset',
      key: 'dataset',
      sorter: (a, b) => a.dataset.localeCompare(b.dataset),
      render: (text) => (
        <Tag color="geekblue" style={{ fontSize: 13 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      sorter: (a, b) => a.model.localeCompare(b.model),
      render: (text) => (
        <Tag color="purple" style={{ fontSize: 13 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '准确率',
      key: 'accuracy',
      sorter: (a, b) => (a.summary?.accuracy || 0) - (b.summary?.accuracy || 0),
      render: (_, record) => {
        const accuracy = record.summary?.accuracy
        if (accuracy === undefined) return '-'
        const percent = (accuracy * 100).toFixed(2)
        const className = accuracy >= 0.8 ? 'score-high' : 
                         accuracy >= 0.5 ? 'score-medium' : 'score-low'
        return <span className={className}>{percent}%</span>
      },
    },
    {
      title: '平均分',
      key: 'avgScore',
      sorter: (a, b) => (a.summary?.average_score || 0) - (b.summary?.average_score || 0),
      render: (_, record) => {
        const score = record.summary?.average_score
        return score !== undefined ? score.toFixed(4) : '-'
      },
    },
    {
      title: '数据量',
      key: 'totalCount',
      sorter: (a, b) => (a.summary?.total_count || 0) - (b.summary?.total_count || 0),
      render: (_, record) => record.summary?.total_count || '-',
    },
    {
      title: 'Badcase',
      key: 'badcaseCount',
      render: (_, record) => {
        const count = record.summary?.badcase_count
        if (count === undefined) return '-'
        return <Tag color={count > 0 ? 'red' : 'green'}>{count}</Tag>
      },
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      sorter: (a, b) => a.timestamp.localeCompare(b.timestamp),
      render: (text) => text ? text.replace(/_/g, ' ') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/reports/${encodeURIComponent(record.dataset)}/${encodeURIComponent(record.model)}`)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          历史报告
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchReports}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="card-shadow">
            <Statistic
              title="报告总数"
              value={filteredReports.length}
              suffix={`/ ${reports.length}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="card-shadow">
            <Statistic
              title="平均准确率"
              value={(avgAccuracy * 100).toFixed(2)}
              suffix="%"
              valueStyle={{ color: avgAccuracy >= 0.7 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="card-shadow">
            <Statistic
              title="涉及模型"
              value={models.length}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选区域 */}
      <Card bordered={false} className="card-shadow" style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="搜索数据集或模型"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="选择数据集"
            value={selectedDataset}
            onChange={setSelectedDataset}
            style={{ width: 180 }}
            allowClear
          >
            {datasets.map(d => (
              <Option key={d} value={d}>{d}</Option>
            ))}
          </Select>
          <Select
            placeholder="选择模型"
            value={selectedModel}
            onChange={setSelectedModel}
            style={{ width: 200 }}
            allowClear
          >
            {models.map(m => (
              <Option key={m} value={m}>{m}</Option>
            ))}
          </Select>
          <Button
            onClick={() => {
              setSearchText('')
              setSelectedDataset(null)
              setSelectedModel(null)
            }}
          >
            重置筛选
          </Button>
        </Space>
      </Card>

      {/* 报告表格 */}
      <Card bordered={false} className="card-shadow">
        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey={(record) => `${record.dataset}-${record.model}-${record.timestamp}`}
          loading={loading}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{
            emptyText: <Empty description="暂无报告数据" />,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/reports/${encodeURIComponent(record.dataset)}/${encodeURIComponent(record.model)}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

export default ReportsPage
