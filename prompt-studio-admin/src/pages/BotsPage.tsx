import { useState, useEffect, useRef, useMemo } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { useNoSpace } from '../lib/form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { BotBinding, BotFormData, BotPlatform } from '../types/bot'
import type { Persona } from '../types/persona'
import type { AiProvider, AiKey } from '../types/ai'
import type { ApiError, ApiResponse } from '../types/api'
import { fetchBots } from '../api/bots'
import { fetchPersonas } from '../api/personas'
import { fetchAiKeys } from '../api/aiKeys'
import api, { unwrap } from '../lib/api'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import Tag from '../components/ui/Tag'
import FilterPill from '../components/ui/FilterPill'
import IconButton from '../components/ui/IconButton'
import GhostButton from '../components/ui/GhostButton'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import DropdownSelect from '../components/ui/DropdownSelect'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PageLoading from '../components/ui/PageLoading'
import PageError from '../components/ui/PageError'

const platformLabel: Record<BotPlatform, string> = { line: 'Line', discord: 'Discord' }
const platformColor: Record<BotPlatform, 'green' | 'blue'> = { line: 'green', discord: 'blue' }

/**
 * 把 simple-icons 規格（置中的 24×24 網格）的白色 logo 等比縮放並置中到 48×48 底色方塊。
 * 位移量由 scale 反推（24 - 12 * scale），所以不論放大多少都保持置中。
 * 兩個平台各自挑選視覺重量相當的 scale：Discord logo 為實心、視覺較重用較小值；
 * LINE 為細線氣泡、視覺較輕，需放大才能與 Discord 看起來一樣大。
 */
const glyphTransform = (scale: number) => {
  const offset = 24 - 12 * scale
  return `translate(${offset} ${offset}) scale(${scale})`
}

/** LINE 官方品牌 SVG（綠底白 logo） */
function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#06C755" />
      <path
        transform={glyphTransform(1.35)}
        fill="white"
        d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
      />
    </svg>
  )
}

/** Discord 官方品牌 SVG（紫底白 logo） */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="#5865F2" />
      <path
        transform={glyphTransform(1.4)}
        fill="white"
        d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
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
  const [platformFilter, setPlatformFilter] = useState<'all' | BotPlatform>('all')
  const [search, setSearch] = useState('')
  // Discord 指令註冊失敗時顯示的錯誤 Modal（Bot 仍會建立，但需提醒使用者修正）
  const [regError, setRegError] = useState<{ name: string; reason: string } | null>(null)
  // 教學模式：ON 用分步引導 Modal、OFF 用快速建立表單。偏好存 localStorage
  const [tutorialMode, setTutorialMode] = useState(() => localStorage.getItem('botTutorialMode') === '1')
  const [wizardOpen, setWizardOpen] = useState(false)
  // 教學模式建立成功後，精靈前進到「完成後續」步驟而非關閉
  const [wizardCreated, setWizardCreated] = useState(false)
  const toggleTutorial = () => setTutorialMode(v => {
    const next = !v
    localStorage.setItem('botTutorialMode', next ? '1' : '0')
    return next
  })

  const { data: bots, isLoading, error } = useQuery<BotBinding[], AxiosError<ApiError>>({
    queryKey: ['bots'],
    queryFn: fetchBots,
  })

  const { data: personas } = useQuery<Persona[]>({
    queryKey: ['personas'],
    queryFn: fetchPersonas,
  })

  // 依後端回傳的憑證驗證結果，給對應的儲存提示
  const notifyBotSaved = (bot: BotBinding, baseMsg: string) => {
    if (bot.credentialValid === false) {
      // Bot 仍建立成功，但憑證驗證失敗 → 跳 Modal 明確告知並引導修正（狀態也已持久化標示無效）
      setRegError({ name: bot.botName, reason: bot.credentialError ?? '未知原因，請查看後端 log' })
    } else if (bot.credentialValid === true) {
      const extra = bot.platform === 'discord'
        ? '，/chat 指令已自動註冊（首次最久約數分鐘生效，之後邀請即可使用）'
        : '，憑證已驗證通過'
      toast('success', `${baseMsg}${extra}`)
    } else {
      toast('success', baseMsg)
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: BotFormData) => api.post<ApiResponse<BotBinding>>('/bot-bindings', {
      platform: data.platform,
      botName: data.botName,
      botToken: data.botToken,
      channelSecret: data.channelSecret || undefined,
      modelType: data.modelType,
      personaId: data.personaId || null,
      webhookBaseUrl: data.webhookBaseUrl || null,
      discordApplicationId: data.discordApplicationId || null,
      discordPublicKey: data.discordPublicKey || null,
    }).then(unwrap),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      notifyBotSaved(data, 'Bot 已新增')
      // 教學模式：建立成功後保持開啟、前進到「完成後續」步驟；快速模式關閉表單
      if (wizardOpen) setWizardCreated(true)
      else setModalMode(null)
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '新增失敗'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data, currentBot }: { id: string; data: BotFormData; currentBot: BotBinding }) =>
      api.put<ApiResponse<BotBinding>>(`/bot-bindings/${id}`, {
        botName: data.botName,
        modelType: data.modelType,
        personaId: data.personaId || null,
        isEnabled: currentBot.isEnabled,
        webhookBaseUrl: data.webhookBaseUrl || null,
        discordApplicationId: data.discordApplicationId || null,
        discordPublicKey: data.discordPublicKey || null,
      }).then(unwrap),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      // 設定可能影響 LINE 用量查詢結果（如更換 Token），一併重新整理該 Bot 的用量
      queryClient.invalidateQueries({ queryKey: ['line-quota', data.id] })
      setModalMode(null); setEditingBot(null); notifyBotSaved(data, 'Bot 已更新')
    },
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
        webhookBaseUrl: bot.webhookBaseUrl,
        discordApplicationId: bot.discordApplicationId,
        discordPublicKey: bot.discordPublicKey,
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

  function openCreate() {
    // 教學模式走分步引導；快速模式走原本的表單 Modal
    if (tutorialMode) { setWizardOpen(true); return }
    setEditingBot(null); setModalMode('create'); setIsFormDirty(false); setIsFormValid(false)
  }
  function openEdit(bot: BotBinding) { setEditingBot(bot); setModalMode('edit'); setIsFormDirty(false); setIsFormValid(false) }
  function closeModal() { setModalMode(null); setEditingBot(null); setIsFormDirty(false); setIsFormValid(false) }

  async function handleFormSubmit(data: BotFormData) {
    if (modalMode === 'edit' && editingBot) {
      updateMutation.mutate({ id: editingBot.id, data, currentBot: editingBot })
      // 若填了新 token，另外呼叫 rotate-token
      if (data.botToken) {
        try {
          await api.post(`/bot-bindings/${editingBot.id}/rotate-token`, {
            newToken: data.botToken,
            newChannelSecret: data.channelSecret || undefined,
          }, { timeout: 8000 })
          // 換 Token 會影響憑證狀態與 LINE 用量，重新整理列表與該 Bot 用量
          queryClient.invalidateQueries({ queryKey: ['bots'] })
          queryClient.invalidateQueries({ queryKey: ['line-quota', editingBot.id] })
        } catch {
          toast('error', 'Token 更新失敗，請稍後再試')
        }
      }
    } else {
      createMutation.mutate(data)
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  const filteredBots = (bots ?? []).filter(b => {
    if (platformFilter !== 'all' && b.platform !== platformFilter) return false
    if (search.trim() && !b.botName.toLowerCase().includes(search.trim().toLowerCase())) return false
    return true
  })

  if (isLoading) return <PageLoading text="載入 Bot 資料" />
  if (error) return <PageError title="載入 Bot 資料失敗" detail={error.response?.data?.detail ?? '請確認網路或重新整理頁面'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['bots'] })} />

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 固定頂部：標題 + 設定流程 */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <PageHeader title="Bot 管理" subtitle="Line / Discord 平台綁定" />
          <div className="flex items-center gap-3">
            {/* 教學模式開關：ON = 分步引導、OFF = 快速建立 */}
            <button
              type="button"
              onClick={toggleTutorial}
              className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 cursor-pointer select-none"
              title={tutorialMode ? '教學模式：新增時逐步引導' : '快速模式：直接填表單建立'}
            >
              <span>教學模式</span>
              <span className={`relative w-9 h-5 rounded-full transition-colors ${tutorialMode ? 'bg-violet-500' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${tutorialMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </span>
            </button>
            <Button size="sm" onClick={openCreate}>+ 新增 Bot</Button>
          </div>
        </div>

        {/* 設定流程卡片 */}
        <Card className="mb-4 px-5 py-4">
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
                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 mt-2 text-center">{item.title}</p>
                <p className="hidden sm:block text-sm text-slate-400 dark:text-zinc-400 mt-0.5 text-center leading-relaxed line-clamp-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 平台篩選 + 搜尋列（放在固定標頭區，避免 overflow-y:auto 裁切 focus ring） */}
        {!!bots?.length && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(['all', 'line', 'discord'] as const).map(p => (
              <FilterPill key={p} active={platformFilter === p} onClick={() => setPlatformFilter(p)}>
                {p === 'all' ? '全部' : p === 'line' ? 'LINE' : 'Discord'}
              </FilterPill>
            ))}
            <div className="relative ml-1">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋 Bot 名稱…"
                className="pl-8 pr-7 py-1.5 text-sm bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 rounded-full border-0 outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-500 transition-shadow w-44"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                  aria-label="清除搜尋"
                >×</button>
              )}
            </div>
          </div>
        )}
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

        {!!bots?.length && filteredBots.length === 0 && (
          <EmptyState title="找不到符合的 Bot" description="請嘗試其他關鍵字或切換平台篩選" />
        )}

        {filteredBots.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredBots.map(bot => (
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
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" disabled={isMutating} onClick={closeModal}>取消</Button>
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
            webhookBaseUrl: editingBot.webhookBaseUrl ?? '',
            discordApplicationId: editingBot.discordApplicationId ?? '',
            discordPublicKey: editingBot.discordPublicKey ?? '',
          } : undefined}
          onSubmit={handleFormSubmit}
          onDirtyChange={setIsFormDirty}
          onValidChange={setIsFormValid}
        />
      </Modal>

      {/* Discord 指令註冊失敗：明確告知並引導修正（Bot 已建立，狀態欄已標示「指令無效」） */}
      <Modal
        isOpen={regError !== null}
        onClose={() => setRegError(null)}
        title="Bot 設定驗證失敗"
        size="sm"
        footer={<Button onClick={() => setRegError(null)}>我知道了</Button>}
      >
        <div className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-zinc-300">
            Bot <span className="font-semibold">{regError?.name}</span> 已儲存，但憑證/設定驗證失敗，目前為<span className="text-red-500 font-semibold">無效</span>狀態。
          </p>
          <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3 py-2 text-red-600 dark:text-red-400">
            原因：{regError?.reason}
          </div>
          <p className="text-slate-400 dark:text-zinc-400">
            請至該 Bot 卡片點「編輯」，確認憑證與相關設定（Token、Application ID 等）正確後重新儲存。修正成功前，此 Bot 無法正常運作。
          </p>
        </div>
      </Modal>

      {/* 教學模式：分步引導精靈 */}
      <BotSetupWizard
        isOpen={wizardOpen}
        onClose={() => { setWizardOpen(false); setWizardCreated(false) }}
        personas={personas ?? []}
        onSubmit={handleFormSubmit}
        isMutating={createMutation.isPending}
        created={wizardCreated}
      />
    </div>
  )
}

// ─── BotCard ────────────────────────────────────────────────────────────────

type LineQuota = {
  quotaType: 'limited' | 'none'
  limit: number | null
  totalUsage: number
  remaining: number | null
}

/** LINE 月訊息用量區塊（緊湊版，嵌入 BotCard 右側 toggle 旁；fullWidth=true 時改為橫跨全寬） */
function LineQuotaSection({ botId, fullWidth = false }: { botId: string; fullWidth?: boolean }) {
  const { data, isFetching, isError, refetch } = useQuery<LineQuota>({
    queryKey: ['line-quota', botId],
    queryFn: () => api.get<ApiResponse<LineQuota>>(`/bot-bindings/${botId}/line-quota`).then(unwrap),
    staleTime: 60_000,
  })

  const pct = data?.limit ? Math.min(100, Math.round((data.totalUsage / data.limit) * 100)) : 0
  const isNearLimit = pct >= 80
  const isExceeded = pct >= 100

  const statusColor = isExceeded
    ? 'text-red-500 dark:text-red-400'
    : isNearLimit
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-emerald-500 dark:text-emerald-400'

  const barColor = isExceeded ? 'bg-red-500' : isNearLimit ? 'bg-amber-400' : 'bg-emerald-400'

  const containerClass = fullWidth
    ? 'flex flex-col gap-1.5 w-full border-t border-slate-100 dark:border-zinc-700/40 pt-2 mt-2'
    : 'flex flex-col gap-1.5 w-56 flex-shrink-0 border-r border-slate-100 dark:border-zinc-700/40 pr-3 mr-1'

  return (
    <div className={containerClass}>
      {/* 標題 + 刷新 */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1 leading-none">
          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          LINE 用量
        </span>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          title="更新用量"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-700/60 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-40 transition-colors"
        >
          <svg className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isFetching ? '更新中' : '更新'}
        </button>
      </div>

      {/* 載入中 */}
      {isFetching && !data && (
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 border border-violet-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="text-xs text-slate-400 dark:text-zinc-500">查詢中...</span>
        </div>
      )}

      {/* 錯誤 */}
      {isError && !isFetching && (
        <span className="text-xs text-red-500 dark:text-red-400 leading-tight">查詢失敗</span>
      )}

      {/* 資料 */}
      {data && (
        data.quotaType === 'none' ? (
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm font-bold text-slate-700 dark:text-zinc-200 tabular-nums leading-none">
              {data.totalUsage.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-500">則（無限）</span>
          </div>
        ) : (
          <>
            {/* 數字行 */}
            <div className="flex items-baseline justify-between gap-1">
              <div className="flex items-baseline gap-0.5">
                <span className={`text-sm font-bold tabular-nums leading-none ${statusColor}`}>
                  {data.totalUsage.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  /{data.limit!.toLocaleString()}
                </span>
              </div>
              <span className={`text-xs font-semibold leading-none ${statusColor}`}>
                {isExceeded ? '超量' : `${pct}%`}
              </span>
            </div>

            {/* 進度條 */}
            <div className="h-1.5 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* 剩餘 */}
            <span className={`text-xs leading-none ${
              isExceeded ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-400 dark:text-zinc-500'
            }`}>
              {isExceeded ? '已超出上限' : `剩餘 ${data.remaining!.toLocaleString()} 則`}
            </span>
          </>
        )
      )}
    </div>
  )
}

function WebhookUrlRow({ webhookUrl }: { webhookUrl: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!webhookUrl) return
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API 不可用（非 HTTPS 或瀏覽器限制）時靜默略過
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2 min-w-0">
      <span
        className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate min-w-0 max-w-full md:max-w-[360px] leading-relaxed"
        title={webhookUrl}
      >
        {webhookUrl}
      </span>
      <GhostButton onClick={handleCopy} title="複製 Webhook URL" className="shrink-0">
        {copied ? (
          <>
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-500">已複製</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>複製 Webhook URL</span>
          </>
        )}
      </GhostButton>
    </div>
  )
}

/**
 * Discord 邀請連結列：由 Bot 的 Application ID 即時組出 OAuth 邀請連結，
 * 提供「複製邀請連結」與「開啟邀請」。連結只取決於 Application ID，固定不變。
 * permissions=67584 → Send Messages + Read Message History；scope = bot + applications.commands
 */
function DiscordInviteRow({ applicationId }: { applicationId: string }) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${applicationId}&permissions=67584&scope=bot+applications.commands`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API 不可用（非 HTTPS 或瀏覽器限制）時靜默略過
    }
  }

  return (
    <div className="flex items-center gap-3 mt-1">
      <GhostButton onClick={handleCopy} title="複製 Discord 邀請連結" className="self-start">
        {copied ? (
          <>
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-500">已複製</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>複製邀請連結</span>
          </>
        )}
      </GhostButton>
      <a
        href={inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 hover:underline"
        title="在新分頁開啟 Discord 邀請頁"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        開啟邀請
      </a>
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
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
            <PlatformIcon platform={bot.platform} className="w-10 h-10" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base font-semibold text-slate-700 dark:text-zinc-200 truncate">{bot.botName}</span>
              <span className="shrink-0"><Badge color={platformColor[bot.platform]}>{platformLabel[bot.platform]}</Badge></span>
            </div>
            <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5 truncate">
              {bot.personaName ? `Persona：${bot.personaName}　·　` : ''}Token：{bot.botTokenMasked}
            </p>
            <WebhookUrlRow webhookUrl={bot.webhookUrl} />
            {bot.platform === 'discord' && bot.discordApplicationId && (
              <DiscordInviteRow applicationId={bot.discordApplicationId} />
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 flex-shrink-0">
          {/* ≥768px：用量區塊內嵌在右側，與 toggle 並排 */}
          {bot.platform === 'line' && (
            <div className="max-md:hidden">
              <LineQuotaSection botId={bot.id} />
            </div>
          )}
          <button
            onClick={onToggle}
            disabled={isToggling || isPendingDelete}
            title={bot.isEnabled ? '停用' : '啟用'}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full overflow-hidden transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              bot.isEnabled ? 'bg-violet-500' : 'bg-slate-200 dark:bg-zinc-700'
            }`}
          >
            <span className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              bot.isEnabled ? 'translate-x-[18px]' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* <768px：用量區塊換行顯示（React Query cache dedup，無額外 API 請求） */}
      {bot.platform === 'line' && (
        <div className="md:hidden">
          <LineQuotaSection botId={bot.id} fullWidth />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-700/25 overflow-hidden">
        <Tag color={bot.isEnabled ? 'green' : 'slate'}>
          {bot.isEnabled ? '運行中' : '已停用'}
        </Tag>
        {bot.credentialValid === false && (
          <Tag color="red" className="cursor-help">
            <span title={`憑證驗證失敗，請編輯修正${bot.platform === 'discord' ? ' Token / Application ID' : ' Channel Access Token'}後重新儲存`}>⚠ 設定無效</span>
          </Tag>
        )}
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
  /** 限定可選的供應商（使用者自帶金鑰的 provider）；不給＝以系統 isConfigured 為準 */
  usableProviders?: Set<string>
}

function ModelSelect({ value, onChange, providers, loading, hasError, usableProviders }: ModelSelectProps) {
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

  const configuredProviders = providers?.filter(p => usableProviders ? usableProviders.has(p.id) : p.isConfigured) ?? []

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className={`w-full px-3 py-2 text-base bg-white dark:bg-zinc-900 border rounded-lg text-left flex items-center justify-between gap-2 transition-all outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
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

/** 教學模式可內嵌的欄位鍵 */
type BotFieldKey =
  | 'platform' | 'botName' | 'botToken' | 'channelSecret'
  | 'model' | 'persona' | 'webhook'
  | 'discordApplicationId' | 'discordPublicKey'

/** BotFieldKey → react-hook-form 欄位名（供分步驗證） */
const FIELD_TO_NAME: Record<BotFieldKey, keyof BotFormData> = {
  platform: 'platform',
  botName: 'botName',
  botToken: 'botToken',
  channelSecret: 'channelSecret',
  model: 'modelType',
  persona: 'personaId',
  webhook: 'webhookBaseUrl',
  discordApplicationId: 'discordApplicationId',
  discordPublicKey: 'discordPublicKey',
}

type FormProps = {
  isEdit: boolean
  personas: Persona[]
  defaultValues?: Partial<BotFormData>
  onSubmit: (data: BotFormData) => void
  onDirtyChange?: (dirty: boolean) => void
  onValidChange?: (valid: boolean) => void
  /** 外部提供的 form（教學模式精靈：跨步驟共用同一份狀態）；不給則自建 */
  form?: UseFormReturn<BotFormData>
  /** 只渲染這些欄位；不給＝全部（快速模式 / 編輯模式） */
  fields?: BotFieldKey[]
}

function BotForm({ isEdit, personas, defaultValues, onSubmit, onDirtyChange, onValidChange, form, fields }: FormProps) {
  const ownForm = useForm<BotFormData>({
    defaultValues: { platform: 'line', modelType: '', personaId: '', ...defaultValues },
    shouldUnregister: true,
    mode: 'onChange',
  })
  const f = form ?? ownForm
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isDirty, isValid } } = f
  /** 欄位是否要顯示（fields 未指定＝全顯示） */
  const show = (k: BotFieldKey) => !fields || fields.includes(k)

  // 通知父層表單是否有變更
  useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty, onDirtyChange])

  // 通知父層表單驗證狀態
  useEffect(() => { onValidChange?.(isValid) }, [isValid, onValidChange])

  // 新增模式：Modal 開啟時立即觸發驗證，讓必填欄位顯示紅框
  useEffect(() => { if (!isEdit) trigger() }, [])
  const { noSpace, blockedHint } = useNoSpace()
  const platform = watch('platform')
  const modelType = watch('modelType')
  const [showToken, setShowToken] = useState(false)
  const [showChannelSecret, setShowChannelSecret] = useState(false)

  const { data: providers, isLoading: providersLoading } = useQuery<AiProvider[]>({
    queryKey: ['ai-providers'],
    queryFn: () => api.get<ApiResponse<AiProvider[]>>('/ai/providers').then(unwrap),
  })

  // Bot 模型只提供「使用者自帶金鑰」的供應商（與後台聊天一致；webhook 仍可 fallback 系統 key）
  const { data: myKeys } = useQuery<AiKey[]>({
    queryKey: ['ai-keys'],
    queryFn: fetchAiKeys,
  })
  const usableProviders = useMemo(
    () => new Set((myKeys ?? []).filter(k => k.isActive).map(k => k.providerId)),
    [myKeys],
  )

  // 資料載入後若尚未選模型，自動帶入第一個可用模型（限使用者有金鑰的供應商）
  useEffect(() => {
    if (!providers || modelType) return
    const first = providers.find(p => usableProviders.has(p.id) && p.models.length > 0)
    if (first) setValue('modelType', `${first.id}:${first.models[0].id}`, { shouldValidate: true })
  }, [providers, modelType, setValue, usableProviders])

  return (
    <form id="bot-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {(show('platform') || show('botName')) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {show('platform') && (
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">平台 <span className="text-red-400">*</span></label>
              <input type="hidden" {...register('platform', { required: true })} />
              <DropdownSelect
                value={platform}
                onChange={v => setValue('platform', v as BotPlatform, { shouldValidate: true, shouldDirty: true })}
                disabled={isEdit}
                options={[
                  { value: 'line', label: 'LINE' },
                  { value: 'discord', label: 'Discord' },
                ]}
              />
            </div>
          )}
          {show('botName') && (
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">Bot 名稱 <span className="text-red-400">*</span></label>
              <Input
                {...register('botName', { required: '請填寫 Bot 名稱', validate: v => v.trim().length > 0 || '不可全為空白' })}
                placeholder="例：客服小幫手"
                error={errors.botName?.message}
              />
            </div>
          )}
        </div>
      )}

      {show('botToken') && (
      <div>
        <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">
          Bot Token {isEdit && <span className="text-slate-300 dark:text-zinc-500">（加密保護，不回傳原值）</span>}
          {!isEdit && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
          <input
            {...noSpace(register('botToken', { required: isEdit ? false : '請填寫 Bot Token', validate: v => !v || v.trim().length > 0 || '不可全為空白' }))}
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
        {(blockedHint('botToken') ?? errors.botToken?.message) && (
          <p className="text-sm text-red-500 dark:text-red-400 mt-1">{blockedHint('botToken') ?? errors.botToken?.message}</p>
        )}
        <p className="text-sm text-slate-400 dark:text-zinc-400 mt-1">Token 將以 AES 加密儲存，前端僅顯示後 4 碼</p>
      </div>
      )}

      {show('channelSecret') && platform === 'line' && (
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
              {...noSpace(register('channelSecret', {
                validate: {
                  required: v => (isEdit || !!v) || 'Line 平台需要填入 Channel Secret',
                  noWhitespace: v => !v || v.trim().length > 0 || '不可全為空白',
                },
              }))}
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
          {(blockedHint('channelSecret') ?? errors.channelSecret?.message) && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">{blockedHint('channelSecret') ?? errors.channelSecret?.message}</p>
          )}
        </div>
      )}

      {(show('model') || show('persona')) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {show('model') && (
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">AI 模型 <span className="text-red-400">*</span></label>
              <input type="hidden" {...register('modelType', { required: '請選擇 AI 模型' })} />
              <ModelSelect
                value={modelType}
                onChange={v => setValue('modelType', v, { shouldValidate: true, shouldDirty: true })}
                providers={providers}
                loading={providersLoading}
                hasError={!!errors.modelType}
                usableProviders={usableProviders}
              />
              {errors.modelType && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.modelType.message}</p>}
            </div>
          )}
          {show('persona') && (
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">Persona</label>
              <input type="hidden" {...register('personaId')} />
              <DropdownSelect
                value={watch('personaId') ?? ''}
                onChange={v => setValue('personaId', v, { shouldDirty: true })}
                options={[
                  { value: '', label: '（不指定）' },
                  ...personas.map(p => ({ value: p.id, label: `${p.emoji ? p.emoji + ' ' : ''}${p.name}` })),
                ]}
              />
            </div>
          )}
        </div>
      )}

      {show('webhook') && (
      <div>
        <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">
          Webhook 基礎 URL
          <span className="text-slate-300 dark:text-zinc-500 ml-1">（選填）</span>
        </label>
        <Input
          {...noSpace(register('webhookBaseUrl', {
            validate: v => !v || /^https?:\/\/.+/.test(v.trim()) || '請輸入有效的 URL（需以 http:// 或 https:// 開頭）',
          }))}
          placeholder="例：https://api.yourdomain.com（留空使用系統預設）"
          error={blockedHint('webhookBaseUrl') ?? errors.webhookBaseUrl?.message}
        />
        <p className="text-sm text-slate-400 dark:text-zinc-400 mt-1">不同伺服器代管的 Bot 可各自指定，留空則共用後端預設 BaseUrl</p>
      </div>
      )}

      {(show('discordApplicationId') || show('discordPublicKey')) && platform === 'discord' && (
        <>
          {show('discordApplicationId') && (
          <div>
            <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">
              Discord Application ID <span className="text-red-400">*</span>
            </label>
            <Input
              {...noSpace(register('discordApplicationId', {
                validate: {
                  required: v => platform !== 'discord' || !!v || '請填寫 Discord Application ID',
                  noWhitespace: v => !v || v.trim().length > 0 || '不可全為空白',
                },
              }))}
              placeholder="Developer Portal → General Information → Application ID"
              error={blockedHint('discordApplicationId') ?? errors.discordApplicationId?.message}
            />
          </div>
          )}
          {show('discordPublicKey') && (
          <div>
            <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">
              Discord Public Key <span className="text-red-400">*</span>
            </label>
            <Input
              {...noSpace(register('discordPublicKey', {
                validate: {
                  required: v => platform !== 'discord' || !!v || '請填寫 Discord Public Key',
                  noWhitespace: v => !v || v.trim().length > 0 || '不可全為空白',
                },
              }))}
              placeholder="Developer Portal → General Information → Public Key（64 字元 hex）"
              error={blockedHint('discordPublicKey') ?? errors.discordPublicKey?.message}
            />
            <p className="text-sm text-slate-400 dark:text-zinc-400 mt-1">用於 Ed25519 簽名驗證，確保 Interactions 請求來自 Discord</p>
          </div>
          )}
        </>
      )}
    </form>
  )
}

// ─── BotSetupWizard（教學模式：分步引導 + 最後一步嵌入建立表單）─────────────

const linkCls = 'text-violet-500 hover:underline'

type WizardStep = {
  title: string
  /** 引導步驟內容 */
  body?: React.ReactNode
  /** 建立表單步驟上方提示 */
  intro?: string
  /** 本步驟內嵌的欄位 */
  fields?: BotFieldKey[]
  /** 是否為建立表單步驟（footer 顯示「建立 Bot」） */
  isForm?: boolean
}

/**
 * 各平台教學流程（含建立步驟）：
 * 1 取得憑證(內嵌憑證欄位) → 2 啟動後端/ngrok → 3 建立(設定欄位+按鈕) → 4 完成後續
 */
const wizardFlow: Record<BotPlatform, WizardStep[]> = {
  discord: [
    {
      title: '準備一：取得 Discord 憑證',
      fields: ['discordApplicationId', 'discordPublicKey', 'botToken'],
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li>前往 <a className={linkCls} href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Discord Developer Portal</a> → <b>New Application</b></li>
          <li><b>General Information</b>：複製 <b>Application ID</b> 與 <b>Public Key</b>（64 字元 hex）</li>
          <li><b>Bot</b> → <b>Reset Token</b> 複製 <b>Bot Token</b>（只顯示一次，請立刻存好）</li>
          <li><b>Bot</b> → 開啟 <b>Message Content Intent</b> 並儲存</li>
        </ul>
      ),
    },
    {
      title: '準備二：啟動後端與 ngrok',
      body: (
        <div className="space-y-2">
          <p>建立時系統會即時向 Discord 註冊指令，所以後端與 ngrok 必須先在線：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>用 Visual Studio 啟動後端（<span className="font-mono">https://localhost:44345</span>）</li>
            <li>啟動 ngrok 靜態 domain（含 <span className="font-mono">--host-header=rewrite</span>）</li>
          </ul>
          <p className="text-slate-400 dark:text-zinc-400">已有自己的公開網域（DNS 指向後端、具有效 HTTPS 憑證）可略過 ngrok，於下一步的「Webhook 基礎 URL」填入該網域即可。</p>
        </div>
      ),
    },
    {
      title: '建立 Bot',
      isForm: true,
      intro: '填入 Bot 名稱、選擇模型與 Persona，按「建立 Bot」（建立時會驗證憑證並自動註冊指令）。',
      fields: ['botName', 'model', 'persona', 'webhook'],
    },
    {
      title: '完成：建立後還要做這兩件事',
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li>後端會<b>自動註冊 <span className="font-mono">/chat</span></b>（卡片無紅色「指令無效」即成功）。</li>
          <li>到卡片<b>複製 Webhook URL</b> → 貼到 Discord 的 <b>Interactions Endpoint URL</b> 並 Save（會出現綠勾）。</li>
          <li>用卡片的<b>「複製邀請連結 / 開啟邀請」</b>把 Bot 邀請進伺服器，即可在頻道輸入 <span className="font-mono">/chat</span>。</li>
        </ul>
      ),
    },
  ],
  line: [
    {
      title: '準備一：建立 LINE Channel 並取得憑證',
      fields: ['channelSecret', 'botToken'],
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li>前往 <a className={linkCls} href="https://developers.line.biz/" target="_blank" rel="noreferrer">LINE Developers Console</a> → 建立 Provider → <b>Messaging API</b> Channel</li>
          <li><b>Basic settings</b>：複製 <b>Channel Secret</b></li>
          <li><b>Messaging API</b>：Issue 並複製長期有效的 <b>Channel Access Token</b>（即下方的 Bot Token）</li>
        </ul>
      ),
    },
    {
      title: '準備二：啟動後端與 ngrok',
      body: (
        <div className="space-y-2">
          <p>LINE 會 Verify Webhook，需先讓服務在線：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>用 Visual Studio 啟動後端（<span className="font-mono">https://localhost:44345</span>）</li>
            <li>啟動 ngrok 靜態 domain（含 <span className="font-mono">--host-header=rewrite</span>）</li>
          </ul>
          <p className="text-slate-400 dark:text-zinc-400">已有自己的公開網域（DNS 指向後端、具有效 HTTPS 憑證）可略過 ngrok，於下一步的「Webhook 基礎 URL」填入該網域即可。</p>
        </div>
      ),
    },
    {
      title: '建立 Bot',
      isForm: true,
      intro: '填入 Bot 名稱、選擇模型與 Persona，按「建立 Bot」（建立時會驗證 LINE 憑證）。',
      fields: ['botName', 'model', 'persona', 'webhook'],
    },
    {
      title: '完成：建立後還要做這兩件事',
      body: (
        <ul className="list-disc pl-5 space-y-1">
          <li>到卡片<b>複製 Webhook URL</b> → 貼到 LINE Console 的 <b>Webhook URL</b>，開啟 <b>Use webhook</b> 並 Verify。</li>
          <li>到 <a className={linkCls} href="https://manager.line.biz/" target="_blank" rel="noreferrer">LINE OA Manager</a> → 回應設定：<b>聊天/自動回應關閉、Webhook 開啟</b>。</li>
          <li>加 Bot 好友傳訊息測試，後台對話監控頁可看到紀錄。</li>
        </ul>
      ),
    },
  ],
}

function BotSetupWizard({ isOpen, onClose, personas, onSubmit, isMutating, created }: {
  isOpen: boolean
  onClose: () => void
  personas: Persona[]
  onSubmit: (data: BotFormData) => void
  isMutating: boolean
  /** 父層在建立成功時設 true → 精靈自動前進到「完成後續」步驟 */
  created: boolean
}) {
  const [platform, setPlatform] = useState<BotPlatform | null>(null)
  const [step, setStep] = useState(0)

  // 表單狀態提升到精靈層：跨步驟共用同一份資料（shouldUnregister:false 讓非當前步驟的欄位保留值）
  const form = useForm<BotFormData>({
    defaultValues: { platform: 'line', modelType: '', personaId: '' },
    mode: 'onChange',
    shouldUnregister: false,
  })
  const { reset } = form

  // 每次開關都重置回平台選擇與表單
  useEffect(() => {
    if (!isOpen) {
      setPlatform(null)
      setStep(0)
      reset({ platform: 'line', modelType: '', personaId: '' })
    }
  }, [isOpen, reset])

  // 建立成功後自動前進到建立步驟之後的「完成後續」步驟
  useEffect(() => {
    if (!created || !platform) return
    const f = wizardFlow[platform]
    const formIdx = f.findIndex(s => s.isForm)
    if (formIdx >= 0 && formIdx < f.length - 1) setStep(formIdx + 1)
  }, [created, platform])

  if (!isOpen) return null

  // 前置步驟：選平台
  if (!platform) {
    return (
      <Modal isOpen onClose={onClose} title="新增 Bot — 教學模式" description="選擇平台，一步步引導你完成部署" size="md">
        <div className="grid grid-cols-2 gap-3">
          {(['line', 'discord'] as BotPlatform[]).map(p => (
            <button
              key={p}
              onClick={() => { setPlatform(p); setStep(0); form.setValue('platform', p) }}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-violet-400 hover:bg-violet-50/40 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
            >
              <PlatformIcon platform={p} className="w-12 h-12" />
              <span className="font-semibold text-slate-700 dark:text-zinc-200">{p === 'line' ? 'LINE' : 'Discord'}</span>
            </button>
          ))}
        </div>
      </Modal>
    )
  }

  const flow = wizardFlow[platform]
  const total = flow.length
  const current = flow[step]
  const isFormStep = !!current.isForm
  const isLast = step === flow.length - 1
  const stepFields = current.fields ?? []
  const goBack = () => (step === 0 ? setPlatform(null) : setStep(s => s - 1))
  // 下一步前先驗證本步驟欄位，避免把空白憑證帶到下一步
  const goNext = async () => {
    const names = stepFields.map(k => FIELD_TO_NAME[k])
    const ok = names.length === 0 ? true : await form.trigger(names)
    if (ok) setStep(s => Math.min(s + 1, flow.length - 1))
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${platform === 'line' ? 'LINE' : 'Discord'} 部署教學 — 步驟 ${step + 1} / ${total}`}
      size="md"
      footer={
        <div className="flex w-full items-center justify-between">
          {/* 建立完成的最後一步不提供「上一步」，避免重複建立 */}
          {isLast ? <span /> : <Button variant="ghost" onClick={goBack}>上一步</Button>}
          {isFormStep
            ? <Button form="bot-form" type="submit" loading={isMutating}>建立 Bot</Button>
            : isLast
              ? <Button onClick={onClose}>完成</Button>
              : <Button onClick={goNext}>下一步</Button>}
        </div>
      }
    >
      {/* 進度條 */}
      <div className="flex gap-1.5 mb-5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-violet-500' : 'bg-slate-200 dark:bg-zinc-700'}`} />
        ))}
      </div>

      {/* 建立步驟顯示 intro 提示；其餘步驟顯示標題＋引導內容 */}
      {isFormStep ? (
        <p className="text-sm text-slate-400 dark:text-zinc-400 mb-3">{current.intro}</p>
      ) : (
        <div className="mb-4">
          <h4 className="text-base font-semibold text-slate-800 dark:text-zinc-100 mb-2">{current.title}</h4>
          <div className="text-sm text-slate-600 dark:text-zinc-300">{current.body}</div>
        </div>
      )}

      {/* 內嵌欄位：取得對應憑證的那一步就地填入；表單狀態跨步驟共用 */}
      <BotForm
        isEdit={false}
        personas={personas}
        defaultValues={{ platform }}
        onSubmit={onSubmit}
        form={form}
        fields={stepFields}
      />
    </Modal>
  )
}
