import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { BotBinding, BotFormData, BotPlatform } from '../types/bot'
import type { Persona } from '../types/persona'
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
import Spinner from '../components/ui/Spinner'

const platformLabel: Record<BotPlatform, string> = { line: 'Line', discord: 'Discord' }
const platformColor: Record<BotPlatform, 'green' | 'blue'> = { line: 'green', discord: 'blue' }
const platformIcon: Record<BotPlatform, string> = { line: '📱', discord: '🎮' }
const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
]

export default function BotsPage() {
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingBot, setEditingBot] = useState<BotBinding | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const { data: bots, isLoading } = useQuery<BotBinding[], AxiosError<ApiError>>({
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
      channelSecret: data.channelSecret,
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
    mutationFn: ({ bot, isEnabled }: { bot: BotBinding; isEnabled: boolean }) =>
      api.put<ApiResponse<BotBinding>>(`/bot-bindings/${bot.id}`, {
        botName: bot.botName,
        modelType: bot.modelType,
        personaId: bot.personaId,
        isEnabled,
      }).then(unwrap),
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
      toast('error', e.response?.data?.detail ?? '操作失敗')
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

  function openCreate() { setEditingBot(null); setModalMode('create') }
  function openEdit(bot: BotBinding) { setEditingBot(bot); setModalMode('edit') }
  function closeModal() { setModalMode(null); setEditingBot(null) }

  async function handleFormSubmit(data: BotFormData) {
    if (modalMode === 'edit' && editingBot) {
      updateMutation.mutate({ id: editingBot.id, data, currentBot: editingBot })
      // 若填了新 token，另外呼叫 rotate-token
      if (data.botToken) {
        await api.post(`/bot-bindings/${editingBot.id}/rotate-token`, {
          newToken: data.botToken,
          newChannelSecret: data.channelSecret || undefined,
        }).catch(() => toast('error', 'Token 更新失敗，請稍後再試'))
      }
    } else {
      createMutation.mutate(data)
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 固定頂部：標題 + 設定流程 */}
      <div className="flex-shrink-0 px-6 lg:px-8 pt-6 lg:pt-8">
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
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-6 lg:pb-8">
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 py-4">
            <Spinner size="sm" /> 載入中...
          </div>
        )}

        {!isLoading && !bots?.length && (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              title="尚未綁定任何 Bot"
              description="新增 Bot 後即可將 Persona 設定部署到 Line 或 Discord"
              action={<Button size="sm" onClick={openCreate}>+ 新增 Bot</Button>}
            />
          </div>
        )}

        {!isLoading && !!bots?.length && (
          <div className="flex flex-col gap-4">
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
            <Button form="bot-form" type="submit" loading={isMutating}>
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
        />
      </Modal>
    </div>
  )
}

// ─── BotCard ────────────────────────────────────────────────────────────────

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
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${
            bot.platform === 'line' ? 'bg-green-500/10' : 'bg-blue-500/10'
          }`}>
            {platformIcon[bot.platform]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-slate-700 dark:text-zinc-200">{bot.botName}</span>
              <Badge color={platformColor[bot.platform]}>{platformLabel[bot.platform]}</Badge>
            </div>
            <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">
              {bot.personaName ? `Persona：${bot.personaName}　·　` : ''}Token：{bot.botTokenMasked}
            </p>
          </div>
        </div>

        <button
          onClick={onToggle}
          disabled={isToggling || isPendingDelete}
          title={bot.isEnabled ? '停用' : '啟用'}
          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
            bot.isEnabled ? 'bg-violet-500' : 'bg-slate-200 dark:bg-zinc-700'
          }`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            bot.isEnabled ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-700/25">
        <Badge color={bot.isEnabled ? 'green' : 'slate'}>{bot.isEnabled ? '運行中' : '已停用'}</Badge>
        <span className="text-sm text-slate-400 dark:text-zinc-400">Model：{bot.modelType}</span>
        <span className="text-sm text-slate-400 dark:text-zinc-400">建立於 {new Date(bot.createdAt).toLocaleDateString('zh-TW')}</span>

        {isPendingDelete ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-red-500">確定刪除？</span>
            <Button variant="danger" size="sm" onClick={onDeleteConfirm} loading={isDeleting}>確認</Button>
            <Button variant="secondary" size="sm" onClick={onDeleteCancel}>取消</Button>
          </div>
        ) : (
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>編輯</Button>
            <Button variant="danger" size="sm" onClick={onDeleteRequest}>刪除</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BotForm ────────────────────────────────────────────────────────────────

type FormProps = {
  isEdit: boolean
  personas: Persona[]
  defaultValues?: Partial<BotFormData>
  onSubmit: (data: BotFormData) => void
}

function BotForm({ isEdit, personas, defaultValues, onSubmit }: FormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BotFormData>({
    defaultValues: { platform: 'line', modelType: 'gpt-4o-mini', personaId: '', ...defaultValues },
  })
  const platform = watch('platform')
  const [showToken, setShowToken] = useState(false)
  const [showChannelSecret, setShowChannelSecret] = useState(false)

  return (
    <form id="bot-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">平台 *</label>
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
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">Bot 名稱 *</label>
          <Input
            {...register('botName', { required: '請填寫 Bot 名稱' })}
            placeholder="例：客服小幫手"
            error={errors.botName?.message}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">
          Bot Token {isEdit && <span className="text-slate-300 dark:text-zinc-500">（留空表示不修改）</span>}
          {!isEdit && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
          <input
            {...register('botToken', { required: isEdit ? false : '請填寫 Bot Token' })}
            type={showToken ? 'text' : 'password'}
            placeholder={isEdit ? '留空表示不修改現有 Token' : '貼上 Bot Token'}
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
              ? <span className="text-slate-300 dark:text-zinc-500">（留空表示不修改）</span>
              : <span className="text-red-400">*</span>
            }
          </label>
          <div className="relative">
            <input
              {...register('channelSecret', {
                validate: v => (isEdit || !!v) || 'Line 平台需要填入 Channel Secret',
              })}
              type={showChannelSecret ? 'text' : 'password'}
              placeholder={isEdit ? '留空表示不修改' : '貼上 Channel Secret'}
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
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">AI 模型</label>
          <select
            {...register('modelType')}
            className="w-full px-3 py-2 text-base bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all cursor-pointer"
          >
            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
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
