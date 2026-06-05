import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import api, { unwrap } from '../lib/api'
import { useNoSpace } from '../lib/form'
import type { ApiResponse, ApiError } from '../types/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import { EyeIcon } from '../components/ui/settingsUi'

type UserProfile = { mustChangePassword?: boolean }

type FormData = {
  newPassword: string
  confirmPassword: string
}

const pwInputClass = (hasError: boolean) =>
  `w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border ${
    hasError ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-zinc-700'
  }`

export default function ForcePasswordChangePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  // 若使用者其實不需要強制改密碼（直接打開此網址），導回首頁
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<UserProfile>>('/users/me').then(unwrap),
  })

  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // mode: 'onChange' → 邊輸入邊驗證（8 字長度、兩次一致等即時提示），不必等送出
  const form = useForm<FormData>({ mode: 'onChange' })
  const { noSpace, blockedHint } = useNoSpace()

  const mutation = useMutation({
    mutationFn: (data: { newPassword: string }) =>
      api.post('/users/me/change-password', data),
    onSuccess: () => {
      toast('success', '密碼已更新')
      // 同步更新快取再導航：避免 invalidate 背景重抓期間，AdminLayout 讀到舊的
      // mustChangePassword=true 而把使用者彈回改密頁，導致「改成功卻又回到改密 UI」
      queryClient.setQueryData<UserProfile>(['profile'], old => ({ ...old, mustChangePassword: false }))
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      navigate('/', { replace: true })
    },
    onError: (e: AxiosError<ApiError>) => {
      toast('error', e.response?.data?.detail ?? '密碼修改失敗')
    },
  })

  function onSubmit(data: FormData) {
    // 一致性與長度等已由 register 的即時驗證把關，這裡只負責送出
    mutation.mutate({ newPassword: data.newPassword })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">請先變更密碼</h1>
          <p className="text-sm text-slate-400 dark:text-zinc-400">
            為了帳號安全，首次登入需變更預設密碼後才能開始使用
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-400 dark:text-zinc-400">新密碼 <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                placeholder="新密碼（至少 8 個字元）"
                autoComplete="new-password"
                {...noSpace(form.register('newPassword', { required: '請填寫新密碼', minLength: { value: 8, message: '至少 8 個字元' }, validate: v => v.trim().length > 0 || '不可全為空白', deps: ['confirmPassword'] }))}
                className={pwInputClass(!!form.formState.errors.newPassword)}
              />
              <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300" tabIndex={-1}>
                <EyeIcon open={showNewPw} />
              </button>
            </div>
            {(blockedHint('newPassword') ?? form.formState.errors.newPassword?.message) && (
              <p className="text-sm text-red-500 dark:text-red-400">{blockedHint('newPassword') ?? form.formState.errors.newPassword?.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-400 dark:text-zinc-400">確認新密碼 <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showConfirmPw ? 'text' : 'password'}
                placeholder="再次輸入新密碼"
                autoComplete="new-password"
                {...noSpace(form.register('confirmPassword', { required: '請確認新密碼', validate: {
                  notBlank: v => v.trim().length > 0 || '不可全為空白',
                  match: v => v === form.getValues('newPassword') || '兩次密碼不一致',
                } }))}
                className={pwInputClass(!!form.formState.errors.confirmPassword)}
              />
              <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300" tabIndex={-1}>
                <EyeIcon open={showConfirmPw} />
              </button>
            </div>
            {(blockedHint('confirmPassword') ?? form.formState.errors.confirmPassword?.message) && (
              <p className="text-sm text-red-500 dark:text-red-400">{blockedHint('confirmPassword') ?? form.formState.errors.confirmPassword?.message}</p>
            )}
          </div>

          <Button type="submit" loading={mutation.isPending} className="w-full">變更密碼並繼續</Button>
        </form>

        {profile && !profile.mustChangePassword && (
          <button
            onClick={() => navigate('/', { replace: true })}
            className="text-sm text-slate-400 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer"
          >
            返回首頁
          </button>
        )}
      </div>
    </div>
  )
}
