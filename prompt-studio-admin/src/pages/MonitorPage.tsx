import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { unwrap } from '../lib/api'
import type { ApiResponse } from '../types/api'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

type Platform = 'all' | 'line' | 'discord'

type ExternalMessageItem = {
  id: string
  platform: string
  botName: string
  externalUserId: string
  externalChannelId?: string
  role: string
  contentPreview: string
  tokensIn: number
  tokensOut: number
  createdAt: string
}

type PagedResponse<T> = {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

const platformColor: Record<string, 'green' | 'blue' | 'violet'> = {
  line: 'green', discord: 'blue', web: 'violet',
}

export default function MonitorPage() {
  const [platform, setPlatform] = useState<Platform>('all')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery<PagedResponse<ExternalMessageItem>>({
    queryKey: ['monitor-messages', platform, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '50' })
      if (platform !== 'all') params.set('platform', platform)
      return api.get<ApiResponse<PagedResponse<ExternalMessageItem>>>(`/monitor/messages?${params}`).then(unwrap)
    },
    refetchInterval: 30_000,
  })

  const items = data?.items ?? []
  const totalCount = data?.totalCount ?? 0

  return (
    <div className="h-full overflow-y-auto"><div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">對話監控</h2>
          <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">外部平台的使用者對話記錄</p>
        </div>
        <div className="text-sm text-slate-400 dark:text-zinc-400">
          共 {totalCount} 則訊息
        </div>
      </div>

      {/* 平台篩選 */}
      <div className="flex gap-2 mb-5">
        {(['all', 'line', 'discord'] as Platform[]).map(p => (
          <button
            key={p}
            onClick={() => { setPlatform(p); setPage(1) }}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${
              platform === p
                ? 'bg-violet-500 text-white'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            {p === 'all' ? '全部' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 py-4">
          <Spinner size="sm" /> 載入中...
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
          <p className="text-base">載入監控資料失敗</p>
          <button onClick={() => refetch()} className="text-sm text-violet-400 hover:text-violet-300">重新載入</button>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <EmptyState title="此平台尚無對話記錄" description="外部 Bot 收到訊息後會顯示在此" />
      )}

      {!isLoading && items.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {items.map((msg, i) => (
            <div
              key={msg.id}
              className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${
                i < items.length - 1 ? 'border-b border-slate-100 dark:border-zinc-700/25' : ''
              }`}
            >
              <div className="flex-shrink-0 pt-0.5">
                <Badge color={platformColor[msg.platform] ?? 'violet'}>{msg.platform}</Badge>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">{msg.botName}</span>
                  <span className="text-sm text-slate-400 dark:text-zinc-400">·</span>
                  <span className="text-sm text-slate-400 dark:text-zinc-400 font-mono">{msg.externalUserId}</span>
                  <span className={`text-sm px-1.5 py-0.5 rounded ${msg.role === 'user' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400' : 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'}`}>
                    {msg.role === 'user' ? '使用者' : 'AI'}
                  </span>
                </div>
                <p
                  onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                  className={`text-base text-slate-700 dark:text-zinc-200 cursor-pointer select-text ${expandedId === msg.id ? 'whitespace-pre-wrap break-words' : 'truncate'}`}
                >
                  {msg.contentPreview}
                </p>
                {expandedId !== msg.id && (msg.contentPreview?.length ?? 0) > 60 && (
                  <button
                    onClick={() => setExpandedId(msg.id)}
                    className="text-sm text-violet-500 hover:text-violet-400 mt-0.5"
                  >
                    展開全文
                  </button>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-slate-400 dark:text-zinc-400">{msg.tokensIn + msg.tokensOut} tokens</p>
                <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">{new Date(msg.createdAt).toLocaleString('zh-TW')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分頁 */}
      {data && data.totalCount > data.pageSize && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-400 dark:text-zinc-400">
            第 {data.page} 頁，共 {Math.ceil(data.totalCount / data.pageSize)} 頁
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              上一頁
            </button>
            <button
              disabled={!data.hasNextPage}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div></div>
  )
}
