import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import api, { unwrap } from '../lib/api'
import { useNoSpace } from '../lib/form'
import type { ApiResponse, ApiError } from '../types/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Section, FieldRow, EyeIcon } from '../components/ui/settingsUi'

type UserProfile = {
  id: string
  email: string
  displayName: string
  role: string
}

export default function SettingsPage() {
  const { push: toast } = useToast()

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => api.get<ApiResponse<UserProfile>>('/users/me').then(unwrap),
  })

  // ── 帳號資訊 ──
  const profileForm = useForm<{ displayName: string }>()
  const { reset: resetProfile } = profileForm

  useEffect(() => {
    if (profile) resetProfile({ displayName: profile.displayName })
  }, [profile, resetProfile])

  const profileMutation = useMutation({
    mutationFn: (data: { displayName: string }) =>
      api.patch<ApiResponse<UserProfile>>('/users/me', data).then(unwrap),
    onSuccess: () => toast('success', '個人資料已更新'),
    onError: () => toast('error', '更新失敗，請稍後再試'),
  })

  // ── 密碼欄位可見性 ──
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // ── 修改密碼 ──
  const pwForm = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>()
  const { noSpace, blockedHint } = useNoSpace()

  const pwMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/users/me/change-password', data),
    onSuccess: () => {
      toast('success', '密碼已更新')
      pwForm.reset()
    },
    onError: (e: AxiosError<ApiError>) => {
      toast('error', e.response?.data?.detail ?? '密碼修改失敗')
    },
  })

  function onPwSubmit(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    if (data.newPassword !== data.confirmPassword) {
      pwForm.setError('confirmPassword', { message: '兩次密碼不一致' })
      return
    }
    pwMutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword })
  }

  return (
    <div className="h-full overflow-y-auto"><div className="p-4 sm:p-6 lg:p-8 max-w-2xl flex flex-col gap-6">
      <Section title="帳號資訊" description="管理你的個人資料">
        <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))}>
          <FieldRow label="顯示名稱">
            <Input
              {...profileForm.register('displayName', { required: '請填寫顯示名稱', validate: v => v.trim().length > 0 || '不可全為空白' })}
              required
              disabled={!profile}
              placeholder={!profile ? '載入中...' : '你的名稱'}
              error={profileForm.formState.errors.displayName?.message}
            />
          </FieldRow>
          <FieldRow label="Email">
            <Input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="opacity-60"
            />
          </FieldRow>
          <div className="flex justify-end pt-2">
            <Button size="sm" type="submit" loading={profileMutation.isPending} disabled={!profileForm.formState.isDirty}>儲存變更</Button>
          </div>
        </form>
      </Section>

      <Section title="安全性" description="密碼與登入設定">
        <form onSubmit={pwForm.handleSubmit(onPwSubmit)}>
          <FieldRow label="修改密碼">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    placeholder="目前密碼"
                    {...noSpace(pwForm.register('currentPassword', { required: '請填寫目前密碼', validate: v => v.trim().length > 0 || '不可全為空白' }))}
                    className={`w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border ${pwForm.formState.errors.currentPassword ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-zinc-700'}`}
                  />
                  <button type="button" onClick={() => setShowCurrentPw(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300" tabIndex={-1}>
                    <EyeIcon open={showCurrentPw} />
                  </button>
                </div>
                {(blockedHint('currentPassword') ?? pwForm.formState.errors.currentPassword?.message) && <p className="text-sm text-red-500 dark:text-red-400">{blockedHint('currentPassword') ?? pwForm.formState.errors.currentPassword?.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="新密碼（至少 8 個字元）"
                    {...noSpace(pwForm.register('newPassword', { required: '請填寫新密碼', minLength: { value: 8, message: '至少 8 個字元' }, validate: v => v.trim().length > 0 || '不可全為空白' }))}
                    className={`w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border ${pwForm.formState.errors.newPassword ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-zinc-700'}`}
                  />
                  <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300" tabIndex={-1}>
                    <EyeIcon open={showNewPw} />
                  </button>
                </div>
                {(blockedHint('newPassword') ?? pwForm.formState.errors.newPassword?.message) && <p className="text-sm text-red-500 dark:text-red-400">{blockedHint('newPassword') ?? pwForm.formState.errors.newPassword?.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="確認新密碼"
                    {...noSpace(pwForm.register('confirmPassword', { required: '請確認新密碼', validate: v => v.trim().length > 0 || '不可全為空白' }))}
                    className={`w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border ${pwForm.formState.errors.confirmPassword ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-zinc-700'}`}
                  />
                  <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300" tabIndex={-1}>
                    <EyeIcon open={showConfirmPw} />
                  </button>
                </div>
                {(blockedHint('confirmPassword') ?? pwForm.formState.errors.confirmPassword?.message) && <p className="text-sm text-red-500 dark:text-red-400">{blockedHint('confirmPassword') ?? pwForm.formState.errors.confirmPassword?.message}</p>}
              </div>
              <div className="flex justify-end">
                <Button size="sm" type="submit" loading={pwMutation.isPending} disabled={!pwForm.formState.isDirty}>更新密碼</Button>
              </div>
            </div>
          </FieldRow>
        </form>
      </Section>
    </div></div>
  )
}
