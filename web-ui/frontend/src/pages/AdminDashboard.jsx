import { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Table, Button, Tag, Card, Modal, message, Space, Tabs, Descriptions, Popconfirm, Avatar } from 'antd'
import {
    UserOutlined,
    AppstoreOutlined,
    FileTextOutlined,
    DeleteOutlined,
    StopOutlined,
    ReloadOutlined,
    LogoutOutlined,
    RocketOutlined,
    DatabaseOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
    getAdminUsers,
    deleteAdminUser,
    getAdminTasks,
    terminateAdminTask,
    getAdminData,
    deleteAdminData
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

    // Fetch data functions
    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await getAdminUsers()
            setUsers(res.users)
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
            setTasks(res.tasks)
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
            setDataFiles(res.data)
        } catch (err) {
            message.error('Failed to load data files: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'users') fetchUsers()
        if (activeTab === 'tasks') fetchTasks()
        if (activeTab === 'data') fetchDataFiles()
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

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

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
                    </Title>
                    <Space>
                        <Tag color="#108ee9">Admin Mode</Tag>
                        <Avatar style={{ backgroundColor: '#007AFF' }} icon={<UserOutlined />} />
                    </Space>
                </Header>

                <Content style={contentStyle}>
                    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                        <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                                <Space>
                                    <Text strong>{activeTab.toUpperCase()}</Text>
                                    <Tag>{activeTab === 'users' ? users.length : (activeTab === 'tasks' ? tasks.length : dataFiles.length)} Total</Tag>
                                </Space>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                        if (activeTab === 'users') fetchUsers()
                                        if (activeTab === 'tasks') fetchTasks()
                                        if (activeTab === 'data') fetchDataFiles()
                                    }}
                                    loading={loading}
                                >
                                    Refresh
                                </Button>
                            </div>

                            <Table
                                dataSource={activeTab === 'users' ? users : (activeTab === 'tasks' ? tasks : dataFiles)}
                                columns={activeTab === 'users' ? userColumns : (activeTab === 'tasks' ? taskColumns : dataColumns)}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 10 }}
                            />
                        </Card>
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}
