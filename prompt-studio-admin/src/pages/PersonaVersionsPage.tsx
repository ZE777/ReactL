import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { ApiError, ApiResponse } from '../types/api'
import api, { unwrap } from '../lib/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'

type BackendVersion = {
  id: string
  version: number
  systemPrompt: string
  changeNote?: string
  createdAt: string
}

export default function PersonaVersionsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push: toast } = useToast()
  const [pendingRestore, setPendingRestore] = useState<BackendVersion | null>(null)

  const { data: versions, isLoading, error, refetch } = useQuery<BackendVersion[]>({
    queryKey: ['persona-versions', id],
    queryFn: () => api.get<ApiResponse<BackendVersion[]>>(`/personas/${id}/versions`).then(unwrap),
    enabled: !!id,
  })

  const restore = useMutation({
    mutationFn: (versionId: string) =>
      api.post<ApiResponse<unknown>>(`/personas/${id}/versions/${versionId}/rollback`).then(unwrap),
    onSuccess: (_, versionId) => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
      queryClient.invalidateQueries({ queryKey: ['personas', id] })
      queryClient.invalidateQueries({ queryKey: ['persona-versions', id] })
      const v = versions?.find(ver => ver.id === versionId)
      toast('success', `已還原至版本 v${v?.version ?? ''}，正在返回編輯頁…`)
      setPendingRestore(null)
      navigate('/personas')
    },
    onError: (e: AxiosError<ApiError>) => {
      toast('error', e.response?.data?.detail ?? '還原失敗，請稍後再試')
      setPendingRestore(null)
    },
  })

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-8 flex items-center gap-2 text-slate-400">
          <Spinner size="sm" /> 載入版本歷史...
        </div>
      </div>
    )
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
      <p className="text-base">載入版本歷史失敗</p>
      <button onClick={() => refetch()} className="text-sm text-violet-400 hover:text-violet-300">重新載入</button>
    </div>
  )

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="px-6 lg:px-8 pt-6 lg:pt-8">
          <Link
            to="/personas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors"
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
              {(() => {
                const maxVersion = Math.max(...versions.map(v => v.version))
                return versions.map(v => (
                  <VersionCard
                    key={v.id}
                    version={v}
                    isCurrent={v.version === maxVersion}
                    isRestoring={restore.isPending && restore.variables === v.id}
                    onRestore={() => setPendingRestore(v)}
                  />
                ))
              })()}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        title="確認還原版本"
        description={`還原至 v${pendingRestore?.version}，此 Persona 的所有 Bot 將立即套用舊版本。`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPendingRestore(null)}>
              取消
            </Button>
            <Button
              size="sm"
              loading={restore.isPending}
              onClick={() => { if (pendingRestore) restore.mutate(pendingRestore.id) }}
            >
              確認還原
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          目前版本的內容將自動保留為新的版本快照，您可以隨時再次回滾。
        </p>
      </Modal>
    </>
  )
}

type CardProps = {
  version: BackendVersion
  isCurrent: boolean
  isRestoring: boolean
  onRestore: () => void
}

function VersionCard({ version, isCurrent, isRestoring, onRestore }: CardProps) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(version.createdAt)
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

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
            <span className="px-2 py-0.5 rounded-full text-sm font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
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
          className="px-6 py-5 cursor-pointer group"
          onClick={() => setExpanded(v => !v)}
          title={expanded ? '點擊收起' : '點擊展開完整 Prompt'}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">System Prompt</p>
            <span className="text-sm text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
