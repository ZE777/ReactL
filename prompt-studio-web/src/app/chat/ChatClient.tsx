'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import type { Message, Persona } from '@/types'
import { fetchPublicPersonas } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

// 與後端 MaxLength 對齊
const MAX_INPUT_LENGTH = 4000
// 在剩餘 200 字時開始顯示字數提示
const SHOW_COUNT_THRESHOLD = 200

// ── 打字動畫 ────────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

// ── 角色清單（sidebar + bottom-sheet 共用） ──────────────────────────────────
function PersonaList({
  personas,
  selectedId,
  onSelect,
}: {
  personas: Persona[]
  selectedId: string | undefined
  onSelect: (p: Persona) => void
}) {
  return (
    <>
      {personas.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
            selectedId === p.id
              ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
              : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
          }`}
        >
          <span className="text-base shrink-0">{p.emoji ?? '🤖'}</span>
          <p className="text-xs font-medium truncate">{p.name}</p>
        </button>
      ))}
    </>
  )
}

// ── 主元件 ───────────────────────────────────────────────────────────────────
export default function ChatClient() {
  const searchParams = useSearchParams()

  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)

  // 載入狀態
  const [personasLoading, setPersonasLoading] = useState(true)
  const [personasError, setPersonasError] = useState(false)

  // 手機底部角色選擇 drawer
  const [showPersonaPicker, setShowPersonaPicker] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Persona 載入 ────────────────────────────────────────────────────────────
  const loadPersonas = useCallback(() => {
    setPersonasLoading(true)
    setPersonasError(false)
    fetchPublicPersonas()
      .then(list => {
        setPersonas(list)
        setPersonasLoading(false)
        const personaId = searchParams.get('personaId')
        const initial = personaId ? (list.find(p => p.id === personaId) ?? list[0]) : list[0]
        setSelectedPersona(initial ?? null)
      })
      .catch(() => {
        setPersonasLoading(false)
        setPersonasError(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadPersonas()
    return () => { abortRef.current?.abort() }
  }, [loadPersonas])

  // ── 自動捲動至底部 ──────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // ── 切換角色 ────────────────────────────────────────────────────────────────
  function handlePersonaChange(persona: Persona) {
    abortRef.current?.abort()
    setSelectedPersona(persona)
    setMessages([])
    setIsStreaming(false)
    setStreamingId(null)
    setInput('')
    setShowPersonaPicker(false)
    inputRef.current?.focus()
  }

  // ── 停止串流 ─────────────────────────────────────────────────────────────────
  function handleStop() {
    abortRef.current?.abort()
    setIsStreaming(false)
    setStreamingId(null)
  }

  // ── 送出訊息 ─────────────────────────────────────────────────────────────────
  async function handleSend(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isStreaming || !selectedPersona) return
    // 前端防線：確保不超過後端 MaxLength
    if (text.length > MAX_INPUT_LENGTH) return

    const history = messages
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content.trim())
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const assistantId = crypto.randomUUID()

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setInput('')
    setIsStreaming(true)
    setStreamingId(assistantId)

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch(`${API_URL}/public/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: selectedPersona.id,
          modelType: 'groq:llama-3.3-70b-versatile',
          messages: history,
          userMessage: text,
        }),
        signal: ctrl.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data: ')) continue
          try {
            const chunk = JSON.parse(line.slice(6)) as { type: string; content?: string }
            if (chunk.type === 'delta' && chunk.content) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + chunk.content! } : m
              ))
            } else if (chunk.type === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: chunk.content ?? '⚠️ AI 服務暫時無法使用' }
                  : m
              ))
            }
          } catch { /* 忽略格式異常 chunk */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const msg = (err as Error).message.includes('HTTP 429')
          ? '⚠️ 請求頻率過高，請稍後再試'
          : '⚠️ 發生錯誤，請稍後再試'
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: msg } : m
        ))
      } else {
        // 使用者主動停止：移除空的 assistant 訊息
        setMessages(prev => {
          const last = prev[prev.length - 1]
          return last?.id === assistantId && last.content === ''
            ? prev.slice(0, -1)
            : prev
        })
      }
    } finally {
      setIsStreaming(false)
      setStreamingId(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const remaining = MAX_INPUT_LENGTH - input.length
  const showCount = remaining <= SHOW_COUNT_THRESHOLD
  const showTyping = isStreaming && streamingId != null &&
    messages.find(m => m.id === streamingId)?.content === ''

  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-zinc-950">
      <Header />

      <div className="flex flex-1 min-h-0">
        {/* ── 桌機角色側欄 ──────────────────────────────────────────────────── */}
        <aside className="hidden sm:flex flex-col w-56 border-r border-slate-100 dark:border-zinc-800 p-3 gap-1 shrink-0 overflow-y-auto">
          <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 px-2 py-1 uppercase tracking-wider">
            選擇角色
          </p>

          {personasLoading && (
            <div className="px-2 py-4 flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 animate-pulse shrink-0" />
                  <div className="h-3 bg-slate-100 dark:bg-zinc-800 animate-pulse rounded flex-1" />
                </div>
              ))}
            </div>
          )}

          {personasError && (
            <div className="px-2 py-3 flex flex-col gap-2">
              <p className="text-xs text-red-400 dark:text-red-500 px-2">角色載入失敗</p>
              <button
                onClick={loadPersonas}
                className="mx-2 px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                重試
              </button>
            </div>
          )}

          {!personasLoading && !personasError && (
            <PersonaList
              personas={personas}
              selectedId={selectedPersona?.id}
              onSelect={handlePersonaChange}
            />
          )}
        </aside>

        {/* ── 聊天主區 ──────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 聊天標頭（含手機換角色按鈕） */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 shrink-0">
            <span className="text-xl">{selectedPersona?.emoji ?? '🤖'}</span>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-200 flex-1 truncate">
              {selectedPersona?.name ?? (personasLoading ? '角色載入中...' : '無可用角色')}
            </p>
            {/* 手機：換角色按鈕 */}
            <button
              onClick={() => setShowPersonaPicker(true)}
              className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
              aria-label="切換角色"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
              </svg>
              換角色
            </button>
          </div>

          {/* 訊息列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
            {messages.filter(m => m.content || m.id === streamingId).length === 0 && !showTyping && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-slate-400 dark:text-zinc-500 px-4">
                {personasError ? (
                  <>
                    <span className="text-3xl">⚠️</span>
                    <p className="text-sm">角色載入失敗，請重試後再開始對話。</p>
                  </>
                ) : selectedPersona ? (
                  <>
                    <span className="text-4xl">{selectedPersona.emoji ?? '🤖'}</span>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                      {selectedPersona.name}
                    </p>
                    <p className="text-xs max-w-xs">請傳訊息開始對話。</p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl">👆</span>
                    <p className="text-sm">請先選擇一個角色再開始對話。</p>
                  </>
                )}
              </div>
            )}

            {messages.map(msg => {
              const isUser = msg.role === 'user'
              if (!isUser && msg.content === '' && msg.id === streamingId) return null
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
                  {!isUser && (
                    <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-sm shrink-0 mt-0.5 select-none">
                      {selectedPersona?.emoji ?? '🤖'}
                    </span>
                  )}
                  <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isUser
                      ? 'bg-violet-500 text-white rounded-tr-sm'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              )
            })}

            {showTyping && (
              <div className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-sm shrink-0 mt-0.5 select-none">
                  {selectedPersona?.emoji ?? '🤖'}
                </span>
                <div className="bg-slate-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* 輸入區 */}
          <div className="border-t border-slate-100 dark:border-zinc-800 p-3 sm:p-4 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2 items-end">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_INPUT_LENGTH}
                  placeholder={
                    !selectedPersona
                      ? '請先選擇角色'
                      : isStreaming
                        ? 'AI 回應中...'
                        : `傳訊息給 ${selectedPersona.name}…`
                  }
                  disabled={!selectedPersona || isStreaming}
                  className="w-full resize-none px-4 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: '42px' }}
                />
                {/* 字數計數器 */}
                {showCount && !isStreaming && (
                  <span className={`absolute right-3 bottom-2.5 text-xs ${
                    remaining <= 0
                      ? 'text-red-400'
                      : remaining <= 50
                        ? 'text-amber-400'
                        : 'text-slate-400 dark:text-zinc-500'
                  }`}>
                    {remaining}
                  </span>
                )}
              </div>

              {isStreaming ? (
                /* 停止按鈕 */
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors shrink-0 flex items-center gap-1.5"
                  aria-label="停止生成"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                  <span className="hidden sm:inline">停止</span>
                </button>
              ) : (
                /* 送出按鈕 */
                <button
                  type="submit"
                  disabled={!input.trim() || !selectedPersona || input.length > MAX_INPUT_LENGTH}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl bg-violet-500 hover:bg-violet-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  送出
                </button>
              )}
            </form>

            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 text-center">
              <span className="hidden sm:inline">Enter 送出 · Shift+Enter 換行</span>
              <span className="sm:hidden">點送出或按 Enter 對話</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── 手機角色選擇 Bottom Sheet ────────────────────────────────────────── */}
      {showPersonaPicker && (
        <div
          className="sm:hidden fixed inset-0 z-50 flex items-end"
          role="dialog"
          aria-modal="true"
          aria-label="選擇角色"
        >
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPersonaPicker(false)}
          />

          {/* 底部面板 */}
          <div className="relative w-full bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl max-h-[70vh] flex flex-col">
            {/* 拖曳把手 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full" />
            </div>

            <div className="px-4 pb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">選擇角色</p>
              <button
                onClick={() => setShowPersonaPicker(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="關閉"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-3 pb-safe pb-4">
              {personasLoading && (
                <p className="text-sm text-slate-400 py-4 text-center">載入中...</p>
              )}
              {personasError && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className="text-sm text-red-400">角色載入失敗</p>
                  <button
                    onClick={() => { loadPersonas(); setShowPersonaPicker(false) }}
                    className="px-4 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                  >
                    重試
                  </button>
                </div>
              )}
              {!personasLoading && !personasError && (
                <PersonaList
                  personas={personas}
                  selectedId={selectedPersona?.id}
                  onSelect={handlePersonaChange}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
