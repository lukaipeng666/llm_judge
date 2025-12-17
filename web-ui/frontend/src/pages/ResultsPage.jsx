import React, { useEffect, useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Select,
  Typography,
  Button,
  Space,
  Spin,
  Empty,
  message,
} from 'antd'
import {
  BarChartOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Radar } from '@ant-design/plots'
import useStore from '../stores'

const { Title, Text } = Typography
const { Option } = Select

function ResultsPage() {
  const { reports, loading, fetchReports } = useStore()
  

  
  // 雷达图分析状态
  const [radarMetrics, setRadarMetrics] = useState([]) // [{name, reports: [...]}]
  const [radarModelColors, setRadarModelColors] = useState({}) // {modelName: color}
  const [radarChartData, setRadarChartData] = useState([])
  const [radarRendered, setRadarRendered] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  // 获取所有可用指标（从报告摘要中提取的数值字段）
  const availableMetrics = useMemo(() => {
    const metrics = new Set()
    reports.forEach(report => {
      if (report.summary) {
        Object.keys(report.summary).forEach(key => {
          if (typeof report.summary[key] === 'number') {
            metrics.add(key)
          }
        })
      }
    })
    return Array.from(metrics).sort()
  }, [reports])



  // 从雷达图选定的指标报告中自动提取可用模型
  const availableModelsFromMetrics = useMemo(() => {
    const models = new Set()
    radarMetrics.forEach(metric => {
      metric.reports.forEach(reportId => {
        const report = reports.find(r => r.id === reportId)
        if (report) {
          models.add(report.model)
        }
      })
    })
    return Array.from(models).sort()
  }, [radarMetrics, reports])

  // 初始化模型颜色（当有新模型时）
  const initializeModelColors = () => {
    const colors = ['#1890ff', '#ff4d4f', '#52c41a', '#faad14', '#13c2c2', '#722ed1']
    const newColors = { ...radarModelColors }
    availableModelsFromMetrics.forEach((model, idx) => {
      if (!newColors[model]) {
        newColors[model] = colors[idx % colors.length]
      }
    })
    setRadarModelColors(newColors)
  }

  // 更新模型颜色
  const updateModelColor = (model, color) => {
    setRadarModelColors({ ...radarModelColors, [model]: color })
  }

  // 添加雷达图指标
  const addRadarMetric = () => {
    setRadarMetrics([...radarMetrics, { name: '', reports: [] }])
  }

  // 更新雷达图指标名称
  const updateRadarMetricName = (index, name) => {
    const newMetrics = [...radarMetrics]
    newMetrics[index].name = name
    setRadarMetrics(newMetrics)
  }

  // 更新雷达图指标报告
  const updateRadarMetricReports = (index, reportIds) => {
    const newMetrics = [...radarMetrics]
    newMetrics[index].reports = reportIds
    setRadarMetrics(newMetrics)
  }

  // 删除雷达图指标
  const deleteRadarMetric = (index) => {
    setRadarMetrics(radarMetrics.filter((_, i) => i !== index))
  }

  // 渲染雷达图
  const renderRadar = () => {
    // 检查是否有效的指标
    const validMetrics = radarMetrics.filter(m => m.name && m.reports.length > 0)
    if (validMetrics.length === 0) {
      message.warning('请至少添加一个指标并选择报告')
      return
    }

    // 获取可用模型
    if (availableModelsFromMetrics.length === 0) {
      message.warning('未找到任何模型，请检查指标报告选择')
      return
    }

    // 初始化模型颜色
    initializeModelColors()

    const chartData = []

    // 对每个模型生成数据，无论指标名称是什么，都取 accuracy 字段
    availableModelsFromMetrics.forEach(model => {
      radarMetrics.forEach(metric => {
        if (metric.name && metric.reports.length > 0) {
          // 计算该模型在该指标下的平均值（只取 accuracy）
          const values = metric.reports
            .map(reportId => {
              const report = reports.find(r => r.id === reportId && r.model === model)
              return report ? report.summary?.accuracy : null
            })
            .filter(v => v !== null)

          const avg = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0
          chartData.push({
            model,
            metric: metric.name,
            value: avg,
          })
        }
      })
    })

    setRadarChartData(chartData)
    setRadarRendered(true)
  }

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

      {reports.length === 0 ? (
        <Empty description="暂无数据" />
      ) : (
        <>
          {/* 雷达图分析 */}
          <Card bordered={false} className="card-shadow" style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              雷达图分析
            </Title>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 指标配置 */}
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Text strong>配置指标：</Text>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addRadarMetric}
                    style={{ marginLeft: 8 }}
                  >
                    添加指标
                  </Button>
                </div>
                {radarMetrics.map((metric, idx) => (
                  <div key={idx} style={{ marginBottom: 16, padding: 12, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="输入指标名称"
                        value={metric.name || ''}
                        onChange={(e) => updateRadarMetricName(idx, e.target.value)}
                        style={{ flex: 1, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4, minWidth: 200 }}
                      />
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteRadarMetric(idx)}
                      />
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        为此指标选择报告（同一指标下多个报告将取平均值）:
                      </Text>
                      <Select
                        mode="multiple"
                        placeholder="选择报告"
                        value={metric.reports}
                        onChange={(val) => updateRadarMetricReports(idx, val)}
                        style={{ marginTop: 6, width: '100%' }}
                      >
                        {reports.map(r => (
                          <Option key={r.id} value={r.id}>
                            {r.dataset} - {r.model}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              {/* 模型颜色配置（自动提取） */}
              {availableModelsFromMetrics.length > 0 && (
                <div>
                  <Text strong>配置模型颜色（自动提取）:</Text>
                  <div style={{ marginTop: 8 }}>
                    {availableModelsFromMetrics.map(model => (
                      <div key={model} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <Text style={{ minWidth: 120 }}>{model}</Text>
                        <input
                          type="color"
                          value={radarModelColors[model] || '#1890ff'}
                          onChange={(e) => updateModelColor(model, e.target.value)}
                          style={{ cursor: 'pointer', width: 50, height: 32 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="primary" onClick={renderRadar}>
                渲染雷达图
              </Button>
            </Space>

            {radarRendered && radarChartData.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Radar
                  data={radarChartData}
                  xField="metric"
                  yField="value"
                  seriesField="model"
                  meta={{
                    value: {
                      min: 0,
                      max: 1,
                    },
                  }}
                  xAxis={{
                    labelFormatter: (v) => v,
                  }}
                  color={(d) => radarModelColors[d.model] || '#1890ff'}
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default ResultsPage
