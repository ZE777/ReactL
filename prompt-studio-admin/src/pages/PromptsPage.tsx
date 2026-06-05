import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { PromptTemplate, PromptFormData, PromptCategory } from '../types/prompt'
import type { ApiError, ApiResponse } from '../types/api'
import { fetchPrompts } from '../api/prompts'
import api, { unwrap } from '../lib/api'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import Tag from '../components/ui/Tag'
import FilterPill from '../components/ui/FilterPill'
import IconButton from '../components/ui/IconButton'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import DropdownSelect from '../components/ui/DropdownSelect'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import PageLoading from '../components/ui/PageLoading'
import PageError from '../components/ui/PageError'

const CATEGORIES: PromptCategory[] = ['程式', '翻譯', '寫作', '其他']

const categoryColor: Record<PromptCategory, 'violet' | 'blue' | 'green' | 'amber'> = {
  '程式': 'violet', '翻譯': 'blue', '寫作': 'green', '其他': 'amber',
}

export default function PromptsPage() {
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  const [selectedCategories, setSelectedCategories] = useState<Set<PromptCategory>>(new Set())
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  const { data: templates, isLoading, error } = useQuery<PromptTemplate[], AxiosError<ApiError>>({
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] }),
  })

  function toggleCategory(cat: PromptCategory) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
    setPendingDeleteId(null)
  }

  const filtered = selectedCategories.size === 0
    ? (templates ?? [])
    : (templates ?? []).filter(t => selectedCategories.has(t.category))

  function openCreate() { setEditingTemplate(null); setModalMode('create'); setIsFormDirty(false); setIsFormValid(false) }
  function openEdit(t: PromptTemplate) { setEditingTemplate(t); setModalMode('edit'); setIsFormDirty(false); setIsFormValid(false) }
  function closeModal() { setModalMode(null); setEditingTemplate(null); setIsFormDirty(false); setIsFormValid(false) }

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

  if (isLoading) return <PageLoading text="載入模板" />
  if (error) return <PageError title="載入模板失敗" detail={error.response?.data?.detail ?? '請確認網路或重新整理頁面'} />

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 固定頭部：標題 + 分類篩選 */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <div className="flex items-center justify-between mb-6">
          <PageHeader title="Prompt 模板庫" subtitle={`共 ${templates?.length ?? 0} 個模板`} />
          <Button size="sm" onClick={openCreate}>+ 新增模板</Button>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          <FilterPill
            active={selectedCategories.size === 0}
            onClick={() => { setSelectedCategories(new Set()); setPendingDeleteId(null) }}
          >
            全部
          </FilterPill>
          {CATEGORIES.map(cat => (
            <FilterPill
              key={cat}
              active={selectedCategories.has(cat)}
              onClick={() => toggleCategory(cat)}
            >
              {cat}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* 內容區：無資料時置中，有資料時可捲動 */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
          <EmptyState
            title="此分類尚無模板"
            description="點擊右上角新增模板"
            action={<Button size="sm" onClick={openCreate}>+ 新增模板</Button>}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
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
        </div>
      )}

      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'edit' ? `編輯模板 — ${editingTemplate?.title}` : '新增 Prompt 模板'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" disabled={isMutating} onClick={closeModal}>取消</Button>
            <Button form="template-form" type="submit" loading={isMutating} disabled={modalMode === 'edit' ? !isFormDirty : !isFormValid}>
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
          onDirtyChange={setIsFormDirty}
          onValidChange={setIsFormValid}
        />
      </Modal>
    </div>
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
    <Card className="hover:border-violet-300 dark:hover:border-violet-700 p-5 transition-all group flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
          {template.title}
        </h3>
        <Badge color={categoryColor[template.category] ?? 'slate'} size="md">{template.category}</Badge>
      </div>

      <p className="text-sm text-slate-400 dark:text-zinc-400 line-clamp-2 flex-1">{template.content}</p>

      <div className="flex gap-1.5 flex-wrap">
        {template.tags.map(tag => (
          <Tag key={tag} color="amber">#{tag}</Tag>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-700/25">
        <span className="text-sm text-slate-400 dark:text-zinc-400">使用 {template.usageCount} 次</span>

        <div className="flex items-center gap-1.5">
          {isPendingDelete ? (
            <>
              <Button autoFocus size="sm" variant="danger" loading={isDeleting} onClick={onDeleteConfirm}>確認</Button>
              <Button size="sm" variant="secondary" disabled={isDeleting} onClick={onDeleteCancel}>取消</Button>
            </>
          ) : (
            <>
              <IconButton color="slate" onClick={onUse} title="複製使用" aria-label="複製使用">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </IconButton>
              <IconButton color="blue" onClick={onEdit} title="編輯" aria-label="編輯">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </IconButton>
              <IconButton color="red" onClick={onDeleteRequest} title="刪除" aria-label="刪除">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </IconButton>
            </>
          )}
        </div>
      </div>

      {isPendingDelete && (
        <p className="text-sm text-red-500 dark:text-red-400 -mt-1">確定要刪除嗎？此操作無法復原</p>
      )}
    </Card>
  )
}

// ─── TemplateForm ─────────────────────────────────────────────────────────────

type FormProps = {
  defaultValues?: Partial<PromptFormData>
  onSubmit: (data: PromptFormData) => void
  onDirtyChange?: (dirty: boolean) => void
  onValidChange?: (valid: boolean) => void
}

function TemplateForm({ defaultValues, onSubmit, onDirtyChange, onValidChange }: FormProps) {
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isDirty, isValid } } = useForm<PromptFormData>({
    defaultValues: { category: '程式', ...defaultValues },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!defaultValues) trigger(['title', 'content'])
  }, [])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty])

  useEffect(() => {
    onValidChange?.(isValid)
  }, [isValid])

  const contentLength = watch('content')?.length ?? 0

  return (
    <form id="template-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">標題 <span className="text-red-400">*</span></label>
          <Input
            {...register('title', { required: '請填寫標題' })}
            placeholder="例：程式碼審查"
            error={errors.title?.message}
          />
        </div>
        <div className="w-32 flex-shrink-0">
          <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">分類 <span className="text-red-400">*</span></label>
          <input type="hidden" {...register('category', { required: true })} />
          <DropdownSelect
            value={watch('category') ?? '程式'}
            onChange={v => setValue('category', v as PromptCategory, { shouldValidate: true, shouldDirty: true })}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
          />
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
        <label className="block text-sm text-slate-400 dark:text-zinc-400 mb-1.5">模板內容 <span className="text-red-400">*</span></label>
        <Textarea
          {...register('content', { required: '請填寫模板內容', minLength: { value: 10, message: '內容至少 10 個字' } })}
          placeholder="撰寫 Prompt 模板，可使用 [佔位符] 標記需要替換的部分..."
          rows={8}
          invalid={!!errors.content}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.content
            ? <p className="text-sm text-red-500 dark:text-red-400" role="alert">{errors.content.message}</p>
            : <p className="text-sm text-slate-400 dark:text-zinc-400">可使用 [佔位符] 標記動態替換的文字</p>
          }
          <span className={`text-sm tabular-nums ${contentLength < 10 ? 'text-red-400' : 'text-slate-400 dark:text-zinc-400'}`}>
            {contentLength} 字{contentLength < 10 ? '（至少 10 字）' : ''}
          </span>
        </div>
      </div>
    </form>
  )
}
