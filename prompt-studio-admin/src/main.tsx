import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import AdminLayout from './layouts/AdminLayout.tsx'
import PrivateRoute from './components/PrivateRoute.tsx'
import LoginPage from './pages/LoginPage.tsx'
import ChatPage from './pages/ChatPage.tsx'
import ConversationsPage from './pages/ConversationsPage.tsx'
import PersonasPage from './pages/PersonasPage.tsx'
import PersonaVersionsPage from './pages/PersonaVersionsPage.tsx'
import PromptsPage from './pages/PromptsPage.tsx'
import BotsPage from './pages/BotsPage.tsx'
import MonitorPage from './pages/MonitorPage.tsx'
import StatsPage from './pages/StatsPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import AiKeysPage from './pages/AiKeysPage.tsx'
import AccessCodesPage from './pages/AccessCodesPage.tsx'
import ForcePasswordChangePage from './pages/ForcePasswordChangePage.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

function GlobalFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center text-center gap-6">

        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800/60 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500 dark:text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">糟糕，出錯了</h2>
          <p className="text-sm text-slate-400 dark:text-zinc-400">頁面發生了未預期的錯誤，請重新整理或稍後再試</p>
        </div>

        <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-lg text-left">
          <p className="text-sm text-slate-400 dark:text-zinc-400 mb-1">錯誤訊息</p>
          <p className="text-sm text-red-600 dark:text-red-400 font-mono break-all">
            {error instanceof Error ? error.message : '未知錯誤'}
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={resetErrorBoundary}
            className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer shadow-md hover:shadow-lg hover:shadow-violet-500/50"
          >
            重新整理頁面
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-400 text-sm rounded-lg transition-colors cursor-pointer"
          >
            回到首頁
          </button>
        </div>

      </div>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <App />,
    children: [
      {
        element: <PrivateRoute />,
        children: [
          { path: '/change-password', element: <ForcePasswordChangePage /> },
          {
            path: '/',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/chat" replace /> },
              { path: 'chat', element: <ChatPage /> },
              { path: 'chat/:id', element: <ChatPage /> },
              { path: 'conversations', element: <ConversationsPage /> },
              { path: 'personas', element: <PersonasPage /> },
              { path: 'personas/:id/versions', element: <PersonaVersionsPage /> },
              { path: 'prompts', element: <PromptsPage /> },
              { path: 'bots', element: <BotsPage /> },
              { path: 'access-codes', element: <AccessCodesPage /> },
              { path: 'monitor', element: <MonitorPage /> },
              { path: 'stats', element: <StatsPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'settings/ai-keys', element: <AiKeysPage /> },
            ],
          },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <ErrorBoundary FallbackComponent={GlobalFallback}>
            <RouterProvider router={router} />
          </ErrorBoundary>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)