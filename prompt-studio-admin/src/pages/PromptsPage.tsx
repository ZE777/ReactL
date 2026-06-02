import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { PromptTemplate, PromptFormData, PromptCategory } from '../types/prompt'
import type { ApiError, ApiResponse } from '../types/api'
import { fetchPrompts } from '../api/prompts'
import api, { unwrap } from '../lib/api'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'

type FilterCategory = 'all' | PromptCategory

const CATEGORIES: PromptCategory[] = ['程式', '翻譯', '寫作', '其他']

const categoryColor: Record<PromptCategory, 'violet' | 'blue' | 'green' | 'amber'> = {
  '程式': 'violet', '翻譯': 'blue', '寫作': 'green', '其他': 'amber',
}

export default function PromptsPage() {
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  const [filter, setFilter] = useState<FilterCategory>('all')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const { data: templates, isLoading } = useQuery<PromptTemplate[], AxiosError<ApiError>>({
    queryKey: ['prompts'],
    queryFn: fetchPrompts,
  })

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; category: string; tags: string }) =>
      api.post<ApiResponse<PromptTemplate>>('/prompt-templates', data).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      setModalMode(null)
      toast('success', '模板建立成功')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '建立失敗'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; content: string; category: string; tags: string } }) =>
      api.put<ApiResponse<PromptTemplate>>(`/prompt-templates/${id}`, data).then(unwrap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      setModalMode(null)
      setEditingTemplate(null)
      toast('success', '模板已更新')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '更新失敗'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/prompt-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] })
      setPendingDeleteId(null)
      toast('success', '模板已刪除')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '刪除失敗'),
  })

  const usageMutation = useMutation({
    mutationFn: (id: string) => api.post(`/prompt-templates/${id}/use`),
  })

  const filtered = filter === 'all'
    ? (templates ?? [])
    : (templates ?? []).filter(t => t.category === filter)

  function openCreate() { setEditingTemplate(null); setModalMode('create') }
  function openEdit(t: PromptTemplate) { setEditingTemplate(t); setModalMode('edit') }
  function closeModal() { setModalMode(null); setEditingTemplate(null) }

  async function handleUse(content: string, title: string, id: string) {
    try {
      await navigator.clipboard.writeText(content)
      usageMutation.mutate(id)
      toast('success', `「${title}」已複製`)
    } catch {
      toast('error', '無法存取剪貼簿，請手動複製')
    }
  }

  function handleFormSubmit(data: PromptFormData) {
    // 後端接受逗號分隔字串
    const payload = { title: data.title, content: data.content, category: data.category, tags: data.tags }
    if (modalMode === 'edit' && editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="h-full overflow-y-auto"><div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">Prompt 模板庫</h2>
          <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">
            共 {templates?.length ?? 0} 個模板
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>+ 新增模板</Button>
      </div>

      {/* 分類篩選 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', ...CATEGORIES] as FilterCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => { setFilter(cat); setPendingDeleteId(null) }}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${
              filter === cat
                ? 'bg-violet-500 text-white'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 py-4">
          <Spinner size="sm" /> 載入中...
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          title="此分類尚無模板"
          description="點擊右上角新增模板"
          action={<Button size="sm" onClick={openCreate}>+ 新增模板</Button>}
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isPendingDelete={pendingDeleteId === template.id}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === template.id}
              onEdit={() => openEdit(template)}
              onUse={() => handleUse(template.content, template.title, template.id)}
              onDeleteRequest={() => setPendingDeleteId(template.id)}
              onDeleteConfirm={() => deleteMutation.mutate(template.id)}
              onDeleteCancel={() => setPendingDeleteId(null)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'edit' ? `編輯模板 — ${editingTemplate?.title}` : '新增 Prompt 模板'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={closeModal}>取消</Button>
            <Button form="template-form" type="submit" loading={isMutating}>
              {modalMode === 'edit' ? '儲存變更' : '新增模板'}
            </Button>
          </div>
        }
      >
        <TemplateForm
          key={editingTemplate?.id ?? 'new'}
          defaultValues={editingTemplate ? {
            title: editingTemplate.title,
            content: editingTemplate.content,
            category: editingTemplate.category,
            tags: editingTemplate.tags.join(', '),
          } : undefined}
          onSubmit={handleFormSubmit}
        />
      </Modal>
    </div></div>
  )
}

// ─── TemplateCard ────────────────────────────────────────────────────────────

type CardProps = {
  template: PromptTemplate
  isPendingDelete: boolean
  isDeleting: boolean
  onEdit: () => void
  onUse: () => void
  onDeleteRequest: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
}

function TemplateCard({ template, isPendingDelete, isDeleting, onEdit, onUse, onDeleteRequest, onDeleteConfirm, onDeleteCancel }: CardProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 border rounded-xl p-5 transition-all group flex flex-col gap-3 ${
      isPendingDelete
        ? 'border-red-300/60 dark:border-red-800/60 bg-red-50/50 dark:bg-red-900/10'
        : 'border-slate-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
          {template.title}
        </h3>
        <Badge color={categoryColor[template.category] ?? 'slate'}>{template.category}</Badge>
      </div>

      <p className="text-sm text-slate-400 dark:text-zinc-400 line-clamp-2 flex-1">{template.content}</p>

      <div className="flex gap-1.5 flex-wrap">
        {template.tags.map(tag => (
          <span key={tag} className="text-sm text-slate-400 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-700/25">
        <span className="text-sm text-slate-400 dark:text-zinc-400">使用 {template.usageCount} 次</span>

        {isPendingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-500">確定刪除？</span>
            <Button variant="danger" size="sm" onClick={onDeleteConfirm} loading={isDeleting}>確認</Button>
            <Button variant="secondary" size="sm" onClick={onDeleteCancel}>取消</Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={onUse}>複製使用</Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>編輯</Button>
            <Button variant="danger" size="sm" onClick={onDeleteRequest}>刪除</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TemplateForm ─────────────────────────────────────────────────────────────

type FormProps = {
  defaultValues?: Partial<PromptFormData>
  onSubmit: (data: PromptFormData) => void
}

function TemplateForm({ defaultValues, onSubmit }: FormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PromptFormData>({
    defaultValues: { category: '程式', ...defaultValues },
  })
  const contentLength = watch('content')?.length ?? 0

  return (
    <form id="template-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">標題 *</label>
          <Input
            {...register('title', { required: '請填寫標題' })}
            placeholder="例：程式碼審查"
            error={errors.title?.message}
          />
        </div>
        <div className="w-32 flex-shrink-0">
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">分類 *</label>
          <select
            {...register('category', { required: true })}
            className="w-full px-3 py-2 text-base bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all cursor-pointer"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">標籤（逗號分隔）</label>
        <Input
          {...register('tags')}
          placeholder="review, code, backend"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm text-slate-400 dark:text-zinc-400">模板內容 *</label>
          <span className={`text-sm tabular-nums ${contentLength < 10 ? 'text-red-400' : 'text-slate-400 dark:text-zinc-400'}`}>
            {contentLength} 字{contentLength < 10 ? `（至少 10 字）` : ''}
          </span>
        </div>
        <Textarea
          {...register('content', { required: '請填寫模板內容', minLength: { value: 10, message: '內容至少 10 個字' } })}
          placeholder="撰寫 Prompt 模板，可使用 [佔位符] 標記需要替換的部分..."
          rows={8}
          error={errors.content?.message}
        />
        <p className="text-sm text-slate-400 dark:text-zinc-400 mt-1">可使用 [佔位符] 標記動態替換的文字</p>
      </div>
    </form>
  )
}
