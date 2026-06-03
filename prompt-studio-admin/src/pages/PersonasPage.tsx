import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Persona } from '../types/persona'
import { fetchPersonas, fetchPersonaDetail } from '../api/personas'
import PersonaListPanel from '../components/persona/PersonaListPanel'
import PersonaForm from '../components/persona/PersonaForm'
import EmptyState from '../components/ui/EmptyState'
import PageLoading from '../components/ui/PageLoading'
import PageError from '../components/ui/PageError'
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
    queryKey: ['persona-detail', selectedId],
    queryFn: () => fetchPersonaDetail(selectedId!),
    enabled: selectedId != null,
  })

  function handleNew() {
    setIsNewModalOpen(true)
  }

  function handleSelect(id: string | null) {
    setSelectedId(id)
  }

  if (isPersonasLoading) return <PageLoading text="載入 Persona" />
  if (personasError) return <PageError title="載入 Persona 列表失敗" onRetry={refetchPersonas} />

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
        {/* 清單面板：desktop 固定左側；mobile 無選取時全寬，有選取時隱藏 */}
        <div className={`${selectedId ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 lg:flex-shrink-0 flex-col border-r border-slate-200 dark:border-zinc-800 overflow-hidden`}>
          <PersonaListPanel
            selectedId={selectedId}
            onSelect={handleSelect}
            onNew={handleNew}
            personas={personas ?? []}
            pendingDeleteId={pendingDeleteId}
            onPendingDeleteChange={setPendingDeleteId}
          />
        </div>

        {/* 表單面板：desktop 永遠顯示；mobile 只在有選取時顯示 */}
        <div className={`${selectedId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col overflow-y-auto`}>
          {/* mobile 返回按鈕 */}
          {selectedId && (
            <button
              onClick={() => setSelectedId(null)}
              className="lg:hidden flex items-center gap-1.5 px-4 py-3 text-sm text-violet-600 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回角色列表
            </button>
          )}

          {selectedId != null ? (
            isDetailLoading ? (
              <PageLoading />
            ) : (
              <div className={`p-4 sm:p-6 max-w-6xl mx-auto w-full ${pendingDeleteId != null && pendingDeleteId === selectedId ? 'pointer-events-none opacity-50' : ''}`}>
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