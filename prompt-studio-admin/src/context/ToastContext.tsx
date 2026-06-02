import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { setToastEmitter } from '../lib/toastEmitter'

type ToastType = 'success' | 'error' | 'warning' | 'info'
type Toast = { id: string; type: ToastType; message: string }
type ToastContextType = { push: (type: ToastType, message: string) => void }

const ToastContext = createContext<ToastContextType>({ push: () => {} })

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
}

const icons: Record<ToastType, React.ReactNode> = {
  success: '✓',
  error: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  warning: '⚠',
  info: 'ℹ',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm max-w-sm animate-in slide-in-from-right-4 ${styles[toast.type]}`}>
      <span className="font-bold text-base leading-none">{icons[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onRemove} className="opacity-70 hover:opacity-100 cursor-pointer ml-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((type: ToastType, message: string) => {
    const id = `t${Date.now()}`
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8000)
  }, [])

  // Wire up the module-level emitter so Axios interceptors can call it
  useEffect(() => { setToastEmitter(push) }, [push])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
