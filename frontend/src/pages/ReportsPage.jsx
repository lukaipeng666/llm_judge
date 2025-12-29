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
  message,
  Modal,
} from 'antd'
import {
  SearchOutlined,
  FileTextOutlined,
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
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
    let filtered = [...(reports || [])]

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
  const safeReports = reports || []
  const datasets = [...new Set(safeReports.map(r => r.dataset))].sort()
  const models = [...new Set(safeReports.map(r => r.model))].sort()

  // 统计数据
  const safeFilteredReports = filteredReports || []
  const avgAccuracy = safeFilteredReports.length > 0
    ? safeFilteredReports.reduce((sum, r) => sum + (r.summary?.accuracy || 0), 0) / safeFilteredReports.length
    : 0

  const handleDelete = async (record) => {
    Modal.confirm({
      title: '确认删除报告',
      content: `确定要删除报告 "${record.dataset} - ${record.model}" 吗？此操作不可恢复。`,
      icon: <ExclamationCircleOutlined />,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await deleteReport(record.id)

          // 删除成功后显示提示信息
          message.success('报告删除成功')

          // 如果当前不在报告列表页，则导航回报告列表页
          if (window.location.pathname !== '/reports') {
            navigate('/reports')
          }
        } catch (err) {
          message.error(`删除失败: ${err.message}`)
        }
      }
    })
  }

  // 导出CSV功能
  const handleExportCSV = async (record) => {
    try {
      // 获取报告详情
      const reportDetail = await useStore.getState().fetchReportDetail(record.dataset, record.model)
      
      if (!reportDetail || !reportDetail.results) {
        message.warning('报告中没有完整的测试结果数据')
        return
      }

      // 生成CSV内容
      const results = reportDetail.results
      
      // CSV标题行
      const headers = ['得分', '用户输入', '模型输出', '参考答案']
      const csvRows = [headers.join(',')]

      // 数据行
      results.forEach(result => {
        const score = result.score !== undefined ? result.score.toFixed(4) : '-'
        
        // 处理用户输入（可能是数组或字符串）
        let userInput = ''
        if (Array.isArray(result.user_input)) {
          const userMsg = result.user_input.find(msg => msg.role === 'user')
          userInput = userMsg?.content || JSON.stringify(result.user_input)
        } else {
          userInput = result.user_input || '-'
        }
        
        const modelOutput = result.model_output || '-'
        const referenceOutput = result.reference_output || '-'
        
        // 转义CSV字段（处理逗号、引号、换行符）
        const escapeCSV = (field) => {
          if (field === null || field === undefined) return '""'
          const str = String(field)
          // 如果包含逗号、引号或换行符，需要用引号包裹，并转义内部引号
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return `"${str}"`
        }
        
        csvRows.push([
          escapeCSV(score),
          escapeCSV(userInput),
          escapeCSV(modelOutput),
          escapeCSV(referenceOutput)
        ].join(','))
      })

      const csvContent = csvRows.join('\n')
      
      // 生成文件名：数据集名前缀+模型名称.csv
      const datasetPrefix = record.dataset.replace(/\.[^/.]+$/, '') // 去除扩展名
      const filename = `${datasetPrefix}+${record.model}.csv`
      
      // 创建下载链接
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      
      message.success(`已导出 ${filename}`)
    } catch (err) {
      console.error('导出失败:', err)
      message.error(`导出失败: ${err.message}`)
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
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation();  // 阻止事件冒泡到行点击
              handleExportCSV(record);
            }}
          >
            导出
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();  // 阻止事件冒泡到行点击
              handleDelete(record);
            }}
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
              value={safeFilteredReports.length}
              suffix={`/ ${safeReports.length}`}
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
          dataSource={safeFilteredReports}
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
