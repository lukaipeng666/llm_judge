import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import EvaluationPage from './pages/EvaluationPage'
import ResultsPage from './pages/ResultsPage'
import ReportsPage from './pages/ReportsPage'
import ReportDetailPage from './pages/ReportDetailPage'
import TasksPage from './pages/TasksPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="evaluate" element={<EvaluationPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/:dataset/:model" element={<ReportDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
      </Route>
    </Routes>
  )
}

export default App
