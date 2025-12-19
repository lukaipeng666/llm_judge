import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
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
  Segmented,
  Tooltip,
  Radio,
} from 'antd'
import {
  BarChartOutlined,
  RadarChartOutlined,
  DeleteOutlined,
  PlusOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { Radar, Column } from '@ant-design/plots'
import useStore from '../stores'

const { Title, Text } = Typography
const { Option } = Select

// 精心设计的配色方案
const COLOR_PALETTES = {
  vibrant: [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EF4444', // Red
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#D946EF', // Fuchsia
  ],
}

// 根据索引获取颜色
const getColor = (index, palette = 'vibrant') => {
  const colors = COLOR_PALETTES[palette]
  return colors[index % colors.length]
}

// 去除文件后缀名
const removeExtension = (filename) => {
  if (!filename) return ''
  return filename.replace(/\.[^/.]+$/, '')
}

// localStorage 键名
const STORAGE_KEYS = {
  CHART_TYPE: 'visualization_chart_type',
  BAR_CHARTS: 'visualization_bar_charts',
  RADAR_CHARTS: 'visualization_radar_charts',
}

// 保存图表配置到 localStorage
const saveChartConfig = (chartType, barCharts, radarCharts) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHART_TYPE, chartType)
    localStorage.setItem(STORAGE_KEYS.BAR_CHARTS, JSON.stringify(barCharts))
    localStorage.setItem(STORAGE_KEYS.RADAR_CHARTS, JSON.stringify(radarCharts))
  } catch (err) {
    console.error('保存图表配置失败:', err)
  }
}

// 从 localStorage 加载图表配置
const loadChartConfig = () => {
  try {
    const chartType = localStorage.getItem(STORAGE_KEYS.CHART_TYPE) || 'bar'
    const barChartsStr = localStorage.getItem(STORAGE_KEYS.BAR_CHARTS)
    const radarChartsStr = localStorage.getItem(STORAGE_KEYS.RADAR_CHARTS)
    
    const barCharts = barChartsStr ? JSON.parse(barChartsStr) : []
    const radarCharts = radarChartsStr ? JSON.parse(radarChartsStr) : []
    
    return { chartType, barCharts, radarCharts }
  } catch (err) {
    console.error('加载图表配置失败:', err)
    return { chartType: 'bar', barCharts: [], radarCharts: [] }
  }
}

// 清除图表配置缓存
export const clearChartConfigCache = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CHART_TYPE)
    localStorage.removeItem(STORAGE_KEYS.BAR_CHARTS)
    localStorage.removeItem(STORAGE_KEYS.RADAR_CHARTS)
  } catch (err) {
    console.error('清除图表配置缓存失败:', err)
  }
}

// 通用导出图表为PNG函数
const exportChartToPng = async (chartRef, filename) => {
  if (!chartRef?.current) {
    message.error('图表未就绪')
    return false
  }
  
  try {
    // 尝试获取图表实例
    let chart = null
    
    // @ant-design/plots v2 的API
    if (typeof chartRef.current.getChart === 'function') {
      chart = chartRef.current.getChart()
    } else if (chartRef.current.chart) {
      chart = chartRef.current.chart
    }
    
    if (chart) {
      // 使用G2的downloadImage方法
      if (typeof chart.downloadImage === 'function') {
        chart.downloadImage(filename)
        message.success(`已导出 ${filename}.png`)
        return true
      }
      
      // 备选方案：直接获取canvas
      const canvas = chart.getCanvas?.()
      if (canvas) {
        const el = canvas.get?.('el') || canvas.cfg?.el
        if (el) {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = el.width
          tempCanvas.height = el.height
          const tempCtx = tempCanvas.getContext('2d')
          tempCtx.fillStyle = '#ffffff'
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
          tempCtx.drawImage(el, 0, 0)
          
          const dataUrl = tempCanvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = `${filename}.png`
          link.href = dataUrl
          link.click()
          message.success(`已导出 ${filename}.png`)
          return true
        }
      }
    }
    
    // 最后的备选方案：直接查找DOM中的canvas或svg
    const container = chartRef.current
    if (container) {
      // 查找canvas
      const canvasEl = container.querySelector?.('canvas') || 
                       (container.getElementsByTagName?.('canvas')?.[0])
      if (canvasEl) {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvasEl.width
        tempCanvas.height = canvasEl.height
        const tempCtx = tempCanvas.getContext('2d')
        tempCtx.fillStyle = '#ffffff'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.drawImage(canvasEl, 0, 0)
        
        const dataUrl = tempCanvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `${filename}.png`
        link.href = dataUrl
        link.click()
        message.success(`已导出 ${filename}.png`)
        return true
      }
    }
    
    message.error('无法获取图表画布，请重试')
    return false
  } catch (err) {
    console.error('导出失败:', err)
    message.error('导出失败，请重试')
    return false
  }
}

// 柱状图配置组件
function BarChartConfig({ 
  config, 
  index, 
  reports, 
  datasets, 
  models, 
  onUpdate, 
  onDelete,
  chartRef 
}) {
  const { mode, selectedDataset, selectedModel, selectedModels, selectedDatasets } = config
  const containerRef = useRef(null)
  
  // 获取当前数据集对应的可用模型
  const availableModelsForDataset = useMemo(() => {
    if (!selectedDataset) return []
    return [...new Set(
      reports
        .filter(r => r.dataset === selectedDataset)
        .map(r => r.model)
    )].sort()
  }, [reports, selectedDataset])
  
  // 获取当前模型对应的可用数据集
  const availableDatasetsForModel = useMemo(() => {
    if (!selectedModel) return []
    return [...new Set(
      reports
        .filter(r => r.model === selectedModel)
        .map(r => r.dataset)
    )].sort()
  }, [reports, selectedModel])
  
  // 生成图表数据 - 使用分组柱状图格式
  const chartData = useMemo(() => {
    if (mode === 'models') {
      // 模式a: 固定数据集，比较多个模型
      // 横坐标显示数据集名称（去后缀），不同颜色柱子代表不同模型
      if (!selectedDataset || !selectedModels?.length) return []
      const groupName = removeExtension(selectedDataset)
      return selectedModels.map((modelName, idx) => {
        const report = reports.find(
          r => r.dataset === selectedDataset && r.model === modelName
        )
        const acc = report?.summary?.accuracy
        return {
          category: groupName,
          series: modelName,
          value: acc !== undefined ? parseFloat((acc * 100).toFixed(2)) : 0,
        }
      })
    } else {
      // 模式b: 固定模型，比较多个数据集
      // 横坐标显示模型名称，不同颜色柱子代表不同数据集
      if (!selectedModel || !selectedDatasets?.length) return []
      return selectedDatasets.map((datasetName, idx) => {
        const report = reports.find(
          r => r.model === selectedModel && r.dataset === datasetName
        )
        const acc = report?.summary?.accuracy
        return {
          category: selectedModel,
          series: removeExtension(datasetName),
          value: acc !== undefined ? parseFloat((acc * 100).toFixed(2)) : 0,
        }
      })
    }
  }, [mode, selectedDataset, selectedModel, selectedModels, selectedDatasets, reports])
  
  // 获取系列列表和颜色数组
  const seriesList = useMemo(() => {
    if (mode === 'models') {
      return selectedModels || []
    } else {
      return (selectedDatasets || []).map(d => removeExtension(d))
    }
  }, [mode, selectedModels, selectedDatasets])
  
  // 颜色数组
  const colorArray = useMemo(() => {
    return seriesList.map((_, idx) => getColor(idx))
  }, [seriesList])
  
  // 计算动态高度 - 基于图例数量增加高度（放大尺寸以提升清晰度）
  const chartHeight = useMemo(() => {
    const itemCount = mode === 'models' ? (selectedModels?.length || 0) : (selectedDatasets?.length || 0)
    // 基础高度800（从500增加），每增加一个图例项增加额外空间
    const legendHeight = Math.ceil(itemCount / 3) * 50 // 假设每行3个图例项，增加间距
    return Math.max(800, 750 + legendHeight)
  }, [mode, selectedModels, selectedDatasets])
  
  // 计算图表宽度（放大以提升清晰度）
  const chartWidth = useMemo(() => {
    // 基础宽度，可以根据容器自适应，但设置最小宽度
    return '100%'
  }, [])
  
  const chartConfig = {
    data: chartData,
    xField: 'category',
    yField: 'value',
    seriesField: 'series',
    colorField: 'series',
    group: true,
    color: colorArray,
    // 提升清晰度：设置更高的像素比例
    pixelRatio: 2,
    autoFit: true,
    style: {
      radiusTopLeft: 10,
      radiusTopRight: 10,
      maxWidth: 80, // 增加柱子宽度
    },
    label: {
      text: (d) => `${d.value}%`,
      textBaseline: 'bottom',
      position: 'top',
      style: {
        fontWeight: 600,
        fontSize: 14, // 增加字体大小
        fill: '#333',
      },
    },
    axis: {
      y: {
        title: {
          text: '准确率 (%)',
          style: { fontSize: 16, fontWeight: 600 },
        },
        titleSpacing: 20,
        min: 0,
        max: 100,
        tickCount: 6,
        labelFormatter: (v) => `${v}`,
        label: {
          style: { fontSize: 14 },
        },
      },
      x: {
        title: {
          text: mode === 'models' ? '数据集' : '模型',
          style: { fontSize: 16, fontWeight: 600 },
        },
        titleSpacing: 16,
        labelAutoRotate: true,
        labelAutoHide: false,
        label: {
          style: { fontSize: 13 },
        },
      },
    },
    legend: {
      color: {
        position: 'top',
        layout: {
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        },
        title: false,
        rowPadding: 12,
        colPadding: 20,
        itemMarker: 'circle',
        itemLabelFontSize: 10, // 增加图例字体大小
        maxRows: 10,
        autoWrap: true,
      },
    },
    interaction: {
      elementHighlight: { background: true },
    },
    animate: { enter: { type: 'growInY', duration: 600 } },
    marginTop: 80,
    paddingTop: 60,
  }

  // 导出当前图表（高分辨率）
  const handleExport = useCallback(() => {
    // 优先使用containerRef来查找canvas
    if (containerRef.current) {
      const canvasEl = containerRef.current.querySelector('canvas')
      if (canvasEl) {
        // 使用更高的分辨率导出（2倍缩放）
        const scale = 2
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvasEl.width * scale
        tempCanvas.height = canvasEl.height * scale
        const tempCtx = tempCanvas.getContext('2d')
        
        // 设置高质量渲染
        tempCtx.fillStyle = '#ffffff'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.scale(scale, scale)
        tempCtx.drawImage(canvasEl, 0, 0)
        
        const dataUrl = tempCanvas.toDataURL('image/png', 1.0)
        const link = document.createElement('a')
        link.download = `bar_chart_${index + 1}.png`
        link.href = dataUrl
        link.click()
        message.success(`已导出 bar_chart_${index + 1}.png`)
        return
      }
    }
    exportChartToPng(chartRef, `bar_chart_${index + 1}`)
  }, [chartRef, index])

  return (
    <Card 
      size="small" 
      className="card-shadow"
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <BarChartOutlined style={{ color: getColor(index) }} />
          <span>柱状图 #{index + 1}</span>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="导出PNG">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            />
          </Tooltip>
          <Tooltip title="删除图表">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(index)}
            />
          </Tooltip>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>对比模式：</Text>
          <Radio.Group
            value={mode}
            onChange={(e) => onUpdate(index, { 
              mode: e.target.value,
              selectedModels: [],
              selectedDatasets: [],
            })}
            style={{ marginLeft: 12 }}
          >
            <Radio.Button value="models">多模型对比（固定数据集）</Radio.Button>
            <Radio.Button value="datasets">多数据集对比（固定模型）</Radio.Button>
          </Radio.Group>
        </div>
        
        {mode === 'models' ? (
          <Row gutter={16}>
            <Col span={8}>
              <Text type="secondary">选择数据集：</Text>
              <Select
                value={selectedDataset}
                onChange={(val) => onUpdate(index, { 
                  selectedDataset: val,
                  selectedModels: [],
                })}
                style={{ width: '100%', marginTop: 4 }}
                placeholder="选择一个数据集"
                showSearch
              >
                {datasets.map(d => (
                  <Option key={d} value={d}>{d}</Option>
                ))}
              </Select>
            </Col>
            <Col span={16}>
              <Text type="secondary">选择要对比的模型：</Text>
              <Select
                mode="multiple"
                value={selectedModels}
                onChange={(val) => onUpdate(index, { selectedModels: val })}
                style={{ width: '100%', marginTop: 4 }}
                placeholder="选择多个模型"
                disabled={!selectedDataset}
                maxTagCount={3}
              >
                {availableModelsForDataset.map(m => (
                  <Option key={m} value={m}>{m}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        ) : (
          <Row gutter={16}>
            <Col span={8}>
              <Text type="secondary">选择模型：</Text>
              <Select
                value={selectedModel}
                onChange={(val) => onUpdate(index, { 
                  selectedModel: val,
                  selectedDatasets: [],
                })}
                style={{ width: '100%', marginTop: 4 }}
                placeholder="选择一个模型"
                showSearch
              >
                {models.map(m => (
                  <Option key={m} value={m}>{m}</Option>
                ))}
              </Select>
            </Col>
            <Col span={16}>
              <Text type="secondary">选择要对比的数据集：</Text>
              <Select
                mode="multiple"
                value={selectedDatasets}
                onChange={(val) => onUpdate(index, { selectedDatasets: val })}
                style={{ width: '100%', marginTop: 4 }}
                placeholder="选择多个数据集"
                disabled={!selectedModel}
                maxTagCount={3}
              >
                {availableDatasetsForModel.map(d => (
                  <Option key={d} value={d}>{d}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        )}
        
        {chartData.length > 0 && (
          <div 
            ref={containerRef}
            style={{ 
              minHeight: chartHeight, 
              marginTop: 24,
              padding: '20px 0',
              width: '100%',
            }}
          >
            <div style={{ height: chartHeight, minHeight: 800, width: '100%' }}>
              <Column {...chartConfig} ref={chartRef} />
            </div>
          </div>
        )}
        
        {chartData.length === 0 && (
          <Empty description="请完成上方配置以生成图表" style={{ padding: '40px 0' }} />
        )}
      </Space>
    </Card>
  )
}

// 雷达图配置组件 - 简化版，只保留多数据集维度对比多模型
function RadarChartConfig({ 
  config, 
  index, 
  reports, 
  datasets, 
  models, 
  onUpdate, 
  onDelete,
  chartRef 
}) {
  const { selectedModels, selectedDatasets } = config
  const containerRef = useRef(null)
  
  // 获取所有模型都测试过的数据集
  const availableDatasets = useMemo(() => {
    if (!selectedModels?.length) return datasets
    // 找到所有选中模型都测试过的数据集
    const datasetSets = selectedModels.map(model => 
      new Set(reports.filter(r => r.model === model).map(r => r.dataset))
    )
    if (datasetSets.length === 0) return datasets
    let intersection = datasetSets[0]
    for (let i = 1; i < datasetSets.length; i++) {
      intersection = new Set([...intersection].filter(x => datasetSets[i].has(x)))
    }
    return [...intersection].sort()
  }, [reports, selectedModels, datasets])
  
  // 生成图表数据
  const chartData = useMemo(() => {
    if (!selectedDatasets?.length || !selectedModels?.length) return []
    
    const data = []
    selectedModels.forEach((modelName) => {
      selectedDatasets.forEach((datasetName) => {
        const report = reports.find(
          r => r.model === modelName && r.dataset === datasetName
        )
        const accuracy = report?.summary?.accuracy || 0
        data.push({
          model: modelName,
          metric: removeExtension(datasetName),
          value: accuracy,
        })
      })
    })
    return data
  }, [selectedModels, selectedDatasets, reports])
  
  // 获取模型颜色映射
  const modelColors = useMemo(() => {
    if (!selectedModels) return []
    return selectedModels.map((_, idx) => getColor(idx))
  }, [selectedModels])
  
  // 雷达图配置
  const chartConfig = {
    data: chartData,
    xField: 'metric',
    yField: 'value',
    seriesField: 'model',
    colorField: 'model',
    color: modelColors,
    // 提升清晰度：设置更高的像素比例
    pixelRatio: 2,
    autoFit: true,
    meta: {
      value: {
        min: 0,
        max: 1,
        formatter: (v) => `${(v * 100).toFixed(1)}%`,
      },
    },
    xAxis: {
      line: null,
      tickLine: null,
      label: {
        style: { fontSize: 14 }, // 增加字体大小
      },
    },
    yAxis: {
      grid: {
        alternateColor: 'rgba(0, 0, 0, 0.04)',
      },
      label: {
        style: { fontSize: 13 },
      },
    },
    point: {
      size: 6, // 增加点的大小
      shape: 'circle',
    },
    lineStyle: {
      lineWidth: 3, // 增加线条宽度
    },
    area: {
      style: {
        fillOpacity: 0.2,
      },
    },
    legend: {
      color: {
        position: 'top',
        layout: {
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        },
        title: false,
        rowPadding: 20,
        colPadding: 25,
        itemMarker: 'circle',
        itemLabelFontSize: 10, // 增加图例字体大小
        maxRows: 10,
        autoWrap: true,
      },
    },
    animate: { enter: { type: 'fadeIn', duration: 600 } },
  }

  // 导出当前图表（高分辨率）
  const handleExport = useCallback(() => {
    // 优先使用containerRef来查找canvas
    if (containerRef.current) {
      const canvasEl = containerRef.current.querySelector('canvas')
      if (canvasEl) {
        // 使用更高的分辨率导出（2倍缩放）
        const scale = 2
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvasEl.width * scale
        tempCanvas.height = canvasEl.height * scale
        const tempCtx = tempCanvas.getContext('2d')
        
        // 设置高质量渲染
        tempCtx.fillStyle = '#ffffff'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempCtx.scale(scale, scale)
        tempCtx.drawImage(canvasEl, 0, 0)
        
        const dataUrl = tempCanvas.toDataURL('image/png', 1.0)
        const link = document.createElement('a')
        link.download = `radar_chart_${index + 1}.png`
        link.href = dataUrl
        link.click()
        message.success(`已导出 radar_chart_${index + 1}.png`)
        return
      }
    }
    exportChartToPng(chartRef, `radar_chart_${index + 1}`)
  }, [chartRef, index])

  return (
    <Card 
      size="small" 
      className="card-shadow"
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <RadarChartOutlined style={{ color: getColor(index + 3) }} />
          <span>雷达图 #{index + 1}</span>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="导出PNG">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            />
          </Tooltip>
          <Tooltip title="删除图表">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(index)}
            />
          </Tooltip>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          选择多个模型进行对比，每个维度代表一个数据集的准确率
        </Text>
        
        <Row gutter={16}>
          <Col span={12}>
            <Text type="secondary">选择要对比的模型：</Text>
            <Select
              mode="multiple"
              value={selectedModels}
              onChange={(val) => onUpdate(index, { 
                selectedModels: val,
                // 当模型变化时，重新过滤可用数据集
                selectedDatasets: selectedDatasets?.filter(d => {
                  if (!val?.length) return true
                  return val.every(model => 
                    reports.some(r => r.model === model && r.dataset === d)
                  )
                }) || [],
              })}
              style={{ width: '100%', marginTop: 4 }}
              placeholder="选择多个模型"
              maxTagCount={3}
            >
              {models.map(m => (
                <Option key={m} value={m}>{m}</Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <Text type="secondary">选择维度（数据集）：</Text>
            <Select
              mode="multiple"
              value={selectedDatasets}
              onChange={(val) => onUpdate(index, { selectedDatasets: val })}
              style={{ width: '100%', marginTop: 4 }}
              placeholder="选择多个数据集作为雷达图维度"
              maxTagCount={3}
            >
              {availableDatasets.map(d => (
                <Option key={d} value={d}>{removeExtension(d)}</Option>
              ))}
            </Select>
          </Col>
        </Row>
        
        {chartData.length > 0 && (
          <div 
            ref={containerRef}
            style={{ 
              height: 700, // 从450增加到700，提升清晰度
              marginTop: 20,
              overflowY: 'auto',
              overflowX: 'hidden',
              width: '100%',
            }}
          >
            <div style={{ height: 700, width: '100%' }}>
              <Radar {...chartConfig} ref={chartRef} />
            </div>
          </div>
        )}
        
        {chartData.length === 0 && (
          <Empty description="请选择模型和数据集维度以生成雷达图" style={{ padding: '40px 0' }} />
        )}
      </Space>
    </Card>
  )
}

function ResultsPage() {
  const { reports, loading, fetchReports } = useStore()
  
  // 从 localStorage 加载初始配置
  const initialConfig = useMemo(() => loadChartConfig(), [])
  
  // 图表类型: 'bar' | 'radar'
  const [chartType, setChartType] = useState(initialConfig.chartType)
  
  // 柱状图配置列表
  const [barCharts, setBarCharts] = useState(initialConfig.barCharts)
  const barChartRefs = useRef([])
  const barContainerRefs = useRef([])
  
  // 雷达图配置列表
  const [radarCharts, setRadarCharts] = useState(initialConfig.radarCharts)
  const radarChartRefs = useRef([])
  const radarContainerRefs = useRef([])

  useEffect(() => {
    fetchReports()
  }, [])

  // 初始化 refs（基于加载的配置）
  useEffect(() => {
    // 为已加载的柱状图创建 refs
    while (barChartRefs.current.length < barCharts.length) {
      barChartRefs.current.push(React.createRef())
      barContainerRefs.current.push(React.createRef())
    }
    
    // 为已加载的雷达图创建 refs
    while (radarChartRefs.current.length < radarCharts.length) {
      radarChartRefs.current.push(React.createRef())
      radarContainerRefs.current.push(React.createRef())
    }
  }, []) // 只在组件挂载时执行一次

  // 保存配置到 localStorage（当配置变化时）
  useEffect(() => {
    saveChartConfig(chartType, barCharts, radarCharts)
  }, [chartType, barCharts, radarCharts])

  // 获取所有数据集和模型
  const datasets = useMemo(() => 
    [...new Set(reports.map(r => r.dataset))].sort()
  , [reports])
  
  const models = useMemo(() => 
    [...new Set(reports.map(r => r.model))].sort()
  , [reports])

  // 添加柱状图
  const addBarChart = () => {
    setBarCharts([...barCharts, {
      mode: 'models', // 'models' | 'datasets'
      selectedDataset: null,
      selectedModel: null,
      selectedModels: [],
      selectedDatasets: [],
    }])
    barChartRefs.current.push(React.createRef())
    barContainerRefs.current.push(React.createRef())
  }
  
  // 更新柱状图配置
  const updateBarChart = (index, updates) => {
    const newCharts = [...barCharts]
    newCharts[index] = { ...newCharts[index], ...updates }
    setBarCharts(newCharts)
  }
  
  // 删除柱状图
  const deleteBarChart = (index) => {
    setBarCharts(barCharts.filter((_, i) => i !== index))
    barChartRefs.current.splice(index, 1)
    barContainerRefs.current.splice(index, 1)
  }
  
  // 添加雷达图
  const addRadarChart = () => {
    setRadarCharts([...radarCharts, {
      selectedModels: [],
      selectedDatasets: [],
    }])
    radarChartRefs.current.push(React.createRef())
    radarContainerRefs.current.push(React.createRef())
  }
  
  // 更新雷达图配置
  const updateRadarChart = (index, updates) => {
    const newCharts = [...radarCharts]
    newCharts[index] = { ...newCharts[index], ...updates }
    setRadarCharts(newCharts)
  }
  
  // 删除雷达图
  const deleteRadarChart = (index) => {
    setRadarCharts(radarCharts.filter((_, i) => i !== index))
    radarChartRefs.current.splice(index, 1)
    radarContainerRefs.current.splice(index, 1)
  }
  
  // 导出全部图表
  const exportAllCharts = async () => {
    const containerRefs = chartType === 'bar' ? barContainerRefs.current : radarContainerRefs.current
    const chartRefs = chartType === 'bar' ? barChartRefs.current : radarChartRefs.current
    const prefix = chartType === 'bar' ? 'bar_chart' : 'radar_chart'
    
    const chartCount = chartType === 'bar' ? barCharts.length : radarCharts.length
    
    if (chartCount === 0) {
      message.warning('没有可导出的图表')
      return
    }
    
    message.loading({ content: '正在导出...', key: 'export' })
    
    let exportedCount = 0
    for (let i = 0; i < chartCount; i++) {
      // 尝试从DOM直接获取canvas
      const container = document.querySelector(`[data-chart-index="${chartType}-${i}"]`)
      if (container) {
        const canvasEl = container.querySelector('canvas')
        if (canvasEl) {
          // 使用更高的分辨率导出（2倍缩放）
          const scale = 2
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = canvasEl.width * scale
          tempCanvas.height = canvasEl.height * scale
          const tempCtx = tempCanvas.getContext('2d')
          
          // 设置高质量渲染
          tempCtx.fillStyle = '#ffffff'
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
          tempCtx.scale(scale, scale)
          tempCtx.drawImage(canvasEl, 0, 0)
          
          const dataUrl = tempCanvas.toDataURL('image/png', 1.0)
          const link = document.createElement('a')
          link.download = `${prefix}_${i + 1}.png`
          link.href = dataUrl
          link.click()
          exportedCount++
          await new Promise(resolve => setTimeout(resolve, 500))
          continue
        }
      }
      
      // 备选方案
      const success = await exportChartToPng(chartRefs[i], `${prefix}_${i + 1}`)
      if (success) exportedCount++
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    if (exportedCount > 0) {
      message.success({ content: `已导出 ${exportedCount} 个图表`, key: 'export' })
    } else {
      message.error({ content: '导出失败，请重试', key: 'export' })
    }
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
      }}>
        <Title level={3} style={{ margin: 0 }}>
          <BarChartOutlined style={{ marginRight: 8, color: '#6366F1' }} />
          可视化
        </Title>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={exportAllCharts}
          >
            导出全部图表
          </Button>
        </Space>
      </div>

      {reports.length === 0 ? (
        <Empty description="暂无数据，请先完成评测任务" />
      ) : (
        <>
          {/* 图表类型切换 */}
          <Card bordered={false} className="card-shadow" style={{ marginBottom: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <Segmented
                value={chartType}
                onChange={(value) => {
                  setChartType(value)
                  // 配置会在 useEffect 中自动保存
                }}
                options={[
                  {
                    value: 'bar',
                    label: (
                      <Space>
                        <BarChartOutlined />
                        <span>柱状图</span>
                      </Space>
                    ),
                  },
                  {
                    value: 'radar',
                    label: (
                      <Space>
                        <RadarChartOutlined />
                        <span>雷达图</span>
                      </Space>
                    ),
                  },
                ]}
                size="large"
              />
              
              <Space>
                <Text type="secondary">
                  已有 {reports.length} 个报告 | {datasets.length} 个数据集 | {models.length} 个模型
                </Text>
              </Space>
            </div>
          </Card>

          {/* 柱状图面板 */}
          {chartType === 'bar' && (
            <div>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>
                  <BarChartOutlined style={{ marginRight: 8 }} />
                  柱状图配置
                </Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addBarChart}
                  style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                >
                  添加柱状图
                </Button>
              </div>
              
              {barCharts.length === 0 ? (
                <Card bordered={false} className="card-shadow">
                  <Empty 
                    description="点击上方按钮添加柱状图" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {barCharts.map((config, index) => {
                    if (!barChartRefs.current[index]) {
                      barChartRefs.current[index] = React.createRef()
                    }
                    return (
                      <Col key={index} span={24} lg={12} data-chart-index={`bar-${index}`}>
                        <BarChartConfig
                          config={config}
                          index={index}
                          reports={reports}
                          datasets={datasets}
                          models={models}
                          onUpdate={updateBarChart}
                          onDelete={deleteBarChart}
                          chartRef={barChartRefs.current[index]}
                        />
                      </Col>
                    )
                  })}
                </Row>
              )}
            </div>
          )}

          {/* 雷达图面板 */}
          {chartType === 'radar' && (
            <div>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>
                  <RadarChartOutlined style={{ marginRight: 8 }} />
                  雷达图配置
                </Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addRadarChart}
                  style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)' }}
                >
                  添加雷达图
                </Button>
              </div>
              
              {radarCharts.length === 0 ? (
                <Card bordered={false} className="card-shadow">
                  <Empty 
                    description="点击上方按钮添加雷达图" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Card>
              ) : (
                <Row gutter={[16, 16]}>
                  {radarCharts.map((config, index) => {
                    if (!radarChartRefs.current[index]) {
                      radarChartRefs.current[index] = React.createRef()
                    }
                    return (
                      <Col key={index} span={24} lg={12} data-chart-index={`radar-${index}`}>
                        <RadarChartConfig
                          config={config}
                          index={index}
                          reports={reports}
                          datasets={datasets}
                          models={models}
                          onUpdate={updateRadarChart}
                          onDelete={deleteRadarChart}
                          chartRef={radarChartRefs.current[index]}
                        />
                      </Col>
                    )
                  })}
                </Row>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ResultsPage
