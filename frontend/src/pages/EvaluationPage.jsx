import React, { useEffect, useState } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Typography,
  Space,
  message,
  Alert,
  Collapse,
  Tooltip,
  AutoComplete,
} from 'antd'
import {
  PlayCircleOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import useStore from '../stores'
import { getModelConfigs } from '../services/api'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

function EvaluationPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  
  const {
    scoringFunctions,
    dataFiles,
    availableModels,
    formData,
    loading,
    fetchScoringFunctions,
    fetchDataFiles,
    fetchAvailableModels,
    setFormData,
    resetFormData,
  } = useStore()
  
  const [modelConfigs, setModelConfigs] = useState([])
  const [selectedModelConfig, setSelectedModelConfig] = useState(null)
  
  const { startEvaluation } = useStore()

  useEffect(() => {
    fetchScoringFunctions()
    fetchDataFiles()
    fetchAvailableModels()
    // 加载模型配置
    getModelConfigs().then(res => {
      setModelConfigs(res.configs || [])
    }).catch(err => {
      console.error('Failed to load model configs:', err)
    })
  }, [])

  // 调试：监听 scoringFunctions 变化
  useEffect(() => {
    console.log('[DEBUG] scoringFunctions changed:', scoringFunctions)
  }, [scoringFunctions])

  useEffect(() => {
    form.setFieldsValue(formData)
  }, [formData])

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      // 从模型配置中获取API地址和参数
      const modelConfig = modelConfigs.find(c => c.model_name === values.model)
      if (!modelConfig) {
        message.error('请选择有效的模型配置')
        return
      }
      
      // 数据处理，确保数字类型正常
      // 处理temperature和top_p，确保是有效数字
      const getTemperature = () => {
        if (values.temperature !== undefined && values.temperature !== null) {
          const val = parseFloat(values.temperature)
          if (!isNaN(val)) return val
        }
        if (modelConfig.temperature !== undefined && modelConfig.temperature !== null) {
          return parseFloat(modelConfig.temperature)
        }
        return 0.0
      }
      
      const getTopP = () => {
        if (values.top_p !== undefined && values.top_p !== null) {
          const val = parseFloat(values.top_p)
          if (!isNaN(val)) return val
        }
        if (modelConfig.top_p !== undefined && modelConfig.top_p !== null) {
          return parseFloat(modelConfig.top_p)
        }
        return 1.0
      }
      
      const config = {
        ...values,
        // 从模型配置中获取API URLs
        api_urls: modelConfig.api_urls || [],
        // 从模型配置中获取API Key
        api_key: modelConfig.api_key || 'sk-xxx',
        // 处理 model（为了匹配后端的 string 类型）
        model: Array.isArray(values.model) ? values.model[0] : values.model,
        // 确保数字字段为整数，0表示使用全部数据
        max_workers: parseInt(values.max_workers) || 4,
        badcase_threshold: parseFloat(values.badcase_threshold) || 1,
        sample_size: (parseInt(values.sample_size) || 0),
        // 从模型配置中获取max_tokens和timeout，如果没有则使用表单值
        max_tokens: parseInt(values.max_tokens) || modelConfig.max_tokens || 1024,
        timeout: parseInt(values.timeout) || modelConfig.timeout || 10,
        // 从模型配置中获取temperature和top_p，确保是有效数字
        temperature: getTemperature(),
        top_p: getTopP(),
        // 默认使用vllm
        is_vllm: true,
        // 使用后端默认值
        scoring_module: './function_register/plugin.py',
        report_format: 'json, txt, badcases',
      }

      console.log('[DEBUG] Submitting config:', config)
      console.log('[DEBUG] sample_size value:', config.sample_size, 'type:', typeof config.sample_size)
      const result = await startEvaluation(config)
      message.success(`评测任务已创建，任务ID: ${result.task_id}`)
      navigate('/tasks')
    } catch (error) {
      console.error('Error submitting:', error)
      message.error('启动评测失败: ' + (error.message || '未知错误'))
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleModelChange = (modelName) => {
    const config = modelConfigs.find(c => c.model_name === modelName)
    if (config) {
      setSelectedModelConfig(config)
      // 自动填充模型配置的参数
      form.setFieldsValue({
        max_tokens: config.max_tokens || 1024,
        timeout: config.timeout || 10,
        temperature: config.temperature ?? 0.0,
        top_p: config.top_p ?? 1.0,
      })
    }
  }

  const handleReset = () => {
    resetFormData()
    form.resetFields()
    message.info('表单已重置')
  }

  const handleValuesChange = (changedValues, allValues) => {
    setFormData(allValues)
  }

  return (
    <div className="fade-in">
      <Title level={3} style={{ marginBottom: 24 }}>
        评测配置
      </Title>

      <Alert
        message="配置评测任务"
        description="填写以下配置项启动大模型评测任务。带 * 的为必填项，其他选项可使用默认值。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={formData}
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
      >
        {/* 基础配置 */}
        <Card title="基础配置" bordered={false} className="card-shadow" style={{ marginBottom: 16 }}>
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="模型名称"
                name="model"
                rules={[{ required: true, message: '请选择模型名称' }]}
              >
                <Select
                  showSearch
                  placeholder="选择模型"
                  loading={loading}
                  optionFilterProp="children"
                  onChange={handleModelChange}
                >
                  {modelConfigs.map(config => (
                    <Option key={config.model_name} value={config.model_name}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{config.model_name}</div>
                        {config.description && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {config.description}
                          </Text>
                        )}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label="数据文件"
                name="data_file"
                rules={[{ required: true, message: '请选择数据文件' }]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="选择数据文件"
                  loading={loading}
                  optionFilterProp="children"
                >
                  {dataFiles.map(file => (
                    <Option key={file.id} value={String(file.id)}>
                      {file.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <Space>
                    评分函数
                    <Tooltip title="选择用于评估模型输出的评分方法">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                name="scoring"
                rules={[{ required: true, message: '请选择评分函数' }]}
              >
                <Select
                  showSearch
                  placeholder="选择评分函数"
                  loading={loading}
                  optionFilterProp="children"
                >
                  {scoringFunctions.map(func => {
                    // 兼容旧格式（字符串）和新格式（对象）
                    const funcName = typeof func === 'string' ? func : func.name
                    const funcDesc = typeof func === 'object' ? func.description : '自定义评分函数'

                    return (
                      <Option key={funcName} value={funcName}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{funcName}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {funcDesc}
                          </Text>
                        </div>
                      </Option>
                    )
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <Space>
                    温度 (Temperature)
                    <Tooltip title="控制输出的随机性，值越大输出越随机。范围：0.0-2.0">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                name="temperature"
                rules={[
                  { required: false },
                  { type: 'number', min: 0, max: 2, message: '温度值应在 0.0 到 2.0 之间' }
                ]}
              >
                <InputNumber
                  min={0}
                  max={2}
                  step={0.1}
                  precision={1}
                  style={{ width: '100%' }}
                  placeholder="从模型配置自动填充"
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label={
                  <Space>
                    Top P
                    <Tooltip title="核采样参数，控制输出的多样性。范围：0.0-1.0">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                name="top_p"
                rules={[
                  { required: false },
                  { type: 'number', min: 0, max: 1, message: 'Top P 值应在 0.0 到 1.0 之间' }
                ]}
              >
                <InputNumber
                  min={0}
                  max={1}
                  step={0.1}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="从模型配置自动填充"
                />
              </Form.Item>
            </Col>
          </Row>
          
          {selectedModelConfig && (
            <Alert
              message={`已选择模型: ${selectedModelConfig.model_name}`}
              description={`API地址: ${selectedModelConfig.api_urls.join(', ')} | 温度: ${selectedModelConfig.temperature} | Top P: ${selectedModelConfig.top_p} | Max Tokens: ${selectedModelConfig.max_tokens} | Timeout: ${selectedModelConfig.timeout}s`}
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>

        {/* 高级配置 */}
        <Collapse
          defaultActiveKey={[]}
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'advanced',
              label: '高级配置',
              children: (
                <Row gutter={24}>
                  <Col xs={24} lg={8}>
                    <Form.Item
                      label="最大工作线程数"
                      name="max_workers"
                    >
                      <InputNumber min={1} max={256} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Form.Item
                      label="Badcase 阈值"
                      name="badcase_threshold"
                    >
                      <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Form.Item
                      label="最大 Tokens"
                      name="max_tokens"
                    >
                      <InputNumber min={1} max={65536} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Form.Item
                      label="超时时间 (秒)"
                      name="timeout"
                    >
                      <InputNumber min={1} max={3600} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Form.Item
                      label="样本数量"
                      name="sample_size"
                      tooltip="0 表示使用全部数据"
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Form.Item
                      label="测试角色"
                      name="role"
                    >
                      <Select>
                        <Option value="assistant">assistant</Option>
                        <Option value="user">user</Option>
                        <Option value="system">system</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                </Row>
              ),
            },
          ]}
        />

        {/* 提交按钮 */}
        <Card bordered={false} className="card-shadow">
          <Space size="middle">
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              htmlType="submit"
              loading={submitting}
            >
              启动评测
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置表单
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  )
}

export default EvaluationPage
