// Module-level singleton so Axios interceptors (outside React tree) can emit toasts.
// ToastProvider calls setToastEmitter(push) on mount to wire it up.
type ToastType = 'success' | 'error' | 'warning' | 'info'
type Emitter = (type: ToastType, message: string) => void

let _emit: Emitter = () => {}

export function setToastEmitter(fn: Emitter) { _emit = fn }
export function emitToast(type: ToastType, message: string) { _emit(type, message) }
