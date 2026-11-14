import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { RatingsProvider } from './context/RatingsContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RatingsProvider>
      <App />
    </RatingsProvider>
  </React.StrictMode>,
)
