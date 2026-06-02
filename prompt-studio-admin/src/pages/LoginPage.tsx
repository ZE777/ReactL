import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { AxiosError } from 'axios'
import api, { unwrap } from '../lib/api'
import type { ApiResponse, ApiError } from '../types/api'
import AnimatedBg from '../components/ui/AnimatedBg'
import Spinner from '../components/ui/Spinner'

type LoginFormData = {
  email: string
  password: string
}

type RegisterFormData = {
  displayName: string
  email: string
  password: string
  confirmPassword: string
}

type AuthResponse = {
  token: string
  expiresAt: string
  user: { id: string; email: string; displayName: string; role: string }
}

type Mode = 'login' | 'register'

/** ISO UTC 時間字串轉為本地時間格式（YYYY-MM-DD HH:mm:ss），方便在 localStorage 直接閱讀 */
function toLocalTimeString(isoUtc: string): string {
  const d = new Date(isoUtc)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [isExiting, setIsExiting] = useState(false)

  // 密碼顯示/隱藏 state
  const [showLoginPw, setShowLoginPw] = useState(false)
  const [showRegPw, setShowRegPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // 離開計時器 ref，避免 unmount 後仍然 navigate
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function exitAndNavigate(to: string) {
    setIsExiting(true)
    exitTimerRef.current = setTimeout(() => navigate(to, { replace: true }), 360)
  }

  useEffect(() => {
    return () => { if (exitTimerRef.current) clearTimeout(exitTimerRef.current) }
  }, [])

  const loginForm = useForm<LoginFormData>()
  const registerForm = useForm<RegisterFormData>()

  function switchMode(next: Mode) {
    loginForm.reset()
    registerForm.reset()
    setMode(next)
  }

  async function onLogin(data: LoginFormData) {
    try {
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data).then(unwrap)
      localStorage.setItem('token', res.token)
      if (res.expiresAt) localStorage.setItem('expiresAt', toLocalTimeString(res.expiresAt))
      exitAndNavigate('/')
    } catch (err) {
      const status = (err as AxiosError<ApiError>).response?.status
      if (status === 401) loginForm.setError('root', { message: '帳號或密碼不正確' })
      else if (status === 403) loginForm.setError('root', { message: '帳號已停用，請聯繫管理員' })
      else loginForm.setError('root', { message: '登入失敗，請稍後再試' })
    }
  }

  async function onRegister(data: RegisterFormData) {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', { message: '兩次密碼不一致' })
      return
    }
    try {
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      }).then(unwrap)
      localStorage.setItem('token', res.token)
      if (res.expiresAt) localStorage.setItem('expiresAt', toLocalTimeString(res.expiresAt))
      exitAndNavigate('/')
    } catch (err) {
      const status = (err as AxiosError<ApiError>).response?.status
      if (status === 409) registerForm.setError('root', { message: '此 Email 已被註冊' })
      else registerForm.setError('root', { message: '註冊失敗，請稍後再試' })
    }
  }

  function inputCls(hasError: boolean, extra = '') {
    return [
      'w-full px-3.5 py-2.5 text-base rounded-xl',
      'bg-zinc-800/50 border',
      hasError ? 'border-red-500/80' : 'border-zinc-700/60',
      'text-zinc-100 placeholder-zinc-500',
      'outline-none focus:ring-2',
      hasError ? 'focus:ring-red-500/30 focus:border-red-500/80' : 'focus:ring-violet-500/40 focus:border-violet-500/70',
      'transition-all duration-150',
      extra,
    ].join(' ')
  }

  const labelClass = 'text-[11px] font-medium text-zinc-300 uppercase tracking-wider'

  return (
    <div className={`min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden${isExiting ? ' page-exit' : ''}`}>

      <AnimatedBg />

      <div className="w-full max-w-[360px] relative z-10 flex flex-col items-center gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-violet-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Prompt Studio</h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">AI Bot 管理後台</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-zinc-600/60 bg-zinc-900/60 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">

          {/* 模式標題 */}
          <div className="px-7 pt-6 pb-2">
            <h2 className="text-lg font-semibold text-zinc-100">
              {mode === 'login' ? '歡迎回來' : '建立帳號'}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {mode === 'login' ? '請輸入您的帳號資訊' : '填寫以下資訊開始使用'}
            </p>
          </div>

          {/* 表單區 */}
          <div className="px-7 pt-4 pb-6">
            <div key={mode} className="form-switch">

            {/* 登入表單 */}
            {mode === 'login' && (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-email" className={labelClass}>Email <span className="text-red-500">*</span></label>
                  <input
                    id="login-email"
                    type="email"
                    {...loginForm.register('email', { required: '請填寫 Email' })}
                    placeholder="admin@example.com"
                    className={inputCls(!!loginForm.formState.errors.email)}
                    autoComplete="email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-[11px] text-red-400">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-password" className={labelClass}>密碼 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showLoginPw ? 'text' : 'password'}
                      {...loginForm.register('password', { required: '請填寫密碼' })}
                      placeholder="••••••••"
                      className={inputCls(!!loginForm.formState.errors.password, 'pr-10')}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showLoginPw ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-[11px] text-red-400">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                {loginForm.formState.errors.root && (
                  <p role="alert" className="text-[11px] text-red-400 text-center py-1">{loginForm.formState.errors.root.message}</p>
                )}

                <button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  className="w-full mt-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-40 text-base font-medium text-white transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
                >
                  {loginForm.formState.isSubmitting
                    ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" />登入中...</span>
                    : '登入'}
                </button>


                <p className="text-center text-[11px] text-zinc-400 mt-1">
                  還沒有帳號？{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    disabled={loginForm.formState.isSubmitting}
                    className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                  >
                    建立帳號
                  </button>
                </p>
              </form>
            )}

            {/* 註冊表單 */}
            {mode === 'register' && (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-name" className={labelClass}>顯示名稱 <span className="text-red-500">*</span></label>
                  <input
                    id="reg-name"
                    type="text"
                    {...registerForm.register('displayName', { required: '請填寫顯示名稱' })}
                    placeholder="你的名稱"
                    className={inputCls(!!registerForm.formState.errors.displayName)}
                    autoComplete="name"
                  />
                  {registerForm.formState.errors.displayName && (
                    <p className="text-[11px] text-red-400">{registerForm.formState.errors.displayName.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-email" className={labelClass}>Email <span className="text-red-500">*</span></label>
                  <input
                    id="reg-email"
                    type="email"
                    {...registerForm.register('email', { required: '請填寫 Email' })}
                    placeholder="admin@example.com"
                    className={inputCls(!!registerForm.formState.errors.email)}
                    autoComplete="email"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-[11px] text-red-400">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-password" className={labelClass}>密碼 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showRegPw ? 'text' : 'password'}
                      {...registerForm.register('password', {
                        required: '請填寫密碼',
                        minLength: { value: 8, message: '密碼至少 8 個字元' },
                      })}
                      placeholder="至少 8 個字元"
                      className={inputCls(!!registerForm.formState.errors.password, 'pr-10')}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showRegPw ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-[11px] text-red-400">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-confirm" className={labelClass}>確認密碼 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      id="reg-confirm"
                      type={showConfirmPw ? 'text' : 'password'}
                      {...registerForm.register('confirmPassword', { required: '請再次輸入密碼' })}
                      placeholder="••••••••"
                      className={inputCls(!!registerForm.formState.errors.confirmPassword, 'pr-10')}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPw ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-[11px] text-red-400">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {registerForm.formState.errors.root && (
                  <p role="alert" className="text-[11px] text-red-400 text-center py-1">{registerForm.formState.errors.root.message}</p>
                )}

                <button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                  className="w-full mt-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-40 text-base font-medium text-white transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
                >
                  {registerForm.formState.isSubmitting
                    ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" />建立中...</span>
                    : '建立帳號'}
                </button>

                <p className="text-center text-[11px] text-zinc-400 mt-1">
                  已有帳號？{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    disabled={registerForm.formState.isSubmitting}
                    className="text-violet-400 hover:text-violet-300 transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                  >
                    登入
                  </button>
                </p>
              </form>
            )}
            </div>
          </div>
        </div>

        <p className="text-[10px] text-zinc-500">© 2026 Prompt Studio</p>
      </div>
    </div>
  )
}
