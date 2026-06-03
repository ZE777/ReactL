import { useState, useEffect, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { BotBinding, BotFormData, BotPlatform } from '../types/bot'
import type { Persona } from '../types/persona'
import type { AiProvider } from '../types/ai'
import type { ApiError, ApiResponse } from '../types/api'
import { fetchBots } from '../api/bots'
import { fetchPersonas } from '../api/personas'
import api, { unwrap } from '../lib/api'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PageLoading from '../components/ui/PageLoading'
import PageError from '../components/ui/PageError'

const platformLabel: Record<BotPlatform, string> = { line: 'Line', discord: 'Discord' }
const platformColor: Record<BotPlatform, 'green' | 'blue'> = { line: 'green', discord: 'blue' }

/** LINE 官方品牌 SVG（綠底白 L） */
function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#06C755" />
      <path
        d="M40 22.3C40 15.1 32.8 9.3 24 9.3C15.2 9.3 8 15.1 8 22.3C8 28.7 13.4 34.1 20.7 35.4C21.2 35.5 21.9 35.8 22.1 36.2C22.3 36.6 22.2 37.2 22.1 37.6L21.7 39.7C21.6 40.1 21.3 41.2 22.6 40.6C23.9 40 30.6 35.7 33.7 32.1C35.9 29.7 40 26.3 40 22.3Z"
        fill="white"
      />
      <path d="M20.5 19.5H19.2C19 19.5 18.8 19.7 18.8 19.9V26.1C18.8 26.3 19 26.5 19.2 26.5H20.5C20.7 26.5 20.9 26.3 20.9 26.1V19.9C20.9 19.7 20.7 19.5 20.5 19.5Z" fill="#06C755" />
      <path d="M28.8 19.5H27.5C27.3 19.5 27.1 19.7 27.1 19.9V23.3L24.3 19.7C24.2 19.6 24.1 19.5 24 19.5H22.7C22.5 19.5 22.3 19.7 22.3 19.9V26.1C22.3 26.3 22.5 26.5 22.7 26.5H24C24.2 26.5 24.4 26.3 24.4 26.1V22.7L27.2 26.3C27.3 26.4 27.4 26.5 27.5 26.5H28.8C29 26.5 29.2 26.3 29.2 26.1V19.9C29.2 19.7 29 19.5 28.8 19.5Z" fill="#06C755" />
      <path d="M17.4 24.4H14.6V19.9C14.6 19.7 14.4 19.5 14.2 19.5H12.9C12.7 19.5 12.5 19.7 12.5 19.9V26.1C12.5 26.2 12.6 26.3 12.6 26.4C12.7 26.4 12.8 26.5 12.9 26.5H17.4C17.6 26.5 17.8 26.3 17.8 26.1V24.8C17.8 24.6 17.6 24.4 17.4 24.4Z" fill="#06C755" />
      <path d="M35.1 21.6C35.3 21.6 35.5 21.4 35.5 21.2V19.9C35.5 19.7 35.3 19.5 35.1 19.5H30.6C30.5 19.5 30.4 19.5 30.3 19.6C30.2 19.7 30.2 19.8 30.2 19.9V26.1C30.2 26.2 30.2 26.3 30.3 26.4C30.4 26.5 30.5 26.5 30.6 26.5H35.1C35.3 26.5 35.5 26.3 35.5 26.1V24.8C35.5 24.6 35.3 24.4 35.1 24.4H32.3V23.5H35.1C35.3 23.5 35.5 23.3 35.5 23.1V21.8C35.5 21.6 35.3 21.6 35.1 21.6H32.3V21.6H35.1Z" fill="#06C755" />
    </svg>
  )
}

/** Discord 官方品牌 SVG（紫底白機器人） */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#5865F2" />
      <path
        d="M34.5 14.4a23.5 23.5 0 0 0-5.8-1.8.09.09 0 0 0-.09.04 16.4 16.4 0 0 0-.72 1.48 21.7 21.7 0 0 0-6.52 0 14.9 14.9 0 0 0-.73-1.48.09.09 0 0 0-.09-.04 23.4 23.4 0 0 0-5.8 1.8.08.08 0 0 0-.04.03C12 19.7 11 24.8 11.5 29.8a.1.1 0 0 0 .04.07 23.6 23.6 0 0 0 7.1 3.6.09.09 0 0 0 .1-.03 16.9 16.9 0 0 0 1.46-2.37.09.09 0 0 0-.05-.12 15.6 15.6 0 0 1-2.22-1.06.09.09 0 0 1-.01-.15c.15-.11.3-.23.44-.34a.09.09 0 0 1 .09-.01c4.66 2.13 9.7 2.13 14.31 0a.09.09 0 0 1 .09.01c.15.12.3.23.44.34a.09.09 0 0 1-.01.15 14.6 14.6 0 0 1-2.22 1.06.09.09 0 0 0-.05.12 18.9 18.9 0 0 0 1.45 2.37.09.09 0 0 0 .1.03 23.5 23.5 0 0 0 7.11-3.6.1.1 0 0 0 .04-.07c.59-6.1-.99-11.4-4.17-15.4a.07.07 0 0 0-.04-.03zM19.9 27a2.7 2.7 0 0 1-2.52-2.83 2.7 2.7 0 0 1 2.52-2.83 2.69 2.69 0 0 1 2.52 2.83A2.7 2.7 0 0 1 19.9 27zm9.3 0a2.7 2.7 0 0 1-2.52-2.83 2.7 2.7 0 0 1 2.52-2.83 2.69 2.69 0 0 1 2.52 2.83A2.7 2.7 0 0 1 29.2 27z"
        fill="white"
      />
    </svg>
  )
}

const PlatformIcon = ({ platform, className }: { platform: BotPlatform; className?: string }) =>
  platform === 'line' ? <LineIcon className={className} /> : <DiscordIcon className={className} />

export default function BotsPage() {
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingBot, setEditingBot] = useState<BotBinding | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  const { data: bots, isLoading, error } = useQuery<BotBinding[], AxiosError<ApiError>>({
    queryKey: ['bots'],
    queryFn: fetchBots,
  })

  const { data: personas } = useQuery<Persona[]>({
    queryKey: ['personas'],
    queryFn: fetchPersonas,
  })

  const createMutation = useMutation({
    mutationFn: (data: BotFormData) => api.post<ApiResponse<BotBinding>>('/bot-bindings', {
      platform: data.platform,
      botName: data.botName,
      botToken: data.botToken,
      channelSecret: data.channelSecret || undefined,
      modelType: data.modelType,
      personaId: data.personaId || null,
    }).then(unwrap),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bots'] }); setModalMode(null); toast('success', 'Bot 已新增') },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '新增失敗'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data, currentBot }: { id: string; data: BotFormData; currentBot: BotBinding }) =>
      api.put<ApiResponse<BotBinding>>(`/bot-bindings/${id}`, {
        botName: data.botName,
        modelType: data.modelType,
        personaId: data.personaId || null,
        isEnabled: currentBot.isEnabled,
      }).then(unwrap),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bots'] }); setModalMode(null); setEditingBot(null); toast('success', 'Bot 已更新') },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '更新失敗'),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ bot, isEnabled }: { bot: BotBinding; isEnabled: boolean }) => {
      // 瀏覽器離線時 request 會進佇列而非立即失敗，需在此提前攔截
      if (!navigator.onLine) throw new Error('網路已斷線')
      return unwrap(await api.put<ApiResponse<BotBinding>>(`/bot-bindings/${bot.id}`, {
        botName: bot.botName,
        modelType: bot.modelType,
        personaId: bot.personaId,
        isEnabled,
      }, { timeout: 5000 }))
    },
    onMutate: async ({ bot, isEnabled }) => {
      await queryClient.cancelQueries({ queryKey: ['bots'] })
      const prev = queryClient.getQueryData<BotBinding[]>(['bots'])
      queryClient.setQueryData<BotBinding[]>(['bots'], old =>
        old?.map(b => b.id === bot.id ? { ...b, isEnabled } : b) ?? []
      )
      return { prev }
    },
    onSuccess: (_, { isEnabled }) => {
      toast('success', isEnabled ? 'Bot 已啟用' : 'Bot 已停用')
    },
    onError: (e: AxiosError<ApiError>, _, context) => {
      if (context?.prev) queryClient.setQueryData(['bots'], context.prev)
      toast('error', e.response?.data?.detail ?? (e as Error).message ?? '操作失敗')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bot-bindings/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bots'] }); setPendingDeleteId(null); toast('success', 'Bot 已刪除') },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '刪除失敗'),
  })

  function openCreate() { setEditingBot(null); setModalMode('create'); setIsFormDirty(false); setIsFormValid(false) }
  function openEdit(bot: BotBinding) { setEditingBot(bot); setModalMode('edit'); setIsFormDirty(false); setIsFormValid(false) }
  function closeModal() { setModalMode(null); setEditingBot(null); setIsFormDirty(false); setIsFormValid(false) }

  async function handleFormSubmit(data: BotFormData) {
    if (modalMode === 'edit' && editingBot) {
      updateMutation.mutate({ id: editingBot.id, data, currentBot: editingBot })
      // 若填了新 token，另外呼叫 rotate-token
      if (data.botToken) {
        await api.post(`/bot-bindings/${editingBot.id}/rotate-token`, {
          newToken: data.botToken,
          newChannelSecret: data.channelSecret || undefined,
        }, { timeout: 8000 }).catch(() => toast('error', 'Token 更新失敗，請稍後再試'))
      }
    } else {
      createMutation.mutate(data)
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  if (isLoading) return <PageLoading text="載入 Bot 資料" />
  if (error) return <PageError title="載入 Bot 資料失敗" detail={error.response?.data?.detail ?? '請確認網路或重新整理頁面'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['bots'] })} />

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 固定頂部：標題 + 設定流程 */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">Bot 管理</h2>
            <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">Line / Discord 平台綁定</p>
          </div>
          <Button size="sm" onClick={openCreate}>+ 新增 Bot</Button>
        </div>

        {/* 設定流程卡片 */}
        <div className="mb-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-5 py-4">
          <div className="relative flex justify-between items-start">
            <div className="absolute top-3 left-[12.5%] right-[12.5%] h-px bg-slate-200 dark:bg-zinc-700" />
            {([
              { n: '1', title: '建立 Bot',   desc: '在開發者平台建立應用程式並取得憑證' },
              { n: '2', title: '填入 Token', desc: '貼入 Bot Token，以 AES 加密儲存' },
              { n: '3', title: '選擇設定',   desc: '指派 Persona 角色與 AI 模型' },
              { n: '4', title: '啟用上線',   desc: '啟用後即可在外部平台接收 AI 對話' },
            ] as const).map(item => (
              <div key={item.n} className="flex-1 flex flex-col items-center relative z-10 px-2">
                <div className="w-6 h-6 rounded-full bg-violet-500 text-white text-sm font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
                  {item.n}
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-200 mt-2 text-center">{item.title}</p>
                <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5 text-center leading-relaxed line-clamp-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 動態內容區：填滿剩餘高度 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
        {!bots?.length && (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              title="尚未綁定任何 Bot"
              description="新增 Bot 後即可將 Persona 設定部署到 Line 或 Discord"
              action={<Button size="sm" onClick={openCreate}>+ 新增 Bot</Button>}
            />
          </div>
        )}

        {!!bots?.length && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {bots.map(bot => (
              <BotCard
                key={bot.id}
                bot={bot}
                isPendingDelete={pendingDeleteId === bot.id}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === bot.id}
                isToggling={toggleMutation.isPending && toggleMutation.variables?.bot.id === bot.id}
                onToggle={() => toggleMutation.mutate({ bot, isEnabled: !bot.isEnabled })}
                onEdit={() => openEdit(bot)}
                onDeleteRequest={() => setPendingDeleteId(bot.id)}
                onDeleteConfirm={() => deleteMutation.mutate(bot.id)}
                onDeleteCancel={() => setPendingDeleteId(null)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'edit' ? `編輯 Bot — ${editingBot?.botName}` : '新增 Bot 綁定'}
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={closeModal}>取消</Button>
            <Button form="bot-form" type="submit" loading={isMutating} disabled={modalMode === 'edit' ? !isFormDirty : !isFormValid}>
              {modalMode === 'edit' ? '儲存變更' : '新增 Bot'}
            </Button>
          </div>
        }
      >
        <BotForm
          key={editingBot?.id ?? 'new'}
          isEdit={modalMode === 'edit'}
          personas={personas ?? []}
          defaultValues={editingBot ? {
            platform: editingBot.platform,
            botName: editingBot.botName,
            botToken: '',
            personaId: editingBot.personaId ?? '',
            modelType: editingBot.modelType,
          } : undefined}
          onSubmit={handleFormSubmit}
          onDirtyChange={setIsFormDirty}
          onValidChange={setIsFormValid}
        />
      </Modal>
    </div>
  )
}

// ─── BotCard ────────────────────────────────────────────────────────────────

function WebhookUrlRow({ platform, botId }: { platform: BotPlatform; botId: string }) {
  const [copied, setCopied] = useState(false)
  const path = `/webhooks/${platform}/${botId}`

  function handleCopy() {
    navigator.clipboard.writeText(path)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-xs text-slate-300 dark:text-zinc-600 font-mono truncate max-w-[220px]" title={path}>
        {path}
      </span>
      <button
        onClick={handleCopy}
        title="複製 Webhook 路徑"
        className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
      >
        {copied ? (
          <>
            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-500">已複製</span>
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>複製路徑</span>
          </>
        )}
      </button>
    </div>
  )
}

type CardProps = {
  bot: BotBinding
  isPendingDelete: boolean
  isDeleting: boolean
  isToggling: boolean
  onToggle: () => void
  onEdit: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

function BotCard({ bot, isPendingDelete, isDeleting, isToggling, onToggle, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel }: CardProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-xl p-5 transition-colors ${
      isPendingDelete
        ? 'border-red-300/60 dark:border-red-800/60 bg-red-50/30 dark:bg-red-900/10'
        : 'border-slate-200 dark:border-zinc-800'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
            <PlatformIcon platform={bot.platform} className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-slate-700 dark:text-zinc-200">{bot.botName}</span>
              <Badge color={platformColor[bot.platform]}>{platformLabel[bot.platform]}</Badge>
            </div>
            <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">
              {bot.personaName ? `Persona：${bot.personaName}　·　` : ''}Token：{bot.botTokenMasked}
            </p>
            <WebhookUrlRow platform={bot.platform} botId={bot.id} />
          </div>
        </div>

        <button
          onClick={onToggle}
          disabled={isToggling || isPendingDelete}
          title={bot.isEnabled ? '停用' : '啟用'}
          className={`relative flex-shrink-0 w-11 h-6 rounded-full overflow-hidden transition-colors cursor-pointer disabled:opacity-60 ${
            bot.isEnabled ? 'bg-violet-500' : 'bg-slate-200 dark:bg-zinc-700'
          }`}
        >
          <span className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            bot.isEnabled ? 'translate-x-[18px]' : 'translate-x-0'
          }`} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-700/25 overflow-hidden">
        <Badge color={bot.isEnabled ? 'green' : 'slate'}>{bot.isEnabled ? '運行中' : '已停用'}</Badge>
        <span className="text-sm text-slate-400 dark:text-zinc-400 min-w-0 truncate max-w-[200px]" title={`Model：${bot.modelType}`}>Model：{bot.modelType}</span>
        <span className="text-sm text-slate-400 dark:text-zinc-400 shrink-0">建立於 {new Date(bot.createdAt).toLocaleDateString('zh-TW')}</span>

        {isPendingDelete ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-red-500">確定刪除？</span>
            <Button variant="danger" size="sm" onClick={onDeleteConfirm} loading={isDeleting}>確認</Button>
            <Button variant="secondary" size="sm" onClick={onDeleteCancel}>取消</Button>
          </div>
        ) : (
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={onEdit}
              title="編輯"
              aria-label="編輯"
              className="w-7 h-7 rounded-md flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDeleteRequest}
              title="刪除"
              aria-label="刪除"
              className="w-7 h-7 rounded-md flex items-center justify-center text-red-600 dark:text-red-500 bg-red-300/70 dark:bg-red-600/30 hover:bg-red-400/70 dark:hover:bg-red-600/50 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ModelSelect ────────────────────────────────────────────────────────────

type ModelSelectProps = {
  value: string
  onChange: (v: string) => void
  providers: AiProvider[] | undefined
  loading: boolean
  hasError?: boolean
}

function ModelSelect({ value, onChange, providers, loading, hasError }: ModelSelectProps) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleOpen() {
    if (loading || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropdownStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setOpen(v => !v)
  }

  const selectedLabel = useMemo(() => {
    if (!value || !providers) return null
    const [providerId, modelId] = value.split(':')
    const provider = providers.find(p => p.id === providerId)
    const model = provider?.models.find(m => m.id === modelId)
    if (!provider || !model) return null
    return { provider: provider.displayName, model: model.displayName }
  }, [value, providers])

  const configuredProviders = providers?.filter(p => p.isConfigured) ?? []

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className={`w-full px-3 py-2 text-base bg-white dark:bg-zinc-900 border rounded-lg text-left flex items-center justify-between gap-2 transition-all outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60 cursor-pointer ${
          hasError ? 'border-red-400 dark:border-red-500' :
          open ? 'border-violet-500' : 'border-slate-300 dark:border-zinc-700'
        }`}
      >
        {loading ? (
          <span className="text-slate-400 dark:text-zinc-500 text-sm">載入中...</span>
        ) : selectedLabel ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-slate-400 dark:text-zinc-500 flex-shrink-0">{selectedLabel.provider}</span>
            <span className="text-slate-700 dark:text-zinc-200 truncate">{selectedLabel.model}</span>
          </span>
        ) : (
          <span className="text-slate-400 dark:text-zinc-500 text-sm">請選擇模型</span>
        )}
        <svg className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="fixed z-[100] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {configuredProviders.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400 dark:text-zinc-500">沒有可用的 AI 供應商</p>
          )}
          {configuredProviders.map((provider, idx) => (
            <div key={provider.id}>
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wide bg-slate-50 dark:bg-zinc-800 sticky top-0">
                {provider.displayName}
              </div>
              {provider.models.map(model => {
                const val = `${provider.id}:${model.id}`
                const isSelected = value === val
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => { onChange(val); setOpen(false) }}
                    className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-medium'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-violet-500' : 'text-transparent'}`}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {model.displayName}
                  </button>
                )
              })}
              {idx < configuredProviders.length - 1 && (
                <div className="border-t border-slate-100 dark:border-zinc-700/25" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── BotForm ────────────────────────────────────────────────────────────────

type FormProps = {
  isEdit: boolean
  personas: Persona[]
  defaultValues?: Partial<BotFormData>
  onSubmit: (data: BotFormData) => void
  onDirtyChange?: (dirty: boolean) => void
  onValidChange?: (valid: boolean) => void
}

function BotForm({ isEdit, personas, defaultValues, onSubmit, onDirtyChange, onValidChange }: FormProps) {
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isDirty, isValid } } = useForm<BotFormData>({
    defaultValues: { platform: 'line', modelType: '', personaId: '', ...defaultValues },
    shouldUnregister: true,
    mode: 'onChange',
  })

  // 通知父層表單是否有變更
  useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty, onDirtyChange])

  // 通知父層表單驗證狀態
  useEffect(() => { onValidChange?.(isValid) }, [isValid, onValidChange])

  // 新增模式：Modal 開啟時立即觸發驗證，讓必填欄位顯示紅框
  useEffect(() => { if (!isEdit) trigger() }, [])
  const platform = watch('platform')
  const modelType = watch('modelType')
  const [showToken, setShowToken] = useState(false)
  const [showChannelSecret, setShowChannelSecret] = useState(false)

  const { data: providers, isLoading: providersLoading } = useQuery<AiProvider[]>({
    queryKey: ['ai-providers'],
    queryFn: () => api.get<ApiResponse<AiProvider[]>>('/ai/providers').then(unwrap),
  })

  // 資料載入後若尚未選模型，自動帶入第一個可用模型
  useEffect(() => {
    if (!providers || modelType) return
    const first = providers.find(p => p.isConfigured && p.models.length > 0)
    if (first) setValue('modelType', `${first.id}:${first.models[0].id}`, { shouldValidate: true })
  }, [providers, modelType, setValue])

  return (
    <form id="bot-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">平台 <span className="text-red-400">*</span></label>
          <select
            {...register('platform', { required: true })}
            disabled={isEdit}
            className="w-full px-3 py-2 text-base bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all cursor-pointer disabled:opacity-60"
          >
            <option value="line">Line</option>
            <option value="discord">Discord</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">Bot 名稱 <span className="text-red-400">*</span></label>
          <Input
            {...register('botName', { required: '請填寫 Bot 名稱' })}
            placeholder="例：客服小幫手"
            error={errors.botName?.message}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">
          Bot Token {isEdit && <span className="text-slate-300 dark:text-zinc-500">（加密保護，不回傳原值）</span>}
          {!isEdit && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
          <input
            {...register('botToken', { required: isEdit ? false : '請填寫 Bot Token' })}
            type={showToken ? 'text' : 'password'}
            placeholder={isEdit ? '填入新值更換' : '貼上 Bot Token'}
            className={`w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border ${errors.botToken ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-zinc-700'}`}
          />
          <button
            type="button"
            onClick={() => setShowToken(v => !v)}
            className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
            tabIndex={-1}
          >
            {showToken ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.botToken && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.botToken.message}</p>}
        <p className="text-sm text-slate-400 dark:text-zinc-400 mt-1">Token 將以 AES 加密儲存，前端僅顯示後 4 碼</p>
      </div>

      {platform === 'line' && (
        <div>
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">
            Channel Secret{' '}
            {isEdit
              ? <span className="text-slate-300 dark:text-zinc-500">（加密保護，不回傳原值）</span>
              : <span className="text-red-400">*</span>
            }
          </label>
          <div className="relative">
            <input
              {...register('channelSecret', {
                validate: v => (isEdit || !!v) || 'Line 平台需要填入 Channel Secret',
              })}
              type={showChannelSecret ? 'text' : 'password'}
              placeholder={isEdit ? '填入新值更換' : '貼上 Channel Secret'}
              className="w-full px-3 py-2 pr-10 text-base bg-white dark:bg-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all border border-slate-300 dark:border-zinc-700"
            />
            <button
              type="button"
              onClick={() => setShowChannelSecret(v => !v)}
              className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              tabIndex={-1}
            >
              {showChannelSecret ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.channelSecret && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.channelSecret.message}</p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">AI 模型 <span className="text-red-400">*</span></label>
          <input type="hidden" {...register('modelType', { required: '請選擇 AI 模型' })} />
          <ModelSelect
            value={modelType}
            onChange={v => setValue('modelType', v, { shouldValidate: true, shouldDirty: true })}
            providers={providers}
            loading={providersLoading}
            hasError={!!errors.modelType}
          />
          {errors.modelType && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.modelType.message}</p>}
        </div>
        <div className="flex-1">
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">Persona</label>
          <select
            {...register('personaId')}
            className="w-full px-3 py-2 text-base bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all cursor-pointer"
          >
            <option value="">（不指定）</option>
            {personas.map(p => (
              <option key={p.id} value={p.id}>{p.emoji ? `${p.emoji} ` : ''}{p.name}</option>
            ))}
          </select>
        </div>
      </div>
    </form>
  )
}
