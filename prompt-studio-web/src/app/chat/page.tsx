'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import Header from '@/components/layout/Header'
import type { Message, Persona } from '@/types'

const BUILTIN_PERSONAS: Persona[] = [
  { id: 1, name: '客服小幫手', emoji: '🤝', description: '親切專業的客服助理' },
  { id: 2, name: '程式導師', emoji: '💻', description: '耐心解釋技術問題' },
  { id: 3, name: '寫作助手', emoji: '✍️', description: '協助撰寫、潤稿、翻譯' },
  { id: 4, name: '產品顧問', emoji: '🎯', description: '協助分析需求與決策' },
]

// Mock reply for demo (replaced by real SSE after backend is ready)
const MOCK_REPLIES: Record<number, string> = {
  1: '您好！我是客服小幫手，請問有什麼我可以協助您的嗎？',
  2: '這是個很好的問題！讓我用清楚的方式解釋給你聽。',
  3: '好的，我來幫你潤飾這段文字，讓它更流暢自然。',
  4: '從產品的角度來看，我建議先釐清核心用戶的需求...',
}

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

export default function ChatPage() {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(BUILTIN_PERSONAS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    return () => { if (streamTimerRef.current) clearTimeout(streamTimerRef.current) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleSend(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isTyping) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    streamTimerRef.current = setTimeout(() => {
      const reply = MOCK_REPLIES[selectedPersona.id] ?? '這是一個有趣的問題，讓我想想...'
      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: reply }
      setMessages(prev => [...prev, assistantMsg])
      setIsTyping(false)
      streamTimerRef.current = null
    }, 1200)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handlePersonaChange(persona: Persona) {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current)
    setSelectedPersona(persona)
    setMessages([])
    setIsTyping(false)
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950">
      <Header />

      <div className="flex flex-1 min-h-0">
        {/* Persona sidebar */}
        <aside className="hidden sm:flex flex-col w-56 border-r border-slate-100 dark:border-zinc-800 p-3 gap-1 shrink-0">
          <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 px-2 py-1 uppercase tracking-wider">選擇角色</p>
          {BUILTIN_PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePersonaChange(p)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                selectedPersona.id === p.id
                  ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="text-base shrink-0">{p.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 truncate">{p.description}</p>
              </div>
            </button>
          ))}
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 shrink-0">
            <span className="text-xl">{selectedPersona.emoji}</span>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">{selectedPersona.name}</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">{selectedPersona.description}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
            {messages.length === 0 && !isTyping && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-slate-400 dark:text-zinc-500">
                <span className="text-4xl">{selectedPersona.emoji}</span>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{selectedPersona.name}</p>
                <p className="text-xs max-w-xs">{selectedPersona.description}，請傳訊息開始對話。</p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {selectedPersona.emoji}
                  </span>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-500 text-white rounded-tr-sm'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-sm shrink-0 mt-0.5">
                  {selectedPersona.emoji}
                </span>
                <div className="bg-slate-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 dark:border-zinc-800 p-4 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`傳訊息給 ${selectedPersona.name}…`}
                className="flex-1 resize-none px-4 py-2.5 text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all max-h-32"
                style={{ minHeight: '42px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="px-4 py-2.5 text-sm font-medium rounded-xl bg-violet-500 hover:bg-violet-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                送出
              </button>
            </form>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 text-center">
              Enter 送出 · Shift+Enter 換行 · 示範模式，回應為 mock 資料
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
