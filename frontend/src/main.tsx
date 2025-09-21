import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize theme early based on saved or system preference
;(() => {
  if (typeof window === 'undefined') return
  try {
    const root = document.documentElement
    const stored = localStorage.getItem('theme') // 'dark' | 'light' | null
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldDark = stored ? stored === 'dark' : !!prefersDark
    root.classList.toggle('dark', shouldDark)
  } catch {}
})()

// Normalize initial route based on auth state
;(() => {
  if (typeof window === 'undefined') return
  try {
    const access = localStorage.getItem('accessToken')
    const path = window.location.pathname
    if (!access && path !== '/auth') {
      // Use replaceState to avoid an extra history entry
      window.history.replaceState({}, '', '/auth')
    } else if (access && path === '/auth') {
      window.history.replaceState({}, '', '/auth')
    }
  } catch {}
})()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
