import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message, ConfigProvider, Segmented, Space, Modal } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, RocketOutlined, UserSwitchOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import useStore from '../stores'
import './LoginPage.css'

const { Title, Text } = Typography

// 错误信息解析函数
const parseErrorMessage = (error) => {
  const errorStr = error.message || error.toString()

  // 检查是否包含具体的错误信息
  if (errorStr.includes('Invalid username or password')) {
    return '用户名或密码错误，请检查后重试'
  }
  if (errorStr.includes('Username already exists')) {
    return '用户名已存在，请使用其他用户名'
  }
  if (errorStr.includes('Admin login requires admin username')) {
    return '管理员登录必须使用 admin 账号'
  }
  if (errorStr.includes('Admin account should use admin login mode')) {
    return 'admin 账号请使用管理员登录模式'
  }
  if (errorStr.includes('HTTP 401') || errorStr.includes('Unauthorized')) {
    return '登录失败，用户名或密码错误'
  }
  if (errorStr.includes('HTTP 429') || errorStr.includes('Too Many Requests')) {
    return '请求过于频繁，请稍后再试'
  }
  if (errorStr.includes('HTTP 500') || errorStr.includes('Internal Server Error')) {
    return '服务器错误，请稍后再试'
  }
  if (errorStr.includes('HTTP 400') || errorStr.includes('Bad Request')) {
    return '请求参数错误，请检查输入'
  }

  // 默认错误消息
  const detailMatch = errorStr.match(/\[HTTP \d+\]\s*(.+)/)
  if (detailMatch) {
    return detailMatch[1]
  }

  return '操作失败，请稍后再试'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isAuthenticated } = useStore()

  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState('user') // 'user' or 'admin'
  const [form] = Form.useForm()

  // 如果已经登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const onFinish = async (values) => {
    setLoading(true)
    try {
      if (isLogin) {
        // 如果选择管理员登录，验证用户名是否为admin
        if (userRole === 'admin' && values.username !== 'admin') {
          Modal.error({
            title: '登录失败',
            icon: <ExclamationCircleOutlined />,
            content: '管理员登录必须使用 admin 账号',
            centered: true,
            okText: '我知道了'
          })
          setLoading(false)
          return
        }
        // 如果选择普通用户登录，但用户名是admin，提示应该选择管理员登录
        if (userRole === 'user' && values.username === 'admin') {
          Modal.error({
            title: '登录失败',
            icon: <ExclamationCircleOutlined />,
            content: 'admin 账号请使用管理员登录模式',
            centered: true,
            okText: '我知道了'
          })
          setLoading(false)
          return
        }

        await login(values.username, values.password)
        message.success('登录成功！')

        // 根据选择的角色跳转到对应的页面
        if (userRole === 'admin') {
          navigate('/admin')
        } else {
          navigate('/')
        }
      } else {
        // 注册功能仅限普通用户
        await register(values.username, values.password, values.email)
        message.success('注册成功！')
        navigate('/')
      }
    } catch (err) {
      // 使用友好的错误提示
      const friendlyMessage = parseErrorMessage(err)
      Modal.error({
        title: '操作失败',
        icon: <ExclamationCircleOutlined />,
        content: friendlyMessage,
        centered: true,
        okText: '我知道了'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    form.resetFields()
  }

  return (
    <div className="login-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#F5F5F7',
      padding: '20px'
    }}>
      <Card
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 400,
          border: 'none',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 16px rgba(0,122,255,0.2)'
          }}>
            <RocketOutlined style={{ fontSize: 32, color: 'white' }} />
          </div>
          <Title level={2} style={{ marginBottom: 4, letterSpacing: '-0.5px' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            LLM Judge System
          </Text>
        </div>

        {/* Role selector for login mode */}
        {isLogin && (
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text style={{ fontSize: 14, fontWeight: 500 }}>Select Login Type:</Text>
              <Segmented
                block
                size="large"
                value={userRole}
                onChange={setUserRole}
                options={[
                  {
                    label: (
                      <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserOutlined />
                        <span>User</span>
                      </div>
                    ),
                    value: 'user'
                  },
                  {
                    label: (
                      <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserSwitchOutlined />
                        <span>Admin</span>
                      </div>
                    ),
                    value: 'admin'
                  }
                ]}
                style={{
                  fontSize: 15,
                  fontWeight: 500
                }}
              />
            </Space>
          </div>
        )}

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#rgba(0,0,0,0.25)' }} />}
              placeholder="Username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#rgba(0,0,0,0.25)' }} />}
              placeholder="Password"
            />
          </Form.Item>

          {!isLogin && (
            <Form.Item
              name="email"
              rules={[
                { type: 'email', message: 'The input is not valid E-mail!' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#rgba(0,0,0,0.25)' }} />}
                placeholder="Email (Optional)"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 44,
                fontSize: 16,
                marginTop: 12,
                background: 'linear-gradient(135deg, #007AFF 0%, #0055FF 100%)',
                border: 'none'
              }}
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            {isLogin ? 'No account yet? ' : 'Already have an account? '}
            <a onClick={toggleMode} style={{ color: '#007AFF', fontWeight: 500 }}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </a>
          </Text>
        </div>
      </Card>
    </div>
  )
}
