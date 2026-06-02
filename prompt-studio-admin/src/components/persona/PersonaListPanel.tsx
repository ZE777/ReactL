import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Link } from 'react-router-dom'
import type { Persona } from '../../types/persona'
import type { ApiError } from '../../types/api'
import api from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import Button from '../ui/Button'

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

  const builtin = personas.filter(p => p.isBuiltin)
  const custom = personas.filter(p => !p.isBuiltin)

  return (
    <div className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden">
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
                isBuiltin
              />
            ))}
          </SectionGroup>
        )}

        {custom.length > 0 && (
          <SectionGroup label="自訂角色">
            {custom.map(p => (
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
            ))}
          </SectionGroup>
        )}

        {custom.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-400 dark:text-zinc-400 text-center">尚無自訂 Persona，點右上角新增</p>
        )}
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
  isBuiltin?: boolean
  isPendingDelete?: boolean
  onDeleteRequest?: () => void
  onDeleteConfirm?: () => void
  onDeleteCancel?: () => void
  isDeleting?: boolean
}

function PersonaRow({ persona, isSelected, onSelect, isBuiltin, isPendingDelete, onDeleteRequest, onDeleteConfirm, onDeleteCancel, isDeleting }: RowProps) {
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
            <p className={`text-sm font-medium truncate ${isSelected ? 'text-violet-600 dark:text-violet-300' : 'text-slate-700 dark:text-zinc-200'}`}>
              {persona.name}
            </p>
            {persona.currentVersion && (
              <p className="text-sm text-slate-400 dark:text-zinc-400">v{persona.currentVersion}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {isPendingDelete ? (
            <>
              <button
                onClick={onDeleteConfirm}
                disabled={isDeleting}
                className="px-2 py-0.5 rounded text-sm text-white bg-red-500 hover:bg-red-400 disabled:opacity-50 transition-colors cursor-pointer"
              >
                確認
              </button>
              <button
                onClick={onDeleteCancel}
                className="px-2 py-0.5 rounded text-sm text-slate-400 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                取消
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isBuiltin && (
                <Link
                  to={`/personas/${persona.id}/versions`}
                  aria-label="版本歷史"
                  className="p-1 rounded text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  title="版本歷史"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              )}
              {!isBuiltin && onDeleteRequest && (
                <button
                  onClick={onDeleteRequest}
                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  title="刪除"
                  aria-label="刪除"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
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
