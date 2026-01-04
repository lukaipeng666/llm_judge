import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Typography,
  Button,
  Spin,
  Row,
  Col,
  Statistic,
  Collapse,
  Empty,
  Tabs,
  Divider,
  Space,
  Modal,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import useStore from '../stores'

const { Title, Text, Paragraph } = Typography

function ReportDetailPage() {
  // 使用路径参数
  const { dataset, model } = useParams();
  const navigate = useNavigate()
  const { currentReport, loading, fetchReportDetail } = useStore()
  const [selectedBadcase, setSelectedBadcase] = useState(null)
  const [badcaseModalVisible, setBadcaseModalVisible] = useState(false)

  useEffect(() => {
    if (dataset && model) {
      // axios会自动处理URL编码，不需要手动解码
      fetchReportDetail(dataset, model)
        .then(data => {
          console.log('Report detail loaded:', data)
          console.log('Badcases count:', data?.badcases?.length)
        })
        .catch(error => {
          console.error('Failed to load report detail:', error)
          // 如果报告不存在，重定向到报告列表
          if (error.response && error.response.status === 404) {
            console.log('Report not found, redirecting to reports list...')
            navigate('/reports')
          }
        })
    }
  }, [dataset, model, navigate])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载报告数据...</div>
      </div>
    )
  }

  if (!currentReport) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Empty description="未找到报告数据" />
        <Button
          type="primary"
          onClick={() => navigate('/reports')}
          style={{ marginTop: 16 }}
        >
          返回报告列表
        </Button>
      </div>
    )
  }

  const { summary = {}, config = {}, badcases = [] } = currentReport

  // 调试日志
  console.log('currentReport:', currentReport)
  console.log('Badcases from destructuring:', badcases)

  // Badcase 表格列
  const badcaseColumns = [
    {
      title: '索引',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (text) => text ?? '-',
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score) => {
        if (score === undefined || score === null) return '-'
        const className = score >= 0.8 ? 'score-high' : 
                         score >= 0.5 ? 'score-medium' : 'score-low'
        return <span className={className}>{score.toFixed(4)}</span>
      },
    },
    {
      title: '用户输入',
      dataIndex: 'user_input',
      key: 'user_input',
      ellipsis: true,
      render: (text) => {
        // user_input 可能是数组或字符串
        let displayText = ''
        if (Array.isArray(text)) {
          // 如果是消息数组，找到 user role 的内容
          const userMsg = text.find(msg => msg.role === 'user')
          displayText = userMsg?.content || JSON.stringify(text)
        } else {
          displayText = text || '-'
        }
        return (
          <Text ellipsis style={{ maxWidth: 300 }}>{displayText}</Text>
        )
      },
    },
    {
      title: '模型输出',
      dataIndex: 'model_output',
      key: 'model_output',
      ellipsis: true,
      render: (text) => (
        <Text ellipsis style={{ maxWidth: 200 }}>{text || '-'}</Text>
      ),
    },
    {
      title: '参考答案',
      dataIndex: 'reference_output',
      key: 'reference_output',
      ellipsis: true,
      render: (text) => (
        <Text ellipsis style={{ maxWidth: 200 }}>{text || '-'}</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedBadcase(record)
            setBadcaseModalVisible(true)
          }}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <div className="fade-in">
      {/* 返回按钮和标题 */}
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/reports')}
          style={{ marginBottom: 16 }}
        >
          返回报告列表
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          评测报告详情
        </Title>
        <Space style={{ marginTop: 8 }}>
          <Tag color="geekblue" style={{ fontSize: 14 }}>{dataset}</Tag>
          <Tag color="purple" style={{ fontSize: 14 }}>{model}</Tag>
        </Space>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card stat-card-blue">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>准确率</span>}
              value={((summary.accuracy || 0) * 100).toFixed(2)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card stat-card-green">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>平均分</span>}
              value={summary.average_score?.toFixed(4) || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card stat-card-orange">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>数据总量</span>}
              value={summary.total_count || 0}
              prefix={<ExperimentOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="stat-card stat-card-red">
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Badcase 数量</span>}
              value={summary.badcase_count || badcases.length}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细信息标签页 */}
      <Card bordered={false} className="card-shadow">
        <Tabs
          defaultActiveKey="summary"
          items={[
            {
              key: 'summary',
              label: '汇总信息',
              children: (
                <div>
                  <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
                    <Descriptions.Item label="数据集">{dataset}</Descriptions.Item>
                    <Descriptions.Item label="模型">{model}</Descriptions.Item>
                    <Descriptions.Item label="评分函数">{config.scoring || '-'}</Descriptions.Item>
                    <Descriptions.Item label="正确数量">{summary.correct_count || 0}</Descriptions.Item>
                    <Descriptions.Item label="总数据量">{summary.total_count || 0}</Descriptions.Item>
                    <Descriptions.Item label="准确率">
                      {((summary.accuracy || 0) * 100).toFixed(2)}%
                    </Descriptions.Item>
                    <Descriptions.Item label="平均分">{summary.average_score?.toFixed(4) || '-'}</Descriptions.Item>
                    <Descriptions.Item label="平均推理时间">
                      {summary.average_inference_time?.toFixed(4) || '-'} 秒
                    </Descriptions.Item>
                    <Descriptions.Item label="Badcase 数量">{summary.badcase_count || badcases.length}</Descriptions.Item>
                  </Descriptions>

                  {/* ROUGE 分数 */}
                  {summary.rouge_scores && Object.keys(summary.rouge_scores).length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Title level={5}>ROUGE 分数</Title>
                      <Row gutter={16}>
                        {Object.entries(summary.rouge_scores).map(([key, value]) => (
                          <Col key={key} xs={24} sm={8}>
                            <Card size="small">
                              <Statistic
                                title={key.toUpperCase()}
                                value={(value * 100).toFixed(2)}
                                suffix="%"
                              />
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'config',
              label: '配置信息',
              children: (
                <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                  <Descriptions.Item label="API 地址">{config.api_urls?.join(', ') || '-'}</Descriptions.Item>
                  <Descriptions.Item label="模型名称">{config.model || '-'}</Descriptions.Item>
                  <Descriptions.Item label="数据文件" span={2}>{config.data_file || '-'}</Descriptions.Item>
                  <Descriptions.Item label="评分函数">{config.scoring || '-'}</Descriptions.Item>
                  <Descriptions.Item label="工作线程">{config.max_workers || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Badcase 阈值">{config.badcase_threshold || '-'}</Descriptions.Item>
                  <Descriptions.Item label="最大 Tokens">{config.max_tokens || '-'}</Descriptions.Item>
                  <Descriptions.Item label="超时时间">{config.timeout || '-'} 秒</Descriptions.Item>
                  <Descriptions.Item label="测试角色">{config.role || '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'badcases',
              label: (
                <span>
                  Badcase 列表
                  <Tag color="red" style={{ marginLeft: 8 }}>{badcases.length}</Tag>
                </span>
              ),
              children: (
                <div>
                  {badcases.length > 0 ? (
                    <Table
                      columns={badcaseColumns}
                      dataSource={badcases}
                      rowKey={(record, index) => record.index || index}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 个 Badcase`,
                      }}
                      scroll={{ x: 1000 }}
                    />
                  ) : (
                    <Empty description="没有 Badcase，表现优秀！" />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Badcase 详情弹窗 */}
      <Modal
        title="Badcase 详情"
        open={badcaseModalVisible}
        onCancel={() => setBadcaseModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBadcaseModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        centered
      >
        {selectedBadcase && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="索引">{selectedBadcase.index}</Descriptions.Item>
              <Descriptions.Item label="得分">
                <span className={selectedBadcase.score >= 0.5 ? 'score-medium' : 'score-low'}>
                  {selectedBadcase.score?.toFixed(4) || '-'}
                </span>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left">用户输入</Divider>
            <Paragraph
              style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                maxHeight: 150,
                overflow: 'auto',
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {(() => {
                  const userInput = selectedBadcase.user_input
                  if (Array.isArray(userInput)) {
                    // 如果是消息数组，格式化显示
                    return userInput.map((msg, idx) => 
                      `[${msg.role}]: ${msg.content}`
                    ).join('\n\n')
                  }
                  return userInput || '-'
                })()}
              </pre>
            </Paragraph>

            <Divider orientation="left">模型输出</Divider>
            <Paragraph
              style={{
                background: '#fff7e6',
                padding: 12,
                borderRadius: 4,
                maxHeight: 150,
                overflow: 'auto',
                border: '1px solid #ffd591',
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {selectedBadcase.model_output || '-'}
              </pre>
            </Paragraph>

            <Divider orientation="left">参考答案</Divider>
            <Paragraph
              style={{
                background: '#f6ffed',
                padding: 12,
                borderRadius: 4,
                maxHeight: 150,
                overflow: 'auto',
                border: '1px solid #b7eb8f',
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {selectedBadcase.reference_output || '-'}
              </pre>
            </Paragraph>

            {selectedBadcase.details && (
              <>
                <Divider orientation="left">详细信息</Divider>
                <Paragraph
                  code
                  style={{
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    maxHeight: 150,
                    overflow: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(selectedBadcase.details, null, 2)}
                  </pre>
                </Paragraph>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ReportDetailPage
