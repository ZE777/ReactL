import axios from 'axios'
import type { AxiosError, AxiosResponse } from 'axios'
import type { ApiError, ApiResponse } from '../types/api'
import { emitToast } from './toastEmitter'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  // 透過 ngrok 免費版發布時，跳過瀏覽器警告攔截頁（否則 API 會收到 HTML 而非 JSON）
  headers: { 'ngrok-skip-browser-warning': 'true' },
})

/** 解包後端 ApiResponse<T> 包裝，取出 data 欄位 */
export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (response.data.data === undefined) {
    throw new Error(`API response missing data field: ${response.config.url}`)
  }
  return response.data.data as T
}

// Request 攔截器：自動帶 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response 攔截器：統一錯誤處理
// 元件層負責：400 / 404(API) / 409 / 422 行內錯誤
// 攔截器負責：401 / 403 / 429 / 5xx / 網路錯誤 全域 Toast
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED'
      emitToast('error', isTimeout ? '連線逾時，請稍後再試' : '網路連線異常，請確認網路狀態')
      return Promise.reject(error)
    }

    const status = error.response.status
    const detail = error.response.data?.detail

    // 路徑可能帶 /admin 前綴（透過 ngrok 子路徑發布時），故用 endsWith 判斷
    if (status === 401 && !window.location.pathname.endsWith('/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('expiresAt')
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }

    if (status === 403) {
      emitToast('error', detail ?? '您沒有此操作的權限')
    }

    if (status === 429) {
      emitToast('warning', detail ?? '請求頻率過高，請稍後再試')
    }

    if (status === 500) {
      emitToast('error', '伺服器發生錯誤，請稍後再試')
    }

    if (status === 502) {
      emitToast('error', '服務暫時無法連線')
    }

    if (status === 503) {
      emitToast('warning', '系統維護中，請稍後再試')
    }

    if (status === 504) {
      emitToast('warning', '請求逾時，請重新操作')
    }

    return Promise.reject(error)
  }
)

export default api
