import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message, ConfigProvider } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, RocketOutlined } from '@ant-design/icons'
import useStore from '../stores'
import './LoginPage.css'

const { Title, Text } = Typography

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isAuthenticated } = useStore()

  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
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
        await login(values.username, values.password)
      } else {
        await register(values.username, values.password, values.email)
      }
      message.success(isLogin ? 'Welcome back!' : 'Registration successful!')

      // Redirect to admin dashboard if logging in as admin
      if (isLogin && values.username === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      message.error(err.message || 'Operation failed')
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
