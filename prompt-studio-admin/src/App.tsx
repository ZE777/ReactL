import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleAuthLogout() {
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:logout', handleAuthLogout)
    return () => window.removeEventListener('auth:logout', handleAuthLogout)
  }, [navigate])

  // 依後端回傳的 expiresAt 設定自動登出計時器
  // 不需要在前端寫死到期分鐘數，到期時間由登入 API 決定
  useEffect(() => {
    const expiresAt = localStorage.getItem('expiresAt')
    if (!expiresAt) return

    const msLeft = new Date(expiresAt).getTime() - Date.now()
    if (msLeft <= 0) return

    const timer = setTimeout(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('expiresAt')
      navigate('/login', { replace: true })
    }, msLeft)

    return () => clearTimeout(timer)
  }, [navigate])

  return <Outlet />
}