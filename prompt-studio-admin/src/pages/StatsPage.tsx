import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import PageLoading from '../components/ui/PageLoading'
import PageError from '../components/ui/PageError'
import EmptyState from '../components/ui/EmptyState'
import Tag from '../components/ui/Tag'
import SegmentedControl from '../components/ui/SegmentedControl'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'

type TokenStatsByDate = {
  date: string
  tokensIn: number
  tokensOut: number
  requestCount: number
}

type TokenStatsBySource = {
  source: string
  tokensIn: number
  tokensOut: number
  requestCount: number
}

type TokenStatsByModel = {
  modelType: string
  tokensIn: number
  tokensOut: number
  requestCount: number
  bySource: TokenStatsBySource[]
}

type StatsSummary = {
  totalRequests: number
  totalTokensIn: number
  totalTokensOut: number
  byDate: TokenStatsByDate[]
  byModel: TokenStatsByModel[]
  bySource: TokenStatsBySource[]
}

type AiModelItem = { id: string; displayName: string }
type AiProvider = { id: string; displayName: string; isConfigured: boolean; models: AiModelItem[] }

const PROVIDER_COLORS: Record<string, string> = {
  groq:       'bg-violet-500',
  mistral:    'bg-blue-500',
  cerebras:   'bg-emerald-500',
  sambanova:  'bg-amber-500',
}

// 每個來源的代表色：內部（admin/web）用冷色調，外部（line/discord）用暖綠/靛藍
const SOURCE_COLORS: Record<string, { bg: string; text: string; label: string; isExternal: boolean }> = {
  admin:   { bg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', label: 'Admin',   isExternal: false },
  web:     { bg: 'bg-blue-500',   text: 'text-blue-600 dark:text-blue-400',     label: 'Web',     isExternal: false },
  line:    { bg: 'bg-emerald-500',text: 'text-emerald-600 dark:text-emerald-400',label: 'LINE',   isExternal: true  },
  discord: { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', label: 'Discord', isExternal: true  },
}

type StatCardProps = { label: string; value: string; sub?: string; color?: 'violet' | 'green' | 'blue' | 'amber' }

function StatCard({ label, value, sub, color = 'violet' }: StatCardProps) {
  const dotColor = { violet: 'bg-violet-500', green: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500' }
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${dotColor[color]}`} />
        <p className="text-sm text-slate-400 dark:text-zinc-400">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-slate-800 dark:text-zinc-100">{value}</p>
      {sub && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-1">{sub}</p>}
    </Card>
  )
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

const SOURCE_OPTIONS = [
  { value: '', label: '全部來源' },
  { value: 'admin', label: 'Admin' },
  { value: 'web', label: 'Web' },
  { value: 'line', label: 'Line' },
  { value: 'discord', label: 'Discord' },
]

const RANGE_OPTIONS = [
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: 'month', label: '本月' },
  { value: 'all', label: '全部' },
]

const MODEL_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500',
]

export default function StatsPage() {
  const [range, setRange] = useState<'7d' | '30d' | 'month' | 'all'>('30d')
  const [source, setSource] = useState('')
  const [hiddenModels, setHiddenModels] = useState<Set<string>>(new Set())
  const [showZeroUsage, setShowZeroUsage] = useState(false)

  const { data: stats, isLoading, isFetching, error, refetch } = useQuery<StatsSummary>({
    queryKey: ['token-stats', range, source],
    queryFn: () => {
      const params = new URLSearchParams()
      if (source) params.set('source', source)
      if (range !== 'all') {
        const to = new Date()
        const from = new Date()
        if (range === 'month') {
          from.setDate(1)
          from.setHours(0, 0, 0, 0)
        } else {
          from.setDate(from.getDate() - (range === '7d' ? 7 : 30))
        }
        params.set('from', from.toISOString())
        params.set('to', to.toISOString())
      }
      const qs = params.toString()
      return api.get<ApiResponse<StatsSummary>>(`/monitor/stats/tokens${qs ? `?${qs}` : ''}`).then(unwrap)
    },
    staleTime: 60 * 1000,
  })

  const { data: providers } = useQuery<AiProvider[]>({
    queryKey: ['ai-providers'],
    queryFn: () => api.get<ApiResponse<AiProvider[]>>('/ai/providers').then(unwrap),
    staleTime: 5 * 60 * 1000,
  })

  const byDate = stats?.byDate ?? []

  // FIX: 直接依賴 stats?.byModel，避免 byModel 每次 render 建新 reference 導致強制重算
  const allModels = useMemo(() => {
    if (!providers) return (stats?.byModel ?? []).map((m, i) => ({
      modelType: m.modelType,
      displayName: m.modelType.split(':')[1] ?? m.modelType,
      providerId: m.modelType.split(':')[0] ?? '',
      providerName: m.modelType.split(':')[0] ?? '',
      color: MODEL_COLORS[i % MODEL_COLORS.length],
    }))
    return providers.flatMap(p =>
      p.models.map((m, i) => ({
        modelType: `${p.id}:${m.id}`,
        displayName: m.displayName,
        providerId: p.id,
        providerName: p.displayName,
        color: PROVIDER_COLORS[p.id] ?? MODEL_COLORS[i % MODEL_COLORS.length],
      }))
    )
  }, [providers, stats?.byModel])

  const modelStats = useMemo(() => {
    const statsMap = new Map((stats?.byModel ?? []).map(m => [m.modelType, m]))
    return allModels.map(m => ({
      ...m,
      tokensIn:     statsMap.get(m.modelType)?.tokensIn     ?? 0,
      tokensOut:    statsMap.get(m.modelType)?.tokensOut    ?? 0,
      requestCount: statsMap.get(m.modelType)?.requestCount ?? 0,
    }))
  }, [allModels, stats?.byModel])

  const filteredModelStats = useMemo(
    () => modelStats.filter(m => !hiddenModels.has(m.modelType)),
    [modelStats, hiddenModels],
  )

  // FIX: totalFiltered 提到 map 外避免 O(N²)，且用 filteredModelStats 為分母讓加總等於 100%
  const filteredTotalTokens = useMemo(
    () => filteredModelStats.reduce((acc, x) => acc + x.tokensIn + x.tokensOut, 0) || 1,
    [filteredModelStats],
  )

  // 預設隱藏零用量模型，可切換顯示
  const displayModelStats = useMemo(
    () => showZeroUsage ? filteredModelStats : filteredModelStats.filter(m => m.requestCount > 0),
    [filteredModelStats, showZeroUsage],
  )

  const hasZeroUsageModels = useMemo(
    () => filteredModelStats.some(m => m.requestCount === 0),
    [filteredModelStats],
  )

  const maxTokens = byDate.length > 0 ? Math.max(...byDate.map(d => d.tokensIn + d.tokensOut)) : 1

  const toggleModel = useCallback((modelType: string) => {
    setHiddenModels(prev => {
      const next = new Set(prev)
      if (next.has(modelType)) next.delete(modelType)
      else next.add(modelType)
      return next
    })
  }, [])

  // 動態 subtitle
  const rangeLabel = range === '7d' ? '近 7 天' : range === '30d' ? '近 30 天' : range === 'month' ? '本月' : '全部時間'
  const sourceLabel = source ? ` · ${SOURCE_OPTIONS.find(o => o.value === source)?.label ?? source}` : ''

  if (isLoading) return <PageLoading text="載入統計資料" />
  if (error) return <PageError title="載入統計資料失敗" onRetry={refetch} />

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8">

        {/* 頁首 */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <PageHeader title="Token 統計" subtitle={`${rangeLabel}${sourceLabel} 用量概覽`} />
          <div className="flex flex-wrap gap-3 items-end">
            <SegmentedControl label="來源" options={SOURCE_OPTIONS} value={source} onChange={setSource} />
            <SegmentedControl
              label="時間"
              options={RANGE_OPTIONS}
              value={range}
              onChange={v => setRange(v as typeof range)}
              variant="accent"
            />
            {/* 刷新按鈕 */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <svg className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isFetching ? '更新中' : '刷新'}
            </button>
          </div>
        </div>

        {/* FIX: isFetching 期間整體內容加淡出過渡，明確傳達更新中狀態 */}
        <div className={`transition-opacity duration-200 ${isFetching ? 'opacity-60 pointer-events-none' : ''}`}>

          {/* 摘要卡片：Token 總計優先，符合 F 型閱讀動線 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">用量統計</span>
            <span
              title="此為系統自行記錄的 Token 用量，依據每次 API 呼叫回傳的 usage 欄位累計。可能與各 AI 提供商官方帳單數字有所出入，如需精確核對請至各提供商的 Dashboard 查詢。"
              className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 text-[10px] cursor-help select-none"
            >
              ?
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-500">數值為系統自行統計，可能與官方帳單有落差</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Token 總計" value={formatTokens((stats?.totalTokensIn ?? 0) + (stats?.totalTokensOut ?? 0))} sub="輸入 + 輸出" color="blue" />
            <StatCard label="輸入 Tokens" value={formatTokens(stats?.totalTokensIn ?? 0)} sub="Prompt 用量" color="violet" />
            <StatCard label="輸出 Tokens" value={formatTokens(stats?.totalTokensOut ?? 0)} sub="生成用量" color="green" />
            <StatCard label="總請求次數" value={String(stats?.totalRequests ?? 0)} sub="所有對話" color="amber" />
          </div>

          {/* 模型選擇器 */}
          {allModels.length > 0 && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-sm text-slate-400 dark:text-zinc-400 flex-shrink-0">顯示模型：</span>
              {allModels.map(model => {
                const hidden = hiddenModels.has(model.modelType)
                const label = model.displayName || model.modelType.split(':')[1] || model.modelType
                return (
                  <button
                    key={model.modelType}
                    onClick={() => toggleModel(model.modelType)}
                    title={`${model.providerName} / ${model.displayName || model.modelType}`}
                    aria-pressed={!hidden}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-all cursor-pointer ${
                      hidden
                        ? 'border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500'
                        : 'border-transparent bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${hidden ? 'bg-slate-300 dark:bg-zinc-600' : model.color}`} />
                    <span className="text-slate-400 dark:text-zinc-500">{model.providerName}</span>
                    <span className="text-slate-300 dark:text-zinc-600">/</span>
                    {label}
                  </button>
                )
              })}
              {/* FIX: 互斥顯示，部分選取時只顯示「全部顯示」 */}
              {hiddenModels.size === 0 ? (
                <button
                  onClick={() => setHiddenModels(new Set(allModels.map(m => m.modelType)))}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border border-slate-300 dark:border-zinc-600 text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  全不選
                </button>
              ) : (
                <button
                  onClick={() => setHiddenModels(new Set())}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border border-violet-400/60 dark:border-violet-600/60 bg-violet-50 dark:bg-violet-900/20 text-violet-500 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all cursor-pointer"
                >
                  全部顯示
                </button>
              )}
            </div>
          )}

          {/* 每日趨勢圖 */}
          <Card className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-medium text-slate-700 dark:text-zinc-200">每日用量趨勢</p>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />輸入</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />輸出</span>
              </div>
            </div>
            {byDate.length === 0 ? (
              <EmptyState title="此條件下無用量記錄" description={source ? `來源「${SOURCE_OPTIONS.find(o => o.value === source)?.label}」在選定時間範圍內沒有資料` : undefined} />
            ) : (
              <div className="flex items-end gap-1.5 h-36">
                {byDate.map(d => {
                  const total = d.tokensIn + d.tokensOut
                  const totalH = (total / maxTokens) * 100
                  const inH = total > 0 ? (d.tokensIn / total) * totalH : 0
                  const label = total >= 1000 ? `${(total / 1000).toFixed(1)}K` : String(total)
                  // FIX: ≤20 天時靜態顯示數值，>20 天避免擁擠只在 hover 時顯示
                  const showStaticLabel = byDate.length <= 20
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-1 group relative"
                    >
                      <span className={`absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 dark:text-zinc-400 whitespace-nowrap pointer-events-none transition-opacity ${
                        showStaticLabel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        {label}
                      </span>
                      <div
                        className="w-full flex flex-col justify-end gap-px"
                        style={{ height: '96px' }}
                        title={`${d.date}\n輸入：${d.tokensIn.toLocaleString()}\n輸出：${d.tokensOut.toLocaleString()}\n合計：${total.toLocaleString()}`}
                      >
                        <div className="w-full bg-emerald-400/70 dark:bg-emerald-500/50 rounded-sm opacity-80 group-hover:opacity-100 transition-opacity" style={{ height: `${totalH - inH}%` }} />
                        <div className="w-full bg-violet-400/70 dark:bg-violet-500/50 rounded-sm opacity-80 group-hover:opacity-100 transition-opacity" style={{ height: `${inH}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-400">{d.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* 來源分布 */}
          {(stats?.bySource ?? []).length > 0 && (
            <Card className="p-5 mb-6">
              <p className="text-base font-medium text-slate-700 dark:text-zinc-200 mb-4">來源分布</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['admin', 'web', 'line', 'discord'] as const).map(src => {
                  const s = SOURCE_COLORS[src]
                  const row = (stats?.bySource ?? []).find(b => b.source === src)
                  const total = (row?.tokensIn ?? 0) + (row?.tokensOut ?? 0)
                  return (
                    <div key={src} className="rounded-lg border border-slate-100 dark:border-zinc-800 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.bg}`} />
                        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                          {s.label}
                          {s.isExternal && (
                            <Tag className="ml-1">外部</Tag>
                          )}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-slate-800 dark:text-zinc-100">{formatTokens(total)}</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{row?.requestCount ?? 0} 次請求</p>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* 模型用量明細 */}
          {filteredModelStats.length === 0 && allModels.length > 0 ? (
            <Card>
              <EmptyState title="所有模型已隱藏" description="點選上方模型名稱以顯示用量明細" />
            </Card>
          ) : displayModelStats.length > 0 ? (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-medium text-slate-700 dark:text-zinc-200">模型用量明細</p>
                {hasZeroUsageModels && (
                  <button
                    onClick={() => setShowZeroUsage(v => !v)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      showZeroUsage
                        ? 'border-violet-400/60 text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {showZeroUsage ? '隱藏零用量' : '顯示零用量'}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-5">
                {displayModelStats.map(m => {
                  const total = m.tokensIn + m.tokensOut
                  const pct = Math.round((total / filteredTotalTokens) * 100)
                  // 從 API 回傳的 bySource 取得此模型的來源細分
                  const modelBySource = (stats?.byModel ?? []).find(b => b.modelType === m.modelType)?.bySource ?? []
                  return (
                    <div key={m.modelType}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${m.color}`} />
                          <div>
                            <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                              {m.displayName || m.modelType.split(':')[1] || m.modelType}
                            </span>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono">{m.modelType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 dark:text-zinc-400">
                          <span title="輸入 Tokens">↑ {formatTokens(m.tokensIn)}</span>
                          <span title="輸出 Tokens">↓ {formatTokens(m.tokensOut)}</span>
                          <span>{m.requestCount.toLocaleString()} 次</span>
                          <span className="w-9 text-right font-semibold text-slate-600 dark:text-zinc-300">{pct}%</span>
                        </div>
                      </div>
                      {/* 主進度條 */}
                      <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                        <div className={`h-full rounded-full transition-all duration-500 ${m.color}`} style={{ width: `${pct}%` }} />
                      </div>
                      {/* 來源細分（有資料才顯示）*/}
                      {modelBySource.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pl-4">
                          {modelBySource.map(s => {
                            const sc = SOURCE_COLORS[s.source]
                            if (!sc) return null
                            return (
                              <span key={s.source} className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500">
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.bg}`} />
                                <span className={sc.text}>{sc.label}</span>
                                {sc.isExternal && <span className="text-[10px] text-slate-300 dark:text-zinc-600">外部</span>}
                                <span>{formatTokens(s.tokensIn + s.tokensOut)}</span>
                                <span className="text-slate-300 dark:text-zinc-700">·</span>
                                <span>{s.requestCount} 次</span>
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ) : null}

        </div>
      </div>
    </div>
  )
}
