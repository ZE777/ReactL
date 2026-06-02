import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import Spinner from '../components/ui/Spinner'

type TokenStatsByDate = {
  date: string          // "yyyy-MM-dd"
  tokensIn: number
  tokensOut: number
  requestCount: number
}

type TokenStatsByModel = {
  modelType: string
  tokensIn: number
  tokensOut: number
  requestCount: number
}

type StatsSummary = {
  totalRequests: number
  totalTokensIn: number
  totalTokensOut: number
  byDate: TokenStatsByDate[]
  byModel: TokenStatsByModel[]
}

type StatCardProps = { label: string; value: string; sub?: string; color?: 'violet' | 'green' | 'blue' | 'amber' }

function StatCard({ label, value, sub, color = 'violet' }: StatCardProps) {
  const dotColor = { violet: 'bg-violet-500', green: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500' }
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${dotColor[color]}`} />
        <p className="text-sm text-slate-400 dark:text-zinc-400">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-slate-800 dark:text-zinc-100">{value}</p>
      {sub && <p className="text-sm text-slate-400 dark:text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export default function StatsPage() {
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d')

  const { data: stats, isLoading, error, refetch } = useQuery<StatsSummary>({
    queryKey: ['token-stats'],
    queryFn: () => api.get<ApiResponse<StatsSummary>>('/monitor/stats/tokens').then(unwrap),
  })

  /** 依 range 過濾 byDate（後端不支援時在前端篩選） */
  const allByDate = stats?.byDate ?? []
  const byDate = (() => {
    if (range === 'all') return allByDate
    const days = range === '7d' ? 7 : 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return allByDate.filter(d => new Date(d.date) >= cutoff)
  })()
  const byModel = stats?.byModel ?? []
  const maxTokens = byDate.length > 0 ? Math.max(...byDate.map(d => d.tokensIn + d.tokensOut)) : 1

  return (
    <div className="h-full overflow-y-auto"><div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">Token 統計</h2>
          <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">近期用量概覽</p>
        </div>
        {/* 時間範圍篩選 */}
        <div className="flex gap-1">
          {(['7d', '30d', 'all'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                range === r
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {r === '7d' ? '近 7 天' : r === '30d' ? '近 30 天' : '全部'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 py-4">
          <Spinner size="sm" /> 載入中...
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <p className="text-base">載入統計資料失敗</p>
          <button onClick={() => refetch()} className="text-sm text-violet-400 hover:text-violet-300">重新載入</button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* 摘要卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="總請求次數"
              value={String(stats?.totalRequests ?? 0)}
              sub="所有對話"
              color="amber"
            />
            <StatCard
              label="輸入 Tokens"
              value={formatTokens(stats?.totalTokensIn ?? 0)}
              sub="Prompt 用量"
              color="violet"
            />
            <StatCard
              label="輸出 Tokens"
              value={formatTokens(stats?.totalTokensOut ?? 0)}
              sub="生成用量"
              color="green"
            />
            <StatCard
              label="Token 總計"
              value={formatTokens((stats?.totalTokensIn ?? 0) + (stats?.totalTokensOut ?? 0))}
              sub="輸入 + 輸出"
              color="blue"
            />
          </div>

          {/* 每日趨勢圖 */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-medium text-slate-700 dark:text-zinc-200">每日用量趨勢</p>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />輸入</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />輸出</span>
              </div>
            </div>
            {byDate.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-zinc-400 py-8 text-center">尚無用量記錄</p>
            ) : (
              <div className="flex items-end gap-1.5 h-36">
                {byDate.map(d => {
                  const total = d.tokensIn + d.tokensOut
                  const totalH = (total / maxTokens) * 100
                  const inH = total > 0 ? (d.tokensIn / total) * totalH : 0
                  const label = total >= 1000 ? `${(total / 1000).toFixed(1)}K` : String(total)
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-1 group relative"
                      title={`${d.date}\n輸入：${d.tokensIn.toLocaleString()}\n輸出：${d.tokensOut.toLocaleString()}\n合計：${total.toLocaleString()}`}
                    >
                      {/* hover 數值標籤 */}
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {label}
                      </span>
                      <div className="w-full flex flex-col justify-end gap-px" style={{ height: '96px' }}>
                        <div className="w-full bg-emerald-400/70 dark:bg-emerald-500/50 rounded-sm transition-opacity group-hover:opacity-100 opacity-80" style={{ height: `${totalH - inH}%` }} />
                        <div className="w-full bg-violet-400/70 dark:bg-violet-500/50 rounded-sm transition-opacity group-hover:opacity-100 opacity-80" style={{ height: `${inH}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-400">{d.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 模型分布 */}
          {byModel.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5">
              <p className="text-base font-medium text-slate-700 dark:text-zinc-200 mb-4">模型用量分布</p>
              <div className="flex flex-col gap-3">
                {byModel.map(m => {
                  const total = byModel.reduce((acc, x) => acc + x.tokensIn + x.tokensOut, 0) || 1
                  const pct = Math.round(((m.tokensIn + m.tokensOut) / total) * 100)
                  return (
                    <div key={m.modelType} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-slate-400 dark:text-zinc-400 flex-shrink-0 truncate">{m.modelType}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-sm text-slate-400 dark:text-zinc-400 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div></div>
  )
}
