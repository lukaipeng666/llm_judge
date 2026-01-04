import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'
import MainLayout from './layouts/MainLayout'
import EvaluationPage from './pages/EvaluationPage'
import ReportsPage from './pages/ReportsPage'
import ReportDetailPage from './pages/ReportDetailPage'
import TasksPage from './pages/TasksPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import DataManagePage from './pages/DataManagePage'
import DataDetailPage from './pages/DataDetailPage'
import AdminDashboard from './pages/AdminDashboard'
import useStore from './stores'

// 路由守卫组件
function PrivateRoute({ children }) {
  const isAuthenticated = useStore(state => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// 管理员路由守卫组件
function AdminRoute({ children }) {
  const user = useStore(state => state.user)
  const isAuthenticated = useStore(state => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 检查用户是否是管理员
  if (!user || user.username !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

// Token自动登录组件
function AutoLoginHandler() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = useStore(state => state.isAuthenticated)

  useEffect(() => {
    try {
      // 检查URL参数中是否有token
      const params = new URLSearchParams(location.search)
      const token = params.get('token')

      if (token && !isAuthenticated) {
        // 设置token到localStorage
        localStorage.setItem('llm_judge_token', token)

        // 解析token获取用户信息（JWT token包含用户信息）
        try {
          // JWT token的payload是base64编码的，可以解析获取用户信息
          const payload = JSON.parse(atob(token.split('.')[1]))
          const user = {
            id: payload.user_id,
            username: payload.username || ''
          }

          // 设置用户信息到localStorage
          localStorage.setItem('llm_judge_user', JSON.stringify(user))

          // 更新store状态
          useStore.setState({
            token: token,
            user: user,
            isAuthenticated: true
          })

          // 清除URL中的token参数，避免泄露
          const newSearch = new URLSearchParams(location.search)
          newSearch.delete('token')
          const newPath = location.pathname + (newSearch.toString() ? '?' + newSearch.toString() : '')
          navigate(newPath, { replace: true })
        } catch (error) {
          console.error('Failed to parse token:', error)
          // 如果解析失败，清除token参数
          const newSearch = new URLSearchParams(location.search)
          newSearch.delete('token')
          const newPath = location.pathname + (newSearch.toString() ? '?' + newSearch.toString() : '')
          navigate(newPath, { replace: true })
        }
      }
    } catch (error) {
      console.error('AutoLoginHandler error:', error)
    }
  }, [location, navigate, isAuthenticated])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <AutoLoginHandler />
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 受保护路由 */}
        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="evaluate" element={<EvaluationPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/:dataset/:model" element={<ReportDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="data" element={<DataManagePage />} />
          <Route path="data-detail/:dataId" element={<DataDetailPage />} />
        </Route>

        {/* Admin Route */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
