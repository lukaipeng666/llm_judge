import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#007AFF', // Apple System Blue
          borderRadius: 12,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
          colorBgContainer: '#ffffff',
          colorBgLayout: '#F5F5F7', // Apple Light Gray Background
        },
        components: {
          Button: {
            borderRadius: 9999, // Capsule shape
            controlHeight: 40,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          },
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary: '0 4px 24px rgba(0, 0, 0, 0.04)', // Softer shadow
          },
          Input: {
            controlHeight: 40,
            borderRadius: 10,
            colorBgContainer: 'rgba(255, 255, 255, 0.8)', // Slightly transparent
          },
          Layout: {
            headerBg: 'rgba(255, 255, 255, 0.7)',
            triggerBg: '#fff',
          }
        }
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)
