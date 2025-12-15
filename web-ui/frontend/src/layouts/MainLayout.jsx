import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography, theme } from 'antd'
import {
  DashboardOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  RocketOutlined,
} from '@ant-design/icons'

const { Header, Content, Sider } = Layout
const { Title } = Typography

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
    key: '/reports',
    icon: <FileTextOutlined />,
    label: '历史报告',
  },
  {
    key: '/results',
    icon: <BarChartOutlined />,
    label: '结果分析',
  },
]

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          background: colorBgContainer,
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <RocketOutlined
            style={{
              fontSize: 28,
              color: '#1890ff',
              marginRight: collapsed ? 0 : 8,
            }}
          />
          {!collapsed && (
            <Title
              level={4}
              style={{
                margin: 0,
                background: 'linear-gradient(90deg, #1890ff, #722ed1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
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
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              大模型评测系统
            </Title>
          </div>
          <div style={{ color: '#666' }}>
            评测框架 v1.0
          </div>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
