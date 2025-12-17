import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import EvaluationPage from './pages/EvaluationPage'
import ResultsPage from './pages/ResultsPage'
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

function App() {
  return (
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
        <Route path="results" element={<ResultsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/:dataset/:model" element={<ReportDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="data" element={<DataManagePage />} />
        <Route path="data-detail/:dataId" element={<DataDetailPage />} />
      </Route>

      {/* Admin Route */}
      <Route path="/admin" element={
        <PrivateRoute>
          <AdminDashboard />
        </PrivateRoute>
      } />
    </Routes>
  )
}

export default App
