import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography, theme, Dropdown, Avatar, Space } from 'antd'
import {
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  RocketOutlined,
  DatabaseOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import useStore from '../stores'

const { Header, Content, Sider } = Layout
const { Title, Text } = Typography

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/evaluate',
    icon: <ExperimentOutlined />,
    label: '评测配置',
  },
  {
    key: '/tasks',
    icon: <UnorderedListOutlined />,
    label: '任务管理',
  },
  {
    key: '/data',
    icon: <DatabaseOutlined />,
    label: '数据管理',
  },
  {
    key: '/reports',
    icon: <FileTextOutlined />,
    label: '历史报告',
  },
]

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useStore()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'username',
      label: <span style={{ fontWeight: '500' }}>{user?.username || '用户'}</span>,
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

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        theme="light"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0,0,0,0.05)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 100,
        }}
        trigger={null} // Hiding default trigger for cleaner look, can add custom one if needed, but lets stick to collapsible
      >
        <div
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)',
            borderRadius: '12px',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: collapsed ? 0 : 12,
            boxShadow: '0 4px 12px rgba(0,122,255,0.3)'
          }}>
            <RocketOutlined style={{ color: 'white', fontSize: 18 }} />
          </div>

          {!collapsed && (
            <Title
              level={4}
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: '#1D1D1F'
              }}
            >
              LLM Judge
            </Title>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            background: 'transparent',
            padding: '0 12px'
          }}
        />
        {/* Custom Trigger Area at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#86868B'
          }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {/* Simple toggle indicator can go here if we hid the default trigger, but for now AntD default trigger is fine, just styled via CSS if needed. 
                 Since I removed trigger={null} above, I will let AntD handle it but I might want to customize it.
                 Actually, let's keep the standard trigger but maybe style it in CSS or accept the default. 
                 Reverting trigger={null} implies I should add a custom one or remove the prop. 
                 Let's remove trigger={null} to bring back the default trigger which is functional.
             */}
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s', background: 'transparent' }}>
        <Header
          style={{
            padding: '0 32px',
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            height: 64
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>
              大模型评测系统
            </Title>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '20px', transition: 'background 0.3s' }} className="hover-bg">
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#007AFF' }} />
              <span style={{ color: '#1D1D1F', fontWeight: 500 }}>{user?.username || '用户'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 32px',
            padding: 0, // Content itself manages padding inside pages or use transparent bg
            minHeight: 280,
            overflow: 'visible', // Allow shadows to overflow
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
