import React, { useEffect, useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Select,
  Typography,
  Table,
  Tag,
  Space,
  Spin,
  Empty,
  Divider,
} from 'antd'
import {
  BarChartOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import { useReportStore } from '../stores'

const { Title, Text } = Typography
const { Option } = Select

function ResultsPage() {
  const { reports, loading, fetchReports } = useReportStore()
  const [selectedDatasets, setSelectedDatasets] = useState([])
  const [selectedModels, setSelectedModels] = useState([])

  useEffect(() => {
    fetchReports()
  }, [])

  // 获取唯一的数据集和模型列表
  const datasets = useMemo(() => {
    return [...new Set(reports.map(r => r.dataset))].sort()
  }, [reports])

  const models = useMemo(() => {
    return [...new Set(reports.map(r => r.model))].sort()
  }, [reports])

  // 过滤报告
  const filteredReports = useMemo(() => {
    let filtered = reports

    if (selectedDatasets.length > 0) {
      filtered = filtered.filter(r => selectedDatasets.includes(r.dataset))
    }

    if (selectedModels.length > 0) {
      filtered = filtered.filter(r => selectedModels.includes(r.model))
    }

    return filtered
  }, [reports, selectedDatasets, selectedModels])

  // 按模型聚合数据
  const modelStats = useMemo(() => {
    const stats = {}

    filteredReports.forEach(report => {
      const model = report.model
      if (!stats[model]) {
        stats[model] = {
          model,
          reports: [],
          avgAccuracy: 0,
          avgScore: 0,
          totalTests: 0,
          datasets: new Set(),
        }
      }
      stats[model].reports.push(report)
      stats[model].datasets.add(report.dataset)
      stats[model].totalTests += report.summary?.total_count || 0
    })

    // 计算平均值
    Object.values(stats).forEach(stat => {
      const accuracies = stat.reports.map(r => r.summary?.accuracy || 0)
      const scores = stat.reports.map(r => r.summary?.average_score || 0)
      stat.avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length
      stat.avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      stat.datasetCount = stat.datasets.size
    })

    return Object.values(stats).sort((a, b) => b.avgAccuracy - a.avgAccuracy)
  }, [filteredReports])

  // 按数据集聚合数据
  const datasetStats = useMemo(() => {
    const stats = {}

    filteredReports.forEach(report => {
      const dataset = report.dataset
      if (!stats[dataset]) {
        stats[dataset] = {
          dataset,
          reports: [],
          models: new Set(),
          bestModel: null,
          bestAccuracy: 0,
        }
      }
      stats[dataset].reports.push(report)
      stats[dataset].models.add(report.model)

      const accuracy = report.summary?.accuracy || 0
      if (accuracy > stats[dataset].bestAccuracy) {
        stats[dataset].bestAccuracy = accuracy
        stats[dataset].bestModel = report.model
      }
    })

    Object.values(stats).forEach(stat => {
      stat.modelCount = stat.models.size
      const accuracies = stat.reports.map(r => r.summary?.accuracy || 0)
      stat.avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length
    })

    return Object.values(stats).sort((a, b) => b.avgAccuracy - a.avgAccuracy)
  }, [filteredReports])

  // 模型排行榜列
  const modelRankColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => {
        if (index === 0) return <TrophyOutlined style={{ color: '#faad14', fontSize: 20 }} />
        if (index === 1) return <TrophyOutlined style={{ color: '#bfbfbf', fontSize: 18 }} />
        if (index === 2) return <TrophyOutlined style={{ color: '#d48806', fontSize: 16 }} />
        return <span style={{ color: '#999' }}>#{index + 1}</span>
      },
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      render: (text) => <Tag color="purple" style={{ fontSize: 13 }}>{text}</Tag>,
    },
    {
      title: '平均准确率',
      dataIndex: 'avgAccuracy',
      key: 'avgAccuracy',
      sorter: (a, b) => a.avgAccuracy - b.avgAccuracy,
      render: (value) => {
        const percent = (value * 100).toFixed(2)
        const className = value >= 0.8 ? 'score-high' : value >= 0.5 ? 'score-medium' : 'score-low'
        return <span className={className}>{percent}%</span>
      },
    },
    {
      title: '平均分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      render: (value) => value?.toFixed(4) || '-',
    },
    {
      title: '测试数据集',
      dataIndex: 'datasetCount',
      key: 'datasetCount',
      render: (value) => <Tag color="blue">{value} 个</Tag>,
    },
    {
      title: '测试样本数',
      dataIndex: 'totalTests',
      key: 'totalTests',
      render: (value) => value.toLocaleString(),
    },
  ]

  // 数据集排行列
  const datasetRankColumns = [
    {
      title: '数据集',
      dataIndex: 'dataset',
      key: 'dataset',
      render: (text) => <Tag color="geekblue" style={{ fontSize: 13 }}>{text}</Tag>,
    },
    {
      title: '平均准确率',
      dataIndex: 'avgAccuracy',
      key: 'avgAccuracy',
      sorter: (a, b) => a.avgAccuracy - b.avgAccuracy,
      render: (value) => {
        const percent = (value * 100).toFixed(2)
        const className = value >= 0.8 ? 'score-high' : value >= 0.5 ? 'score-medium' : 'score-low'
        return <span className={className}>{percent}%</span>
      },
    },
    {
      title: '最佳模型',
      dataIndex: 'bestModel',
      key: 'bestModel',
      render: (text, record) => (
        <Space>
          <Tag color="gold">{text}</Tag>
          <Text type="secondary">({(record.bestAccuracy * 100).toFixed(2)}%)</Text>
        </Space>
      ),
    },
    {
      title: '测试模型数',
      dataIndex: 'modelCount',
      key: 'modelCount',
      render: (value) => <Tag color="purple">{value} 个</Tag>,
    },
  ]

  // 详细对比表格
  const comparisonData = useMemo(() => {
    // 构建数据集 x 模型的矩阵
    const matrix = {}
    const allModels = [...new Set(filteredReports.map(r => r.model))]
    const allDatasets = [...new Set(filteredReports.map(r => r.dataset))]

    allDatasets.forEach(dataset => {
      matrix[dataset] = { dataset }
      allModels.forEach(model => {
        const report = filteredReports.find(r => r.dataset === dataset && r.model === model)
        matrix[dataset][model] = report?.summary?.accuracy
      })
    })

    return { data: Object.values(matrix), models: allModels }
  }, [filteredReports])

  // 对比表格列
  const comparisonColumns = useMemo(() => {
    const cols = [
      {
        title: '数据集',
        dataIndex: 'dataset',
        key: 'dataset',
        fixed: 'left',
        width: 150,
        render: (text) => <Tag color="geekblue">{text}</Tag>,
      },
    ]

    comparisonData.models.forEach(model => {
      cols.push({
        title: model,
        dataIndex: model,
        key: model,
        render: (value) => {
          if (value === undefined) return <Text type="secondary">-</Text>
          const percent = (value * 100).toFixed(2)
          const className = value >= 0.8 ? 'score-high' : value >= 0.5 ? 'score-medium' : 'score-low'
          return <span className={className}>{percent}%</span>
        },
      })
    })

    return cols
  }, [comparisonData])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="fade-in">
      <Title level={3} style={{ marginBottom: 24 }}>
        <BarChartOutlined style={{ marginRight: 8 }} />
        结果分析
      </Title>

      {/* 筛选区域 */}
      <Card bordered={false} className="card-shadow" style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <div>
            <Text strong style={{ marginRight: 8 }}>数据集:</Text>
            <Select
              mode="multiple"
              placeholder="选择数据集"
              value={selectedDatasets}
              onChange={setSelectedDatasets}
              style={{ minWidth: 300 }}
              maxTagCount={3}
              allowClear
            >
              {datasets.map(d => (
                <Option key={d} value={d}>{d}</Option>
              ))}
            </Select>
          </div>
          <div>
            <Text strong style={{ marginRight: 8 }}>模型:</Text>
            <Select
              mode="multiple"
              placeholder="选择模型"
              value={selectedModels}
              onChange={setSelectedModels}
              style={{ minWidth: 300 }}
              maxTagCount={3}
              allowClear
            >
              {models.map(m => (
                <Option key={m} value={m}>{m}</Option>
              ))}
            </Select>
          </div>
        </Space>
      </Card>

      {filteredReports.length === 0 ? (
        <Empty description="暂无数据，请调整筛选条件" />
      ) : (
        <>
          {/* 模型排行榜 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span>
                    <TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    模型排行榜
                  </span>
                }
                bordered={false}
                className="card-shadow"
              >
                <Table
                  columns={modelRankColumns}
                  dataSource={modelStats}
                  rowKey="model"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span>
                    <BarChartOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                    数据集统计
                  </span>
                }
                bordered={false}
                className="card-shadow"
              >
                <Table
                  columns={datasetRankColumns}
                  dataSource={datasetStats}
                  rowKey="dataset"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* 详细对比表格 */}
          <Card
            title="模型性能对比矩阵"
            bordered={false}
            className="card-shadow"
          >
            <Table
              columns={comparisonColumns}
              dataSource={comparisonData.data}
              rowKey="dataset"
              pagination={false}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          </Card>
        </>
      )}
    </div>
  )
}

export default ResultsPage
