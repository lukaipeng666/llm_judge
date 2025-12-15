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
} from 'antd'
import {
  PlayCircleOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useEvaluationStore, useTaskStore } from '../stores'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

// 评分函数描述
const scoringFunctionDescriptions = {
  rouge: 'ROUGE 评分，计算文本相似度 (ROUGE-1, ROUGE-2, ROUGE-L)',
  exact_match: '精确匹配评分，检查输出是否与参考答案完全一致',
  json_check: 'JSON 格式检查，验证输出的 JSON 格式是否正确',
  equal_check: '相等检查，比较输出与参考答案是否相等',
  list_check: '列表检查，验证输出列表与参考答案的匹配度',
  llm_judge_with_answer: 'LLM 裁判评分，使用大模型判断答案质量',
  box: 'Box 格式评分，提取并比较 boxed 格式的数值',
  reject: '拒识评分，评估模型的拒识能力',
  agent_instruct_score: 'Agent 指令评分，评估 Agent 任务完成度',
  ifeval_full_scorer: 'IFEval 完整评分，评估指令遵循能力',
  toolbench_evaluation: 'ToolBench 评估，评估工具调用能力',
}

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
  } = useEvaluationStore()
  
  const { startEvaluation } = useTaskStore()

  useEffect(() => {
    fetchScoringFunctions()
    fetchDataFiles()
    fetchAvailableModels()
  }, [])

  useEffect(() => {
    form.setFieldsValue(formData)
  }, [formData])

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true)
      
      // 处理 API URLs (逗号分隔转数组)
      const config = {
        ...values,
        api_urls: typeof values.api_urls === 'string' 
          ? values.api_urls.split(',').map(url => url.trim()).filter(Boolean)
          : values.api_urls,
      }
      
      const result = await startEvaluation(config)
      message.success(`评测任务已创建，任务ID: ${result.task_id}`)
      navigate('/tasks')
    } catch (error) {
      message.error('启动评测失败: ' + (error.message || '未知错误'))
    } finally {
      setSubmitting(false)
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
                label={
                  <Space>
                    API 地址
                    <Tooltip title="支持多个地址，用逗号分隔">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                name="api_urls"
                rules={[{ required: true, message: '请输入 API 地址' }]}
              >
                <TextArea
                  placeholder="http://localhost:8000/v1&#10;多个地址用逗号或换行分隔"
                  rows={3}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label="API Key"
                name="api_key"
                rules={[{ required: true, message: '请输入 API Key' }]}
              >
                <Input.Password placeholder="sk-xxx" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="模型名称"
                name="model"
                rules={[{ required: true, message: '请输入或选择模型名称' }]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="选择或输入模型名称"
                  mode="tags"
                  maxTagCount={1}
                  options={availableModels.map(m => ({ label: m, value: m }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label="数据文件"
                name="data_file"
                rules={[{ required: true, message: '请选择或输入数据文件路径' }]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="选择数据文件"
                  loading={loading}
                  optionFilterProp="children"
                >
                  {dataFiles.map(file => (
                    <Option key={file.path} value={file.path}>
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
                  {scoringFunctions.map(func => (
                    <Option key={func} value={func}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{func}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {scoringFunctionDescriptions[func] || '自定义评分函数'}
                        </Text>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label="报告输出目录"
                name="report_dir"
              >
                <Input placeholder="./reports" />
              </Form.Item>
            </Col>
          </Row>
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
                      <InputNumber min={10} max={3600} style={{ width: '100%' }} />
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
                  <Col xs={24} lg={12}>
                    <Form.Item
                      label="评分模块路径"
                      name="scoring_module"
                    >
                      <Input placeholder="./function_register/plugin.py" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Form.Item
                      label="报告格式"
                      name="report_format"
                    >
                      <Select mode="tags" placeholder="选择报告格式">
                        <Option value="json">JSON</Option>
                        <Option value="txt">TXT</Option>
                        <Option value="badcases">Badcases</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'checkpoint',
              label: '断点续测配置',
              children: (
                <Row gutter={24}>
                  <Col xs={24} lg={12}>
                    <Form.Item
                      label="检查点文件路径"
                      name="checkpoint_path"
                    >
                      <Input placeholder="./checkpoint/task.json" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={6}>
                    <Form.Item
                      label="检查点保存间隔"
                      name="checkpoint_interval"
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} lg={6}>
                    <Form.Item
                      label="从断点继续"
                      name="resume"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'debug',
              label: '调试选项',
              children: (
                <Row gutter={24}>
                  <Col xs={24} lg={8}>
                    <Form.Item
                      label="测试模式"
                      name="test_mode"
                      valuePropName="checked"
                      tooltip="启用后不实际调用 API，用于测试流程"
                    >
                      <Switch />
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
