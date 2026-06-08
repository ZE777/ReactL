import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { AccessCode } from '../types/accessCode'
import type { ApiError } from '../types/api'
import {
  fetchAccessCodes,
  createAccessCode,
  updateAccessCode,
  setAccessCodeActive,
  deleteAccessCode,
} from '../api/accessCodes'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import IconButton from '../components/ui/IconButton'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PageLoading from '../components/ui/PageLoading'
import PageError from '../components/ui/PageError'

const PUBLIC_WEB_URL = import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined

type FormData = {
  label: string
  dailyTokenLimit: number
  /** datetime-local 字串（本地時間，無時區） */
  expiresAt: string
}

/** 後端時間字串（台灣本地時間，無時區標記）→ datetime-local input 字串（YYYY-MM-DDTHH:mm） */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * datetime-local 字串（本地時間）→ 送給後端的本地時間字串或 null。
 * 後端整套以台灣本地時間儲存與比對過期（DateTime.Now），
 * 故「不可」用 toISOString() 轉成 UTC，否則會整整偏移 8 小時；
 * 直接補上秒數送出使用者輸入的牆上時間（無時區標記）。
 */
function localInputToIso(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  // datetime-local 為 "YYYY-MM-DDTHH:mm"，補滿秒數後原樣送出，不做時區換算
  return v.length === 16 ? `${v}:00` : v
}

/** 過期時間是否已過 */
function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const d = new Date(expiresAt)
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AccessCodesPage() {
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AccessCode | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  /** 建立成功後高亮顯示的新存取碼，方便管理員複製 */
  const [createdCode, setCreatedCode] = useState<AccessCode | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)

  const { data: codes, isLoading, error } = useQuery<AccessCode[], AxiosError<ApiError>>({
    queryKey: ['access-codes'],
    queryFn: fetchAccessCodes,
  })

  const createMutation = useMutation({
    mutationFn: createAccessCode,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] })
      setModalMode(null)
      setCreatedCode(created)
      toast('success', '存取碼建立成功')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '建立失敗'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { label: string | null; dailyTokenLimit: number; expiresAt: string | null } }) =>
      updateAccessCode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] })
      setModalMode(null)
      setEditing(null)
      toast('success', '存取碼已更新')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '更新失敗'),
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setAccessCodeActive(id, isActive),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] })
      toast('success', v.isActive ? '已啟用存取碼' : '已停用存取碼')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '操作失敗'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAccessCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] })
      setPendingDeleteId(null)
      toast('success', '存取碼已刪除')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '刪除失敗'),
  })

  function openCreate() { setEditing(null); setModalMode('create'); setIsFormDirty(false) }
  function openEdit(c: AccessCode) { setEditing(c); setModalMode('edit'); setIsFormDirty(false) }
  function closeModal() { setModalMode(null); setEditing(null); setIsFormDirty(false) }

  async function copyText(text: string, successMsg: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast('success', successMsg)
    } catch {
      toast('error', '無法存取剪貼簿，請手動複製')
    }
  }

  function copyCode(code: string) {
    copyText(code, '已複製存取碼')
  }

  function copyInviteLink(code: string) {
    if (!PUBLIC_WEB_URL) {
      toast('error', '尚未設定前台網址（VITE_PUBLIC_WEB_URL）')
      return
    }
    copyText(`${PUBLIC_WEB_URL}/chat?code=${code}`, '已複製邀請連結')
  }

  function handleFormSubmit(data: FormData) {
    const label = data.label.trim() ? data.label.trim() : null
    const dailyTokenLimit = Number(data.dailyTokenLimit) || 0
    const expiresAt = localInputToIso(data.expiresAt)
    if (modalMode === 'edit' && editing) {
      updateMutation.mutate({ id: editing.id, data: { label, dailyTokenLimit, expiresAt } })
    } else {
      createMutation.mutate({ label, dailyTokenLimit, expiresAt })
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  if (isLoading) return <PageLoading text="載入存取碼" />
  if (error) return <PageError title="載入存取碼失敗" detail={error.response?.data?.detail ?? '請確認網路或重新整理頁面'} />

  const list = codes ?? []

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="flex items-center justify-between mb-6">
          <PageHeader title="存取碼" subtitle={`共 ${list.length} 組存取碼`} />
          <Button size="sm" onClick={openCreate}>+ 新增存取碼</Button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
          <EmptyState
            title="尚無存取碼"
            description="建立存取碼以產生邀請連結，分享給使用者"
            action={<Button size="sm" onClick={openCreate}>+ 新增存取碼</Button>}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {list.map(code => (
              <AccessCodeCard
                key={code.id}
                code={code}
                isPendingDelete={pendingDeleteId === code.id}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === code.id}
                isToggling={activeMutation.isPending && activeMutation.variables?.id === code.id}
                onCopyCode={() => copyCode(code.code)}
                onCopyInvite={() => copyInviteLink(code.code)}
                onToggleActive={() => activeMutation.mutate({ id: code.id, isActive: !code.isActive })}
                onEdit={() => openEdit(code)}
                onDeleteRequest={() => setPendingDeleteId(code.id)}
                onDeleteConfirm={() => deleteMutation.mutate(code.id)}
                onDeleteCancel={() => setPendingDeleteId(null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 建立 / 編輯 Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'edit' ? `編輯存取碼${editing?.label ? ` — ${editing.label}` : ''}` : '新增存取碼'}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" disabled={isMutating} onClick={closeModal}>取消</Button>
            <Button form="access-code-form" type="submit" loading={isMutating} disabled={modalMode === 'edit' && !isFormDirty}>
              {modalMode === 'edit' ? '儲存變更' : '建立存取碼'}
            </Button>
          </div>
        }
      >
        <AccessCodeForm
          key={editing?.id ?? 'new'}
          defaultValues={editing ? {
            label: editing.label ?? '',
            dailyTokenLimit: editing.dailyTokenLimit,
            expiresAt: isoToLocalInput(editing.expiresAt),
          } : undefined}
          onSubmit={handleFormSubmit}
          onDirtyChange={setIsFormDirty}
        />
      </Modal>

      {/* 建立成功後顯示新存取碼 */}
      <Modal
        isOpen={createdCode !== null}
        onClose={() => setCreatedCode(null)}
        title="存取碼已建立"
        description="請複製存取碼或邀請連結分享給使用者"
        size="md"
        footer={<Button onClick={() => setCreatedCode(null)}>完成</Button>}
      >
        {createdCode && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">存取碼</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono text-base text-slate-800 dark:text-zinc-100 break-all">
                  {createdCode.code}
                </code>
                <Button size="sm" variant="secondary" onClick={() => copyCode(createdCode.code)}>複製</Button>
              </div>
            </div>
            <Button onClick={() => copyInviteLink(createdCode.code)}>複製邀請連結</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── AccessCodeCard ───────────────────────────────────────────────────────────

type CardProps = {
  code: AccessCode
  isPendingDelete: boolean
  isDeleting: boolean
  isToggling: boolean
  onCopyCode: () => void
  onCopyInvite: () => void
  onToggleActive: () => void
  onEdit: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

function AccessCodeCard({
  code, isPendingDelete, isDeleting, isToggling,
  onCopyCode, onCopyInvite, onToggleActive, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: CardProps) {
  const expired = isExpired(code.expiresAt)
  const unlimited = code.dailyTokenLimit === 0

  return (
    <Card className="p-5 transition-all flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <code className="font-mono text-base font-semibold text-slate-800 dark:text-zinc-100 break-all">{code.code}</code>
            <IconButton color="slate" onClick={onCopyCode} title="複製存取碼" aria-label="複製存取碼">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </IconButton>
          </div>
          {code.label && <p className="text-sm text-slate-500 dark:text-zinc-400 truncate">{code.label}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {expired && <Badge color="amber" size="sm">已過期</Badge>}
          <Badge color={code.isActive ? 'green' : 'slate'} size="sm">{code.isActive ? '啟用中' : '已停用'}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-sm">
        <span className="text-slate-400 dark:text-zinc-400">每日上限</span>
        <span className="text-slate-700 dark:text-zinc-200 text-right tabular-nums">{unlimited ? '不限' : code.dailyTokenLimit.toLocaleString()}</span>

        <span className="text-slate-400 dark:text-zinc-400">今日用量</span>
        <span className="text-slate-700 dark:text-zinc-200 text-right tabular-nums">
          已用 {code.usedTokensToday.toLocaleString()} / {unlimited ? '不限' : code.dailyTokenLimit.toLocaleString()}，{code.requestsToday} 次
        </span>

        <span className="text-slate-400 dark:text-zinc-400">過期時間</span>
        <span className={`text-right ${expired ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-zinc-200'}`}>
          {code.expiresAt ? formatDateTime(code.expiresAt) : '永不過期'}
        </span>
      </div>

      <Button size="sm" variant="blue" onClick={onCopyInvite} className="w-full">複製邀請連結</Button>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-700/25">
        {isPendingDelete ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-red-500 dark:text-red-400">確定要刪除嗎？</span>
            <div className="flex items-center gap-1.5">
              <Button autoFocus size="sm" variant="danger" loading={isDeleting} onClick={onDeleteConfirm}>確認</Button>
              <Button size="sm" variant="secondary" disabled={isDeleting} onClick={onDeleteCancel}>取消</Button>
            </div>
          </div>
        ) : (
          <>
            <Button size="sm" variant="secondary" loading={isToggling} onClick={onToggleActive}>
              {code.isActive ? '停用' : '啟用'}
            </Button>
            <div className="flex items-center gap-1.5">
              <IconButton color="blue" onClick={onEdit} title="編輯" aria-label="編輯">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </IconButton>
              <IconButton color="red" onClick={onDeleteRequest} title="刪除" aria-label="刪除">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </IconButton>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

// ─── AccessCodeForm ───────────────────────────────────────────────────────────

type FormProps = {
  defaultValues?: Partial<FormData>
  onSubmit: (data: FormData) => void
  onDirtyChange?: (dirty: boolean) => void
}

function AccessCodeForm({ defaultValues, onSubmit, onDirtyChange }: FormProps) {
  const { register, handleSubmit, watch, formState: { errors, isDirty } } = useForm<FormData>({
    defaultValues: { label: '', dailyTokenLimit: 50000, expiresAt: '', ...defaultValues },
    mode: 'onChange',
  })

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const limit = Number(watch('dailyTokenLimit'))

  return (
    <form id="access-code-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">標籤（選填）</label>
        <Input
          {...register('label')}
          placeholder="例：行銷團隊、活動 A"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">每日 Token 上限</label>
        <Input
          type="number"
          min={0}
          {...register('dailyTokenLimit', {
            required: '請填寫每日上限',
            min: { value: 0, message: '不可小於 0' },
            valueAsNumber: true,
          })}
          placeholder="50000"
          error={errors.dailyTokenLimit?.message}
          hint={Number.isFinite(limit) && limit === 0 ? '0 = 不限制用量' : '填 0 表示不限制用量'}
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">過期時間（選填）</label>
        <Input
          type="datetime-local"
          {...register('expiresAt')}
          hint="留空表示永不過期"
        />
      </div>
    </form>
  )
}
