import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Link } from 'react-router-dom'
import type { Persona } from '../../types/persona'
import type { ApiError } from '../../types/api'
import api from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import Button from '../ui/Button'
import Tag from '../ui/Tag'
import IconButton from '../ui/IconButton'

type Props = {
  selectedId: string | null
  onSelect: (id: string | null) => void
  onNew: () => void
  personas: Persona[]
  pendingDeleteId: string | null
  onPendingDeleteChange: (id: string | null) => void
}

export default function PersonaListPanel({ selectedId, onSelect, onNew, personas, pendingDeleteId, onPendingDeleteChange }: Props) {
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  const deletePersona = useMutation({
    mutationFn: (id: string) => api.delete(`/personas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
      onPendingDeleteChange(null)
      toast('success', 'Persona 已刪除')
    },
    onError: (error: AxiosError<ApiError>) => {
      toast('error', error.response?.data?.detail ?? '刪除失敗')
    },
  })

  const builtin = useMemo(() => personas.filter(p => p.builtinGroup === 'Official'), [personas])
  const custom = useMemo(() => personas.filter(p => p.builtinGroup === 'User'), [personas])

  return (
    <div className="w-full flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Personas</p>
        <Button size="sm" onClick={onNew}>+ 新增</Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {builtin.length > 0 && (
          <SectionGroup label="系統內建">
            {builtin.map(p => (
              <PersonaRow
                key={p.id}
                persona={p}
                isSelected={selectedId === p.id}
                onSelect={() => onSelect(p.id)}
                isSystemBuiltin
              />
            ))}
          </SectionGroup>
        )}

        <SectionGroup label="自訂角色">
          {custom.length > 0 ? (
            custom.map(p => (
              <PersonaRow
                key={p.id}
                persona={p}
                isSelected={selectedId === p.id}
                onSelect={() => onSelect(p.id)}
                isPendingDelete={pendingDeleteId === p.id}
                onDeleteRequest={() => onPendingDeleteChange(p.id)}
                onDeleteConfirm={() => deletePersona.mutate(p.id)}
                onDeleteCancel={() => onPendingDeleteChange(null)}
                isDeleting={deletePersona.isPending && deletePersona.variables === p.id}
              />
            ))
          ) : (
            <p className="px-4 py-6 text-sm text-slate-400 dark:text-zinc-400 text-center">尚無自訂 Persona，點上方「+ 新增」建立第一個</p>
          )}
        </SectionGroup>
      </div>
    </div>
  )
}

function SectionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="px-4 py-1.5 text-sm text-slate-400 dark:text-zinc-400 font-medium">{label}</p>
      {children}
    </div>
  )
}

type RowProps = {
  persona: Persona
  isSelected: boolean
  onSelect: () => void
  isSystemBuiltin?: boolean
  isPendingDelete?: boolean
  onDeleteRequest?: () => void
  onDeleteConfirm?: () => void
  onDeleteCancel?: () => void
  isDeleting?: boolean
}

function PersonaRow({ persona, isSelected, onSelect, isSystemBuiltin, isPendingDelete, onDeleteRequest, onDeleteConfirm, onDeleteCancel, isDeleting }: RowProps) {
  return (
    <div
      className={`mx-2 px-3 py-2.5 rounded-lg cursor-pointer group transition-all border ${
        isSelected
          ? 'border-violet-500/50 bg-violet-500/10'
          : isPendingDelete
            ? 'border-red-300/50 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10'
            : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800'
      }`}
      onClick={isPendingDelete ? undefined : onSelect}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base flex-shrink-0">{persona.emoji ?? '🤖'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={`text-sm font-medium truncate ${isSelected ? 'text-violet-600 dark:text-violet-300' : 'text-slate-700 dark:text-zinc-200'}`}>
                {persona.name}
              </p>
              {/* 公開於前台（isBuiltin）即顯示標籤，含系統內建；非公開的內建角色就不顯示 */}
              {persona.isBuiltin && (
                <Tag color="green" className="flex-shrink-0">公開</Tag>
              )}
            </div>
            {persona.currentVersion && (
              <p className="text-sm text-slate-400 dark:text-zinc-400">v{persona.currentVersion}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {isPendingDelete ? (
            <>
              {/* autoFocus：條件渲染時此按鈕是全新掛載，焦點自動移入讓鍵盤可直接確認 */}
              <Button
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                size="sm"
                variant="danger"
                loading={isDeleting}
                onClick={onDeleteConfirm}
              >
                確認
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={isDeleting}
                onClick={onDeleteCancel}
              >
                取消
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1">
              {!isSystemBuiltin && (
                <Link
                  to={`/personas/${persona.id}/versions`}
                  aria-label="版本歷史"
                  title="版本歷史"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-violet-600 dark:text-violet-500 bg-violet-300/70 dark:bg-violet-600/30 hover:bg-violet-400/70 dark:hover:bg-violet-600/50 dark:hover:text-violet-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              )}
              {!isSystemBuiltin && onDeleteRequest && (
                <IconButton color="red" onClick={onDeleteRequest} title="刪除" aria-label="刪除">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </IconButton>
              )}
            </div>
          )}
        </div>
      </div>

      {isPendingDelete && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-0.5 ml-7">確定要刪除嗎？此操作無法復原</p>
      )}
    </div>
  )
}
