import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { markdownComponents } from '../components/ui/MarkdownComponents'
import 'highlight.js/styles/github-dark.css'
import type { AxiosError } from 'axios'
import api, { unwrap } from '../lib/api'
import type { ApiError, ApiResponse } from '../types/api'
import type { PromptTemplate, PromptCategory } from '../types/prompt'
import { fetchPrompts } from '../api/prompts'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Tag from '../components/ui/Tag'
import FilterPill from '../components/ui/FilterPill'
import IconButton from '../components/ui/IconButton'
import GhostButton from '../components/ui/GhostButton'
import Spinner from '../components/ui/Spinner'
import PageLoading from '../components/ui/PageLoading'
import ModelPickerModal from '../components/ui/ModelPickerModal'
import Modal from '../components/ui/Modal'

type MessageItem = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokensIn: number
  tokensOut: number
  createdAt: string
  truncated?: boolean
}

type ConversationDetail = {
  id: string
  title: string
  modelType: string
  isPinned: boolean
  personaId: string | null
  personaName: string | null
  messages: MessageItem[]
  createdAt: string
  updatedAt: string
}

/** 角色選擇器用到的最小型別 */
type PersonaOption = {
  id: string
  name: string
}

export default function ChatPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push: toast } = useToast()

  const [messages, setMessages] = useState<MessageItem[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const accumulatedRef = useRef('')
  const truncatedRef = useRef(false)
  /** 防止 conv refetch 覆蓋串流後已更新的本地 messages */
  const msgInitializedRef = useRef(false)

  const [showNewConvPicker, setShowNewConvPicker] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [showPersonaPicker, setShowPersonaPicker] = useState(false)
  const [showPromptPicker, setShowPromptPicker] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isStreaming && currentLocation.pathname !== nextLocation.pathname
  )

  const { data: conv, isLoading, error } = useQuery<ConversationDetail>({
    queryKey: ['conversation', id],
    queryFn: () => api.get<ApiResponse<ConversationDetail>>(`/conversations/${id}`).then(unwrap),
    enabled: !!id,
  })

  /** 角色清單：在 PersonaPicker 或新增對話 Picker 開啟時抓取，5 分鐘內不重新請求 */
  const { data: personas } = useQuery<PersonaOption[]>({
    queryKey: ['personas-list'],
    queryFn: () => api.get<ApiResponse<PersonaOption[]>>('/personas').then(unwrap),
    enabled: showPersonaPicker || showNewConvPicker,
    staleTime: 5 * 60 * 1000,
  })

  /** Prompt 模板：picker 開啟時抓取，不設 staleTime 確保每次開啟都取得最新資料 */
  const { data: promptTemplates } = useQuery<PromptTemplate[]>({
    queryKey: ['prompts'],
    queryFn: fetchPrompts,
    enabled: showPromptPicker,
  })

  const promptUsageMutation = useMutation({
    mutationFn: (templateId: string) => api.post(`/prompt-templates/${templateId}/use`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] }),
  })

  function handleSelectPrompt(template: PromptTemplate) {
    setInput(template.content)
    setShowPromptPicker(false)
    promptUsageMutation.mutate(template.id)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  // C-14：對話不存在（404）時自動導回列表
  useEffect(() => {
    if (error) navigate('/chat', { replace: true })
  }, [error, navigate])

  // id 切換時中止串流並重設狀態；cleanup 也在 unmount 時執行（合併兩個 useEffect）
  useEffect(() => {
    abortRef.current?.abort()
    setMessages([])
    setInput('')
    setIsStreaming(false)
    setStreamingContent('')
    accumulatedRef.current = ''
    msgInitializedRef.current = false
    return () => { abortRef.current?.abort() }
  }, [id])

  // 只在第一次載入時從 API 初始化訊息；後續 refetch 不覆蓋本地狀態
  // 避免串流完成後 conv refetch 早於後端 DB 寫入，導致 assistant 訊息消失
  useEffect(() => {
    if (conv && !msgInitializedRef.current) {
      setMessages(conv.messages)
      msgInitializedRef.current = true
    }
  }, [conv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // 串流中攔截頁面關閉（beforeunload），提示使用者確認
  useEffect(() => {
    if (!isStreaming) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isStreaming])

  /** 建立新對話（在尚未選擇對話的空白畫面使用） */
  const createMutation = useMutation({
    mutationFn: ({ model, title, personaId }: { model: string; title: string; personaId?: string | null }) =>
      api.post<ApiResponse<ConversationDetail>>('/conversations', {
        title,
        modelType: model,
        personaId: personaId ?? null,
      }).then(unwrap),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/chat/${newConv.id}`)
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '建立對話失敗'),
  })

  /** PATCH 當前對話（切換模型 / 角色） */
  const patchMutation = useMutation({
    mutationFn: (data: { modelType?: string; personaId?: string | null; updatePersona?: boolean }) => {
      if (!id) throw new Error('No conversation ID')
      return api.patch<ApiResponse<ConversationDetail>>(`/conversations/${id}`, data).then(unwrap)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast('success', '已更新')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '更新失敗'),
  })

  /** 刪除當前對話並返回對話列表 */
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('No conversation ID')
      return api.delete(`/conversations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast('success', '對話已刪除')
      navigate('/chat')
    },
    onError: (e: AxiosError<ApiError>) => toast('error', e.response?.data?.detail ?? '刪除失敗'),
  })

  /**
   * 送出訊息並接收 SSE 串流。
   * overrideText：由 Regenerate 傳入，跳過讀取 input state，不清空輸入框。
   */
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText !== undefined ? overrideText : input).trim()
    if (!text || isStreaming || !id) return

    /** 防止 race condition：若使用者在串流途中切換對話，用此值與當前 id 比對 */
    const streamId = id

    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: text,
      tokensIn: 0,
      tokensOut: 0,
      createdAt: new Date().toISOString(),
    }])
    if (overrideText === undefined) setInput('')
    setIsStreaming(true)
    setStreamingContent('')
    accumulatedRef.current = ''

    const token = localStorage.getItem('token')
    const baseUrl = (api.defaults.baseURL ?? '') as string
    const abort = new AbortController()
    abortRef.current = abort

    try {
      const resp = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ conversationId: streamId, userMessage: text }),
        signal: abort.signal,
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      // resp.body 在極少數環境（舊版 Safari）下可能為 null
      if (!resp.body) throw new Error('Response body is null')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      outer: while (true) {
        const { done, value } = await reader.read()

        // done 時沖出 TextDecoder 殘餘 multi-byte 字元，再處理最後一批行
        buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6).trim()
          if (!json) continue

          try {
            const chunk = JSON.parse(json) as {
              type: string
              content?: string
              usage?: { tokensIn: number; tokensOut: number }
            }

            if (chunk.type === 'delta' && chunk.content) {
              accumulatedRef.current += chunk.content
              setStreamingContent(accumulatedRef.current)
            } else if (chunk.type === 'truncated') {
              truncatedRef.current = true
            } else if (chunk.type === 'done') {
              // accumulatedRef 直後會被清空，先 capture 給 updater closure 使用
              const finalContent = accumulatedRef.current
              const wasTruncated = truncatedRef.current
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content: finalContent,
                tokensIn: chunk.usage?.tokensIn ?? 0,
                tokensOut: chunk.usage?.tokensOut ?? 0,
                createdAt: new Date().toISOString(),
                truncated: wasTruncated,
              }])
              setStreamingContent('')
              setIsStreaming(false)
              accumulatedRef.current = ''
              truncatedRef.current = false
              queryClient.invalidateQueries({ queryKey: ['conversations'] })
              setTimeout(() => textareaRef.current?.focus(), 0)
              break outer
            } else if (chunk.type === 'title_updated') {
              // C-05：後端在 done 之前 yield 此 chunk，此時標題已寫入 DB
              // done 的 invalidateQueries 會重新抓取 conversations 並更新側欄標題
            } else if (chunk.type === 'error' || chunk.type === 'rate_limit') {
              // rate_limit = 免費額度上限，需與 error 一起處理避免 isStreaming 永遠卡在 true
              toast('error', chunk.content ?? 'AI 回應發生錯誤')
              setStreamingContent('')
              setIsStreaming(false)
              accumulatedRef.current = ''
              break outer
            }
          } catch {
            // malformed JSON — skip line
          }
        }

        if (done) break
      }

      // 安全弁：stream 關閉但沒有收到 done chunk 時保留已累積內容
      if (!abort.signal.aborted) {
        const leftover = accumulatedRef.current
        accumulatedRef.current = ''
        if (leftover) {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: leftover,
            tokensIn: 0,
            tokensOut: 0,
            createdAt: new Date().toISOString(),
          }])
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
        setStreamingContent('')
        setIsStreaming(false)
      } else {
        // abort（id 切換觸發）：清空 ref，state 由 useEffect([id]) 重設
        accumulatedRef.current = ''
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast('error', '連線失敗，請稍後再試')
      }
      if (!abort.signal.aborted) {
        // 非 abort 中斷：保留已累積的 partial 內容
        const partial = accumulatedRef.current
        accumulatedRef.current = ''
        if (partial) {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: partial,
            tokensIn: 0,
            tokensOut: 0,
            createdAt: new Date().toISOString(),
          }])
        }
        setStreamingContent('')
        setIsStreaming(false)
      } else {
        accumulatedRef.current = ''
      }
    }
  }, [id, input, isStreaming, queryClient, toast])

  /**
   * C-08 Regenerate：刪除 DB 中最後一對 user+assistant，移除 local state，重新送出同樣問題。
   * 後端同時刪除兩筆，避免 AI 送出重複的 user 訊息。
   */
  const handleRegenerate = useCallback(async () => {
    if (!id || isStreaming) return

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return

    try {
      await api.delete(`/conversations/${id}/last-assistant-message`)

      // 移除 local state 中最後一筆 assistant 與緊接在前的 user（順序：由尾往頭找）
      setMessages(prev => {
        let assistantRemoved = false
        let userRemoved = false
        return [...prev].reverse().filter(m => {
          if (!assistantRemoved && m.role === 'assistant') { assistantRemoved = true; return false }
          if (assistantRemoved && !userRemoved && m.role === 'user') { userRemoved = true; return false }
          return true
        }).reverse()
      })

      // handleSend 會重新加入 user bubble 並送出串流
      await handleSend(lastUserMsg.content)
    } catch {
      toast('error', '重新生成失敗，請稍後再試')
    }
  }, [id, isStreaming, messages, handleSend, toast])

  function handleStop() {
    abortRef.current?.abort()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  /** 最後一筆 assistant 訊息的 id，用於顯示 Regenerate 按鈕 */
  const lastAssistantMsgId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id
    }
    return null
  }, [messages])

  const visibleMessages = useMemo(
    () => messages.filter(m => m.role !== 'system'),
    [messages]
  )

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <EmptyState
          title="尚未選擇對話"
          description="從左側選擇一個對話，或新增一個開始測試 AI 回應"
          action={
            <Button loading={createMutation.isPending} onClick={() => setShowNewConvPicker(true)}>
              + 新增對話
            </Button>
          }
        />
        <ModelPickerModal
          open={showNewConvPicker}
          onClose={() => setShowNewConvPicker(false)}
          personas={personas ?? []}
          onConfirm={(model, title, personaId) => {
            setShowNewConvPicker(false)
            createMutation.mutate({ model, title: title || '新對話', personaId })
          }}
        />
      </div>
    )
  }

  if (isLoading) return <PageLoading text="載入對話" />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <EmptyState
          title="無法載入對話"
          description="此對話不存在或已被刪除"
          action={<Button variant="secondary" onClick={() => navigate('/chat')}>返回</Button>}
        />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* 對話資訊列 */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2 sm:gap-3">
        <span className="hidden sm:inline text-sm text-slate-400 dark:text-zinc-400 shrink-0">Persona：</span>
        <button
          onClick={() => setShowPersonaPicker(true)}
          title="切換角色"
          className="hover:opacity-75 transition-opacity shrink-0"
        >
          <InfoPill label={conv?.personaName ?? '無'} color="violet" />
        </button>

        <span className="hidden sm:inline text-sm text-slate-400 dark:text-zinc-400 ml-auto shrink-0">模型：</span>
        <button
          onClick={() => setShowModelPicker(true)}
          title="切換模型"
          className="hover:opacity-75 transition-opacity ml-auto sm:ml-0 shrink-0"
        >
          <InfoPill label={conv?.modelType ?? ''} color="emerald" />
        </button>

        {/* 刪除對話 */}
        <IconButton
          color="red"
          onClick={() => setShowDeleteModal(true)}
          disabled={deleteMutation.isPending}
          title="刪除此對話"
          className="ml-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </IconButton>
      </div>

      {/* 訊息區 */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6">
        {visibleMessages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-base text-slate-400 dark:text-zinc-400">這是一個全新的對話</p>
            <p className="text-sm text-slate-300 dark:text-zinc-500">輸入你的第一個問題，開始測試 AI 回應</p>
          </div>
        )}

        {visibleMessages.map(msg => (
          <MessageBubble
            key={msg.id}
            role={msg.role as 'user' | 'assistant'}
            content={msg.content}
            createdAt={msg.createdAt}
            isLastAssistant={msg.id === lastAssistantMsgId && !isStreaming}
            onRegenerate={msg.id === lastAssistantMsgId && !isStreaming ? handleRegenerate : undefined}
            truncated={msg.truncated}
          />
        ))}

        {/* Streaming bubble */}
        {isStreaming && (
          streamingContent ? (
            <MessageBubble role="assistant" content={streamingContent} isStreaming />
          ) : (
            <div className="flex gap-3">
              <AvatarDot role="assistant" />
              <div className="px-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-slate-400 dark:text-zinc-400">思考中...</span>
              </div>
            </div>
          )
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區 */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-zinc-800 p-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息… (Enter 送出，Shift+Enter 換行)"
            rows={3}
            disabled={isStreaming}
            className="flex-1 px-4 py-3 text-base bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all resize-none disabled:opacity-50"
          />
          <div className="flex flex-col gap-2 items-stretch">
            {/* Prompt 模板選用按鈕 */}
            <button
              onClick={() => setShowPromptPicker(true)}
              disabled={isStreaming}
              title="選用 Prompt 模板"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-violet-600 dark:text-violet-500 bg-violet-300/70 dark:bg-violet-600/30 hover:bg-violet-400/70 dark:hover:bg-violet-600/50 dark:hover:text-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>模板</span>
            </button>
            {isStreaming ? (
              <Button variant="secondary" size="sm" onClick={handleStop} className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                ■ 停止
              </Button>
            ) : (
              <Button
                onClick={() => void handleSend()}
                disabled={!input.trim()}
                className="px-5 py-3 rounded-xl"
              >
                送出
              </Button>
            )}
          </div>
        </div>
        <p className="text-center text-sm text-slate-400 dark:text-zinc-400 mt-2">
          AI 可能產生不準確的內容，請自行判斷
        </p>
      </div>

      {/* 切換模型 Modal */}
      <ModelPickerModal
        open={showModelPicker}
        onClose={() => setShowModelPicker(false)}
        defaultValue={conv?.modelType}
        showTitleInput={false}
        onConfirm={(model) => {
          setShowModelPicker(false)
          patchMutation.mutate({ modelType: model })
        }}
      />

      {/* Prompt 模板 Picker */}
      {showPromptPicker && (
        <PromptPickerOverlay
          templates={promptTemplates ?? []}
          onSelect={handleSelectPrompt}
          onClose={() => setShowPromptPicker(false)}
        />
      )}

      {/* 切換角色 Picker */}
      {showPersonaPicker && (
        <PersonaPickerOverlay
          currentPersonaId={conv?.personaId ?? null}
          personas={personas ?? []}
          onSelect={(personaId) => {
            setShowPersonaPicker(false)
            patchMutation.mutate({ personaId, updatePersona: true })
          }}
          onClose={() => setShowPersonaPicker(false)}
        />
      )}

      {/* 刪除對話確認 Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="刪除對話"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => { setShowDeleteModal(false); deleteMutation.mutate() }}
            >
              確認刪除
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          確定要刪除「<span className="font-medium text-slate-800 dark:text-zinc-100">{conv?.title ?? '此對話'}</span>」嗎？
        </p>
        <p className="text-sm text-slate-400 dark:text-zinc-400 mt-2">刪除後無法復原。</p>
      </Modal>

      {/* Streaming 離頁攔截確認 */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-100">正在接收 AI 回應</h2>
              <p className="text-sm text-slate-400 dark:text-zinc-400 mt-1">離開此對話將中斷串流，已接收的部分內容會保留。確定要離開嗎？</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => blocker.reset()}>繼續等待</Button>
              <Button variant="danger" size="sm" onClick={() => blocker.proceed()}>離開</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AvatarDot({ role }: { role: 'user' | 'assistant' }) {
  const isUser = role === 'user'
  return (
    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold ${
      isUser
        ? 'bg-violet-600 text-white'
        : 'bg-slate-200 dark:bg-zinc-700 text-slate-400 dark:text-zinc-400'
    }`}>
      {isUser ? 'U' : 'AI'}
    </div>
  )
}

type MessageBubbleProps = {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  isStreaming?: boolean
  isLastAssistant?: boolean
  onRegenerate?: () => void
  truncated?: boolean
}

function MessageBubble({ role, content, createdAt, isStreaming, isLastAssistant, onRegenerate, truncated }: MessageBubbleProps) {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)
  const { push: toast } = useToast()

  // useEffect 管理 copied 計時器，確保 unmount 時清除（替代裸 setTimeout）
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
    } catch {
      // C-07：複製失敗時通知使用者（HTTP 頁面或特殊瀏覽器設定會拒絕）
      toast('error', '複製失敗，請手動選取文字複製')
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`}>
      <AvatarDot role={role} />
      <div className={`max-w-2xl flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-2`}>
        <div className={`px-4 py-3 rounded-2xl text-base leading-relaxed ${
          isUser
            ? 'bg-violet-600 text-white rounded-tr-sm whitespace-pre-wrap'
            : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 rounded-tl-sm'
        }`}>
          {/* C-06：user 訊息純文字；assistant 串流中純文字，完成後 Markdown 渲染 */}
          {isUser || isStreaming ? (
            <>
              {content}
              {isStreaming && (
                <span className="inline-block w-0.5 h-3.5 bg-current animate-pulse ml-0.5 align-middle" />
              )}
            </>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none
              prose-p:my-1
              prose-pre:bg-slate-100 dark:prose-pre:bg-zinc-800 prose-pre:rounded-lg
              prose-code:text-violet-600 dark:prose-code:text-violet-400
              prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={markdownComponents}>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {truncated && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-600 dark:text-amber-400">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            回應已被 token 上限截斷，可重新產生或調高後端 MaxTokens 設定
          </div>
        )}

        {!isStreaming && (
          <div className="flex items-center gap-1 w-full opacity-0 group-hover:opacity-100 transition-opacity">
            {/* 時間 */}
            {createdAt && (
              <span className="text-xs text-slate-400 dark:text-zinc-500 px-1">
                {new Date(createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {/* 複製按鈕 */}
            <GhostButton onClick={handleCopy} title="複製訊息" className="ml-auto">
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-500">已複製</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>複製</span>
                </>
              )}
            </GhostButton>

            {/* C-08：Regenerate 按鈕，只出現在最後一筆 assistant 訊息 hover 時 */}
            {isLastAssistant && onRegenerate && (
              <GhostButton onClick={() => void onRegenerate()} title="重新生成回應">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>重新生成</span>
              </GhostButton>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── PromptPickerOverlay ───────────────────────────────────────────────────────

const PROMPT_CATEGORIES: PromptCategory[] = ['程式', '翻譯', '寫作', '其他']

const categoryColor: Record<PromptCategory, 'violet' | 'blue' | 'green' | 'amber'> = {
  '程式': 'violet', '翻譯': 'blue', '寫作': 'green', '其他': 'amber',
}

type PromptPickerOverlayProps = {
  templates: PromptTemplate[]
  onSelect: (template: PromptTemplate) => void
  onClose: () => void
}

function PromptPickerOverlay({ templates, onSelect, onClose }: PromptPickerOverlayProps) {
  const [activeCategory, setActiveCategory] = useState<PromptCategory | 'all'>('all')

  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '70vh' }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-700/25 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-100">選用 Prompt 模板</h2>
            <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">點選後自動填入輸入框</p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 分類篩選 */}
        <div className="flex gap-2 px-6 py-3 border-b border-slate-100 dark:border-zinc-700/25 flex-shrink-0 flex-wrap">
          {(['all', ...PROMPT_CATEGORIES] as const).map(cat => (
            <FilterPill key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
              {cat === 'all' ? '全部' : cat}
            </FilterPill>
          ))}
        </div>

        {/* 模板列表 */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-zinc-500 text-center py-8">此分類尚無模板</p>
          ) : (
            filtered.map(t => (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                    {t.title}
                  </span>
                  <Badge color={categoryColor[t.category]} size="sm">{t.category}</Badge>
                </div>
                <p className="text-sm text-slate-400 dark:text-zinc-500 line-clamp-2">{t.content}</p>
                {t.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {t.tags.map(tag => (
                      <Tag key={tag} color="amber">#{tag}</Tag>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

type InfoPillProps = { label: string; color: 'violet' | 'emerald' }

function InfoPill({ label, color }: InfoPillProps) {
  const dot = color === 'violet' ? 'bg-violet-500/40' : 'bg-emerald-500/40'
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-sm text-slate-600 dark:text-zinc-400">{label}</span>
    </div>
  )
}

type PersonaPickerOverlayProps = {
  currentPersonaId: string | null
  personas: PersonaOption[]
  onSelect: (personaId: string | null) => void
  onClose: () => void
}

function PersonaPickerOverlay({ currentPersonaId, personas, onSelect, onClose }: PersonaPickerOverlayProps) {
  const [selected, setSelected] = useState<string | null>(currentPersonaId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-700/25">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-zinc-100">選擇角色</h2>
            <p className="text-sm text-slate-400 dark:text-zinc-400 mt-0.5">為此對話指定 Persona 角色</p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 max-h-[50vh] overflow-y-auto space-y-1">
          {/* 無角色選項 */}
          <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors border ${
            selected === null
              ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300/60 dark:border-violet-700/40'
              : 'bg-slate-50 dark:bg-zinc-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}>
            <input
              type="radio"
              name="persona-picker"
              checked={selected === null}
              onChange={() => setSelected(null)}
              className="accent-violet-600 w-3.5 h-3.5 flex-shrink-0"
            />
            <span className={`text-sm ${selected === null ? 'text-violet-700 dark:text-violet-300 font-medium' : 'text-slate-600 dark:text-zinc-400'}`}>
              無角色
            </span>
          </label>

          {personas.map(p => (
            <label key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors border ${
              selected === p.id
                ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300/60 dark:border-violet-700/40'
                : 'bg-slate-50 dark:bg-zinc-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}>
              <input
                type="radio"
                name="persona-picker"
                value={p.id}
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
                className="accent-violet-600 w-3.5 h-3.5 flex-shrink-0"
              />
              <span className={`text-sm ${selected === p.id ? 'text-violet-700 dark:text-violet-300 font-medium' : 'text-slate-600 dark:text-zinc-400'}`}>
                {p.name}
              </span>
            </label>
          ))}

          {personas.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-zinc-400 text-center py-4">
              尚無可用角色，請先至「角色」頁面新增
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-700/25 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={() => onSelect(selected)}>確認</Button>
        </div>
      </div>
    </div>
  )
}
