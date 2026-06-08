import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { store } from './store'
import App from './App'
import './index.css'
import './styles/receipt-print.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Be Vietnam Pro, sans-serif', fontSize: '14px' },
            success: { style: { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' } },
            error: { style: { background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
