import { Navigate, Outlet } from 'react-router-dom'

function isTokenValid(): boolean {
  const token = localStorage.getItem('token')
  if (!token) return false
  const expiresAt = localStorage.getItem('expiresAt')
  if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
    localStorage.removeItem('token')
    localStorage.removeItem('expiresAt')
    return false
  }
  return true
}

export default function PrivateRoute() {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
