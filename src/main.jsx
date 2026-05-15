import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { OrganModelProvider } from './context/OrganModelContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OrganModelProvider>
          <App />
        </OrganModelProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
