import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { PersonaVersion } from '../types/persona'
import type { ApiError, ApiResponse } from '../types/api'
import api, { unwrap } from '../lib/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import PageLoading from '../components/ui/PageLoading'
import PageError from '../components/ui/PageError'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'

export default function PersonaVersionsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push: toast } = useToast()
  const [pendingRestore, setPendingRestore] = useState<PersonaVersion | null>(null)

  const { data: versions, isLoading, error, refetch } = useQuery<PersonaVersion[]>({
    queryKey: ['persona-versions', id],
    queryFn: () => api.get<ApiResponse<PersonaVersion[]>>(`/personas/${id}/versions`).then(unwrap),
    enabled: !!id,
  })

  const restore = useMutation({
    // M6: 傳完整 version 物件，避免 onSuccess 讀 stale closure 的 versions 陣列
    mutationFn: (version: PersonaVersion) =>
      api.post<ApiResponse<unknown>>(`/personas/${id}/versions/${version.id}/rollback`).then(unwrap),
    onSuccess: (_, version) => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
      queryClient.invalidateQueries({ queryKey: ['persona-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['persona-versions', id] })
      toast('success', `已還原至版本 v${version.version}，正在返回編輯頁…`)
      setPendingRestore(null)
      navigate('/personas')
    },
    onError: (e: AxiosError<ApiError>) => {
      toast('error', e.response?.data?.detail ?? '還原失敗，請稍後再試')
      setPendingRestore(null)
    },
  })

  if (isLoading) return <PageLoading text="載入版本歷史" />
  if (error) return <PageError title="載入版本歷史失敗" onRetry={refetch} />

  const maxVersion = versions?.length ? Math.max(...versions.map(v => v.version)) : 0

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
          <Link
            to="/personas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-400 dark:border-zinc-600 bg-slate-300/80 dark:bg-zinc-400/30 hover:bg-slate-400 dark:hover:bg-zinc-500 text-slate-800 dark:text-white transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回 Personas
          </Link>
        </div>

        <div className="p-6 lg:p-8 max-w-6xl mx-auto flex flex-col gap-5">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-5 py-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              每次儲存 Persona 時自動建立版本快照，您可以在此回滾至任意歷史版本。
            </p>
          </div>

          {!versions?.length ? (
            <EmptyState title="尚無版本記錄" description="儲存 Persona 後會自動建立版本快照" />
          ) : (
            <div className="flex flex-col gap-3">
              {versions.map(v => (
                <VersionCard
                  key={v.id}
                  version={v}
                  isCurrent={v.version === maxVersion}
                  isRestoring={restore.isPending && restore.variables?.id === v.id}
                  onRestore={() => setPendingRestore(v)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={pendingRestore !== null}
        onClose={restore.isPending ? () => {} : () => setPendingRestore(null)}
        title="確認還原版本"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" disabled={restore.isPending} onClick={() => setPendingRestore(null)}>
              取消
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={restore.isPending}
              onClick={() => { if (pendingRestore) restore.mutate(pendingRestore) }}
            >
              確認還原
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              還原至 v{pendingRestore?.version} 後，此 Persona 的所有 Bot 將立即套用舊版本內容。
            </p>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            目前版本的內容將自動保留為新的版本快照，您可以隨時再次回滾。
          </p>
        </div>
      </Modal>
    </>
  )
}

type CardProps = {
  version: PersonaVersion
  isCurrent: boolean
  isRestoring: boolean
  onRestore: () => void
}

function VersionCard({ version, isCurrent, isRestoring, onRestore }: CardProps) {
  const [expanded, setExpanded] = useState(false)
  const dateStr = useMemo(() =>
    new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(version.createdAt)),
  [version.createdAt])

  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-xl flex flex-col ${
      isCurrent
        ? 'border-violet-500/40 ring-1 ring-violet-500/20'
        : 'border-slate-200 dark:border-zinc-800'
    }`}>
      {/* 版本標頭 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className={`text-base font-semibold ${isCurrent ? 'text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-zinc-200'}`}>
            v{version.version}
          </span>
          {isCurrent && (
            <span className="px-2 py-0.5 rounded-full text-sm font-medium bg-violet-300/70 dark:bg-violet-600 text-violet-800 dark:text-white">
              目前版本
            </span>
          )}
          {version.changeNote && (
            <span className="text-sm text-slate-400 dark:text-zinc-400">{version.changeNote}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 dark:text-zinc-400">{dateStr}</span>
          {!isCurrent && (
            <Button variant="secondary" size="sm" loading={isRestoring} onClick={onRestore}>
              還原此版本
            </Button>
          )}
        </div>
      </div>

      {/* Prompt 內容 */}
      {version.systemPrompt && (
        <div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          className="px-6 py-5 cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 rounded-b-xl"
          onClick={() => setExpanded(v => !v)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v) } }}
          title={expanded ? '點擊收起' : '點擊展開完整 Prompt'}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">System Prompt</p>
            <span className="text-sm text-violet-500 opacity-60 group-hover:opacity-100 transition-opacity">
              {expanded ? '收起 ↑' : '展開 ↓'}
            </span>
          </div>
          <p className={`text-sm text-slate-600 dark:text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed ${expanded ? '' : 'line-clamp-6'}`}>
            {version.systemPrompt}
          </p>
        </div>
      )}
    </div>
  )
}
