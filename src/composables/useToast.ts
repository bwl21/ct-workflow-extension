import { ref, readonly } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
  persistent?: boolean
}

interface ToastOptions {
  title?: string
  duration?: number
  dismissible?: boolean
  persistent?: boolean
}

const toasts = ref<Toast[]>([])
const toastTimeouts = new Map<string, NodeJS.Timeout>()

let toastIdCounter = 0

const generateToastId = (): string => {
  return `toast-${++toastIdCounter}-${Date.now()}`
}

const addToast = (type: Toast['type'], message: string, options: ToastOptions = {}): string => {
  const id = generateToastId()

  const toast: Toast = {
    id,
    type,
    message,
    title: options.title,
    duration: options.duration ?? (type === 'error' ? 8000 : 5000),
    dismissible: options.dismissible ?? true,
    persistent: options.persistent ?? false,
  }

  toasts.value.push(toast)

  // Auto-remove toast after duration (unless persistent)
  if (!toast.persistent && toast.duration && toast.duration > 0) {
    const timeout = setTimeout(() => {
      removeToast(id)
    }, toast.duration)

    toastTimeouts.set(id, timeout)
  }

  return id
}

const removeToast = (id: string): void => {
  const index = toasts.value.findIndex((toast) => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }

  // Clear timeout if exists
  const timeout = toastTimeouts.get(id)
  if (timeout) {
    clearTimeout(timeout)
    toastTimeouts.delete(id)
  }
}

const clearAllToasts = (): void => {
  // Clear all timeouts
  toastTimeouts.forEach((timeout) => clearTimeout(timeout))
  toastTimeouts.clear()

  // Clear all toasts
  toasts.value = []
}

const updateToast = (id: string, updates: Partial<Toast>): void => {
  const toast = toasts.value.find((t) => t.id === id)
  if (toast) {
    Object.assign(toast, updates)
  }
}

// Convenience methods
const showSuccess = (message: string, options?: ToastOptions): string => {
  return addToast('success', message, options)
}

const showError = (message: string, options?: ToastOptions): string => {
  return addToast('error', message, options)
}

const showWarning = (message: string, options?: ToastOptions): string => {
  return addToast('warning', message, options)
}

const showInfo = (message: string, options?: ToastOptions): string => {
  return addToast('info', message, options)
}

export const useToast = () => {
  return {
    // State
    toasts: readonly(toasts),

    // Core methods
    addToast,
    removeToast,
    clearAllToasts,
    updateToast,

    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}

// Global toast instance for use outside of components
export const toast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
}
