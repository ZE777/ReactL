import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import api, { unwrap } from '../lib/api'
import type { ApiResponse, ApiError } from '../types/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

type UserProfile = {
  id: string
  email: string
  displayName: string
  role: string
}

type SectionProps = { title: string; description?: string; children: React.ReactNode }

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-700/25">
        <p className="text-lg font-semibold text-slate-700 dark:text-zinc-200">{title}</p>
        {description && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

type FieldRowProps = { label: string; hint?: string; children: React.ReactNode }

function FieldRow({ label, hint, children }: FieldRowProps) {
  return (
    <div className="flex items-start gap-6 py-4 border-b border-dashed border-slate-200/70 dark:border-zinc-700/25 last:border-0 last:pb-0 first:pt-0">
      <div className="w-36 flex-shrink-0">
        <p className="text-base text-slate-600 dark:text-zinc-400">{label}</p>
        {hint && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
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
    <div className="h-full overflow-y-auto"><div className="p-6 lg:p-8 max-w-2xl flex flex-col gap-6">
      <Section title="帳號資訊" description="管理你的個人資料">
        <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))}>
          <FieldRow label="顯示名稱">
            <Input
              {...profileForm.register('displayName', { required: '請填寫顯示名稱' })}
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
            <Button size="sm" type="submit" loading={profileMutation.isPending}>儲存變更</Button>
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
                    {...pwForm.register('currentPassword', { required: '請填寫目前密碼' })}
                    className={`w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border ${pwForm.formState.errors.currentPassword ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-zinc-700'}`}
                  />
                  <button type="button" onClick={() => setShowCurrentPw(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300" tabIndex={-1}>
                    <EyeIcon open={showCurrentPw} />
                  </button>
                </div>
                {pwForm.formState.errors.currentPassword && <p className="text-sm text-red-500 dark:text-red-400">{pwForm.formState.errors.currentPassword.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="新密碼（至少 8 個字元）"
                    {...pwForm.register('newPassword', { required: '請填寫新密碼', minLength: { value: 8, message: '至少 8 個字元' } })}
                    className={`w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border ${pwForm.formState.errors.newPassword ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-zinc-700'}`}
                  />
                  <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300" tabIndex={-1}>
                    <EyeIcon open={showNewPw} />
                  </button>
                </div>
                {pwForm.formState.errors.newPassword && <p className="text-sm text-red-500 dark:text-red-400">{pwForm.formState.errors.newPassword.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="確認新密碼"
                    {...pwForm.register('confirmPassword', { required: '請確認新密碼' })}
                    className={`w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border ${pwForm.formState.errors.confirmPassword ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-zinc-700'}`}
                  />
                  <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300" tabIndex={-1}>
                    <EyeIcon open={showConfirmPw} />
                  </button>
                </div>
                {pwForm.formState.errors.confirmPassword && <p className="text-sm text-red-500 dark:text-red-400">{pwForm.formState.errors.confirmPassword.message}</p>}
              </div>

              <div className="flex justify-end">
                <Button size="sm" type="submit" loading={pwMutation.isPending}>更新密碼</Button>
              </div>
            </div>
          </FieldRow>
        </form>
      </Section>
    </div></div>
  )
}

// ── EyeIcon ───────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
