import { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Table, Button, Tag, Card, Modal, message, Space, Tabs, Descriptions, Popconfirm, Avatar, Dropdown, Form, Input, InputNumber, Switch } from 'antd'
import {
    UserOutlined,
    AppstoreOutlined,
    FileTextOutlined,
    DeleteOutlined,
    StopOutlined,
    ReloadOutlined,
    LogoutOutlined,
    RocketOutlined,
    DatabaseOutlined,
    SettingOutlined,
    PlusOutlined,
    EditOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
    getAdminUsers,
    deleteAdminUser,
    getAdminTasks,
    terminateAdminTask,
    getAdminData,
    deleteAdminData,
    getAdminModelConfigs,
    createAdminModelConfig,
    updateAdminModelConfig,
    deleteAdminModelConfig
} from '../services/api'
import useStore from '../stores'
import dayjs from 'dayjs'

const { Header, Content, Sider } = Layout
const { Title, Text } = Typography

export default function AdminDashboard() {
    const navigate = useNavigate()
    const { logout, user } = useStore()
    const [activeTab, setActiveTab] = useState('users')
    const [loading, setLoading] = useState(false)

    // Data states
    const [users, setUsers] = useState([])
    const [tasks, setTasks] = useState([])
    const [dataFiles, setDataFiles] = useState([])
    const [modelConfigs, setModelConfigs] = useState([])
    
    // Model config modal state
    const [modelConfigModalVisible, setModelConfigModalVisible] = useState(false)
    const [editingConfig, setEditingConfig] = useState(null)
    const [modelConfigForm] = Form.useForm()

    // Fetch data functions
    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await getAdminUsers()
            setUsers(res.users || [])
        } catch (err) {
            message.error('Failed to load users: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchTasks = async () => {
        setLoading(true)
        try {
            const res = await getAdminTasks()
            setTasks(res.tasks || [])
        } catch (err) {
            message.error('Failed to load tasks: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchDataFiles = async () => {
        setLoading(true)
        try {
            const res = await getAdminData()
            setDataFiles(res.data || [])
        } catch (err) {
            message.error('Failed to load data files: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchModelConfigs = async () => {
        setLoading(true)
        try {
            const res = await getAdminModelConfigs()
            setModelConfigs(res.configs || [])
        } catch (err) {
            message.error('Failed to load model configs: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'users') fetchUsers()
        if (activeTab === 'tasks') fetchTasks()
        if (activeTab === 'data') fetchDataFiles()
        if (activeTab === 'models') fetchModelConfigs()
    }, [activeTab])

    // Actions
    const handleDeleteUser = async (userId) => {
        try {
            await deleteAdminUser(userId)
            message.success('User deleted successfully')
            fetchUsers()
        } catch (err) {
            message.error('Delete failed: ' + err.message)
        }
    }

    const handleTerminateTask = async (taskId) => {
        try {
            await terminateAdminTask(taskId)
            message.success('Task terminated successfully')
            fetchTasks()
        } catch (err) {
            message.error('Termination failed: ' + err.message)
        }
    }

    const handleDeleteData = async (userId, dataId) => {
        try {
            await deleteAdminData(userId, dataId)
            message.success('Data deleted successfully')
            fetchDataFiles()
        } catch (err) {
            message.error('Delete failed: ' + err.message)
        }
    }

    const handleOpenModelConfigModal = (config = null) => {
        setEditingConfig(config)
        if (config) {
            modelConfigForm.setFieldsValue({
                ...config,
                api_urls: config.api_urls.join('\n')
            })
        } else {
            modelConfigForm.resetFields()
        }
        setModelConfigModalVisible(true)
    }

    const handleSaveModelConfig = async () => {
        try {
            const values = await modelConfigForm.validateFields()

            // Build config data with explicit type conversions
            const configData = {
                model_name: String(values.model_name),
                api_urls: values.api_urls.split('\n').map(url => String(url.trim())).filter(Boolean),
                api_key: String(values.api_key || ''),
                temperature: Number(values.temperature),
                top_p: Number(values.top_p),
                max_tokens: Number(values.max_tokens),
                timeout: Number(values.timeout),
                max_concurrency: Number(values.max_concurrency),
                description: String(values.description || ''),
                is_active: values.is_active ? 1 : 0,
                is_vllm: values.is_vllm ? 1 : 0
            }

            if (editingConfig) {
                await updateAdminModelConfig(editingConfig.id, configData)
                message.success('Model config updated successfully')
            } else {
                await createAdminModelConfig(configData)
                message.success('Model config created successfully')
            }
            setModelConfigModalVisible(false)
            modelConfigForm.resetFields()
            fetchModelConfigs()
        } catch (err) {
            if (err.errorFields) {
                // Form validation error
                return
            }
            message.error('Save failed: ' + err.message)
        }
    }

    const handleDeleteModelConfig = async (configId) => {
        try {
            await deleteAdminModelConfig(configId)
            message.success('Model config deleted successfully')
            fetchModelConfigs()
        } catch (err) {
            message.error('Delete failed: ' + err.message)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // 用户菜单项（和普通用户界面保持一致）
    const userMenuItems = [
        {
            key: 'username',
            label: <span style={{ fontWeight: '500' }}>{user?.username || '管理员'}</span>,
            disabled: true,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout,
        },
    ]

    // Columns Definitions
    const userColumns = [
        {
            title: 'User ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Joined At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title="Delete User"
                    description="Are you sure to delete this user? All their data will be wiped."
                    onConfirm={() => handleDeleteUser(record.id)}
                    okText="Yes"
                    cancelText="No"
                    disabled={record.username === 'admin'}
                >
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        disabled={record.username === 'admin'}
                        type="text"
                    >
                        Delete
                    </Button>
                </Popconfirm>
            ),
        },
    ]

    const taskColumns = [
        {
            title: 'Task ID',
            dataIndex: 'task_id',
            key: 'task_id',
            width: 180,
        },
        {
            title: 'User',
            dataIndex: 'username',
            key: 'username',
            render: (text) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default'
                if (status === 'completed') color = 'success'
                if (status === 'running') color = 'processing'
                if (status === 'failed') color = 'error'
                if (status === 'cancelled') color = 'warning'
                return <Tag color={color}>{status.toUpperCase()}</Tag>
            }
        },
        {
            title: 'Progress',
            dataIndex: 'progress',
            key: 'progress',
            render: (val) => <Text>{val ? val.toFixed(1) + '%' : '-'}</Text>
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => dayjs(text).format('MM-DD HH:mm')
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    {record.status === 'running' || record.status === 'pending' ? (
                        <Popconfirm
                            title="Terminate Task"
                            description="Are you sure to stop this task?"
                            onConfirm={() => handleTerminateTask(record.task_id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button danger icon={<StopOutlined />} size="small">Terminate</Button>
                        </Popconfirm>
                    ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>None</Text>
                    )}
                </Space>
            ),
        },
    ]

    const dataColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 70,
        },
        {
            title: 'User',
            dataIndex: 'username',
            key: 'username',
            render: (text) => <Tag color="purple">{text}</Tag>
        },
        {
            title: 'Filename',
            dataIndex: 'filename',
            key: 'filename',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Size',
            dataIndex: 'file_size',
            key: 'file_size',
            render: (size) => size ? (size / 1024).toFixed(2) + ' KB' : '-'
        },
        {
            title: 'Uploaded At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => dayjs(text).format('MM-DD HH:mm')
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title="Delete Data"
                    description="Are you sure to delete this file?"
                    onConfirm={() => handleDeleteData(record.user_id, record.id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button danger icon={<DeleteOutlined />} type="text" size="small">Delete</Button>
                </Popconfirm>
            ),
        },
    ]

    const modelConfigColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 70,
        },
        {
            title: 'Model Name',
            dataIndex: 'model_name',
            key: 'model_name',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'API URLs',
            dataIndex: 'api_urls',
            key: 'api_urls',
            render: (urls) => (
                <div>
                    {Array.isArray(urls) ? urls.map((url, idx) => (
                        <Tag key={idx} style={{ marginBottom: 4 }}>{url}</Tag>
                    )) : <Tag>{urls}</Tag>}
                </div>
            )
        },
        {
            title: 'Temperature',
            dataIndex: 'temperature',
            key: 'temperature',
            width: 100,
        },
        {
            title: 'Top P',
            dataIndex: 'top_p',
            key: 'top_p',
            width: 80,
        },
        {
            title: 'Max Tokens',
            dataIndex: 'max_tokens',
            key: 'max_tokens',
            width: 100,
        },
        {
            title: 'Timeout',
            dataIndex: 'timeout',
            key: 'timeout',
            width: 80,
            render: (val) => `${val}s`
        },
        {
            title: 'Max Concurrency',
            dataIndex: 'max_concurrency',
            key: 'max_concurrency',
            width: 120,
            render: (val) => val || 10
        },
        {
            title: 'Is VLLM',
            dataIndex: 'is_vllm',
            key: 'is_vllm',
            width: 90,
            render: (isVLLM) => (
                <Tag color={isVLLM ? 'blue' : 'green'}>
                    {isVLLM ? 'VLLM' : 'OpenAI'}
                </Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 80,
            render: (active) => (
                <Tag color={active ? 'success' : 'default'}>
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleOpenModelConfigModal(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete Model Config"
                        description="Are you sure to delete this model config?"
                        onConfirm={() => handleDeleteModelConfig(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger icon={<DeleteOutlined />} size="small">Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    // Styles simulating Apple UI
    const glassStyle = {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
    }

    const contentStyle = {
        padding: '24px',
        background: '#F5F5F7', // Apple light gray background
        minHeight: '100vh',
    }

    const cardStyle = {
        borderRadius: 16,
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        background: 'white'
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={240} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <Space>
                        <RocketOutlined style={{ fontSize: 20, color: '#007AFF' }} />
                        <Text strong style={{ fontSize: 16 }}>Admin Console</Text>
                    </Space>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[activeTab]}
                    style={{ borderRight: 0, marginTop: 16 }}
                    onClick={({ key }) => setActiveTab(key)}
                    items={[
                        {
                            key: 'users',
                            icon: <UserOutlined />,
                            label: 'User Management',
                        },
                        {
                            key: 'tasks',
                            icon: <AppstoreOutlined />,
                            label: 'Task Monitor',
                        },
                        {
                            key: 'data',
                            icon: <DatabaseOutlined />,
                            label: 'Data Manager',
                        },
                        {
                            key: 'models',
                            icon: <SettingOutlined />,
                            label: 'Model Configuration',
                        },
                    ]}
                />
                <div style={{ position: 'absolute', bottom: 20, width: '100%', padding: '0 20px' }}>
                    <Button
                        block
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                        type="text"
                        danger
                    >
                        Sign Out
                    </Button>
                </div>
            </Sider>

            <Layout>
                <Header style={{ ...glassStyle, padding: '0 24px', height: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
                        {activeTab === 'users' && 'User Management'}
                        {activeTab === 'tasks' && 'Global Task Monitor'}
                        {activeTab === 'data' && 'All User Data'}
                        {activeTab === 'models' && 'Model Configuration'}
                    </Title>
                    <Space>
                        <Tag color="#108ee9">Admin Mode</Tag>
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '20px', transition: 'background 0.3s' }} className="hover-bg">
                                <Avatar style={{ backgroundColor: '#007AFF' }} icon={<UserOutlined />} />
                                <span style={{ color: '#1D1D1F', fontWeight: 500 }}>{user?.username || '管理员'}</span>
                            </Space>
                        </Dropdown>
                    </Space>
                </Header>

                <Content style={contentStyle}>
                    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                        <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                                <Space>
                                    <Text strong>{activeTab.toUpperCase()}</Text>
                                    <Tag>{activeTab === 'users' ? (users?.length || 0) : (activeTab === 'tasks' ? (tasks?.length || 0) : (activeTab === 'data' ? (dataFiles?.length || 0) : (modelConfigs?.length || 0)))} Total</Tag>
                                </Space>
                                <Space>
                                    {activeTab === 'models' && (
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => handleOpenModelConfigModal()}
                                        >
                                            Add Model Config
                                        </Button>
                                    )}
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={() => {
                                            if (activeTab === 'users') fetchUsers()
                                            if (activeTab === 'tasks') fetchTasks()
                                            if (activeTab === 'data') fetchDataFiles()
                                            if (activeTab === 'models') fetchModelConfigs()
                                        }}
                                        loading={loading}
                                    >
                                        Refresh
                                    </Button>
                                </Space>
                            </div>

                            <Table
                                dataSource={activeTab === 'users' ? (users || []) : (activeTab === 'tasks' ? (tasks || []) : (activeTab === 'data' ? (dataFiles || []) : (modelConfigs || [])))}
                                columns={activeTab === 'users' ? userColumns : (activeTab === 'tasks' ? taskColumns : (activeTab === 'data' ? dataColumns : modelConfigColumns))}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 10 }}
                            />
                        </Card>
                    </div>
                </Content>
            </Layout>

            {/* Model Config Modal */}
            <Modal
                title={editingConfig ? 'Edit Model Config' : 'Add Model Config'}
                open={modelConfigModalVisible}
                onOk={handleSaveModelConfig}
                onCancel={() => {
                    setModelConfigModalVisible(false)
                    modelConfigForm.resetFields()
                    setEditingConfig(null)
                }}
                width={700}
                okText="Save"
                cancelText="Cancel"
                centered
            >
                <Form
                    form={modelConfigForm}
                    layout="vertical"
                    initialValues={{
                        temperature: 0.0,
                        top_p: 1.0,
                        max_tokens: 1024,
                        timeout: 10,
                        max_concurrency: 10,
                        is_vllm: true,
                        is_active: true
                    }}
                >
                    <Form.Item
                        name="model_name"
                        label="Model Name"
                        rules={[{ required: true, message: 'Please input model name' }]}
                    >
                        <Input placeholder="e.g., Qwen/Qwen-1.8B-Chat" disabled={!!editingConfig} />
                    </Form.Item>
                    <Form.Item
                        name="api_urls"
                        label="API URLs (one per line)"
                        rules={[{ required: true, message: 'Please input API URLs' }]}
                    >
                        <Input.TextArea 
                            rows={3} 
                            placeholder="http://localhost:8000/v1&#10;http://localhost:8001/v1"
                        />
                    </Form.Item>
                    <Form.Item
                        name="api_key"
                        label="API Key (Optional)"
                    >
                        <Input.Password placeholder="sk-xxx" />
                    </Form.Item>
                    <Form.Item
                        name="temperature"
                        label="Temperature"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="top_p"
                        label="Top P"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="max_tokens"
                        label="Max Tokens"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={1} max={65536} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="timeout"
                        label="Timeout (seconds)"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={1} max={3600} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="max_concurrency"
                        label="Max Concurrency (Maximum concurrent requests)"
                        rules={[{ required: true, message: 'Please input max concurrency' }]}
                    >
                        <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Description (Optional)"
                    >
                        <Input.TextArea rows={2} placeholder="Model description" />
                    </Form.Item>
                    <Form.Item
                        name="is_vllm"
                        label="Use VLLM Format"
                        valuePropName="checked"
                        tooltip="Enable to use VLLM-specific parameters (do_sample, chat_template_kwargs). Disable for standard OpenAI-compatible API."
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        name="is_active"
                        label="Active"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    )
}
