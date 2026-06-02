import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Persona } from '../types/persona'
import { fetchPersonas, fetchPersonaDetail } from '../api/personas'
import PersonaListPanel from '../components/persona/PersonaListPanel'
import PersonaForm from '../components/persona/PersonaForm'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'

export default function PersonasPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const { data: personas, isLoading: isPersonasLoading, error: personasError, refetch: refetchPersonas } = useQuery<Persona[]>({
    queryKey: ['personas'],
    queryFn: fetchPersonas,
  })

  const { data: personaDetail, isLoading: isDetailLoading } = useQuery<Persona>({
    queryKey: ['personas', selectedId],
    queryFn: () => fetchPersonaDetail(selectedId!),
    enabled: selectedId != null,
  })

  function handleNew() {
    setIsNewModalOpen(true)
  }

  function handleSelect(id: string | null) {
    setSelectedId(id)
  }

  if (isPersonasLoading) return (
    <div className="flex items-center justify-center h-full gap-2 text-slate-400">
      <Spinner size="sm" /> 載入 Persona...
    </div>
  )

  if (personasError) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
      <p className="text-base">載入 Persona 列表失敗</p>
      <button onClick={() => refetchPersonas()} className="text-sm text-violet-400 hover:text-violet-300">重新載入</button>
    </div>
  )

  if (personas?.length === 0) return (
    <>
      <div className="absolute inset-0 flex items-center justify-center">
        <EmptyState
          title="選擇或新增 Persona"
          description="還沒有任何角色，點擊下方按鈕建立第一個"
          action={
            <button onClick={handleNew} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-base font-medium rounded-lg transition-colors cursor-pointer">
              + 新增 Persona
            </button>
          }
        />
      </div>

      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="新增 Persona"
        description="設定 AI 的角色與行為準則"
        size="xl"
      >
        <PersonaForm
          hideHeader
          onSuccess={() => setIsNewModalOpen(false)}
        />
      </Modal>
    </>
  )

  return (
    <>
      <div className="absolute inset-0 flex overflow-hidden">
        <PersonaListPanel
          selectedId={selectedId}
          onSelect={handleSelect}
          onNew={handleNew}
          personas={personas ?? []}
          pendingDeleteId={pendingDeleteId}
          onPendingDeleteChange={setPendingDeleteId}
        />

        <div className="flex-1 overflow-y-auto">
          {selectedId != null ? (
            isDetailLoading ? (
              <div className="flex items-center justify-center h-full gap-2 text-slate-400 dark:text-zinc-400">
                <Spinner size="sm" /> 載入中...
              </div>
            ) : (
              <div className={`p-6 max-w-6xl mx-auto ${pendingDeleteId != null && pendingDeleteId === selectedId ? 'pointer-events-none opacity-50' : ''}`}>
                <PersonaForm
                  persona={personaDetail}
                  onSuccess={() => {}}
                  onDiscard={() => setSelectedId(null)}
                />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                title="選擇一個 Persona"
                description="從左側選擇一個已有的角色進行編輯"
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="新增 Persona"
        description="設定 AI 的角色與行為準則"
        size="xl"
      >
        <PersonaForm
          hideHeader
          onSuccess={() => setIsNewModalOpen(false)}
        />
      </Modal>
    </>
  )
}